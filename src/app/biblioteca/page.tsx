"use client";
import { useMemo, useState } from "react";
import { Copy, Heart, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { getPlantillasBase } from "@/lib/messages";
import { Cercania, CERCANIAS, Fase, FASES, Plantilla, TipoProspecto, TIPOS_PROSPECTO } from "@/lib/types";
import { cx, uid } from "@/lib/utils";
import { Badge, CopyButton, EmptyState, Modal, useToast } from "@/components/ui";

export default function BibliotecaPage() {
  const { data, cargando, agregarPlantilla, actualizarPlantilla, eliminarPlantilla, toggleFavorito } = useStore();
  const { mostrar, nodo } = useToast();

  const base = useMemo(() => getPlantillasBase(), []);
  const [busqueda, setBusqueda] = useState("");
  const [fTipo, setFTipo] = useState<TipoProspecto | "todos">("todos");
  const [fCercania, setFCercania] = useState<Cercania | "todas">("todas");
  const [fFase, setFFase] = useState<Fase | "todas">("todas");
  const [soloFav, setSoloFav] = useState(false);
  const [modalEditar, setModalEditar] = useState<Plantilla | null>(null);
  const [modalNuevo, setModalNuevo] = useState(false);

  const todas: Plantilla[] = useMemo(() => {
    const conFav = base.map((p) => ({ ...p, favorito: data.favoritos.includes(p.id) }));
    return [...data.plantillasPersonalizadas, ...conFav];
  }, [base, data.favoritos, data.plantillasPersonalizadas]);

  const filtradas = useMemo(() => {
    return todas.filter((p) => {
      if (soloFav && !p.favorito) return false;
      if (fTipo !== "todos" && p.tipoProspecto && p.tipoProspecto !== "cualquiera" && p.tipoProspecto !== fTipo) return false;
      if (fCercania !== "todas" && p.cercania && p.cercania !== "cualquiera" && p.cercania !== fCercania) return false;
      if (fFase !== "todas" && p.fase && p.fase !== "cualquiera" && p.fase !== fFase) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        if (!`${p.titulo} ${p.texto} ${p.objetivo ?? ""} ${p.objecion ?? ""}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [todas, soloFav, fTipo, fCercania, fFase, busqueda]);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  const duplicar = (p: Plantilla) => {
    agregarPlantilla({ ...p, id: uid("tpl"), titulo: `${p.titulo} (copia)`, favorito: false, personalizada: true });
    mostrar("Plantilla duplicada");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-carbon-900">Biblioteca de mensajes</h1>
          <p className="text-sm text-carbon-500">{filtradas.length} plantillas visibles</p>
        </div>
        <button className="btn-primario" onClick={() => setModalNuevo(true)}>
          <Plus size={16} /> Crear
        </button>
      </div>

      <div className="tarjeta space-y-3 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-300" />
          <input className="campo pl-9" placeholder="Buscar mensajes…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select className="campo" value={fTipo} onChange={(e) => setFTipo(e.target.value as never)}>
            <option value="todos">Todos los tipos</option>
            {TIPOS_PROSPECTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select className="campo" value={fCercania} onChange={(e) => setFCercania(e.target.value as never)}>
            <option value="todas">Cualquier cercanía</option>
            {CERCANIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select className="campo" value={fFase} onChange={(e) => setFFase(e.target.value as never)}>
            <option value="todas">Cualquier fase</option>
            {FASES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setSoloFav((s) => !s)}
          className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", soloFav ? "bg-ambar-500 text-white" : "bg-carbon-50 text-carbon-600")}
        >
          <Heart size={13} className={soloFav ? "fill-current" : ""} /> Solo favoritos
        </button>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState titulo="No hay plantillas con estos filtros" descripcion="Prueba con otros filtros o crea una plantilla personalizada." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map((p) => (
            <div key={p.id} className="tarjeta flex flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-carbon-800">{p.titulo}</span>
                  {p.personalizada && <Badge color="ambar">personalizada</Badge>}
                </div>
                <button onClick={() => toggleFavorito(p.id)} className={cx("rounded-lg p-1.5", p.favorito ? "text-ambar-500" : "text-carbon-300 hover:text-ambar-400")} aria-label="Favorito">
                  <Star size={16} className={p.favorito ? "fill-current" : ""} />
                </button>
              </div>
              <p className="flex-1 whitespace-pre-wrap text-sm text-carbon-700">{p.texto}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.fase && p.fase !== "cualquiera" && <Badge color="ambar">{FASES.find((f) => f.value === p.fase)?.label}</Badge>}
                {p.objetivo && <Badge color="carbon">{p.objetivo}</Badge>}
                {p.objecion && <Badge color="gris">{p.objecion}</Badge>}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <CopyButton texto={p.texto} />
                <button className="btn-secundario px-2.5 py-1.5 text-xs" onClick={() => duplicar(p)}>
                  <Copy size={13} /> Duplicar
                </button>
                {p.personalizada && (
                  <>
                    <button className="btn-secundario px-2.5 py-1.5 text-xs" onClick={() => setModalEditar(p)}>
                      <Pencil size={13} /> Editar
                    </button>
                    <button className="rounded-lg p-2 text-carbon-400 hover:bg-red-50 hover:text-red-600" onClick={() => { eliminarPlantilla(p.id); mostrar("Plantilla eliminada"); }} aria-label="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modalNuevo} onCerrar={() => setModalNuevo(false)} titulo="Nueva plantilla" ancho="max-w-lg">
        <EditorPlantilla onGuardar={(p) => { agregarPlantilla(p); setModalNuevo(false); mostrar("Plantilla creada"); }} />
      </Modal>
      <Modal abierto={!!modalEditar} onCerrar={() => setModalEditar(null)} titulo="Editar plantilla" ancho="max-w-lg">
        {modalEditar && (
          <EditorPlantilla inicial={modalEditar} onGuardar={(p) => { actualizarPlantilla(modalEditar.id, p); setModalEditar(null); mostrar("Plantilla actualizada"); }} />
        )}
      </Modal>

      {nodo}
    </div>
  );
}

function EditorPlantilla({ inicial, onGuardar }: { inicial?: Plantilla; onGuardar: (p: Plantilla) => void }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [texto, setTexto] = useState(inicial?.texto ?? "");
  const [fase, setFase] = useState<Fase | "cualquiera">(inicial?.fase ?? "cualquiera");
  const [cercania, setCercania] = useState<Cercania | "cualquiera">(inicial?.cercania ?? "cualquiera");
  const [objetivo, setObjetivo] = useState(inicial?.objetivo ?? "");

  return (
    <div className="space-y-3">
      <div>
        <label className="etiqueta">Título</label>
        <input className="campo" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Apertura para referidos" />
      </div>
      <div>
        <label className="etiqueta">Mensaje</label>
        <textarea className="campo min-h-[100px]" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Puedes usar [nombre], {observacion}…" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="etiqueta">Fase</label>
          <select className="campo" value={fase} onChange={(e) => setFase(e.target.value as never)}>
            <option value="cualquiera">Cualquiera</option>
            {FASES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiqueta">Cercanía</label>
          <select className="campo" value={cercania} onChange={(e) => setCercania(e.target.value as never)}>
            <option value="cualquiera">Cualquiera</option>
            {CERCANIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="etiqueta">Objetivo (opcional)</label>
        <input className="campo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
      </div>
      <button
        className="btn-primario w-full"
        disabled={!titulo.trim() || !texto.trim()}
        onClick={() =>
          onGuardar({
            id: inicial?.id ?? uid("tpl"),
            titulo: titulo.trim(),
            texto: texto.trim(),
            fase,
            cercania,
            objetivo: objetivo.trim() || undefined,
            favorito: inicial?.favorito ?? false,
            personalizada: true,
          })
        }
      >
        Guardar plantilla
      </button>
    </div>
  );
}
