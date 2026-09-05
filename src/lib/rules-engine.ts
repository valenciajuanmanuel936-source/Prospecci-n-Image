// =============================================================
// Motor de reglas determinista del setting de IMAGE (sin IA)
// =============================================================
import {
  Config,
  Decision,
  Fase,
  faseOrden,
  MensajesPorCercania,
  Prospecto,
  Recomendacion,
  Senal,
  Temperatura,
} from "./types";
import {
  ALERTA_SALUD,
  getAperturas,
  PREGUNTAS_FASE,
  PROTOCOLO_IDENTIDAD_DEFAULT,
  rellenar,
  respuestaPrecio,
  SEGUIMIENTO,
  SEGUIMIENTO_ULTIMO,
} from "./messages";

function tiene(s: Senal[], ...keys: Senal[]): boolean {
  return keys.some((k) => s.includes(k));
}

// ---------------------------------------------------------------
// Temperatura
// ---------------------------------------------------------------
export function calculateTemperature(
  prospecto: Pick<Prospecto, "fase" | "problema" | "intencion" | "momento">,
  senales: Senal[] = []
): Temperatura {
  const s = senales;
  if (tiene(s, "solicita_llamada", "quiere_resolver_ahora") || (prospecto.intencion && prospecto.momento)) {
    return "caliente";
  }
  if (tiene(s, "no_interesado")) return "frio";
  if (tiene(s, "satisfecho", "sin_problema", "algun_dia")) return "tibio";
  if (
    tiene(s, "mostro_curiosidad", "menciono_dificultad", "menciono_impacto", "explico_interes", "describio_situacion", "menciono_resultado") ||
    prospecto.problema ||
    faseOrden(prospecto.fase) >= faseOrden("situacion")
  ) {
    return "tibio";
  }
  if (tiene(s, "respondio_detalle", "respondio_corto", "hizo_pregunta", "pidio_informacion")) return "tibio";
  return "frio";
}

// ---------------------------------------------------------------
// Variable que falta y evidencia
// ---------------------------------------------------------------
const DISCOVERY_SEQ: { campo: keyof Prospecto; etiqueta: string }[] = [
  { campo: "motivo", etiqueta: "Motivo o interés real" },
  { campo: "situacionActual", etiqueta: "Situación actual" },
  { campo: "problema", etiqueta: "Problema concreto" },
  { campo: "frecuencia", etiqueta: "Frecuencia del problema" },
  { campo: "impacto", etiqueta: "Impacto o costo" },
  { campo: "resultadoDeseado", etiqueta: "Resultado que desea" },
  { campo: "brecha", etiqueta: "Brecha (qué le falta)" },
  { campo: "intentosAnteriores", etiqueta: "Intentos anteriores" },
  { campo: "intencion", etiqueta: "Intención de resolverlo" },
  { campo: "momento", etiqueta: "Momento para empezar" },
];

function lleno(v: unknown): boolean {
  return typeof v === "string" ? v.trim().length > 0 : !!v;
}

export function getMissingVariable(prospecto: Prospecto): string {
  for (const { campo, etiqueta } of DISCOVERY_SEQ) {
    if (!lleno(prospecto[campo])) return etiqueta;
  }
  return "Nada crítico: hay evidencia suficiente para evaluar la llamada.";
}

export function getEvidence(prospecto: Prospecto): string {
  const partes = DISCOVERY_SEQ.filter(({ campo }) => lleno(prospecto[campo])).map(({ etiqueta }) => etiqueta);
  if (partes.length === 0) return "Todavía no hay evidencia registrada.";
  return partes.join(" · ");
}

// Requisitos mínimos para evaluar una llamada.
export function hasFullEvidence(p: Prospecto): boolean {
  return (
    lleno(p.problema) &&
    lleno(p.impacto) &&
    lleno(p.resultadoDeseado) &&
    lleno(p.brecha) &&
    lleno(p.intencion) &&
    lleno(p.momento)
  );
}

// ---------------------------------------------------------------
// Fase recomendada (driven por señales)
// ---------------------------------------------------------------
export function getRecommendedPhase(faseActual: Fase, senales: Senal[], hayRespuesta: boolean): Fase {
  const s = senales;

  if (tiene(s, "no_interesado")) return "descartado";
  if (tiene(s, "solicita_llamada")) return "transicion_llamada";
  // Situaciones que no cambian la fase (se resuelven en la acción/decisión).
  if (tiene(s, "pregunto_por_juan", "solicita_audio", "quiere_negociar", "relacion_desconocida", "condicion_delicada")) {
    return faseActual;
  }

  // Apertura sin respuesta: no avanzar.
  if (faseActual === "apertura" && !hayRespuesta) return "apertura";

  // No fabricar problema.
  if (tiene(s, "sin_problema", "satisfecho") && !tiene(s, "quiere_resolver_ahora")) {
    return "nutricion";
  }
  // Quiere cambiar "algún día": no forzar avance.
  if (tiene(s, "algun_dia") && !tiene(s, "quiere_resolver_ahora")) {
    return faseActual;
  }

  // Escalera del setting.
  if (tiene(s, "quiere_resolver_ahora")) return maxFase(faseActual, "momento");
  if (tiene(s, "intentos_previos")) return maxFase(faseActual, "intencion");
  if (tiene(s, "menciono_brecha")) return maxFase(faseActual, "intentos_anteriores");
  if (tiene(s, "menciono_resultado")) return maxFase(faseActual, "brecha");
  if (tiene(s, "menciono_impacto")) return maxFase(faseActual, "resultado_deseado");
  if (tiene(s, "menciono_frecuencia")) return maxFase(faseActual, "impacto");
  if (tiene(s, "menciono_dificultad", "problema_ambiguo")) return maxFase(faseActual, "profundizacion");
  if (tiene(s, "describio_situacion")) return maxFase(faseActual, "problema");
  if (tiene(s, "explico_interes")) return maxFase(faseActual, "situacion");
  if (tiene(s, "pidio_informacion")) return maxFase(faseActual, "motivo");

  // Respuesta breve pero amable: mantener rapport.
  if (tiene(s, "respondio_corto") && !tiene(s, "respondio_detalle")) {
    return faseActual === "apertura" ? "rapport" : faseActual;
  }
  if (faseActual === "apertura" && tiene(s, "respondio_detalle", "mostro_curiosidad")) {
    return "motivo";
  }

  return faseActual;
}

function maxFase(a: Fase, b: Fase): Fase {
  return faseOrden(b) > faseOrden(a) ? b : a;
}

// ---------------------------------------------------------------
// Decisión recomendada
// ---------------------------------------------------------------
export interface ContextoMotor {
  prospecto: Prospecto;
  faseActual: Fase;
  senales: Senal[];
  hayRespuesta: boolean;
}

const FASE_A_DECISION: Partial<Record<Fase, Decision>> = {
  rapport: "mantener_rapport",
  motivo: "continuar",
  situacion: "continuar",
  problema: "continuar",
  profundizacion: "profundizar",
  frecuencia: "continuar",
  impacto: "explorar_impacto",
  resultado_deseado: "explorar_resultado",
  brecha: "explorar_brecha",
  intentos_anteriores: "continuar",
  intencion: "explorar_intencion",
  momento: "explorar_momento",
  fit: "validar_fit",
  transicion_llamada: "proponer_llamada",
  llamada_propuesta: "proponer_llamada",
  llamada_agendada: "agendar_llamada",
  seguimiento_prellamada: "hacer_seguimiento",
  seguimiento_postllamada: "hacer_seguimiento",
  nutricion: "dejar_nutricion",
  descartado: "descartar",
};

export function getRecommendedDecision(ctx: ContextoMotor): Decision {
  const { senales: s, faseActual, hayRespuesta, prospecto } = ctx;

  if (tiene(s, "pregunto_por_juan")) return "identificarse_mireya";
  if (tiene(s, "relacion_desconocida", "solicita_audio", "quiere_negociar", "condicion_delicada")) {
    return "escalar_juan";
  }
  if (tiene(s, "no_interesado")) return "descartar";
  if (tiene(s, "solicita_llamada")) return "agendar_llamada";

  if (tiene(s, "sin_problema")) return "cerrar";
  if (tiene(s, "satisfecho")) return "dejar_nutricion";
  if (tiene(s, "algun_dia") && !tiene(s, "quiere_resolver_ahora")) return "dejar_nutricion";

  // Apertura sin respuesta: no avanzar (esperar / eventual seguimiento).
  if (faseActual === "apertura" && !hayRespuesta) return "hacer_seguimiento";

  // Llamada SOLO con evidencia suficiente.
  const fase = getRecommendedPhase(faseActual, s, hayRespuesta);
  if (fase === "transicion_llamada" || tiene(s, "quiere_resolver_ahora")) {
    if (hasFullEvidence(prospecto)) return "proponer_llamada";
    return "validar_fit";
  }

  return FASE_A_DECISION[fase] ?? "continuar";
}

// ---------------------------------------------------------------
// Identidad y salud
// ---------------------------------------------------------------
export function getIdentityWarning(senales: Senal[]): string | null {
  if (tiene(senales, "pregunto_por_juan")) {
    return "Preguntaron con quién hablan: Mireya debe identificarse como socia de Juanma y parte del equipo de IMAGE.";
  }
  if (tiene(senales, "solicita_audio", "quiere_negociar", "relacion_desconocida")) {
    return "Situación que Mireya no debería resolver sola (audio, negociación o relación desconocida): identifícate o escala a Juan Manuel.";
  }
  return null;
}

export function getHealthAlert(senales: Senal[]): string | null {
  return tiene(senales, "condicion_delicada") ? ALERTA_SALUD : null;
}

// ---------------------------------------------------------------
// Estado de seguimiento
// ---------------------------------------------------------------
export type EstadoSeguimiento =
  | "vencido"
  | "hoy"
  | "proximo"
  | "sin_fecha"
  | "ultimo_intento"
  | "sin_respuesta"
  | "no_aplica";

export function hoyISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TERMINALES = ["cerrado_ganado", "cerrado_perdido", "descartado", "sin_fit", "llamada_agendada"];

export function getFollowUpStatus(
  prospecto: Prospecto,
  hoy: string = hoyISO(),
  maxSeguimientos = 3
): EstadoSeguimiento {
  if (TERMINALES.includes(prospecto.estado)) return "no_aplica";
  if (prospecto.seguimientosRealizados >= maxSeguimientos) return "sin_respuesta";

  if (prospecto.seguimientosRealizados === maxSeguimientos - 1) {
    if (!prospecto.proximoSeguimiento || prospecto.proximoSeguimiento <= hoy) return "ultimo_intento";
    return "proximo";
  }
  if (!prospecto.proximoSeguimiento) return "sin_fecha";
  if (prospecto.proximoSeguimiento < hoy) return "vencido";
  if (prospecto.proximoSeguimiento === hoy) return "hoy";
  return "proximo";
}

export function puedeRecomendarSeguimiento(prospecto: Prospecto, maxSeguimientos = 3): boolean {
  return prospecto.seguimientosRealizados < maxSeguimientos && !TERMINALES.includes(prospecto.estado);
}

// ---------------------------------------------------------------
// Mensajes sugeridos (3 niveles de cercanía)
// ---------------------------------------------------------------
export function getMessageSuggestions(
  prospecto: Prospecto,
  fase: Fase,
  senales: Senal[],
  config?: Pick<Config, "precio" | "cuotas" | "textoProtocoloIdentidad" | "enlaceAgenda">
): MensajesPorCercania {
  if (tiene(senales, "pregunto_por_juan")) {
    const t = config?.textoProtocoloIdentidad?.trim() || PROTOCOLO_IDENTIDAD_DEFAULT;
    return { muyCercana: t, cercana: t, menosCercana: t };
  }
  if (tiene(senales, "condicion_delicada")) {
    const t =
      "Gracias por contarme algo así, de verdad. Antes que nada quiero que estés bien; no soy quién para opinar de eso. ¿Te parece si lo hablamos con calma y, si quieres, lo revisamos directamente con Juanma?";
    return { muyCercana: t, cercana: t, menosCercana: t };
  }
  if (tiene(senales, "pregunto_precio")) {
    const t = respuestaPrecio(config?.precio ?? "", config?.cuotas ?? "");
    return { muyCercana: t, cercana: t, menosCercana: t };
  }
  if (tiene(senales, "solicita_llamada") || fase === "transicion_llamada" || fase === "llamada_propuesta") {
    const base = PREGUNTAS_FASE.transicion_llamada![0];
    const t = config?.enlaceAgenda?.trim() ? `${base} Te dejo el enlace para agendar: ${config.enlaceAgenda}` : base;
    return { muyCercana: t, cercana: t, menosCercana: t };
  }

  if (fase === "apertura" || fase === "investigacion") {
    const ap = getAperturas(prospecto.tipoProspecto, prospecto);
    return { muyCercana: ap.muy_cercana, cercana: ap.cercana, menosCercana: ap.menos_cercana };
  }

  if (fase === "rapport") {
    const t = rellenar("¡Qué bueno! Cuéntame un poco, ¿cómo va todo con tu entrenamiento estos días?", prospecto);
    return { muyCercana: t, cercana: t, menosCercana: t };
  }

  if (fase === "nutricion" || fase === "seguimiento_prellamada" || fase === "seguimiento_postllamada") {
    const juego = prospecto.seguimientosRealizados >= 2 ? SEGUIMIENTO_ULTIMO : SEGUIMIENTO;
    return {
      muyCercana: rellenar(juego.muy_cercana, prospecto),
      cercana: rellenar(juego.cercana, prospecto),
      menosCercana: rellenar(juego.menos_cercana, prospecto),
    };
  }

  if (fase === "descartado") {
    const t = "Todo bien, gracias por contarme con sinceridad. Cualquier cosa por acá estamos. ¡Un abrazo y éxitos! 🙌";
    return { muyCercana: t, cercana: t, menosCercana: t };
  }

  const preguntas = PREGUNTAS_FASE[fase];
  if (preguntas && preguntas.length) {
    const base = rellenar(preguntas[0], prospecto);
    const alt = rellenar(preguntas[Math.min(1, preguntas.length - 1)], prospecto);
    const nombre = prospecto.nombre ? prospecto.nombre.split(" ")[0] : "";
    return {
      muyCercana: `Ey, ${minusc(base)}`,
      cercana: nombre ? `Ey, ${nombre}, ${minusc(base)}` : base,
      menosCercana: alt,
    };
  }

  const fallback = "Cuéntame un poco más de eso, quiero entenderlo bien antes de seguir.";
  return { muyCercana: fallback, cercana: fallback, menosCercana: fallback };
}

function minusc(s: string): string {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s;
}

// ---------------------------------------------------------------
// Orquestador
// ---------------------------------------------------------------
export function buildRecommendation(
  ctx: ContextoMotor,
  config?: Pick<Config, "precio" | "cuotas" | "textoProtocoloIdentidad" | "enlaceAgenda">
): Recomendacion {
  const { prospecto, faseActual, senales, hayRespuesta } = ctx;

  const decisionPrevia = getRecommendedDecision(ctx);
  let fase = getRecommendedPhase(faseActual, senales, hayRespuesta);
  // Reconciliar la fase con la decisión (la decisión conoce la evidencia).
  if (decisionPrevia === "proponer_llamada") fase = "transicion_llamada";
  else if (decisionPrevia === "validar_fit" && faseOrden(fase) < faseOrden("fit")) fase = "fit";

  const temperatura = calculateTemperature(
    { fase, problema: prospecto.problema, intencion: prospecto.intencion, momento: prospecto.momento },
    senales
  );
  const decision = decisionPrevia;
  const variableQueFalta = getMissingVariable({ ...prospecto, fase });
  const evidencia = getEvidence(prospecto);
  const mensajes = getMessageSuggestions(prospecto, fase, senales, config);
  const alertaSalud = getHealthAlert(senales);

  const { lectura, objetivo, advertencia } = leerSituacion(ctx, fase, decision);

  return {
    fase,
    temperatura,
    lectura,
    evidencia,
    variableQueFalta,
    objetivo,
    mensajes,
    advertencia,
    alertaSalud,
    decision,
  };
}

function leerSituacion(
  ctx: ContextoMotor,
  fase: Fase,
  decision: Decision
): { lectura: string; objetivo: string; advertencia: string } {
  const s = ctx.senales;
  const enApertura = ctx.faseActual === "apertura";

  if (tiene(s, "condicion_delicada")) {
    return {
      lectura: "Mencionó una condición médica o psicológica delicada.",
      objetivo: "Cuidar a la persona, no vender.",
      advertencia: ALERTA_SALUD,
    };
  }
  if (tiene(s, "pregunto_por_juan")) {
    return {
      lectura: "Preguntó con quién está hablando.",
      objetivo: "Presentarte con transparencia.",
      advertencia: "No te hagas pasar por Juan Manuel. Preséntate como Mireya, parte del equipo de IMAGE.",
    };
  }
  if (tiene(s, "relacion_desconocida", "solicita_audio", "quiere_negociar")) {
    return {
      lectura: "Aparece algo que Mireya no debería resolver sola (audio, negociación o una relación previa que desconoce).",
      objetivo: "Escalar sin improvisar.",
      advertencia: "No inventes contexto, condiciones ni excepciones. Identifícate o escala a Juan Manuel.",
    };
  }
  if (tiene(s, "no_interesado")) {
    return { lectura: "No está interesado.", objetivo: "Cerrar con respeto.", advertencia: "No insistas ni fabriques urgencia." };
  }
  if (tiene(s, "sin_problema", "satisfecho") && !tiene(s, "quiere_resolver_ahora")) {
    return {
      lectura: "No manifiesta un problema real o está satisfecho.",
      objetivo: "Cerrar o dejar en nutrición, sin forzar.",
      advertencia: "No fabriques dolor ni necesidad. No toda interacción es intención de compra.",
    };
  }
  if (tiene(s, "algun_dia") && !tiene(s, "quiere_resolver_ahora")) {
    return {
      lectura: "Le interesaría cambiar, pero 'algún día'. No hay urgencia real.",
      objetivo: "Nutrir sin presionar.",
      advertencia: "No marques urgencia artificial ni lleves a llamada todavía.",
    };
  }
  if (tiene(s, "pidio_informacion")) {
    return {
      lectura: "Pidió información.",
      objetivo: "Entender primero qué busca.",
      advertencia: "Antes de dar datos o precio, comprende qué está buscando realmente.",
    };
  }
  if (tiene(s, "pregunto_precio")) {
    return {
      lectura: "Preguntó por el precio.",
      objetivo: "Responder con transparencia usando el valor configurado.",
      advertencia: "Responde con el precio configurado; no inventes descuentos ni condiciones.",
    };
  }
  if (enApertura && !ctx.hayRespuesta) {
    return {
      lectura: "Se envió la apertura y aún no hay respuesta.",
      objetivo: "Esperar la respuesta; no avanzar.",
      advertencia: "No avances hasta que responda. Si no contesta, programa un seguimiento.",
    };
  }
  if (fase === "transicion_llamada" && decision === "proponer_llamada") {
    return {
      lectura: "Hay evidencia suficiente (problema, impacto, resultado, brecha, intención y momento).",
      objetivo: "Proponer una llamada para revisar el caso.",
      advertencia: "Propón la llamada solo porque hay evidencia; no elijas oferta todavía ni asumas capacidad económica.",
    };
  }
  if (decision === "validar_fit") {
    return {
      lectura: "Hay interés, pero falta completar evidencia para una llamada.",
      objetivo: "Validar el fit antes de proponer llamada.",
      advertencia: "No propongas llamada todavía: primero confirma que encaja.",
    };
  }

  const lecturaFase: Partial<Record<Fase, string>> = {
    rapport: "Respondió breve y amable; toca sostener rapport.",
    motivo: "Buscamos entender por qué interactúa con Juan Manuel.",
    situacion: "Explicó su interés; entendamos su situación actual.",
    problema: "Conocemos su situación; buscamos si hay un problema real.",
    profundizacion: "Mencionó una dificultad; hay que profundizar (pide un ejemplo).",
    frecuencia: "Hay dificultad; falta saber con qué frecuencia ocurre.",
    impacto: "Sabemos la frecuencia; falta el impacto o costo.",
    resultado_deseado: "Conocemos el impacto; exploremos el resultado que desea.",
    brecha: "Sabemos qué quiere; identifiquemos la brecha.",
    intentos_anteriores: "Exploremos qué ha intentado antes.",
    intencion: "Midamos su intención real de resolverlo.",
    momento: "Veamos si este es el momento para él.",
    fit: "Evaluemos si IMAGE encaja con su caso.",
  };
  const objetivoFase: Partial<Record<Fase, string>> = {
    rapport: "Sostener la conversación con una pregunta fácil.",
    motivo: "Descubrir su motivo o interés.",
    situacion: "Entender cómo maneja hoy esa parte.",
    problema: "Detectar un problema real sin asumirlo.",
    profundizacion: "Entender la raíz con un ejemplo concreto.",
    frecuencia: "Medir la frecuencia.",
    impacto: "Descubrir el costo real del problema.",
    resultado_deseado: "Definir el resultado que busca.",
    brecha: "Identificar qué le ha faltado.",
    intentos_anteriores: "Conocer sus intentos previos.",
    intencion: "Medir su intención.",
    momento: "Medir el momento.",
    fit: "Confirmar el encaje.",
  };

  return {
    lectura: lecturaFase[fase] ?? "Continúa la conversación con una sola pregunta principal.",
    objetivo: objetivoFase[fase] ?? "Avanzar una fase con una sola pregunta.",
    advertencia:
      fase === "apertura"
        ? "Primer mensaje indirecto: no preguntes por problema, físico, dinero ni llamada."
        : "Máximo una pregunta principal por mensaje. No vendas antes de entender ni fabriques necesidad.",
  };
}
