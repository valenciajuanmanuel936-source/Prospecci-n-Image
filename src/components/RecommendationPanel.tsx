"use client";
import { AlertTriangle, Compass, HeartPulse, Link2, ListChecks, ShieldAlert, Target, Thermometer } from "lucide-react";
import { Cercania, decisionLabel, faseLabel, Recomendacion, RIESGO_LABELS } from "@/lib/types";
import { cx } from "@/lib/utils";
import { Badge, BadgeTemperatura, CopyButton } from "./ui";

function decisionColor(d: Recomendacion["decision"]): "jade" | "ambar" | "rojo" | "carbon" {
  switch (d) {
    case "proponer_llamada":
    case "agendar_llamada":
      return "jade";
    case "identificarse_mireya":
    case "escalar_juan":
      return "ambar";
    case "descartar":
    case "cerrar":
      return "rojo";
    case "hacer_seguimiento":
    case "dejar_nutricion":
      return "ambar";
    default:
      return "carbon";
  }
}

export function RecommendationPanel({ rec, cercania, className }: { rec: Recomendacion; cercania: Cercania; className?: string }) {
  const destacado: "muyCercana" | "cercana" | "menosCercana" =
    cercania === "muy_cercana" ? "muyCercana" : cercania === "cercana" ? "cercana" : "menosCercana";

  const mensajes: { key: typeof destacado; titulo: string; texto: string }[] = [
    { key: "muyCercana", titulo: "Muy cercano", texto: rec.mensajes.muyCercana },
    { key: "cercana", titulo: "Cercano", texto: rec.mensajes.cercana },
    { key: "menosCercana", titulo: "Menos cercano", texto: rec.mensajes.menosCercana },
  ];

  return (
    <div className={cx("tarjeta overflow-hidden", className)}>
      <div className="border-b border-carbon-100 bg-carbon-50/70 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color="ambar">{faseLabel(rec.fase)}</Badge>
          <BadgeTemperatura t={rec.temperatura} />
          <Badge color={decisionColor(rec.decision)}>Decisión: {decisionLabel(rec.decision)}</Badge>
          {typeof rec.score === "number" && <Badge color="carbon">Score {rec.score}/16</Badge>}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {rec.alertaSalud && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <HeartPulse size={18} className="mt-0.5 shrink-0" />
            <span>{rec.alertaSalud}</span>
          </div>
        )}

        <Item icono={<Compass size={16} />} titulo="Lectura">{rec.lectura}</Item>
        <Item icono={<ListChecks size={16} />} titulo="Evidencia">{rec.evidencia}</Item>
        <Item icono={<Target size={16} />} titulo="Variable que falta">{rec.variableQueFalta}</Item>
        <Item icono={<Target size={16} />} titulo="Objetivo">{rec.objetivo}</Item>
        {rec.porQue && <Item icono={<Link2 size={16} />} titulo="Por qué">{rec.porQue}</Item>}

        {rec.readiness && !rec.readiness.ready && rec.readiness.faltan.length > 0 && (
          <Item icono={<Target size={16} />} titulo="Para invitar a llamada, falta">
            {rec.readiness.faltan.join(" · ")}
          </Item>
        )}

        {rec.advertencia && (
          <div className="flex items-start gap-2 rounded-xl border border-ambar-200 bg-ambar-50 px-4 py-3 text-sm text-ambar-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{rec.advertencia}</span>
          </div>
        )}

        {rec.riesgo && rec.riesgo !== "NONE" && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <span><b>Riesgo:</b> {RIESGO_LABELS[rec.riesgo]}. Revisa el mensaje antes de enviarlo.</span>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-carbon-700">
            <Thermometer size={16} /> Mensajes sugeridos
          </div>
          <div className="space-y-2.5">
            {mensajes.map((m) => {
              const esDefault = m.key === destacado;
              return (
                <div
                  key={m.key}
                  className={cx(
                    "rounded-xl border p-3.5",
                    esDefault ? "border-carbon-800 bg-carbon-50/70 ring-1 ring-carbon-200" : "border-carbon-100 bg-white"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-carbon-600">
                      {m.titulo}
                      {esDefault && (
                        <span className="rounded-full bg-carbon-800 px-2 py-0.5 text-[10px] font-bold text-ambar-300">sugerido</span>
                      )}
                    </span>
                    <CopyButton texto={m.texto} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-carbon-800">{m.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ icono, titulo, children }: { icono: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-carbon-400">
        {icono} {titulo}
      </div>
      <p className="text-sm leading-relaxed text-carbon-800">{children}</p>
    </div>
  );
}
