"use client";
import { useMemo } from "react";
import Link from "next/link";
import { KanbanSquare } from "lucide-react";
import { useStore } from "@/lib/store";
import { estadoLabel, PIPELINE_ORDEN, Prospecto } from "@/lib/types";
import { BadgeTemperatura, EmptyState } from "@/components/ui";

export default function PipelinePage() {
  const { data, cargando } = useStore();

  const columnas = useMemo(() => {
    return PIPELINE_ORDEN.map((estado) => ({
      estado,
      prospectos: data.prospectos.filter((p) => p.estado === estado),
    })).filter((c) => c.prospectos.length > 0);
  }, [data.prospectos]);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-carbon-900">Pipeline</h1>
        <p className="text-sm text-carbon-500">Todos tus prospectos por etapa comercial. Toca una tarjeta para abrirla.</p>
      </div>

      {columnas.length === 0 ? (
        <EmptyState icono={<KanbanSquare size={40} />} titulo="El pipeline está vacío" descripcion="Registra prospectos y avanza sus estados para verlos aquí por etapa." />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: "min-content" }}>
            {columnas.map((col) => (
              <div key={col.estado} className="w-64 shrink-0">
                <div className="mb-2 flex items-center justify-between rounded-lg bg-carbon-100 px-3 py-2">
                  <span className="text-xs font-bold text-carbon-700">{estadoLabel(col.estado)}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-carbon-600">{col.prospectos.length}</span>
                </div>
                <div className="space-y-2">
                  {col.prospectos.map((p) => (
                    <TarjetaPipeline key={p.id} p={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaPipeline({ p }: { p: Prospecto }) {
  return (
    <Link href={`/prospectos/${p.id}`} className="tarjeta block p-3 transition hover:shadow-suave">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-carbon-900">{p.nombre}</span>
        <BadgeTemperatura t={p.temperatura} />
      </div>
      <p className="mt-0.5 truncate text-xs text-carbon-400">{p.usuarioInstagram}</p>
      {(p.dineroCobrado || p.facturacionContratada) && (
        <p className="mt-1 text-[11px] text-jade-600">
          {p.dineroCobrado ? `Cobrado: ${p.dineroCobrado.toLocaleString("es-CO")}` : `Contratado: ${(p.facturacionContratada ?? 0).toLocaleString("es-CO")}`}
        </p>
      )}
    </Link>
  );
}
