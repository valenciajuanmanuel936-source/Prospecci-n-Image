"use client";
import { useRef, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { descargarArchivo, exportarJSON, prospectosACSV, validarImportacion } from "@/lib/storage";
import { CriterioItem, EntregableItem, MiembroEquipo } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Modal, SectionTitle, useToast } from "@/components/ui";

export default function ConfiguracionPage() {
  const { data, cargando, actualizarConfig, reemplazarDatos, cargarDemo, eliminarDemo, reiniciarTodo } = useStore();
  const { mostrar, nodo } = useToast();
  const c = data.config;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{ raw: string; resumen: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  // Helpers para listas de {id, texto}
  const setLista = <T extends { id: string }>(key: "entregables" | "criteriosFit" | "criteriosExclusion", items: T[]) =>
    actualizarConfig({ [key]: items } as never);

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result);
      const res = validarImportacion(raw);
      if (!res.ok || !res.data) {
        mostrar(`Importación inválida: ${res.error}`);
        return;
      }
      const d = res.data;
      setImportPreview({
        raw,
        resumen: `${d.prospectos.length} prospectos, ${d.sesiones.length} sesiones, ${d.aprendizajes.length} aprendizajes, ${d.plantillasPersonalizadas.length} plantillas.`,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-carbon-900">Configuración</h1>
        <p className="text-sm text-carbon-500">Datos de {c.nombrePrograma}. Todo se guarda automáticamente en este navegador.</p>
      </div>

      {/* Operación */}
      <div className="tarjeta p-5">
        <SectionTitle>Operación</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Nombre de la operadora" value={c.nombreOperadora} onChange={(v) => actualizarConfig({ nombreOperadora: v })} />
          <Campo label="Nombre del líder" value={c.nombreLider} onChange={(v) => actualizarConfig({ nombreLider: v })} />
          <Campo label="Nombre del programa" value={c.nombrePrograma} onChange={(v) => actualizarConfig({ nombrePrograma: v })} />
          <Campo label="Ciudad principal" value={c.ciudadPrincipal} onChange={(v) => actualizarConfig({ ciudadPrincipal: v })} />
        </div>
      </div>

      {/* Datos comerciales */}
      <div className="tarjeta p-5">
        <SectionTitle>Datos comerciales del programa</SectionTitle>
        <p className="mb-3 text-xs text-carbon-400">Nada está codificado: la app solo sugiere lo que cargues aquí, y siempre después de entender el caso.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Duración del programa" value={c.duracionPrograma} onChange={(v) => actualizarConfig({ duracionPrograma: v })} placeholder="Ej: 12 semanas" />
          <Campo label="Precio" value={c.precio} onChange={(v) => actualizarConfig({ precio: v })} placeholder="Ej: $X.XXX.XXX" />
          <Campo label="Cuotas" value={c.cuotas} onChange={(v) => actualizarConfig({ cuotas: v })} placeholder="Ej: hasta 3 cuotas" />
          <Campo label="Enlace de agenda" value={c.enlaceAgenda} onChange={(v) => actualizarConfig({ enlaceAgenda: v })} placeholder="https://calendly.com/..." />
        </div>

        <ListaEditable
          titulo="Entregables"
          items={c.entregables}
          onAdd={() => setLista("entregables", [...c.entregables, { id: uid("ent"), texto: "" }])}
          onChange={(id, texto) => setLista("entregables", c.entregables.map((x) => (x.id === id ? { ...x, texto } : x)))}
          onDel={(id) => setLista("entregables", c.entregables.filter((x) => x.id !== id))}
        />

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-carbon-700">Equipo</span>
            <button className="btn-secundario px-2.5 py-1.5 text-xs" onClick={() => actualizarConfig({ equipo: [...c.equipo, { id: uid("eq"), nombre: "", rol: "" }] })}>
              <Plus size={13} /> Agregar
            </button>
          </div>
          <div className="space-y-2">
            {c.equipo.map((m: MiembroEquipo) => (
              <div key={m.id} className="flex gap-2">
                <input className="campo flex-1" placeholder="Nombre" value={m.nombre} onChange={(e) => actualizarConfig({ equipo: c.equipo.map((x) => (x.id === m.id ? { ...x, nombre: e.target.value } : x)) })} />
                <input className="campo flex-1" placeholder="Rol" value={m.rol} onChange={(e) => actualizarConfig({ equipo: c.equipo.map((x) => (x.id === m.id ? { ...x, rol: e.target.value } : x)) })} />
                <button className="rounded-lg p-2 text-carbon-400 hover:bg-red-50 hover:text-red-600" onClick={() => actualizarConfig({ equipo: c.equipo.filter((x) => x.id !== m.id) })} aria-label="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Criterios de fit y exclusión */}
      <div className="tarjeta p-5">
        <SectionTitle>Criterios de fit y exclusión</SectionTitle>
        <ListaEditable
          titulo="Criterios de fit"
          items={c.criteriosFit}
          onAdd={() => setLista("criteriosFit", [...c.criteriosFit, { id: uid("fit"), texto: "" }])}
          onChange={(id, texto) => setLista("criteriosFit", c.criteriosFit.map((x) => (x.id === id ? { ...x, texto } : x)))}
          onDel={(id) => setLista("criteriosFit", c.criteriosFit.filter((x) => x.id !== id))}
        />
        <div className="mt-4">
          <ListaEditable
            titulo="Criterios de exclusión"
            items={c.criteriosExclusion}
            onAdd={() => setLista("criteriosExclusion", [...c.criteriosExclusion, { id: uid("exc"), texto: "" }])}
            onChange={(id, texto) => setLista("criteriosExclusion", c.criteriosExclusion.map((x) => (x.id === id ? { ...x, texto } : x)))}
            onDel={(id) => setLista("criteriosExclusion", c.criteriosExclusion.filter((x) => x.id !== id))}
          />
        </div>
      </div>

      {/* Protocolo de identidad */}
      <div className="tarjeta p-5">
        <SectionTitle>Protocolo de identidad</SectionTitle>
        <p className="mb-2 text-xs text-carbon-400">Mensaje que la app recomienda cuando preguntan quién escribe, piden audio/llamada o quieren negociar.</p>
        <textarea className="campo min-h-[90px]" value={c.textoProtocoloIdentidad} onChange={(e) => actualizarConfig({ textoProtocoloIdentidad: e.target.value })} />
      </div>

      {/* Metas / sesión */}
      <div className="tarjeta p-5">
        <SectionTitle>Sesión y metas comerciales</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CampoNum label="Duración de sesión (min)" value={c.duracionSesionMin} onChange={(v) => actualizarConfig({ duracionSesionMin: v })} />
          <CampoNum label="Meta diaria de contactos" value={c.metaContactosDiaria} onChange={(v) => actualizarConfig({ metaContactosDiaria: v })} />
          <CampoNum label="Meta diaria de seguimientos" value={c.metaSeguimientosDiaria} onChange={(v) => actualizarConfig({ metaSeguimientosDiaria: v })} />
          <CampoNum label="Meta diaria de llamadas" value={c.metaLlamadasDiaria} onChange={(v) => actualizarConfig({ metaLlamadasDiaria: v })} />
          <CampoNum label="Máx. seguimientos por prospecto" value={c.maxSeguimientos} onChange={(v) => actualizarConfig({ maxSeguimientos: Math.max(1, v) })} />
        </div>
      </div>

      {/* Respaldo */}
      <div className="tarjeta p-5">
        <SectionTitle>Respaldo de datos</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secundario" onClick={() => { descargarArchivo(`copiloto-image-${new Date().toISOString().slice(0, 10)}.json`, exportarJSON(data), "application/json"); mostrar("Exportado a JSON"); }}>
            <FileJson size={16} /> Exportar JSON
          </button>
          <button className="btn-secundario" onClick={() => { descargarArchivo(`prospectos-image-${new Date().toISOString().slice(0, 10)}.csv`, prospectosACSV(data.prospectos), "text/csv"); mostrar("Exportado a CSV"); }}>
            <FileSpreadsheet size={16} /> Exportar CSV
          </button>
          <button className="btn-secundario" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
        </div>
        <p className="mt-2 text-xs text-carbon-400">La importación valida el formato, rechaza datos de otra marca y pide confirmación antes de reemplazar.</p>
      </div>

      {/* Demo / reinicio */}
      <div className="tarjeta p-5">
        <SectionTitle>Datos de demostración</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secundario" onClick={() => { cargarDemo(); mostrar("Datos demo cargados"); }}>
            <Download size={16} /> Cargar datos demo
          </button>
          <button className="btn-secundario" onClick={() => { eliminarDemo(); mostrar("Datos demo eliminados"); }}>
            <Trash2 size={16} /> Eliminar datos demo
          </button>
          <button className="btn bg-red-50 text-red-700 hover:bg-red-100" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reiniciar todo
          </button>
        </div>
      </div>

      <Modal abierto={!!importPreview} onCerrar={() => setImportPreview(null)} titulo="Confirmar importación">
        <p className="text-sm text-carbon-700">Se reemplazarán <b>todos</b> los datos actuales por el archivo importado:</p>
        <p className="mt-2 rounded-lg bg-carbon-50 px-3 py-2 text-sm text-carbon-600">{importPreview?.resumen}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secundario" onClick={() => setImportPreview(null)}>Cancelar</button>
          <button
            className="btn-primario"
            onClick={() => {
              if (importPreview) {
                const res = validarImportacion(importPreview.raw);
                if (res.ok && res.data) {
                  reemplazarDatos(res.data);
                  mostrar("Datos importados ✅");
                }
              }
              setImportPreview(null);
            }}
          >
            Reemplazar datos
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmReset} onCerrar={() => setConfirmReset(false)} titulo="Reiniciar todo">
        <p className="text-sm text-carbon-700">Esto borra prospectos, sesiones, aprendizajes y plantillas, y recarga los datos demo. No se puede deshacer.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secundario" onClick={() => setConfirmReset(false)}>Cancelar</button>
          <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => { reiniciarTodo(); setConfirmReset(false); mostrar("Todo reiniciado"); }}>
            <RotateCcw size={15} /> Reiniciar
          </button>
        </div>
      </Modal>

      {nodo}
    </div>
  );
}

function ListaEditable({
  titulo,
  items,
  onAdd,
  onChange,
  onDel,
}: {
  titulo: string;
  items: (EntregableItem | CriterioItem)[];
  onAdd: () => void;
  onChange: (id: string, texto: string) => void;
  onDel: (id: string) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-carbon-700">{titulo}</span>
        <button className="btn-secundario px-2.5 py-1.5 text-xs" onClick={onAdd}>
          <Plus size={13} /> Agregar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-carbon-400">Sin elementos.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex gap-2">
              <input className="campo flex-1" value={it.texto} onChange={(e) => onChange(it.id, e.target.value)} />
              <button className="rounded-lg p-2 text-carbon-400 hover:bg-red-50 hover:text-red-600" onClick={() => onDel(it.id)} aria-label="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Campo({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="etiqueta">{label}</label>
      <input className="campo" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
function CampoNum({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="etiqueta">{label}</label>
      <input type="number" min={0} className="campo" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
