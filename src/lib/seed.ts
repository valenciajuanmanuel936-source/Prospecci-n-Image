// =============================================================
// Datos iniciales de IMAGE: configuración, bloques de sesión y
// prospectos de demostración (ficticios). Independiente de todo.
// =============================================================
import { PROTOCOLO_IDENTIDAD_DEFAULT } from "./messages";
import {
  AppData,
  BloqueSesion,
  Config,
  Prospecto,
  Sesion,
} from "./types";
import { uid } from "./utils";

export const DATA_VERSION = 1;

export function configPorDefecto(): Config {
  return {
    nombreOperadora: "Mireya",
    nombreLider: "Juan Manuel",
    nombrePrograma: "IMAGE",
    duracionPrograma: "",
    precio: "",
    cuotas: "",
    entregables: [],
    equipo: [{ id: uid("eq"), nombre: "Juan Manuel", rol: "Líder del programa" }],
    enlaceAgenda: "",
    criteriosFit: [
      { id: uid("fit"), texto: "Reconoce un problema real y quiere resolverlo." },
      { id: uid("fit"), texto: "Está en un momento adecuado para comprometerse." },
      { id: uid("fit"), texto: "Busca una transformación integral, no solo una rutina." },
    ],
    criteriosExclusion: [
      { id: uid("exc"), texto: "Condición médica o psicológica delicada sin acompañamiento profesional." },
      { id: uid("exc"), texto: "Solo busca información sin ninguna intención de cambiar." },
    ],
    textoProtocoloIdentidad: PROTOCOLO_IDENTIDAD_DEFAULT,
    duracionSesionMin: 60,
    metaContactosDiaria: 5,
    metaSeguimientosDiaria: 5,
    metaLlamadasDiaria: 1,
    maxSeguimientos: 3,
    ciudadPrincipal: "Bogotá",
  };
}

export function bloquesPorDefecto(): BloqueSesion[] {
  const b = (titulo: string, rangoMinutos: string, items: string[]): BloqueSesion => ({
    id: uid("bloque"),
    titulo,
    rangoMinutos,
    items: items.map((texto) => ({ id: uid("chk"), texto, hecho: false })),
  });
  return [
    b("Preparación", "0–5 min", [
      "Abrir Instagram.",
      "Seleccionar la ruta del día.",
      "Revisar pendientes.",
      "Definir la meta del día.",
    ]),
    b("Conversaciones activas", "5–20 min", [
      "Responder conversaciones activas.",
      "Priorizar solicitudes de llamada.",
      "Atender prospectos calificados.",
      "Atender respuestas nuevas.",
      "Enviar una sola pregunta principal.",
    ]),
    b("Nuevos contactos", "20–35 min", [
      "Contactar nuevos prospectos.",
      "Personalizar cada apertura.",
      "Registrar una observación real por perfil.",
      "No preguntar por problema, físico o dinero en el primer mensaje.",
    ]),
    b("Seguimientos", "35–50 min", [
      "Realizar seguimientos.",
      "Reactivar conversaciones pertinentes.",
      "No insistir más allá del último intento.",
    ]),
    b("Cierre", "50–60 min", [
      "Registrar métricas.",
      "Programar próximos pasos.",
      "Guardar el aprendizaje del día.",
    ]),
  ];
}

export const RUTAS_EJEMPLO: string[] = [
  "Seguidores recientes",
  "Respuestas a historias",
  "Interacciones frecuentes",
  "Antiguos clientes",
  "Oportunidades reactivadas",
  "Referidos",
  "Contactos fríos seleccionados",
];

export const META_EJEMPLO: string[] = [
  "Abrir 5 conversaciones nuevas con calidad.",
  "Avanzar 3 discoveries hasta el problema.",
  "Agendar al menos 1 llamada con evidencia.",
  "Reactivar 5 conversaciones frías.",
];

function iso(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString();
}

function base(p: Omit<Prospecto, "seguimientosRealizados" | "creadoEn" | "esDemo"> & Partial<Pick<Prospecto, "seguimientosRealizados">>): Prospecto {
  return {
    ...p,
    seguimientosRealizados: p.seguimientosRealizados ?? 0,
    esDemo: true,
    creadoEn: new Date().toISOString(),
  };
}

export function prospectosDemo(): Prospecto[] {
  return [
    // 1. Seguidor reciente en apertura (sin respuesta)
    base({
      id: uid("p"),
      nombre: "Mariana López",
      usuarioInstagram: "@mariana.lp",
      urlInstagram: "https://instagram.com/mariana.lp",
      ciudad: "Bogotá",
      tipoProspecto: "seguidor_reciente",
      cercania: "poco_cercana",
      observacion: "empezó a seguir hace 3 días tras un reel de hábitos",
      fase: "apertura",
      temperatura: "frio",
      estado: "apertura_enviada",
      fechaPrimerContacto: iso(0),
      fechaUltimoMensaje: iso(0),
      historial: [
        {
          id: uid("m"),
          fecha: iso(0),
          emisor: "operador",
          texto: "Hola, Mariana, ¿qué tal? Vi que empezaste a seguirme hace poco y me dio curiosidad. ¿Qué fue lo que te llamó la atención?",
          fase: "apertura",
          senales: [],
          enviado: true,
        },
      ],
    }),

    // 2. Respondió historia → motivo/situación
    base({
      id: uid("p"),
      nombre: "Carlos Méndez",
      usuarioInstagram: "@carlosmz",
      urlInstagram: "https://instagram.com/carlosmz",
      ciudad: "Medellín",
      tipoProspecto: "respondio_historia",
      cercania: "cercana",
      fase: "situacion",
      temperatura: "tibio",
      estado: "discovery",
      motivo: "Le pegó una historia sobre falta de constancia.",
      fechaPrimerContacto: iso(2),
      fechaUltimoMensaje: iso(1),
      historial: [
        {
          id: uid("m"),
          fecha: iso(2),
          emisor: "operador",
          texto: "Ey, Carlos, vi lo que me respondiste. ¿Eso que decía la historia te ha pasado a ti también?",
          fase: "apertura",
          senales: [],
          enviado: true,
        },
        {
          id: uid("m"),
          fecha: iso(1),
          emisor: "prospecto",
          texto: "Uf, sí, total. Llevo como un año empezando y dejando el gym jajaja.",
          fase: "motivo",
          senales: ["respondio_detalle", "explico_interes"],
        },
      ],
    }),

    // 3. Discovery con problema + impacto (profundización/impacto)
    base({
      id: uid("p"),
      nombre: "Valentina Ríos",
      usuarioInstagram: "@valeriosfit",
      urlInstagram: "https://instagram.com/valeriosfit",
      ciudad: "Bogotá",
      tipoProspecto: "reacciono_contenido",
      cercania: "cercana",
      fase: "impacto",
      temperatura: "tibio",
      estado: "problema_validado",
      motivo: "Sigue el contenido de rendimiento y energía.",
      situacionActual: "Entrena por su cuenta, sin plan claro.",
      problema: "No logra sostener la rutina más de 3 semanas.",
      frecuencia: "Le pasa casi cada mes.",
      fechaPrimerContacto: iso(4),
      fechaUltimoMensaje: iso(1),
      historial: [
        {
          id: uid("m"),
          fecha: iso(1),
          emisor: "prospecto",
          texto: "Es que arranco full motivada y a las 3 semanas ya lo dejé otra vez. Me frustra un montón.",
          fase: "problema",
          senales: ["menciono_dificultad", "menciono_frecuencia", "respondio_detalle"],
        },
      ],
    }),

    // 4. Calificado con evidencia completa → listo para llamada
    base({
      id: uid("p"),
      nombre: "Andrés Peña",
      usuarioInstagram: "@andrespenya",
      urlInstagram: "https://instagram.com/andrespenya",
      ciudad: "Bogotá",
      tipoProspecto: "oportunidad_reactivada",
      cercania: "cercana",
      fase: "momento",
      temperatura: "caliente",
      estado: "calificado",
      motivo: "Quiere retomar tras un año difícil.",
      situacionActual: "Sin acompañamiento, come desordenado.",
      problema: "Subió de peso y perdió energía y foco.",
      frecuencia: "Es su día a día desde hace meses.",
      impacto: "Le afecta el ánimo, el trabajo y la relación con su pareja.",
      resultadoDeseado: "Volver a sentirse en control y con energía.",
      brecha: "Nunca ha tenido estructura ni quien lo sostenga.",
      intentosAnteriores: "Rutinas de YouTube y apps que abandonó.",
      intencion: "Quiere resolverlo ya, está cansado de repetir el ciclo.",
      momento: "Puede empezar esta misma semana.",
      aperturaAyuda: "Sí, está abierto a que lo acompañen.",
      fitConfirmado: "sí",
      capacidadDecision: "él mismo",
      capacidadInversion: "Dice que si le sirve, puede darle prioridad.",
      fechaPrimerContacto: iso(6),
      fechaUltimoMensaje: iso(0),
      historial: [
        {
          id: uid("m"),
          fecha: iso(0),
          emisor: "prospecto",
          texto: "La verdad ya estoy cansado de empezar y dejarlo. Quiero algo serio y empezar ya.",
          fase: "momento",
          senales: ["quiere_resolver_ahora", "menciono_impacto", "menciono_resultado"],
        },
      ],
    }),

    // 5. Satisfecho, sin problema real
    base({
      id: uid("p"),
      nombre: "Laura Gómez",
      usuarioInstagram: "@lau.gomez",
      urlInstagram: "https://instagram.com/lau.gomez",
      ciudad: "Cali",
      tipoProspecto: "seguidor_antiguo",
      cercania: "poco_cercana",
      fase: "situacion",
      temperatura: "tibio",
      estado: "nutricion",
      motivo: "Le gusta el contenido de motivación.",
      situacionActual: "Ya entrena con un coach y está feliz.",
      fechaPrimerContacto: iso(3),
      fechaUltimoMensaje: iso(1),
      resultadoComercial: "Sin fit actual — nutrir.",
      historial: [
        {
          id: uid("m"),
          fecha: iso(1),
          emisor: "prospecto",
          texto: "La verdad ya tengo un coach y estoy muy contenta, todo bien por ahora 🙌",
          fase: "situacion",
          senales: ["satisfecho", "sin_problema"],
        },
      ],
    }),

    // 6. Preguntó quién escribe (protocolo de identidad) + condición delicada
    base({
      id: uid("p"),
      nombre: "Sofía Herrera",
      usuarioInstagram: "@sofiher",
      urlInstagram: "https://instagram.com/sofiher",
      ciudad: "Bogotá",
      tipoProspecto: "comento",
      cercania: "fria",
      fase: "rapport",
      temperatura: "tibio",
      estado: "respondio",
      fechaPrimerContacto: iso(1),
      fechaUltimoMensaje: iso(0),
      historial: [
        {
          id: uid("m"),
          fecha: iso(0),
          emisor: "prospecto",
          texto: "Hola, ¿con quién hablo? ¿Este es el Instagram de Juan Manuel directamente?",
          fase: "rapport",
          senales: ["hizo_pregunta", "pregunto_por_juan"],
        },
      ],
    }),
  ];
}

export function datosIniciales(conDemo: boolean): AppData {
  return {
    version: DATA_VERSION,
    marca: "IMAGE",
    config: configPorDefecto(),
    prospectos: conDemo ? prospectosDemo() : [],
    sesiones: [],
    aprendizajes: [],
    plantillasPersonalizadas: [],
    favoritos: [],
  };
}

export function crearSesionVacia(config: Config): Sesion {
  return {
    id: uid("ses"),
    fecha: new Date().toISOString().slice(0, 10),
    ruta: RUTAS_EJEMPLO[0],
    meta: META_EJEMPLO[0],
    metaContactos: config.metaContactosDiaria,
    metaSeguimientos: config.metaSeguimientosDiaria,
    metaLlamadas: config.metaLlamadasDiaria,
    duracionMin: config.duracionSesionMin,
    estado: "no_iniciada",
    segundosTranscurridos: 0,
    bloques: bloquesPorDefecto(),
    contactosHechos: 0,
    seguimientosHechos: 0,
    respuestas: 0,
    llamadasPropuestas: 0,
    creadaEn: new Date().toISOString(),
  };
}
