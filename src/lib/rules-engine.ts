// =============================================================
// Motor de reglas determinista del setting de IMAGE (sin IA)
// =============================================================
import {
  Config,
  Decision,
  DecisionOperativa,
  Fase,
  faseLabel,
  faseOrden,
  MensajesPorCercania,
  Prospecto,
  Readiness,
  Recomendacion,
  Riesgo,
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
// IMAGE Setting OS: gates de llamada, scoring, riesgo, decisión operativa
// ---------------------------------------------------------------

// Fase determinada por la primera variable obligatoria que falta (evidencia),
// no por la última señal. Las situaciones especiales se resuelven antes.
export function faseDeEvidencia(prospecto: Prospecto, senales: Senal[] = []): Fase {
  if (!lleno(prospecto.motivo)) return "motivo";
  if (!lleno(prospecto.situacionActual)) return "situacion";
  if (!lleno(prospecto.problema)) {
    return tiene(senales, "menciono_dificultad", "problema_ambiguo") ? "profundizacion" : "problema";
  }
  if (tiene(senales, "problema_ambiguo")) return "profundizacion";
  if (!lleno(prospecto.impacto)) return "impacto";
  if (!lleno(prospecto.resultadoDeseado)) return "resultado_deseado";
  if (!lleno(prospecto.brecha)) return "brecha";
  if (!lleno(prospecto.intencion)) return "intencion";
  if (!lleno(prospecto.momento)) return "momento";
  return "fit";
}

// Requisitos para invitar a una llamada + bloqueos estructurales.
export function getCallReadiness(prospecto: Prospecto, senales: Senal[] = []): Readiness {
  const faltan: string[] = [];
  const bloqueos: string[] = [];

  const req: [keyof Prospecto, string][] = [
    ["problema", "Problema reconocido"],
    ["impacto", "Impacto"],
    ["resultadoDeseado", "Resultado deseado"],
    ["brecha", "Brecha"],
    ["intencion", "Intención"],
    ["momento", "Momento"],
  ];
  for (const [campo, label] of req) if (!lleno(prospecto[campo])) faltan.push(label);

  // Apertura a recibir ayuda
  const abierto = lleno(prospecto.aperturaAyuda) || tiene(senales, "quiere_resolver_ahora", "solicita_llamada");
  if (!abierto) faltan.push("Apertura a recibir ayuda");

  // Fit
  const fit = (prospecto.fitConfirmado || "").trim().toLowerCase();
  if (!fit) faltan.push("Fit confirmado");
  else if (fit === "no" || fit.startsWith("no ")) bloqueos.push("Sin fit");

  // Capacidad de decisión
  const dec = (prospecto.capacidadDecision || "").trim().toLowerCase();
  if (!dec) faltan.push("Capacidad de decisión");
  else if (dec === "no") bloqueos.push("Sin capacidad de decisión");

  // Capacidad de inversión (solo bloquea si explícitamente "no")
  const inv = (prospecto.capacidadInversion || "").trim().toLowerCase();
  if (inv === "no") bloqueos.push("Sin capacidad de inversión");

  // Señales de bloqueo / momento no real
  if (tiene(senales, "no_interesado")) bloqueos.push("Rechazo explícito");
  if (tiene(senales, "satisfecho", "sin_problema") && !tiene(senales, "quiere_resolver_ahora")) {
    bloqueos.push("Sin problema reconocido");
  }
  if (tiene(senales, "algun_dia") && !tiene(senales, "quiere_resolver_ahora")) {
    faltan.push("Momento real (no 'algún día')");
  }

  return { ready: faltan.length === 0 && bloqueos.length === 0, faltan, bloqueos };
}

// Scoring de priorización (P I O G T F D E), 0..2 cada uno; máx 16.
export function calculateScore(
  prospecto: Prospecto,
  senales: Senal[] = []
): { score: number; bloqueos: string[] } {
  const s = senales;
  const P = lleno(prospecto.problema) ? 2 : tiene(s, "menciono_dificultad", "problema_ambiguo") ? 1 : 0;
  const I = lleno(prospecto.impacto) ? 2 : tiene(s, "menciono_impacto") ? 1 : 0;
  const O = lleno(prospecto.resultadoDeseado) ? 2 : tiene(s, "menciono_resultado") ? 1 : 0;
  const G = lleno(prospecto.brecha) ? 2 : tiene(s, "menciono_brecha") ? 1 : 0;
  let T = 0;
  if (tiene(s, "algun_dia") && !tiene(s, "quiere_resolver_ahora")) T = 0;
  else if (lleno(prospecto.intencion) && lleno(prospecto.momento)) T = 2;
  else if (lleno(prospecto.intencion) || lleno(prospecto.momento) || tiene(s, "quiere_resolver_ahora")) T = 1;
  const fit = (prospecto.fitConfirmado || "").trim().toLowerCase();
  const F = fit && fit !== "no" ? 2 : fit === "no" ? 0 : 1;
  const dec = (prospecto.capacidadDecision || "").trim().toLowerCase();
  const D = dec && dec !== "no" ? 2 : dec === "no" ? 0 : 1;
  const E = tiene(s, "respondio_detalle")
    ? 2
    : tiene(s, "respondio_corto", "hizo_pregunta", "mostro_curiosidad") || prospecto.historial.some((m) => m.emisor === "prospecto")
      ? 1
      : 0;

  const score = P + I + O + G + T + F + D + E;
  const { bloqueos } = getCallReadiness(prospecto, senales);
  if (!lleno(prospecto.problema) && !tiene(s, "menciono_dificultad")) {
    if (!bloqueos.includes("Sin problema reconocido")) bloqueos.push("Problema no reconocido");
  }
  return { score, bloqueos };
}

// Mapea la decisión interna a la decisión operativa del OS.
export function toOperationalDecision(decision: Decision): DecisionOperativa {
  switch (decision) {
    case "proponer_llamada":
      return "INVITE_TO_CALL";
    case "agendar_llamada":
      return "BOOK_CALL";
    case "hacer_seguimiento":
      return "FOLLOW_UP";
    case "dejar_nutricion":
      return "NURTURE";
    case "cerrar":
    case "descartar":
      return "CLOSE";
    default:
      return "CONTINUE";
  }
}

// Auditor determinista del mensaje elegido.
export function detectRisk(
  mensaje: string,
  senales: Senal[],
  decisionOperativa: DecisionOperativa,
  readiness: Readiness,
  fase: Fase
): Riesgo {
  const preguntas = (mensaje.match(/\?/g) || []).length;
  if (decisionOperativa === "INVITE_TO_CALL" && !readiness.ready) return "PREMATURE_PITCH";
  if (preguntas > 1) return "MULTIPLE_QUESTIONS";
  if (tiene(senales, "pregunto_precio")) {
    const bajo = mensaje.toLowerCase();
    const responde =
      /\d/.test(mensaje) ||
      bajo.includes("precio") ||
      bajo.includes("valor") ||
      bajo.includes("inversión") ||
      bajo.includes("inversion") ||
      bajo.includes("cuesta");
    if (!responde) return "PRICE_EVASION";
  }
  const cierreFases: Fase[] = ["descartado", "nutricion", "cerrado_ganado", "cerrado_perdido"];
  if (preguntas === 0 && decisionOperativa === "CONTINUE" && !cierreFases.includes(fase)) return "NO_NEXT_STEP";
  return "NONE";
}

function buildPorQue(evidencia: string, fase: Fase, variable: string, objetivo: string): string {
  const ev = evidencia.startsWith("Todavía") ? "aún hay poca evidencia" : `dijo: ${evidencia}`;
  return `Como ${ev}, la conversación está en «${faseLabel(fase)}». La única variable que falta es ${variable.toLowerCase()}, por eso el mensaje busca ${objetivo.toLowerCase()} con una sola pregunta.`;
}

// ---------------------------------------------------------------
// Orquestador
// ---------------------------------------------------------------
export function buildRecommendation(
  ctx: ContextoMotor,
  config?: Pick<Config, "precio" | "cuotas" | "textoProtocoloIdentidad" | "enlaceAgenda">
): Recomendacion {
  const { prospecto, faseActual, senales, hayRespuesta } = ctx;

  const readiness = getCallReadiness(prospecto, senales);

  const decisionPrevia = getRecommendedDecision(ctx);
  let fase = getRecommendedPhase(faseActual, senales, hayRespuesta);
  let decision: Decision = decisionPrevia;

  // Fase por EVIDENCIA (no solo por la última señal), salvo situaciones especiales.
  const especial =
    tiene(
      senales,
      "no_interesado",
      "solicita_llamada",
      "pregunto_por_juan",
      "solicita_audio",
      "quiere_negociar",
      "relacion_desconocida",
      "condicion_delicada",
      "satisfecho",
      "sin_problema"
    ) ||
    (faseActual === "apertura" && !hayRespuesta);
  if (!especial && hayRespuesta) fase = faseDeEvidencia(prospecto, senales);

  // Reconciliar la fase con la decisión (la decisión conoce la evidencia).
  if (decision === "proponer_llamada") fase = "transicion_llamada";
  else if (decision === "validar_fit" && faseOrden(fase) < faseOrden("fit")) fase = "fit";

  // Gate de llamada: nunca invitar sin cumplir todos los requisitos.
  if (decision === "proponer_llamada" && !readiness.ready) {
    decision = "validar_fit";
    fase = "fit";
  }

  let temperatura = calculateTemperature(
    { fase, problema: prospecto.problema, intencion: prospecto.intencion, momento: prospecto.momento },
    senales
  );
  if (readiness.bloqueos.length > 0) temperatura = "no_calificado";

  const variableQueFalta = getMissingVariable({ ...prospecto, fase });
  const evidencia = getEvidence(prospecto);
  const mensajes = getMessageSuggestions(prospecto, fase, senales, config);
  const alertaSalud = getHealthAlert(senales);

  const { lectura, objetivo, advertencia } = leerSituacion(ctx, fase, decision);

  const decisionOperativa = toOperationalDecision(decision);
  const mensajeElegido =
    prospecto.cercania === "muy_cercana"
      ? mensajes.muyCercana
      : prospecto.cercania === "cercana"
        ? mensajes.cercana
        : mensajes.menosCercana;
  const riesgo = detectRisk(mensajeElegido, senales, decisionOperativa, readiness, fase);
  const { score } = calculateScore(prospecto, senales);
  const porQue = buildPorQue(evidencia, fase, variableQueFalta, objetivo);

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
    porQue,
    riesgo,
    decisionOperativa,
    score,
    readiness,
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
