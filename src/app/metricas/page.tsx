"use client";
import { useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useStore } from "@/lib/store";
import { aprendizajesEnRango, calcularEmbudo, calcularMetricas, desglosePorFuente, motivosDePerdida, RangoFechas } from "@/lib/metrics";
import { hoyISO } from "@/lib/rules-engine";
import { cx, formatDinero, formatFecha, sumarDias } from "@/lib/utils";
import { Badge, EmptyState, ProgressBar, SectionTitle } from "@/components/ui";

type Preset = "hoy" | "semana" | "mes" | "personalizado";

export default function MetricasPage() {
  const { data, cargando } = useStore();
  const hoy = hoyISO();
  const [preset, setPreset] = useState<Preset>("semana");
  const [desde, setDesde] = useState(sumarDias(hoy, -6));
  const [hasta, setHasta] = useState(hoy);

  const rango: RangoFechas = useMemo(() => {
    if (preset === "hoy") return { desde: hoy, hasta: hoy };
    if (preset === "semana") return { desde: sumarDias(hoy, -6), hasta: hoy };
    if (preset === "mes") return { desde: sumarDias(hoy, -29), hasta: hoy };
    return { desde, hasta };
  }, [preset, hoy, desde, hasta]);

  const m = useMemo(() => calcularMetricas(data.prospectos, data.sesiones, rango), [data, rango]);
  const embudo = useMemo(() => calcularEmbudo(data.prospectos), [data.prospectos]);
  const fuentes = useMemo(() => desglosePorFuente(data.prospectos), [data.prospectos]);
  const perdidas = useMemo(() => motivosDePerdida(data.prospectos), [data.prospectos]);
  const aprendizajes = useMemo(() => aprendizajesEnRango(data.aprendizajes, rango), [data.aprendizajes, rango]);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  const cards: { label: string; valor: string | number }[] = [
    { label: "Contactos", valor: m.contactos },
    { label: "Respuestas", valor: m.respuestas },
    { label: "Tasa de respuesta", valor: `${Math.round(m.tasaRespuesta * 100)}%` },
    { label: "Discoveries", valor: m.discoveries },
    { label: "Problemas validados", valor: m.problemasValidados },
    { label: "Calificados", valor: m.calificados },
    { label: "Llamadas propuestas", valor: m.llamadasPropuestas },
    { label: "Llamadas agendadas", valor: m.llamadasAgendadas },
    { label: "Asistencia a llamada", valor: m.asistencia },
    { label: "Ofertas", valor: m.ofertas },
    { label: "Cierres (ventas)", valor: m.cierres },
    { label: "Seguimientos", valor: m.seguimientos },
  ];

  const embudoPasos = [
    { label: "Contactados", valor: embudo.contactados },
    { label: "Respondieron", valor: embudo.respondieron },
    { label: "Discovery", valor: embudo.discovery },
    { label: "Problema validado", valor: embudo.problemaValidado },
    { label: "Calificado", valor: embudo.calificado },
    { label: "Llamada agendada", valor: embudo.llamadaAgendada },
    { label: "Cerrado ganado", valor: embudo.cerradoGanado },
  ];
  const maxEmbudo = Math.max(1, ...embudoPasos.map((e) => e.valor));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-carbon-900">Métricas</h1>
        <p className="text-sm text-carbon-500">Calculadas desde tus datos reales. Si no hay datos, no se inventan.</p>
      </div>

      <div className="tarjeta space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {([
            ["hoy", "Hoy"],
            ["semana", "Últimos 7 días"],
            ["mes", "Últimos 30 días"],
            ["personalizado", "Personalizado"],
          ] as [Preset, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setPreset(v)}
              className={cx("rounded-full px-3.5 py-1.5 text-xs font-semibold transition", preset === v ? "bg-carbon-900 text-white" : "bg-carbon-50 text-carbon-600 hover:bg-carbon-100")}
            >
              {l}
            </button>
          ))}
        </div>
        {preset === "personalizado" && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="campo w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <span className="text-carbon-400">→</span>
            <input type="date" className="campo w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        )}
        <p className="text-xs text-carbon-400">
          Rango: {formatFecha(rango.desde)} — {formatFecha(rango.hasta)}
        </p>
      </div>

      {/* Dinero: facturación vs cobrado (diferenciados) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="tarjeta p-4">
          <p className="text-xs text-carbon-500">Facturación contratada</p>
          <p className="text-2xl font-bold text-carbon-900">{formatDinero(m.facturacionContratada)}</p>
          <p className="mt-1 text-[11px] text-carbon-400">Lo comprometido por los cierres.</p>
        </div>
        <div className="tarjeta p-4">
          <p className="text-xs text-carbon-500">Dinero efectivamente cobrado</p>
          <p className="text-2xl font-bold text-jade-600">{formatDinero(m.dineroCobrado)}</p>
          <p className="mt-1 text-[11px] text-carbon-400">Lo que realmente entró en caja.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="tarjeta p-4">
            <p className="text-2xl font-bold text-carbon-900 tabular-nums">{c.valor}</p>
            <p className="text-xs text-carbon-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="tarjeta p-5">
        <SectionTitle>Embudo</SectionTitle>
        <div className="space-y-2.5">
          {embudoPasos.map((e) => (
            <div key={e.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-carbon-600">{e.label}</span>
                <span className="font-semibold text-carbon-800">{e.valor}</span>
              </div>
              <ProgressBar valor={(e.valor / maxEmbudo) * 100} color="ambar" />
            </div>
          ))}
        </div>
      </div>

      <div className="tarjeta p-5">
        <SectionTitle>Desglose por fuente</SectionTitle>
        {fuentes.length === 0 ? (
          <p className="text-sm text-carbon-400">Sin datos todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-carbon-100 text-left text-xs text-carbon-400">
                  <th className="py-2">Fuente</th>
                  <th className="py-2 text-center">Total</th>
                  <th className="py-2 text-center">Cierres</th>
                  <th className="py-2 text-right">Cobrado</th>
                </tr>
              </thead>
              <tbody>
                {fuentes.map((f) => (
                  <tr key={f.fuente} className="border-b border-carbon-50">
                    <td className="py-2 text-carbon-700">{f.label}</td>
                    <td className="py-2 text-center font-semibold">{f.total}</td>
                    <td className="py-2 text-center text-jade-600">{f.cierres}</td>
                    <td className="py-2 text-right text-carbon-600">{f.cobrado ? formatDinero(f.cobrado) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="tarjeta p-5">
        <SectionTitle>Motivos de pérdida</SectionTitle>
        {perdidas.length === 0 ? (
          <p className="text-sm text-carbon-400">Sin pérdidas registradas.</p>
        ) : (
          <div className="space-y-1.5">
            {perdidas.map((p) => (
              <div key={p.motivo} className="flex items-center justify-between rounded-lg bg-carbon-50 px-3 py-2 text-sm">
                <span className="text-carbon-700">{p.motivo}</span>
                <Badge color="gris">{p.total}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tarjeta p-5">
        <SectionTitle>Aprendizajes del periodo</SectionTitle>
        {aprendizajes.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-carbon-400">
            <Lightbulb size={16} /> Aún no hay aprendizajes en este rango.
          </div>
        ) : (
          <div className="space-y-3">
            {aprendizajes.map((a) => (
              <div key={a.id} className="rounded-xl border border-carbon-100 p-3.5">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-carbon-400">{formatFecha(a.fecha)}</span>
                  {a.ruta && <Badge color="carbon">{a.ruta}</Badge>}
                </div>
                {a.frasePrincipal && <p className="font-semibold text-carbon-900">“{a.frasePrincipal}”</p>}
                <dl className="mt-1 space-y-0.5 text-xs text-carbon-600">
                  {a.patron && <div><b>Patrón:</b> {a.patron}</div>}
                  {a.objecion && <div><b>Objeción:</b> {a.objecion}</div>}
                  {a.problemaLiteral && <div><b>Problema:</b> {a.problemaLiteral}</div>}
                  {a.mejorMensaje && <div><b>Mejor mensaje:</b> {a.mejorMensaje}</div>}
                  {a.probarManana && <div><b>Probar mañana:</b> {a.probarManana}</div>}
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
