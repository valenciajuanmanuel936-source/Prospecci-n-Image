"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, ChevronDown, DollarSign, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Estado, ESTADOS, FASES, faseLabel, faseOrden, MensajeHistorial, Prospecto, Senal, SENALES } from "@/lib/types";
import { buildRecommendation, getFollowUpStatus, hoyISO } from "@/lib/rules-engine";
import { cx, formatFechaHora, sumarDias, uid } from "@/lib/utils";
import { Badge, BadgeEstado, BadgeFase, BadgeTemperatura, Modal, useToast } from "@/components/ui";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ProspectoForm } from "@/components/ProspectoForm";

const DISCOVERY: { campo: keyof Prospecto; label: string }[] = [
  { campo: "motivo", label: "Motivo o interés" },
  { campo: "situacionActual", label: "Situación actual" },
  { campo: "problema", label: "Problema" },
  { campo: "frecuencia", label: "Frecuencia" },
  { campo: "impacto", label: "Impacto o costo" },
  { campo: "resultadoDeseado", label: "Resultado deseado" },
  { campo: "brecha", label: "Brecha" },
  { campo: "intentosAnteriores", label: "Intentos anteriores" },
  { campo: "intencion", label: "Intención" },
  { campo: "momento", label: "Momento" },
  { campo: "aperturaAyuda", label: "Apertura a recibir ayuda" },
  { campo: "fitConfirmado", label: "Fit confirmado (sí / no / parcial)" },
  { campo: "capacidadDecision", label: "Capacidad de decisión (él / compartida / no)" },
  { campo: "capacidadInversion", label: "Capacidad de inversión (contexto)" },
  { campo: "fitNotas", label: "Notas de fit" },
];

export default function ProspectoDetalle() {
  const { id } = useParams<{ id: string }>();
  const { data, cargando, actualizarProspecto, agregarMensaje, actualizarMensaje, eliminarMensaje } = useStore();
  const { mostrar, nodo } = useToast();

  const prospecto = data.prospectos.find((p) => p.id === id);
  const [editar, setEditar] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(true);
  const [showComercial, setShowComercial] = useState(false);
  const [nuevoMsg, setNuevoMsg] = useState("");
  const [emisorNuevo, setEmisorNuevo] = useState<"operador" | "prospecto">("prospecto");
  const [senalesNuevo, setSenalesNuevo] = useState<Senal[]>([]);
  const [msgEditando, setMsgEditando] = useState<MensajeHistorial | null>(null);
  const [confirmarMsg, setConfirmarMsg] = useState<string | null>(null);

  const ultimaRespuesta = useMemo(
    () => (prospecto ? [...prospecto.historial].reverse().find((m) => m.emisor === "prospecto") : undefined),
    [prospecto]
  );

  const rec = useMemo(() => {
    if (!prospecto) return null;
    const hayRespuesta = prospecto.historial.some((m) => m.emisor === "prospecto");
    return buildRecommendation(
      { prospecto, faseActual: prospecto.fase, senales: ultimaRespuesta?.senales ?? [], hayRespuesta },
      data.config
    );
  }, [prospecto, ultimaRespuesta, data.config]);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;
  if (!prospecto)
    return (
      <div className="py-20 text-center">
        <p className="text-carbon-500">No se encontró el prospecto.</p>
        <Link href="/prospectos" className="btn-secundario mt-4">
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>
    );

  const toggleSenal = (s: Senal) => setSenalesNuevo((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const agregar = () => {
    if (!nuevoMsg.trim()) return;
    agregarMensaje(prospecto.id, {
      id: uid("m"),
      fecha: new Date().toISOString(),
      emisor: emisorNuevo,
      texto: nuevoMsg.trim(),
      fase: prospecto.fase,
      senales: emisorNuevo === "prospecto" ? senalesNuevo : [],
      enviado: emisorNuevo === "operador",
    });
    if (emisorNuevo === "prospecto" && ["nuevo", "apertura_enviada"].includes(prospecto.estado)) {
      actualizarProspecto(prospecto.id, { estado: "respondio" });
    }
    setNuevoMsg("");
    setSenalesNuevo([]);
    mostrar("Mensaje agregado");
  };

  const cambiarFase = (dir: 1 | -1) => {
    const nueva = FASES.find((f) => f.orden === faseOrden(prospecto.fase) + dir);
    if (nueva) {
      actualizarProspecto(prospecto.id, { fase: nueva.value });
      mostrar(`Fase: ${nueva.label}`);
    }
  };

  const programar = (dias: number) => {
    actualizarProspecto(prospecto.id, { proximoSeguimiento: sumarDias(hoyISO(), dias), estado: "seguimiento" });
    mostrar(`Seguimiento +${dias} días`);
  };

  const fSeg = getFollowUpStatus(prospecto, hoyISO(), data.config.maxSeguimientos);

  return (
    <div className="space-y-5">
      <Link href="/prospectos" className="inline-flex items-center gap-1 text-sm text-carbon-500 hover:text-carbon-800">
        <ArrowLeft size={15} /> Prospectos
      </Link>

      <div className="tarjeta p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-carbon-900">{prospecto.nombre}</h1>
            <p className="text-sm text-carbon-400">
              {prospecto.usuarioInstagram} · {prospecto.ciudad}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {prospecto.urlInstagram && (
              <a href={prospecto.urlInstagram} target="_blank" rel="noreferrer" className="btn-secundario">
                <ExternalLink size={15} /> Instagram
              </a>
            )}
            <button className="btn-secundario" onClick={() => setEditar(true)}>
              <Pencil size={15} /> Editar
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <BadgeFase fase={prospecto.fase} />
          <BadgeTemperatura t={prospecto.temperatura} />
          <BadgeEstado estado={prospecto.estado} />
        </div>
        {prospecto.observacion && <p className="mt-3 text-sm text-carbon-600">Observación: {prospecto.observacion}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-carbon-100 pt-4">
          <span className="text-xs font-medium text-carbon-500">Fase:</span>
          <button className="btn-secundario px-3 py-1.5 text-xs" onClick={() => cambiarFase(-1)} disabled={faseOrden(prospecto.fase) <= 1}>
            <ArrowLeft size={14} /> Retroceder
          </button>
          <span className="text-sm font-semibold text-carbon-800">{faseLabel(prospecto.fase)}</span>
          <button className="btn-secundario px-3 py-1.5 text-xs" onClick={() => cambiarFase(1)} disabled={faseOrden(prospecto.fase) >= 26}>
            Avanzar <ArrowRight size={14} />
          </button>
          <select
            className="campo ml-auto w-auto text-xs"
            value={prospecto.estado}
            onChange={(e) => actualizarProspecto(prospecto.id, { estado: e.target.value as Estado })}
          >
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rec && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-carbon-500">Recomendación del copiloto</h2>
          <RecommendationPanel rec={rec} cercania={prospecto.cercania} />
        </div>
      )}

      {/* Seguimiento */}
      <div className="tarjeta p-5">
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock size={16} className="text-ambar-600" />
          <h2 className="text-sm font-bold uppercase tracking-wide text-carbon-500">Seguimiento</h2>
        </div>
        <p className="text-sm text-carbon-600">
          Realizados: <b>{prospecto.seguimientosRealizados}</b> / {data.config.maxSeguimientos} ·{" "}
          {prospecto.proximoSeguimiento ? `próximo: ${prospecto.proximoSeguimiento}` : "sin fecha"}
        </p>
        {fSeg === "sin_respuesta" ? (
          <p className="mt-2 rounded-lg bg-carbon-50 px-3 py-2 text-xs text-carbon-600">
            Se alcanzó el máximo de seguimientos. No se recomiendan más mensajes. Puedes reactivarlo manualmente más adelante.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-secundario text-xs" onClick={() => programar(2)}>
              +2 días
            </button>
            <button className="btn-secundario text-xs" onClick={() => programar(5)}>
              +5 días
            </button>
            <button
              className="btn-secundario text-xs"
              onClick={() => {
                actualizarProspecto(prospecto.id, { seguimientosRealizados: prospecto.seguimientosRealizados + 1 });
                mostrar("Seguimiento registrado");
              }}
            >
              Marcar seguimiento enviado
            </button>
          </div>
        )}
      </div>

      {/* Discovery */}
      <div className="tarjeta p-5">
        <button className="flex w-full items-center justify-between" onClick={() => setShowDiscovery((s) => !s)}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-carbon-500">Variables del setting</h2>
          <ChevronDown size={18} className={cx("text-carbon-400 transition", showDiscovery && "rotate-180")} />
        </button>
        {showDiscovery && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DISCOVERY.map(({ campo, label }) => (
              <div key={campo as string}>
                <label className="etiqueta text-xs">{label}</label>
                <textarea
                  className="campo min-h-[54px] text-sm"
                  value={(prospecto[campo] as string) ?? ""}
                  onChange={(e) => actualizarProspecto(prospecto.id, { [campo]: e.target.value } as Partial<Prospecto>)}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resultado comercial */}
      <div className="tarjeta p-5">
        <button className="flex w-full items-center justify-between" onClick={() => setShowComercial((s) => !s)}>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-carbon-500">
            <DollarSign size={15} /> Resultado comercial
          </h2>
          <ChevronDown size={18} className={cx("text-carbon-400 transition", showComercial && "rotate-180")} />
        </button>
        {showComercial && (
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-carbon-700">
              <input
                type="checkbox"
                checked={prospecto.asistioLlamada ?? false}
                onChange={(e) => actualizarProspecto(prospecto.id, { asistioLlamada: e.target.checked })}
              />
              Asistió a la llamada
            </label>
            <label className="flex items-center gap-2 text-sm text-carbon-700">
              <input
                type="checkbox"
                checked={prospecto.ofertaPresentada ?? false}
                onChange={(e) => actualizarProspecto(prospecto.id, { ofertaPresentada: e.target.checked })}
              />
              Se presentó la oferta
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="etiqueta text-xs">Facturación contratada (COP)</label>
                <input
                  type="number"
                  min={0}
                  className="campo"
                  value={prospecto.facturacionContratada ?? ""}
                  onChange={(e) => actualizarProspecto(prospecto.id, { facturacionContratada: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="etiqueta text-xs">Dinero efectivamente cobrado (COP)</label>
                <input
                  type="number"
                  min={0}
                  className="campo"
                  value={prospecto.dineroCobrado ?? ""}
                  onChange={(e) => actualizarProspecto(prospecto.id, { dineroCobrado: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
            <p className="text-[11px] text-carbon-400">
              La facturación contratada es lo comprometido; el dinero cobrado es lo que realmente entró. Se miden por separado.
            </p>
            <div>
              <label className="etiqueta text-xs">Motivo de pérdida (si aplica)</label>
              <input className="campo" value={prospecto.motivoPerdida ?? ""} onChange={(e) => actualizarProspecto(prospecto.id, { motivoPerdida: e.target.value })} placeholder="Ej: no era el momento, precio, sin fit…" />
            </div>
            <div>
              <label className="etiqueta text-xs">Resultado / notas comerciales</label>
              <input className="campo" value={prospecto.resultadoComercial ?? ""} onChange={(e) => actualizarProspecto(prospecto.id, { resultadoComercial: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="tarjeta p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-carbon-500">Historial de conversación</h2>
        {prospecto.historial.length === 0 ? (
          <p className="py-4 text-center text-sm text-carbon-400">Aún no hay mensajes registrados.</p>
        ) : (
          <div className="space-y-3">
            {prospecto.historial.map((m) => (
              <div
                key={m.id}
                className={cx(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  m.emisor === "operador" ? "ml-auto bg-carbon-900 text-white" : "mr-auto bg-carbon-50 text-carbon-900"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] opacity-80">
                  <span>{m.emisor === "operador" ? "Nosotros" : prospecto.nombre}</span>
                  <span>{formatFechaHora(m.fecha)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.texto}</p>
                {m.senales.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.senales.map((s) => (
                      <span key={s} className={cx("rounded-full px-2 py-0.5 text-[10px]", m.emisor === "operador" ? "bg-white/20" : "bg-white text-carbon-600")}>
                        {SENALES.find((x) => x.value === s)?.label ?? s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex justify-end gap-2 text-[11px]">
                  <button className={cx("underline-offset-2 hover:underline", m.emisor === "operador" ? "text-carbon-200" : "text-carbon-400")} onClick={() => setMsgEditando(m)}>
                    Editar
                  </button>
                  <button className={cx("underline-offset-2 hover:underline", m.emisor === "operador" ? "text-ambar-200" : "text-red-400")} onClick={() => setConfirmarMsg(m.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-carbon-100 bg-carbon-50/40 p-3.5">
          <div className="mb-2 flex gap-2">
            <button className={cx("flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition", emisorNuevo === "prospecto" ? "bg-carbon-900 text-white" : "bg-white text-carbon-600")} onClick={() => setEmisorNuevo("prospecto")}>
              Respuesta recibida
            </button>
            <button className={cx("flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition", emisorNuevo === "operador" ? "bg-carbon-900 text-white" : "bg-white text-carbon-600")} onClick={() => setEmisorNuevo("operador")}>
              Mensaje enviado
            </button>
          </div>
          <textarea
            className="campo min-h-[64px]"
            placeholder={emisorNuevo === "prospecto" ? "Pega lo que respondió el prospecto…" : "Lo que enviamos…"}
            value={nuevoMsg}
            onChange={(e) => setNuevoMsg(e.target.value)}
          />
          {emisorNuevo === "prospecto" && (
            <div className="mt-2">
              <p className="mb-1 text-xs font-medium text-carbon-500">Señales detectadas:</p>
              <div className="flex flex-wrap gap-1.5">
                {SENALES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleSenal(s.value)}
                    className={cx(
                      "rounded-full border px-2.5 py-1 text-[11px] transition",
                      senalesNuevo.includes(s.value) ? "border-carbon-800 bg-carbon-900 text-white" : "border-carbon-200 bg-white text-carbon-600 hover:border-carbon-400"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button className="btn-primario mt-3 w-full" onClick={agregar} disabled={!nuevoMsg.trim()}>
            <Plus size={15} /> Agregar al historial
          </button>
        </div>
      </div>

      <Modal abierto={editar} onCerrar={() => setEditar(false)} titulo="Editar prospecto" ancho="max-w-2xl">
        <ProspectoForm
          inicial={prospecto}
          onGuardar={(p) => {
            actualizarProspecto(prospecto.id, p);
            setEditar(false);
            mostrar("Prospecto actualizado");
          }}
          onCancelar={() => setEditar(false)}
        />
      </Modal>

      <Modal abierto={!!msgEditando} onCerrar={() => setMsgEditando(null)} titulo="Editar mensaje">
        {msgEditando && (
          <EditarMensaje
            mensaje={msgEditando}
            onGuardar={(cambios) => {
              actualizarMensaje(prospecto.id, msgEditando.id, cambios);
              setMsgEditando(null);
              mostrar("Mensaje actualizado");
            }}
          />
        )}
      </Modal>

      <Modal abierto={!!confirmarMsg} onCerrar={() => setConfirmarMsg(null)} titulo="Eliminar mensaje">
        <p className="text-sm text-carbon-700">¿Eliminar este mensaje del historial?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-secundario" onClick={() => setConfirmarMsg(null)}>
            Cancelar
          </button>
          <button
            className="btn bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              if (confirmarMsg) eliminarMensaje(prospecto.id, confirmarMsg);
              setConfirmarMsg(null);
              mostrar("Mensaje eliminado");
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

function EditarMensaje({ mensaje, onGuardar }: { mensaje: MensajeHistorial; onGuardar: (cambios: Partial<MensajeHistorial>) => void }) {
  const [texto, setTexto] = useState(mensaje.texto);
  const [senales, setSenales] = useState<Senal[]>(mensaje.senales);
  const toggle = (s: Senal) => setSenales((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <div className="space-y-3">
      <textarea className="campo min-h-[80px]" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {mensaje.emisor === "prospecto" && (
        <div className="flex flex-wrap gap-1.5">
          {SENALES.map((s) => (
            <button
              key={s.value}
              onClick={() => toggle(s.value)}
              className={cx("rounded-full border px-2.5 py-1 text-[11px]", senales.includes(s.value) ? "border-carbon-800 bg-carbon-900 text-white" : "border-carbon-200 bg-white text-carbon-600")}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <button className="btn-primario w-full" onClick={() => onGuardar({ texto, senales })}>
        Guardar cambios
      </button>
    </div>
  );
}
