"use client";
import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, CalendarX2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { EstadoSeguimiento, getFollowUpStatus, getMessageSuggestions, hoyISO } from "@/lib/rules-engine";
import { cercaniaA3 } from "@/lib/messages";
import { Prospecto } from "@/lib/types";
import { formatFecha } from "@/lib/utils";
import { Badge, BadgeFase, CopyButton, EmptyState } from "@/components/ui";

const GRUPOS: { estado: EstadoSeguimiento; titulo: string; color: string; nota?: string }[] = [
  { estado: "vencido", titulo: "Vencidos", color: "text-red-600", nota: "Su fecha de seguimiento ya pasó." },
  { estado: "hoy", titulo: "Para hoy", color: "text-ambar-600" },
  { estado: "ultimo_intento", titulo: "Último intento", color: "text-ambar-600", nota: "Queda el último seguimiento. Después no se persigue." },
  { estado: "proximo", titulo: "Próximos", color: "text-carbon-700" },
  { estado: "sin_fecha", titulo: "Sin fecha", color: "text-carbon-500", nota: "Conversaciones sin seguimiento programado." },
  { estado: "sin_respuesta", titulo: "Sin respuesta (cerrados)", color: "text-carbon-500", nota: "Se alcanzó el máximo de seguimientos. No se recomiendan más mensajes." },
];

export default function SeguimientosPage() {
  const { data, cargando } = useStore();
  const hoy = hoyISO();
  const max = data.config.maxSeguimientos;

  const grupos = useMemo(() => {
    const map: Record<EstadoSeguimiento, Prospecto[]> = {
      vencido: [],
      hoy: [],
      proximo: [],
      sin_fecha: [],
      ultimo_intento: [],
      sin_respuesta: [],
      no_aplica: [],
    };
    for (const p of data.prospectos) map[getFollowUpStatus(p, hoy, max)].push(p);
    return map;
  }, [data.prospectos, hoy, max]);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  const hayAlgo = GRUPOS.some((g) => grupos[g.estado].length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-carbon-900">Seguimientos</h1>
        <p className="text-sm text-carbon-500">Máximo {max} seguimientos por prospecto. Después no se persigue: se nutre o se cierra.</p>
      </div>

      {!hayAlgo ? (
        <EmptyState icono={<CalendarClock size={40} />} titulo="No hay seguimientos pendientes" descripcion="Cuando programes seguimientos desde un prospecto, aparecerán aquí por urgencia." />
      ) : (
        GRUPOS.map((g) => {
          const lista = grupos[g.estado];
          if (lista.length === 0) return null;
          return (
            <section key={g.estado}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className={`text-sm font-bold uppercase tracking-wide ${g.color}`}>{g.titulo}</h2>
                <Badge color="gris">{lista.length}</Badge>
              </div>
              {g.nota && <p className="mb-2 text-xs text-carbon-400">{g.nota}</p>}
              <div className="space-y-2.5">
                {lista.map((p) => (
                  <TarjetaSeguimiento key={p.id} p={p} estado={g.estado} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function TarjetaSeguimiento({ p, estado }: { p: Prospecto; estado: EstadoSeguimiento }) {
  const sugerido = estado !== "sin_respuesta" ? getMessageSuggestions(p, "seguimiento_prellamada", []) : null;
  const cerc = cercaniaA3(p.cercania);
  const texto = sugerido ? (cerc === "muy_cercana" ? sugerido.muyCercana : cerc === "cercana" ? sugerido.cercana : sugerido.menosCercana) : null;

  return (
    <div className="tarjeta p-4">
      <Link href={`/prospectos/${p.id}`} className="block">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-carbon-900">{p.nombre}</span>
          <span className="text-xs text-carbon-400">{p.usuarioInstagram}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <BadgeFase fase={p.fase} />
          <Badge color="gris">seguimientos: {p.seguimientosRealizados}</Badge>
        </div>
        <p className="mt-1 text-xs text-carbon-400">
          Último mensaje: {formatFecha(p.fechaUltimoMensaje)}
          {p.proximoSeguimiento ? ` · programado: ${p.proximoSeguimiento}` : ""}
        </p>
      </Link>

      {texto ? (
        <div className="mt-3 rounded-xl border border-carbon-100 bg-carbon-50/50 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-carbon-500">Seguimiento sugerido</span>
            <CopyButton texto={texto} />
          </div>
          <p className="whitespace-pre-wrap text-sm text-carbon-800">{texto}</p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-carbon-50 px-3 py-2 text-xs text-carbon-500">
          <CalendarX2 size={15} /> No se recomiendan más mensajes. Reactívalo manualmente si más adelante tiene sentido.
        </div>
      )}
    </div>
  );
}
