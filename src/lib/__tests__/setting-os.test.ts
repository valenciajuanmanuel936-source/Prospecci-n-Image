// Pruebas de la ampliación metodológica "IMAGE Setting OS" (determinista).
import { describe, expect, it } from "vitest";
import {
  buildRecommendation,
  calculateScore,
  ContextoMotor,
  detectRisk,
  faseDeEvidencia,
  getCallReadiness,
  getFollowUpStatus,
  getMessageSuggestions,
} from "../rules-engine";
import { Prospecto, Senal } from "../types";

function p(over: Partial<Prospecto> = {}): Prospecto {
  return {
    id: "p",
    nombre: "Ana Prueba",
    usuarioInstagram: "@ana",
    urlInstagram: "",
    ciudad: "Bogotá",
    tipoProspecto: "seguidor_reciente",
    cercania: "cercana",
    fase: "apertura",
    temperatura: "frio",
    estado: "respondio",
    seguimientosRealizados: 0,
    historial: [{ id: "m1", fecha: new Date().toISOString(), emisor: "prospecto", texto: "hola", fase: "apertura", senales: [] }],
    creadoEn: new Date().toISOString(),
    ...over,
  };
}

function rec(prospecto: Prospecto, senales: Senal[] = [], faseActual = prospecto.fase) {
  const ctx: ContextoMotor = { prospecto, faseActual, senales, hayRespuesta: true };
  return buildRecommendation(ctx);
}

// Un prospecto con toda la evidencia + gates.
function listo(): Prospecto {
  return p({
    fase: "momento",
    motivo: "x", situacionActual: "x", problema: "x", impacto: "x",
    resultadoDeseado: "x", brecha: "x", intencion: "x", momento: "x",
    aperturaAyuda: "sí", fitConfirmado: "sí", capacidadDecision: "él",
  });
}

describe("1. Amable pero sin problema", () => {
  it("no invita a llamada, no calificado, decisión nutrir/cerrar", () => {
    const r = rec(p({ motivo: "le gusta el contenido" }), ["satisfecho", "sin_problema"]);
    expect(r.decisionOperativa).not.toBe("INVITE_TO_CALL");
    expect(["NURTURE", "CLOSE"]).toContain(r.decisionOperativa);
    expect(r.temperatura).toBe("no_calificado");
  });
});

describe("2. Problema vago", () => {
  it("recomienda profundizar", () => {
    const r = rec(p({ motivo: "x", situacionActual: "x" }), ["problema_ambiguo"]);
    expect(r.fase).toBe("profundizacion");
  });
});

describe("3. Problema e impacto pero sin intención", () => {
  it("no invita a llamada; falta la intención/momento", () => {
    const prospecto = p({ motivo: "x", situacionActual: "x", problema: "x", impacto: "x" });
    const r = rec(prospecto);
    expect(r.decisionOperativa).not.toBe("INVITE_TO_CALL");
    expect(getCallReadiness(prospecto).faltan).toContain("Intención");
  });
});

describe("4. Intención pero sin fit", () => {
  it("no invita a llamada; falta el fit", () => {
    const prospecto = p({
      fase: "momento", motivo: "x", situacionActual: "x", problema: "x", impacto: "x",
      resultadoDeseado: "x", brecha: "x", intencion: "x", momento: "x", aperturaAyuda: "sí",
      // sin fitConfirmado ni capacidadDecision
    });
    const r = rec(prospecto, ["quiere_resolver_ahora"]);
    expect(r.decisionOperativa).not.toBe("INVITE_TO_CALL");
    expect(getCallReadiness(prospecto, ["quiere_resolver_ahora"]).faltan).toContain("Fit confirmado");
  });
});

describe("5. Listo para llamada", () => {
  it("invita a llamada cuando se cumplen todos los gates", () => {
    const r = rec(listo(), ["quiere_resolver_ahora"]);
    expect(getCallReadiness(listo(), ["quiere_resolver_ahora"]).ready).toBe(true);
    expect(r.decisionOperativa).toBe("INVITE_TO_CALL");
    expect(r.fase).toBe("transicion_llamada");
  });
});

describe("6. Pregunta el precio directamente", () => {
  it("responde (no evade) y no invita a llamada por ello", () => {
    const r = rec(p({ motivo: "x" }), ["pregunto_precio"]);
    expect(r.riesgo).not.toBe("PRICE_EVASION");
    expect(r.decisionOperativa).not.toBe("INVITE_TO_CALL");
  });
});

describe("7. Establece un límite / rechaza", () => {
  it("cierra con respeto y registra el bloqueo", () => {
    const r = rec(p({ motivo: "x" }), ["no_interesado"]);
    expect(r.decisionOperativa).toBe("CLOSE");
    expect(r.readiness?.bloqueos).toContain("Rechazo explícito");
  });
});

describe("8. No fabricar problema", () => {
  it("sin problema reconocido, la fase no salta a vender", () => {
    const r = rec(p({ motivo: "x", situacionActual: "x" }));
    expect(r.fase).toBe("problema");
    expect(r.decisionOperativa).not.toBe("INVITE_TO_CALL");
  });
});

describe("9. Varios datos en un solo mensaje (fase por evidencia)", () => {
  it("salta a la variable faltante, no a la última pregunta", () => {
    const prospecto = p({ motivo: "x", situacionActual: "x", problema: "x", impacto: "x", resultadoDeseado: "x" });
    expect(faseDeEvidencia(prospecto)).toBe("brecha");
    const r = rec(prospecto, ["respondio_detalle"]);
    expect(r.fase).toBe("brecha");
  });
});

describe("10. Mensaje con más de una pregunta", () => {
  it("el auditor lo marca", () => {
    expect(detectRisk("¿Cómo vas? ¿Y qué tal el gym?", [], "CONTINUE", { ready: false, faltan: [], bloqueos: [] }, "situacion")).toBe(
      "MULTIPLE_QUESTIONS"
    );
  });
});

describe("11. Seguimiento sin contexto", () => {
  it("sin fecha se detecta y hay mensaje de seguimiento con contexto", () => {
    const prospecto = p({ estado: "seguimiento" });
    expect(getFollowUpStatus(prospecto)).toBe("sin_fecha");
    const m = getMessageSuggestions(prospecto, "seguimiento_prellamada", []);
    expect(m.cercana.length).toBeGreaterThan(10);
  });
});

describe("12. El usuario puede editar / elegir mensaje", () => {
  it("siempre entrega tres versiones", () => {
    const r = rec(p({ motivo: "x" }));
    expect(r.mensajes.muyCercana.length).toBeGreaterThan(0);
    expect(r.mensajes.cercana.length).toBeGreaterThan(0);
    expect(r.mensajes.menosCercana.length).toBeGreaterThan(0);
  });
});

describe("Scoring: bloqueos impiden la llamada aunque el score sea alto", () => {
  it("score presente y bloqueo por rechazo evita INVITE", () => {
    const r = rec(listo(), ["no_interesado"]);
    expect(typeof r.score).toBe("number");
    expect(r.decisionOperativa).not.toBe("INVITE_TO_CALL");
  });
  it("calculateScore devuelve 0..16", () => {
    const { score } = calculateScore(listo(), ["respondio_detalle", "quiere_resolver_ahora"]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(16);
  });
});
