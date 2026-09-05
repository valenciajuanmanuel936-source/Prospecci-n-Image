"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Plus, Search, Trash2, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { Estado, ESTADOS, Prospecto, TipoProspecto, TIPOS_PROSPECTO } from "@/lib/types";
import { formatFecha } from "@/lib/utils";
import { Badge, BadgeEstado, BadgeFase, BadgeTemperatura, EmptyState, Modal, useToast } from "@/components/ui";
import { ProspectoForm } from "@/components/ProspectoForm";

export default function ProspectosPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-carbon-400">Cargando…</div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { data, cargando, agregarProspecto, eliminarProspecto } = useStore();
  const params = useSearchParams();
  const { mostrar, nodo } = useToast();

  const [busqueda, setBusqueda] = useState("");
  const [fTipo, setFTipo] = useState<TipoProspecto | "todos">("todos");
  const [fEstado, setFEstado] = useState<Estado | "todos">((params.get("estado") as Estado) || "todos");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [confirmar, setConfirmar] = useState<Prospecto | null>(null);

  const filtrados = useMemo(() => {
    return data.prospectos.filter((p) => {
      if (fTipo !== "todos" && p.tipoProspecto !== fTipo) return false;
      if (fEstado !== "todos" && p.estado !== fEstado) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        if (!`${p.nombre} ${p.usuarioInstagram} ${p.ciudad} ${p.observacion ?? ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data.prospectos, fTipo, fEstado, busqueda]);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-carbon-900">Prospectos</h1>
          <p className="text-sm text-carbon-500">
            {data.prospectos.length} en total · {filtrados.length} visibles
          </p>
        </div>
        <button className="btn-primario" onClick={() => setModalNuevo(true)}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="tarjeta space-y-3 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-300" />
          <input className="campo pl-9" placeholder="Buscar por nombre, usuario, ciudad…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select className="campo" value={fTipo} onChange={(e) => setFTipo(e.target.value as never)}>
            <option value="todos">Todos los tipos</option>
            {TIPOS_PROSPECTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select className="campo" value={fEstado} onChange={(e) => setFEstado(e.target.value as never)}>
            <option value="todos">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icono={<Users size={40} />}
          titulo="No hay prospectos con estos filtros"
          descripcion="Ajusta los filtros o registra un nuevo prospecto para empezar."
          accion={
            <button className="btn-primario" onClick={() => setModalNuevo(true)}>
              <Plus size={16} /> Nuevo prospecto
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtrados.map((p) => (
            <div key={p.id} className="tarjeta flex items-center gap-3 p-4">
              <Link href={`/prospectos/${p.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-carbon-900">{p.nombre}</span>
                  <span className="text-xs text-carbon-400">{p.usuarioInstagram}</span>
                  {p.esDemo && <Badge color="gris">demo</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <BadgeFase fase={p.fase} />
                  <BadgeTemperatura t={p.temperatura} />
                  <BadgeEstado estado={p.estado} />
                </div>
                <p className="mt-1 text-xs text-carbon-400">
                  {TIPOS_PROSPECTO.find((t) => t.value === p.tipoProspecto)?.label} · {p.ciudad} · último mensaje {formatFecha(p.fechaUltimoMensaje)}
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                {p.urlInstagram && (
                  <a href={p.urlInstagram} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-carbon-400 hover:bg-carbon-50 hover:text-carbon-700" aria-label="Abrir Instagram">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button onClick={() => setConfirmar(p)} className="rounded-lg p-2 text-carbon-400 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modalNuevo} onCerrar={() => setModalNuevo(false)} titulo="Nuevo prospecto" ancho="max-w-2xl">
        <ProspectoForm
          onGuardar={(p) => {
            agregarProspecto(p);
            setModalNuevo(false);
            mostrar("Prospecto creado ✅");
          }}
          onCancelar={() => setModalNuevo(false)}
        />
      </Modal>

      <Modal abierto={!!confirmar} onCerrar={() => setConfirmar(null)} titulo="Eliminar prospecto">
        <p className="text-sm text-carbon-700">
          ¿Seguro que quieres eliminar a <b>{confirmar?.nombre}</b>? Esta acción no se puede deshacer.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secundario" onClick={() => setConfirmar(null)}>
            Cancelar
          </button>
          <button
            className="btn bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              if (confirmar) {
                eliminarProspecto(confirmar.id);
                mostrar("Prospecto eliminado");
              }
              setConfirmar(null);
            }}
          >
            <Trash2 size={15} /> Eliminar
          </button>
        </div>
      </Modal>

      {nodo}
    </div>
  );
}
