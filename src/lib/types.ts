// =============================================================
// Tipos centrales — Copiloto de Setting y Prospección (IMAGE)
// Aplicación independiente. No comparte datos ni configuración
// con ninguna otra marca.
// =============================================================

// ---------- Tipo de prospecto (fuente/origen) ----------
export type TipoProspecto =
  | "seguidor_reciente"
  | "seguidor_antiguo"
  | "respondio_historia"
  | "reacciono_contenido"
  | "comento"
  | "antiguo_cliente"
  | "prospecto_antiguo"
  | "referido"
  | "conocido"
  | "contacto_evento"
  | "contacto_frio"
  | "pidio_informacion"
  | "asistio_llamada"
  | "oportunidad_reactivada";

export const TIPOS_PROSPECTO: { value: TipoProspecto; label: string }[] = [
  { value: "seguidor_reciente", label: "Seguidor reciente" },
  { value: "seguidor_antiguo", label: "Seguidor antiguo" },
  { value: "respondio_historia", label: "Respondió una historia" },
  { value: "reacciono_contenido", label: "Reaccionó al contenido" },
  { value: "comento", label: "Comentó" },
  { value: "antiguo_cliente", label: "Antiguo cliente" },
  { value: "prospecto_antiguo", label: "Prospecto antiguo" },
  { value: "referido", label: "Referido" },
  { value: "conocido", label: "Conocido" },
  { value: "contacto_evento", label: "Contacto de evento" },
  { value: "contacto_frio", label: "Contacto frío seleccionado" },
  { value: "pidio_informacion", label: "Pidió información" },
  { value: "asistio_llamada", label: "Ya asistió a una llamada" },
  { value: "oportunidad_reactivada", label: "Oportunidad reactivada" },
];

// ---------- Cercanía ----------
export type Cercania = "muy_cercana" | "cercana" | "poco_cercana" | "fria";

export const CERCANIAS: { value: Cercania; label: string; desc: string }[] = [
  { value: "muy_cercana", label: "Muy cercana", desc: "Confianza alta. Tono directo, con humor." },
  { value: "cercana", label: "Cercana", desc: "Se conocen o ha habido trato. Tono amable y cercano." },
  { value: "poco_cercana", label: "Poco cercana", desc: "Trato puntual o lejano. Tono respetuoso." },
  { value: "fria", label: "Fría", desc: "Sin relación previa. Cortesía total, sin asumir confianza." },
];

// ---------- Temperatura ----------
export type Temperatura = "frio" | "tibio" | "caliente";

// ---------- Fases del setting (26) ----------
export type Fase =
  | "investigacion"
  | "apertura"
  | "rapport"
  | "motivo"
  | "situacion"
  | "problema"
  | "profundizacion"
  | "frecuencia"
  | "impacto"
  | "resultado_deseado"
  | "brecha"
  | "intentos_anteriores"
  | "intencion"
  | "momento"
  | "fit"
  | "capacidad_decision"
  | "capacidad_inversion"
  | "transicion_llamada"
  | "llamada_propuesta"
  | "llamada_agendada"
  | "seguimiento_prellamada"
  | "seguimiento_postllamada"
  | "cerrado_ganado"
  | "cerrado_perdido"
  | "nutricion"
  | "descartado";

export const FASES: { value: Fase; label: string; orden: number }[] = [
  { value: "investigacion", label: "Investigación", orden: 1 },
  { value: "apertura", label: "Apertura", orden: 2 },
  { value: "rapport", label: "Rapport", orden: 3 },
  { value: "motivo", label: "Motivo o interés", orden: 4 },
  { value: "situacion", label: "Situación actual", orden: 5 },
  { value: "problema", label: "Problema", orden: 6 },
  { value: "profundizacion", label: "Profundización", orden: 7 },
  { value: "frecuencia", label: "Frecuencia", orden: 8 },
  { value: "impacto", label: "Impacto o costo", orden: 9 },
  { value: "resultado_deseado", label: "Resultado deseado", orden: 10 },
  { value: "brecha", label: "Brecha", orden: 11 },
  { value: "intentos_anteriores", label: "Intentos anteriores", orden: 12 },
  { value: "intencion", label: "Intención", orden: 13 },
  { value: "momento", label: "Momento", orden: 14 },
  { value: "fit", label: "Fit", orden: 15 },
  { value: "capacidad_decision", label: "Capacidad de decisión", orden: 16 },
  { value: "capacidad_inversion", label: "Capacidad de inversión", orden: 17 },
  { value: "transicion_llamada", label: "Transición a llamada", orden: 18 },
  { value: "llamada_propuesta", label: "Llamada propuesta", orden: 19 },
  { value: "llamada_agendada", label: "Llamada agendada", orden: 20 },
  { value: "seguimiento_prellamada", label: "Seguimiento prellamada", orden: 21 },
  { value: "seguimiento_postllamada", label: "Seguimiento postllamada", orden: 22 },
  { value: "cerrado_ganado", label: "Cerrado ganado", orden: 23 },
  { value: "cerrado_perdido", label: "Cerrado perdido", orden: 24 },
  { value: "nutricion", label: "Nutrición", orden: 25 },
  { value: "descartado", label: "Descartado", orden: 26 },
];

export function faseLabel(f: Fase): string {
  return FASES.find((x) => x.value === f)?.label ?? f;
}
export function faseOrden(f: Fase): number {
  return FASES.find((x) => x.value === f)?.orden ?? 0;
}

// ---------- Pipeline (estados comerciales) ----------
export type Estado =
  | "nuevo"
  | "apertura_enviada"
  | "respondio"
  | "rapport"
  | "discovery"
  | "problema_validado"
  | "fit_por_confirmar"
  | "calificado"
  | "llamada_propuesta"
  | "llamada_agendada"
  | "no_asistio"
  | "postllamada"
  | "seguimiento"
  | "cerrado_ganado"
  | "cerrado_perdido"
  | "nutricion"
  | "sin_fit"
  | "descartado";

export const ESTADOS: { value: Estado; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "apertura_enviada", label: "Apertura enviada" },
  { value: "respondio", label: "Respondió" },
  { value: "rapport", label: "Rapport" },
  { value: "discovery", label: "Discovery" },
  { value: "problema_validado", label: "Problema validado" },
  { value: "fit_por_confirmar", label: "Fit por confirmar" },
  { value: "calificado", label: "Calificado" },
  { value: "llamada_propuesta", label: "Llamada propuesta" },
  { value: "llamada_agendada", label: "Llamada agendada" },
  { value: "no_asistio", label: "No asistió" },
  { value: "postllamada", label: "Postllamada" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "cerrado_ganado", label: "Cerrado ganado" },
  { value: "cerrado_perdido", label: "Cerrado perdido" },
  { value: "nutricion", label: "Nutrición" },
  { value: "sin_fit", label: "Sin fit" },
  { value: "descartado", label: "Descartado" },
];

// Orden del pipeline para la vista tipo tablero.
export const PIPELINE_ORDEN: Estado[] = [
  "nuevo",
  "apertura_enviada",
  "respondio",
  "rapport",
  "discovery",
  "problema_validado",
  "fit_por_confirmar",
  "calificado",
  "llamada_propuesta",
  "llamada_agendada",
  "no_asistio",
  "postllamada",
  "seguimiento",
  "cerrado_ganado",
  "cerrado_perdido",
  "nutricion",
  "sin_fit",
  "descartado",
];

export function estadoLabel(e: Estado): string {
  return ESTADOS.find((x) => x.value === e)?.label ?? e;
}

// ---------- Señales rápidas ----------
export type Senal =
  | "respondio_detalle"
  | "respondio_corto"
  | "hizo_pregunta"
  | "mostro_curiosidad"
  | "explico_interes"
  | "describio_situacion"
  | "menciono_dificultad"
  | "problema_ambiguo"
  | "menciono_frecuencia"
  | "menciono_impacto"
  | "menciono_resultado"
  | "menciono_brecha"
  | "intentos_previos"
  | "quiere_resolver_ahora"
  | "algun_dia"
  | "pidio_informacion"
  | "pregunto_precio"
  | "sin_problema"
  | "satisfecho"
  | "no_interesado"
  | "pregunto_por_juan"
  | "solicita_audio"
  | "solicita_llamada"
  | "quiere_negociar"
  | "relacion_desconocida"
  | "condicion_delicada";

export const SENALES: { value: Senal; label: string }[] = [
  { value: "respondio_detalle", label: "Respondió con detalle" },
  { value: "respondio_corto", label: "Respondió corto" },
  { value: "hizo_pregunta", label: "Hizo una pregunta" },
  { value: "mostro_curiosidad", label: "Mostró curiosidad" },
  { value: "explico_interes", label: "Explicó su interés / motivo" },
  { value: "describio_situacion", label: "Describió su situación actual" },
  { value: "menciono_dificultad", label: "Mencionó una dificultad" },
  { value: "problema_ambiguo", label: "Problema poco claro (falta ejemplo)" },
  { value: "menciono_frecuencia", label: "Mencionó frecuencia" },
  { value: "menciono_impacto", label: "Mencionó impacto o costo" },
  { value: "menciono_resultado", label: "Mencionó el resultado que desea" },
  { value: "menciono_brecha", label: "Mencionó qué le falta (brecha)" },
  { value: "intentos_previos", label: "Habló de intentos anteriores" },
  { value: "quiere_resolver_ahora", label: "Quiere resolverlo ahora" },
  { value: "algun_dia", label: "Lo cambiaría 'algún día' / explorando" },
  { value: "pidio_informacion", label: "Pidió información" },
  { value: "pregunto_precio", label: "Preguntó por precio" },
  { value: "sin_problema", label: "No hay problema aparente" },
  { value: "satisfecho", label: "Está satisfecho" },
  { value: "no_interesado", label: "No está interesado" },
  { value: "pregunto_por_juan", label: "Preguntó quién escribe / si es Juan Manuel" },
  { value: "solicita_audio", label: "Solicita audio" },
  { value: "solicita_llamada", label: "Solicita llamada" },
  { value: "quiere_negociar", label: "Quiere negociar" },
  { value: "relacion_desconocida", label: "Menciona una relación que Mireya desconoce" },
  { value: "condicion_delicada", label: "Menciona condición médica o psicológica delicada" },
];

// ---------- Mensaje del historial ----------
export type Emisor = "operador" | "prospecto";

export interface MensajeHistorial {
  id: string;
  fecha: string; // ISO
  emisor: Emisor;
  texto: string;
  fase: Fase;
  senales: Senal[];
  proximoPaso?: string;
  enviado?: boolean;
}

// ---------- Prospecto ----------
export interface Prospecto {
  id: string;
  nombre: string;
  usuarioInstagram: string;
  urlInstagram: string;
  ciudad: string;
  tipoProspecto: TipoProspecto; // también es la "fuente"
  cercania: Cercania;
  observacion?: string; // observación real (obligatoria para contacto frío)
  fase: Fase;
  temperatura: Temperatura;
  estado: Estado;
  // Variables de discovery del setting
  motivo?: string;
  situacionActual?: string;
  problema?: string;
  frecuencia?: string;
  impacto?: string;
  resultadoDeseado?: string;
  brecha?: string;
  intentosAnteriores?: string;
  intencion?: string;
  momento?: string;
  fitNotas?: string;
  // Resultado comercial (se diferencia facturación de dinero cobrado)
  ofertaPresentada?: boolean;
  facturacionContratada?: number;
  dineroCobrado?: number;
  motivoPerdida?: string;
  asistioLlamada?: boolean;
  resultadoComercial?: string;
  // Fechas
  fechaPrimerContacto?: string;
  fechaUltimoMensaje?: string;
  proximoSeguimiento?: string; // YYYY-MM-DD
  seguimientosRealizados: number;
  notas?: string;
  historial: MensajeHistorial[];
  esDemo?: boolean;
  creadoEn: string;
}

// ---------- Sesión diaria ----------
export interface BloqueChecklist {
  id: string;
  texto: string;
  hecho: boolean;
}
export interface BloqueSesion {
  id: string;
  titulo: string;
  rangoMinutos: string;
  items: BloqueChecklist[];
}
export interface Sesion {
  id: string;
  fecha: string; // YYYY-MM-DD
  ruta: string; // foco del día
  meta: string; // meta principal del día
  metaContactos: number;
  metaSeguimientos: number;
  metaLlamadas: number;
  duracionMin: number;
  estado: "no_iniciada" | "en_curso" | "pausada" | "finalizada";
  segundosTranscurridos: number;
  iniciadaEn?: string;
  bloques: BloqueSesion[];
  contactosHechos: number;
  seguimientosHechos: number;
  respuestas: number;
  llamadasPropuestas: number;
  creadaEn: string;
}

// ---------- Aprendizaje ----------
export interface Aprendizaje {
  id: string;
  fecha: string;
  ruta?: string;
  patron: string;
  objecion: string;
  problemaLiteral: string;
  mejorMensaje: string;
  probarManana: string;
  frasePrincipal: string;
}

// ---------- Plantilla ----------
export interface Plantilla {
  id: string;
  titulo: string;
  texto: string;
  tipoProspecto?: TipoProspecto | "cualquiera";
  cercania?: Cercania | "cualquiera";
  fase?: Fase | "cualquiera";
  objetivo?: string;
  objecion?: string;
  favorito: boolean;
  personalizada: boolean;
}

// ---------- Configuración comercial de IMAGE ----------
export interface EntregableItem {
  id: string;
  texto: string;
}
export interface MiembroEquipo {
  id: string;
  nombre: string;
  rol: string;
}
export interface CriterioItem {
  id: string;
  texto: string;
}

export interface Config {
  nombreOperadora: string;
  nombreLider: string; // Juan Manuel
  nombrePrograma: string; // IMAGE
  // Datos comerciales editables (nunca codificados)
  duracionPrograma: string;
  precio: string;
  cuotas: string;
  entregables: EntregableItem[];
  equipo: MiembroEquipo[];
  enlaceAgenda: string;
  criteriosFit: CriterioItem[];
  criteriosExclusion: CriterioItem[];
  textoProtocoloIdentidad: string;
  // Sesión y metas comerciales
  duracionSesionMin: number;
  metaContactosDiaria: number;
  metaSeguimientosDiaria: number;
  metaLlamadasDiaria: number;
  maxSeguimientos: number;
  ciudadPrincipal: string;
}

// ---------- Estado global persistido (namespace propio de IMAGE) ----------
export interface AppData {
  version: number;
  marca: "IMAGE";
  config: Config;
  prospectos: Prospecto[];
  sesiones: Sesion[];
  aprendizajes: Aprendizaje[];
  plantillasPersonalizadas: Plantilla[];
  favoritos: string[];
}

// ---------- Decisiones del motor ----------
export type Decision =
  | "continuar"
  | "mantener_rapport"
  | "profundizar"
  | "explorar_impacto"
  | "explorar_resultado"
  | "explorar_brecha"
  | "explorar_intencion"
  | "explorar_momento"
  | "validar_fit"
  | "proponer_llamada"
  | "agendar_llamada"
  | "hacer_seguimiento"
  | "dejar_nutricion"
  | "escalar_juan"
  | "identificarse_mireya"
  | "cerrar"
  | "descartar";

export const DECISIONES: { value: Decision; label: string }[] = [
  { value: "continuar", label: "Continuar" },
  { value: "mantener_rapport", label: "Mantener rapport" },
  { value: "profundizar", label: "Profundizar" },
  { value: "explorar_impacto", label: "Explorar impacto" },
  { value: "explorar_resultado", label: "Explorar resultado" },
  { value: "explorar_brecha", label: "Explorar brecha" },
  { value: "explorar_intencion", label: "Explorar intención" },
  { value: "explorar_momento", label: "Explorar momento" },
  { value: "validar_fit", label: "Validar fit" },
  { value: "proponer_llamada", label: "Proponer llamada" },
  { value: "agendar_llamada", label: "Agendar llamada" },
  { value: "hacer_seguimiento", label: "Hacer seguimiento" },
  { value: "dejar_nutricion", label: "Dejar en nutrición" },
  { value: "escalar_juan", label: "Escalar a Juan Manuel" },
  { value: "identificarse_mireya", label: "Identificarse como Mireya" },
  { value: "cerrar", label: "Cerrar" },
  { value: "descartar", label: "Descartar" },
];

export function decisionLabel(d: Decision): string {
  return DECISIONES.find((x) => x.value === d)?.label ?? d;
}

export interface MensajesPorCercania {
  muyCercana: string;
  cercana: string;
  menosCercana: string;
}

export interface Recomendacion {
  fase: Fase;
  temperatura: Temperatura;
  lectura: string;
  evidencia: string; // lo que YA sabemos
  variableQueFalta: string;
  objetivo: string;
  mensajes: MensajesPorCercania;
  advertencia: string;
  alertaSalud: string | null;
  decision: Decision;
}
