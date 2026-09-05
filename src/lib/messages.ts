// =============================================================
// Biblioteca de mensajes y plantillas de IMAGE (determinista, sin IA)
// =============================================================
import type { Cercania, Fase, Plantilla, Prospecto, TipoProspecto } from "./types";

// Reemplaza placeholders con datos del prospecto.
export function rellenar(texto: string, p?: Partial<Prospecto>): string {
  const nombre = p?.nombre?.trim() || "";
  const primerNombre = nombre ? nombre.split(" ")[0] : "[nombre]";
  const observacion = p?.observacion?.trim() || "[observación real]";
  return texto
    .replace(/\[nombre\]/g, primerNombre)
    .replace(/\{nombre\}/g, primerNombre)
    .replace(/\{observacion\}/g, observacion)
    .replace(/\[observación real\]/g, observacion);
}

type Cerc3 = "muy_cercana" | "cercana" | "menos_cercana";

export function cercaniaA3(c: Cercania): Cerc3 {
  if (c === "muy_cercana") return "muy_cercana";
  if (c === "cercana") return "cercana";
  return "menos_cercana";
}

export interface JuegoMensajes {
  muy_cercana: string;
  cercana: string;
  menos_cercana: string;
}

// ---------- Aperturas por tipo de prospecto (primer mensaje indirecto) ----------
export const APERTURAS: Record<TipoProspecto, JuegoMensajes> = {
  seguidor_reciente: {
    muy_cercana: "¡Ey! ¿Qué más? Vi que caíste por acá hace nada jajaja. ¿Qué fue lo que te hizo seguirme?",
    cercana: "Ey, [nombre], ¿qué tal? Vi que llegaste hace poquito por acá y me dio curiosidad jajaja. ¿Qué fue lo que te hizo seguirme?",
    menos_cercana: "Hola, [nombre], ¿qué tal? Vi que empezaste a seguirme hace poco y me dio curiosidad. ¿Qué fue lo que te llamó la atención?",
  },
  seguidor_antiguo: {
    muy_cercana: "Ey, ¿qué más? Caí en cuenta de que llevas rato por acá pendiente jajaja. ¿Qué es lo que más te ha gustado de lo que subo?",
    cercana: "Ey, [nombre], ¿qué tal? Me di cuenta de que llevas tiempo por acá siguiéndome. ¿Qué parte de lo que comparto es la que más te suena?",
    menos_cercana: "Hola, [nombre], ¿qué tal? Vi que llevas un buen tiempo siguiéndome. ¿Qué es lo que más te ha aportado de lo que comparto?",
  },
  respondio_historia: {
    muy_cercana: "Jajaja ey, vi lo que me pusiste. ¿Eso que decía la historia te ha pasado a ti también?",
    cercana: "Ey, [nombre], vi lo que me respondiste. ¿Eso que decía la historia te ha pasado a ti también?",
    menos_cercana: "Hola, [nombre], vi tu respuesta a la historia. ¿Eso que comentaba te ha pasado a ti también?",
  },
  reacciono_contenido: {
    muy_cercana: "Ey, ¿cómo vas? Te he visto bien pendiente de lo que subo últimamente jajaja. ¿Qué parte es la que más te está sirviendo?",
    cercana: "Ey, [nombre], ¿cómo vas? Te he visto bastante pendiente de lo que he estado subiendo últimamente jajaja. ¿Qué parte del contenido es la que más te está sirviendo?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? He notado que sigues de cerca lo que comparto. ¿Qué parte del contenido es la que más te está sirviendo?",
  },
  comento: {
    muy_cercana: "Ey, ¿qué más? Vi tu comentario jajaja. ¿Eso es algo que estás viviendo de tu lado?",
    cercana: "Ey, [nombre], ¿cómo vas? Vi tu comentario y me dio curiosidad. ¿Eso es algo que estás viviendo actualmente?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Vi tu comentario y me llamó la atención. ¿Es algo que estás viviendo en este momento?",
  },
  antiguo_cliente: {
    muy_cercana: "¡Ey! ¿Cómo vas? Hace rato quería saber de ti jajaja. ¿Cómo te ha ido desde que dejamos de trabajar juntos?",
    cercana: "Ey, [nombre], ¿cómo vas? Hace rato quería saber de ti. ¿Cómo te ha ido desde que dejamos de trabajar juntos?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Hace tiempo quería saber de ti. ¿Cómo te ha ido desde que dejamos de trabajar juntos?",
  },
  prospecto_antiguo: {
    muy_cercana: "Ey, ¿qué más? Nos habíamos escrito hace tiempo y quedé pensando en ti jajaja. ¿Cómo va todo ahora?",
    cercana: "Ey, [nombre], ¿cómo vas? Hace tiempo habíamos hablado un poco. ¿Cómo te ha ido con todo desde entonces?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Hace un tiempo habíamos conversado. ¿Cómo te ha ido con todo desde entonces?",
  },
  referido: {
    muy_cercana: "Ey, ¿qué más? Un parcero en común me habló bien de ti jajaja. ¿Cómo vas con todo?",
    cercana: "Ey, [nombre], ¿cómo vas? Tenemos un conocido en común que me habló muy bien de ti. Me dio curiosidad saludarte, ¿cómo estás con todo?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Un conocido en común me habló de ti y quise saludarte. ¿Cómo te ha ido con todo?",
  },
  conocido: {
    muy_cercana: "¡Ey! ¿Cómo vas? Hace rato no hablábamos jajaja. ¿Cómo te ha ido con el gimnasio y con todo lo demás?",
    cercana: "Ey, [nombre], ¿cómo vas? Hace rato no hablábamos. ¿Cómo te ha ido últimamente con el gimnasio y con todo lo demás?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Hace tiempo no hablábamos. ¿Cómo te ha ido últimamente con todo?",
  },
  contacto_evento: {
    muy_cercana: "Ey, ¿qué más? Quedé pensando en lo que hablamos cuando nos vimos jajaja. ¿Cómo te ha ido desde entonces?",
    cercana: "Ey, [nombre], ¿qué tal? Nos vimos hace poco y me quedé con ganas de saber cómo te ha ido desde entonces.",
    menos_cercana: "Hola, [nombre], ¿qué tal? Coincidimos hace poco y quise saludarte. ¿Cómo te ha ido desde entonces?",
  },
  contacto_frio: {
    muy_cercana: "Ey, ¿cómo vas? Estuve mirando tu perfil y me llamó la atención {observacion} jajaja. ¿Hace cuánto estás metido en eso?",
    cercana: "Ey, [nombre], ¿cómo vas? Estuve mirando un poco tu perfil y me llamó la atención {observacion}. ¿Hace cuánto estás metido en eso?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Estuve viendo tu perfil y me llamó la atención {observacion}. ¿Hace cuánto estás en eso?",
  },
  pidio_informacion: {
    muy_cercana: "¡Ey! Vi que preguntaste por info jajaja. Antes de tirarte todo, cuéntame: ¿qué es lo que estás buscando ahorita?",
    cercana: "Ey, [nombre], ¿qué tal? Vi que preguntaste por información. Antes de contarte todo, cuéntame un poco: ¿qué es lo que estás buscando en este momento?",
    menos_cercana: "Hola, [nombre], ¿qué tal? Vi que pediste información. Para orientarte bien, cuéntame primero: ¿qué es lo que estás buscando en este momento?",
  },
  asistio_llamada: {
    muy_cercana: "Ey, ¿cómo vas? Quedé pensando en la llamada que tuvimos jajaja. ¿Cómo te has sentido con todo lo que hablamos?",
    cercana: "Ey, [nombre], ¿cómo vas? Quedé pensando en la llamada que tuvimos. ¿Cómo te has sentido con todo lo que conversamos?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Quedé pensando en nuestra llamada. ¿Cómo te has sentido con todo lo que conversamos?",
  },
  oportunidad_reactivada: {
    muy_cercana: "Ey, ¿qué más? Hace un tiempo estuvimos hablando y quedó en veremos jajaja. ¿Cómo va todo ahora?",
    cercana: "Ey, [nombre], ¿cómo vas? Hace un tiempo estuvimos hablando y quedó ahí en pausa. ¿Cómo va todo ahora?",
    menos_cercana: "Hola, [nombre], ¿cómo estás? Hace un tiempo habíamos conversado y quedó en pausa. ¿Cómo va todo ahora?",
  },
};

export function getAperturas(tipo: TipoProspecto, p?: Partial<Prospecto>): JuegoMensajes {
  const base = APERTURAS[tipo] ?? APERTURAS.seguidor_reciente;
  return {
    muy_cercana: rellenar(base.muy_cercana, p),
    cercana: rellenar(base.cercana, p),
    menos_cercana: rellenar(base.menos_cercana, p),
  };
}

// ---------- Preguntas por fase (una sola pregunta principal por mensaje) ----------
export const PREGUNTAS_FASE: Partial<Record<Fase, string[]>> = {
  motivo: [
    "¿Qué fue lo que te hizo seguirme?",
    "¿Con qué parte del contenido conectaste más?",
    "¿Eso es algo que estás viviendo actualmente?",
  ],
  situacion: [
    "¿Cómo estás manejando esa parte actualmente?",
    "¿Cómo te está yendo con tu entrenamiento?",
    "¿Estás siguiendo algún plan o lo llevas por tu cuenta?",
    "¿Cómo se ve una semana normal para ti?",
  ],
  problema: [
    "¿Qué es lo que más te está costando?",
    "¿En qué parte sientes que te estás estancando?",
    "¿Qué es lo que no has podido sostener?",
  ],
  profundizacion: [
    "Cuando dices que te cuesta, ¿qué termina pasando?",
    "¿Desde hace cuánto ocurre?",
    "¿Me puedes dar un ejemplo reciente?",
    "¿Qué crees que hay detrás de eso?",
  ],
  frecuencia: [
    "¿Eso te pasa de vez en cuando o casi siempre?",
    "¿Con qué frecuencia termina ocurriendo?",
    "¿Es algo puntual o ya se volvió parte del día a día?",
  ],
  impacto: [
    "¿Cómo te está afectando por fuera del gimnasio?",
    "¿Qué es lo que más te pesa de seguir así?",
    "Si esto continúa igual, ¿qué terminaría pasando?",
    "¿Sientes que también se refleja en otras áreas?",
  ],
  resultado_deseado: [
    "¿Qué te gustaría que fuera diferente?",
    "¿Cómo te gustaría verte o sentirte?",
    "¿Qué resultado sería realmente importante para ti?",
    "Más allá del físico, ¿qué cambiaría?",
  ],
  brecha: [
    "¿Qué sientes que te falta para llegar a ese resultado?",
    "¿Qué no has tenido en intentos anteriores?",
    "¿El problema ha sido saber qué hacer o lograr sostenerlo?",
  ],
  intentos_anteriores: [
    "¿Qué has intentado antes para resolverlo?",
    "¿Qué fue lo que no terminó de funcionarte de eso?",
    "¿Qué te hizo dejarlo en su momento?",
  ],
  intencion: [
    "¿Esto es algo que quieres resolver ahora o todavía lo estás pensando?",
    "¿Qué tan importante es para ti cambiarlo en este momento?",
    "¿Estás buscando una solución o apenas empezando a explorarlo?",
  ],
  momento: [
    "Si encontraras el acompañamiento correcto, ¿cuándo te gustaría empezar?",
    "¿Hay algo que te impida comenzar ahora?",
    "¿Lo estás pensando para este momento o para más adelante?",
  ],
  fit: [
    "Por lo que me cuentas, ¿sientes que este es el momento para trabajarlo con acompañamiento?",
    "¿Qué tendría que tener un acompañamiento para que valga la pena para ti?",
  ],
  capacidad_decision: [
    "Si decides dar el paso, ¿es algo que resuelves tú o lo hablas con alguien más?",
  ],
  capacidad_inversion: [
    "Cuando encuentras algo que de verdad te sirve, ¿sueles poder darle prioridad e invertir en eso?",
  ],
  transicion_llamada: [
    "Por lo que me cuentas, creo que vale la pena revisar tu caso con más calma. ¿Te parece si hacemos una llamada y vemos si IMAGE realmente encaja contigo?",
  ],
  seguimiento_prellamada: [
    "Ey, [nombre], quedamos en hablar. ¿Sigue en pie? Cuéntame qué horario te sirve mejor.",
  ],
  seguimiento_postllamada: [
    "Ey, [nombre], quedé pensando en lo que hablamos en la llamada. ¿Cómo te has sentido con eso? ¿Alguna duda que te haya quedado dando vueltas?",
  ],
};

// ---------- Seguimientos genéricos ----------
export const SEGUIMIENTO: JuegoMensajes = {
  muy_cercana: "Ey, [nombre], te escribo rapidito porque quedé pendiente de lo que estábamos hablando jajaja. ¿Cómo vas con eso?",
  cercana: "Ey, [nombre], ¿cómo vas? Quedé pendiente de lo que estábamos conversando. Sin afán, cuando puedas me cuentas.",
  menos_cercana: "Hola, [nombre], ¿cómo estás? Quedé pendiente de lo que conversábamos. Cuando tengas un momento me cuentas, sin problema.",
};

export const SEGUIMIENTO_ULTIMO: JuegoMensajes = {
  muy_cercana: "Ey, [nombre], cierro por acá para no atosigarte jajaja. Si en algún momento quieres retomarlo, acá estamos. ¡Un abrazo!",
  cercana: "Ey, [nombre], cierro por acá para no insistir. Si más adelante quieres retomarlo, quedo atento. ¡Un abrazo!",
  menos_cercana: "Hola, [nombre], cierro el mensaje por acá para no insistir. Si más adelante quieres retomarlo, con gusto. ¡Éxitos!",
};

// ---------- Respuestas especiales ----------
export const PROTOCOLO_IDENTIDAD_DEFAULT =
  "Por cierto, soy Mireya, socia de Juanma y parte del equipo de IMAGE. Le estoy ayudando a organizar esta parte desde su cuenta para que podamos responder bien todas las conversaciones. Todo lo que estamos revisando lo trabajamos directamente con él.";

// La respuesta de precio usa el valor configurado; este es el marco.
export function respuestaPrecio(precio: string, cuotas: string): string {
  const detalle = precio?.trim()
    ? `El programa está en ${precio}${cuotas?.trim() ? ` (${cuotas})` : ""}.`
    : "Con gusto te cuento los valores.";
  return `${detalle} Igual, antes de que decidas solo por el número, me gustaría entender bien tu caso para decirte con honestidad si tiene sentido para ti. ¿Te parece?`;
}

export const ALERTA_SALUD =
  "El prospecto mencionó una condición médica o psicológica delicada. No diagnostiques ni sigas vendiendo automáticamente: escúchalo, valida y, si corresponde, escala a Juan Manuel.";

// ---------- Plantillas base para la biblioteca ----------
export function getPlantillasBase(): Plantilla[] {
  const out: Plantilla[] = [];
  const push = (t: Omit<Plantilla, "id" | "favorito" | "personalizada">) =>
    out.push({ ...t, id: `base-${out.length + 1}`, favorito: false, personalizada: false });

  const cercMap: { c3: Cerc3; cerc: Cercania; lbl: string }[] = [
    { c3: "muy_cercana", cerc: "muy_cercana", lbl: "Muy cercana" },
    { c3: "cercana", cerc: "cercana", lbl: "Cercana" },
    { c3: "menos_cercana", cerc: "poco_cercana", lbl: "Menos cercana" },
  ];

  // Aperturas
  (Object.keys(APERTURAS) as TipoProspecto[]).forEach((tipo) => {
    const labelTipo = TIPO_LABEL[tipo] ?? tipo;
    for (const cm of cercMap) {
      push({
        titulo: `Apertura · ${labelTipo} · ${cm.lbl}`,
        texto: APERTURAS[tipo][cm.c3],
        tipoProspecto: tipo,
        cercania: cm.cerc,
        fase: "apertura",
        objetivo: "Abrir conversación",
      });
    }
  });

  // Preguntas por fase
  for (const [fase, preguntas] of Object.entries(PREGUNTAS_FASE)) {
    (preguntas as string[]).forEach((texto, i) => {
      push({
        titulo: `${FASE_TITULO[fase as Fase] ?? fase} · pregunta ${i + 1}`,
        texto,
        fase: fase as Fase,
        objetivo: "Avanzar el setting",
      });
    });
  }

  // Seguimientos
  push({ titulo: "Seguimiento · cercano", texto: SEGUIMIENTO.cercana, fase: "seguimiento_prellamada", objetivo: "Reactivar" });
  push({ titulo: "Seguimiento · menos cercano", texto: SEGUIMIENTO.menos_cercana, fase: "seguimiento_prellamada", objetivo: "Reactivar" });
  push({ titulo: "Último seguimiento", texto: SEGUIMIENTO_ULTIMO.cercana, fase: "nutricion", objetivo: "Cerrar sin insistir" });

  // Especiales
  push({ titulo: "Protocolo de identidad (Mireya)", texto: PROTOCOLO_IDENTIDAD_DEFAULT, objetivo: "Identificarse", objecion: "Preguntan quién escribe" });

  return out;
}

const TIPO_LABEL: Record<string, string> = {
  seguidor_reciente: "Seguidor reciente",
  seguidor_antiguo: "Seguidor antiguo",
  respondio_historia: "Respondió historia",
  reacciono_contenido: "Reaccionó al contenido",
  comento: "Comentó",
  antiguo_cliente: "Antiguo cliente",
  prospecto_antiguo: "Prospecto antiguo",
  referido: "Referido",
  conocido: "Conocido",
  contacto_evento: "Contacto de evento",
  contacto_frio: "Contacto frío",
  pidio_informacion: "Pidió información",
  asistio_llamada: "Asistió a llamada",
  oportunidad_reactivada: "Oportunidad reactivada",
};

const FASE_TITULO: Partial<Record<Fase, string>> = {
  motivo: "Motivo",
  situacion: "Situación actual",
  problema: "Problema",
  profundizacion: "Profundización",
  frecuencia: "Frecuencia",
  impacto: "Impacto",
  resultado_deseado: "Resultado deseado",
  brecha: "Brecha",
  intentos_anteriores: "Intentos anteriores",
  intencion: "Intención",
  momento: "Momento",
  fit: "Fit",
  capacidad_decision: "Capacidad de decisión",
  capacidad_inversion: "Capacidad de inversión",
  transicion_llamada: "Transición a llamada",
  seguimiento_prellamada: "Seguimiento prellamada",
  seguimiento_postllamada: "Seguimiento postllamada",
};
