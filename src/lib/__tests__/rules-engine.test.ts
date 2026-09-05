import { describe, expect, it } from "vitest";
import {
  buildRecommendation,
  calculateTemperature,
  ContextoMotor,
  getFollowUpStatus,
  getHealthAlert,
  getIdentityWarning,
  getMessageSuggestions,
  getMissingVariable,
  getRecommendedDecision,
  getRecommendedPhase,
  hasFullEvidence,
  puedeRecomendarSeguimiento,
} from "../rules-engine";
import { Prospecto } from "../types";

function prospectoBase(over: Partial<Prospecto> = {}): Prospecto {
  return {
    id: "p1",
    nombre: "Test Persona",
    usuarioInstagram: "@test",
    urlInstagram: "",
    ciudad: "Bogotá",
    tipoProspecto: "seguidor_reciente",
    cercania: "cercana",
    fase: "apertura",
    temperatura: "frio",
    estado: "nuevo",
    seguimientosRealizados: 0,
    historial: [],
    creadoEn: new Date().toISOString(),
    ...over,
  };
}

function ctx(over: Partial<ContextoMotor>): ContextoMotor {
  return {
    prospecto: over.prospecto ?? prospectoBase({ fase: over.faseActual }),
    faseActual: over.faseActual ?? "apertura",
    senales: over.senales ?? [],
    hayRespuesta: over.hayRespuesta ?? false,
  };
}

describe("1. No avanzar sin respuesta", () => {
  it("permanece en apertura sin respuesta y no propone llamada", () => {
    expect(getRecommendedPhase("apertura", [], false)).toBe("apertura");
    const rec = buildRecommendation(ctx({ faseActual: "apertura", hayRespuesta: false }));
    expect(rec.fase).toBe("apertura");
    expect(rec.decision).not.toBe("proponer_llamada");
  });
});

describe("2. No inventar problemas", () => {
  it("si está satisfecho, no avanza a problema y cierra/nutre", () => {
    const rec = buildRecommendation(
      ctx({ faseActual: "situacion", senales: ["satisfecho", "sin_problema"], hayRespuesta: true })
    );
    expect(rec.fase).toBe("nutricion");
    expect(["cerrar", "dejar_nutricion"]).toContain(rec.decision);
    expect(rec.fase).not.toBe("problema");
  });
});

describe("3. No confundir interacción con intención", () => {
  it("curiosidad/respuesta no lleva a llamada", () => {
    const rec = buildRecommendation(
      ctx({ faseActual: "apertura", senales: ["mostro_curiosidad", "respondio_detalle"], hayRespuesta: true })
    );
    expect(rec.decision).not.toBe("proponer_llamada");
    expect(rec.decision).not.toBe("agendar_llamada");
  });
});

describe("4. No proponer llamada demasiado pronto", () => {
  it("quiere resolver ya PERO sin evidencia completa => validar fit, no llamada", () => {
    const p = prospectoBase({ fase: "problema", problema: "algo" });
    const rec = buildRecommendation(
      ctx({ prospecto: p, faseActual: "problema", senales: ["quiere_resolver_ahora"], hayRespuesta: true })
    );
    expect(rec.decision).not.toBe("proponer_llamada");
    expect(rec.decision).toBe("validar_fit");
  });
  it("con evidencia completa SÍ propone llamada", () => {
    const p = prospectoBase({
      fase: "momento",
      problema: "x",
      impacto: "x",
      resultadoDeseado: "x",
      brecha: "x",
      intencion: "x",
      momento: "x",
    });
    expect(hasFullEvidence(p)).toBe(true);
    const rec = buildRecommendation(
      ctx({ prospecto: p, faseActual: "momento", senales: ["quiere_resolver_ahora"], hayRespuesta: true })
    );
    expect(rec.decision).toBe("proponer_llamada");
    expect(rec.fase).toBe("transicion_llamada");
  });
});

describe("5. Recomendar profundización correctamente", () => {
  it("dificultad => profundización", () => {
    expect(getRecommendedPhase("problema", ["menciono_dificultad"], true)).toBe("profundizacion");
  });
  it("problema ambiguo => profundización (pedir ejemplo)", () => {
    expect(getRecommendedPhase("problema", ["problema_ambiguo"], true)).toBe("profundizacion");
  });
  it("frecuencia => impacto", () => {
    expect(getRecommendedPhase("frecuencia", ["menciono_frecuencia"], true)).toBe("impacto");
  });
});

describe("6. Detectar la variable faltante", () => {
  it("con motivo y situación, la siguiente es el problema", () => {
    const p = prospectoBase({ motivo: "curiosidad", situacionActual: "entrena solo" });
    expect(getMissingVariable(p)).toMatch(/problema/i);
  });
});

describe("7. Generar mensajes según cercanía", () => {
  it("apertura de seguidor reciente entrega 3 versiones distintas", () => {
    const p = prospectoBase({ nombre: "Ana", tipoProspecto: "seguidor_reciente" });
    const m = getMessageSuggestions(p, "apertura", []);
    expect(m.muyCercana.length).toBeGreaterThan(0);
    expect(m.cercana.length).toBeGreaterThan(0);
    expect(m.menosCercana.length).toBeGreaterThan(0);
    expect(m.muyCercana).not.toBe(m.menosCercana);
  });
});

describe("8. Activar protocolo de identidad", () => {
  it("preguntar por Juan => identificarse", () => {
    expect(getIdentityWarning(["pregunto_por_juan"])).not.toBeNull();
    expect(getRecommendedDecision(ctx({ senales: ["pregunto_por_juan"] }))).toBe("identificarse_mireya");
  });
  it("audio/negociación/relación desconocida => escalar", () => {
    expect(getRecommendedDecision(ctx({ senales: ["solicita_audio"] }))).toBe("escalar_juan");
    expect(getRecommendedDecision(ctx({ senales: ["quiere_negociar"] }))).toBe("escalar_juan");
  });
});

describe("9. Activar alertas de salud", () => {
  it("condición delicada => alerta y escalar, sin vender", () => {
    expect(getHealthAlert(["condicion_delicada"])).not.toBeNull();
    const rec = buildRecommendation(ctx({ faseActual: "problema", senales: ["condicion_delicada"], hayRespuesta: true }));
    expect(rec.alertaSalud).not.toBeNull();
    expect(rec.decision).toBe("escalar_juan");
    expect(rec.decision).not.toBe("proponer_llamada");
  });
});

describe("10. No recomendar seguimientos indefinidos", () => {
  it("tras el máximo, no se recomiendan más", () => {
    const p = prospectoBase({ estado: "seguimiento", seguimientosRealizados: 3 });
    expect(getFollowUpStatus(p)).toBe("sin_respuesta");
    expect(puedeRecomendarSeguimiento(p)).toBe(false);
  });
  it("en el penúltimo, marca último intento", () => {
    const p = prospectoBase({ estado: "seguimiento", seguimientosRealizados: 2, proximoSeguimiento: "2020-01-01" });
    expect(getFollowUpStatus(p, "2024-01-01")).toBe("ultimo_intento");
  });
  it("detecta vencidos", () => {
    const p = prospectoBase({ estado: "seguimiento", proximoSeguimiento: "2020-01-01" });
    expect(getFollowUpStatus(p, "2024-01-01")).toBe("vencido");
  });
});

describe("Extra: temperatura", () => {
  it("intención + momento => caliente", () => {
    expect(calculateTemperature({ fase: "momento", intencion: "sí", momento: "ya" }, [])).toBe("caliente");
  });
  it("no interesado => frío", () => {
    expect(calculateTemperature({ fase: "apertura" }, ["no_interesado"])).toBe("frio");
  });
});
