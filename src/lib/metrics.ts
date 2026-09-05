// =============================================================
// Métricas de IMAGE (desde datos reales; nunca se inventan).
// Diferencia venta cerrada, facturación contratada y dinero cobrado.
// =============================================================
import { Aprendizaje, Prospecto, Sesion, TipoProspecto, TIPOS_PROSPECTO } from "./types";

export interface RangoFechas {
  desde: string;
  hasta: string;
}

function enRango(iso: string | undefined, r: RangoFechas): boolean {
  if (!iso) return false;
  const d = iso.slice(0, 10);
  return d >= r.desde && d <= r.hasta;
}

export interface Metricas {
  contactos: number;
  respuestas: number;
  tasaRespuesta: number;
  discoveries: number;
  problemasValidados: number;
  calificados: number;
  llamadasPropuestas: number;
  llamadasAgendadas: number;
  asistencia: number;
  ofertas: number;
  cierres: number; // ventas cerradas (cerrado_ganado)
  facturacionContratada: number;
  dineroCobrado: number;
  seguimientos: number;
  perdidas: number;
}

const DISCOVERY_ESTADOS = [
  "discovery",
  "problema_validado",
  "fit_por_confirmar",
  "calificado",
  "llamada_propuesta",
  "llamada_agendada",
  "postllamada",
  "cerrado_ganado",
];

export function calcularMetricas(prospectos: Prospecto[], sesiones: Sesion[], rango: RangoFechas): Metricas {
  const ps = prospectos.filter((p) => enRango(p.creadoEn, rango) || enRango(p.fechaPrimerContacto, rango));
  const ss = sesiones.filter((s) => enRango(s.fecha, rango));

  const contactosSesion = ss.reduce((a, s) => a + s.contactosHechos, 0);
  const seguimientos = ss.reduce((a, s) => a + s.seguimientosHechos, 0);
  const respuestasSesion = ss.reduce((a, s) => a + s.respuestas, 0);
  const respuestasHist = prospectos.reduce(
    (a, p) => a + p.historial.filter((m) => m.emisor === "prospecto" && enRango(m.fecha, rango)).length,
    0
  );
  const respuestas = Math.max(respuestasSesion, respuestasHist);
  const contactos = Math.max(contactosSesion, ps.length);

  const cnt = (fn: (p: Prospecto) => boolean) => ps.filter(fn).length;
  const suma = (fn: (p: Prospecto) => number) => ps.reduce((a, p) => a + fn(p), 0);

  return {
    contactos,
    respuestas,
    tasaRespuesta: contactos > 0 ? respuestas / contactos : 0,
    discoveries: cnt((p) => DISCOVERY_ESTADOS.includes(p.estado)),
    problemasValidados: cnt((p) => (p.problema || "").trim().length > 0),
    calificados: cnt((p) => ["calificado", "llamada_propuesta", "llamada_agendada", "postllamada", "cerrado_ganado"].includes(p.estado)),
    llamadasPropuestas: cnt((p) => ["llamada_propuesta", "llamada_agendada", "no_asistio", "postllamada", "cerrado_ganado", "cerrado_perdido"].includes(p.estado)),
    llamadasAgendadas: cnt((p) => ["llamada_agendada", "postllamada", "no_asistio", "cerrado_ganado", "cerrado_perdido"].includes(p.estado)),
    asistencia: cnt((p) => p.asistioLlamada === true),
    ofertas: cnt((p) => p.ofertaPresentada === true),
    cierres: cnt((p) => p.estado === "cerrado_ganado"),
    facturacionContratada: suma((p) => p.facturacionContratada ?? 0),
    dineroCobrado: suma((p) => p.dineroCobrado ?? 0),
    seguimientos,
    perdidas: cnt((p) => p.estado === "cerrado_perdido"),
  };
}

// Embudo
export interface Embudo {
  contactados: number;
  respondieron: number;
  discovery: number;
  problemaValidado: number;
  calificado: number;
  llamadaAgendada: number;
  cerradoGanado: number;
}

const DISCOVERY_TODOS = [
  "discovery",
  "problema_validado",
  "fit_por_confirmar",
  "calificado",
  "llamada_propuesta",
  "llamada_agendada",
  "no_asistio",
  "postllamada",
  "cerrado_ganado",
  "cerrado_perdido",
];

export function calcularEmbudo(prospectos: Prospecto[]): Embudo {
  return {
    contactados: prospectos.filter((p) => p.estado !== "nuevo").length,
    respondieron: prospectos.filter((p) => p.historial.some((m) => m.emisor === "prospecto")).length,
    discovery: prospectos.filter((p) => DISCOVERY_TODOS.includes(p.estado)).length,
    problemaValidado: prospectos.filter((p) => (p.problema || "").trim()).length,
    calificado: prospectos.filter((p) =>
      ["calificado", "llamada_propuesta", "llamada_agendada", "postllamada", "cerrado_ganado"].includes(p.estado)
    ).length,
    llamadaAgendada: prospectos.filter((p) =>
      ["llamada_agendada", "postllamada", "cerrado_ganado", "cerrado_perdido", "no_asistio"].includes(p.estado)
    ).length,
    cerradoGanado: prospectos.filter((p) => p.estado === "cerrado_ganado").length,
  };
}

// Desglose por fuente (tipo de prospecto)
export function desglosePorFuente(
  prospectos: Prospecto[]
): { fuente: TipoProspecto; label: string; total: number; cierres: number; cobrado: number }[] {
  const map = new Map<TipoProspecto, { total: number; cierres: number; cobrado: number }>();
  for (const p of prospectos) {
    const cur = map.get(p.tipoProspecto) ?? { total: 0, cierres: 0, cobrado: 0 };
    cur.total++;
    if (p.estado === "cerrado_ganado") cur.cierres++;
    cur.cobrado += p.dineroCobrado ?? 0;
    map.set(p.tipoProspecto, cur);
  }
  return Array.from(map.entries()).map(([fuente, v]) => ({
    fuente,
    label: TIPOS_PROSPECTO.find((t) => t.value === fuente)?.label ?? fuente,
    ...v,
  }));
}

// Motivos de pérdida
export function motivosDePerdida(prospectos: Prospecto[]): { motivo: string; total: number }[] {
  const map = new Map<string, number>();
  for (const p of prospectos) {
    if (p.estado === "cerrado_perdido") {
      const m = (p.motivoPerdida || "").trim() || "Sin motivo registrado";
      map.set(m, (map.get(m) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([motivo, total]) => ({ motivo, total }))
    .sort((a, b) => b.total - a.total);
}

export function aprendizajesEnRango(aprendizajes: Aprendizaje[], rango: RangoFechas): Aprendizaje[] {
  return aprendizajes.filter((a) => enRango(a.fecha, rango));
}
