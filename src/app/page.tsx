"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Flag, Pause, Play, RotateCcw, Sparkles, Square, Target, TimerReset } from "lucide-react";
import { useStore, crearSesionVacia } from "@/lib/store";
import { RUTAS_EJEMPLO, META_EJEMPLO } from "@/lib/seed";
import { getFollowUpStatus, hoyISO } from "@/lib/rules-engine";
import { Sesion } from "@/lib/types";
import { cx, fechaLargaHoy, segundosAReloj } from "@/lib/utils";
import { Badge, ProgressBar, SectionTitle, useToast } from "@/components/ui";
import { AprendizajeModal } from "@/components/AprendizajeModal";

export default function HoyPage() {
  const { data, cargando, sesionDeHoy, crearSesion, actualizarSesion, toggleChecklist, agregarAprendizaje } = useStore();
  const { mostrar, nodo } = useToast();
  const sesion = sesionDeHoy();
  const [modalApr, setModalApr] = useState(false);

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm capitalize text-carbon-400">{fechaLargaHoy()}</p>
        <h1 className="text-2xl font-bold text-carbon-900">Hola, {data.config.nombreOperadora} 👋</h1>
        <p className="text-sm text-carbon-500">
          Sesión de setting de {data.config.nombrePrograma}. Entender antes de vender, sin fabricar necesidad.
        </p>
      </header>

      {!sesion ? (
        <CrearSesion onCrear={crearSesion} config={data.config} />
      ) : (
        <SesionActiva
          sesion={sesion}
          onActualizar={(c) => actualizarSesion(sesion.id, c)}
          onToggle={(b, i) => toggleChecklist(sesion.id, b, i)}
          onFinalizar={() => setModalApr(true)}
        />
      )}

      <AprendizajeModal
        abierto={modalApr}
        onCerrar={() => setModalApr(false)}
        onGuardar={(a) => {
          agregarAprendizaje(a);
          mostrar("Aprendizaje guardado 🎯");
        }}
        ruta={sesion?.ruta}
      />
      {nodo}
    </div>
  );
}

function CrearSesion({ onCrear, config }: { onCrear: (s: Sesion) => void; config: ReturnType<typeof useStore>["data"]["config"] }) {
  const [ruta, setRuta] = useState<string>(RUTAS_EJEMPLO[0]);
  const [rutaCustom, setRutaCustom] = useState("");
  const [usarRutaCustom, setUsarRutaCustom] = useState(false);
  const [meta, setMeta] = useState<string>(META_EJEMPLO[0]);
  const [metaContactos, setMetaContactos] = useState(config.metaContactosDiaria);
  const [metaSeguimientos, setMetaSeguimientos] = useState(config.metaSeguimientosDiaria);
  const [metaLlamadas, setMetaLlamadas] = useState(config.metaLlamadasDiaria);
  const [duracion, setDuracion] = useState(config.duracionSesionMin);

  const crear = () => {
    const s = crearSesionVacia(config);
    onCrear({
      ...s,
      ruta: usarRutaCustom ? rutaCustom.trim() || "Ruta personalizada" : ruta,
      meta,
      metaContactos,
      metaSeguimientos,
      metaLlamadas,
      duracionMin: duracion,
    });
  };

  return (
    <div className="tarjeta p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-ambar-500" size={20} />
        <h2 className="text-lg font-bold text-carbon-900">Preparar la sesión de hoy</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="etiqueta">Ruta del día</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {RUTAS_EJEMPLO.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setUsarRutaCustom(false);
                  setRuta(r);
                }}
                className={cx(
                  "rounded-xl border px-3 py-2 text-left text-xs font-medium transition",
                  !usarRutaCustom && ruta === r
                    ? "border-carbon-800 bg-carbon-50 ring-1 ring-carbon-300 text-carbon-900"
                    : "border-carbon-200 bg-white text-carbon-600 hover:border-carbon-300"
                )}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setUsarRutaCustom(true)}
              className={cx(
                "rounded-xl border px-3 py-2 text-left text-xs font-medium transition",
                usarRutaCustom ? "border-carbon-800 bg-carbon-50 ring-1 ring-carbon-300 text-carbon-900" : "border-carbon-200 bg-white text-carbon-600 hover:border-carbon-300"
              )}
            >
              Personalizada…
            </button>
          </div>
          {usarRutaCustom && (
            <input className="campo mt-2" value={rutaCustom} onChange={(e) => setRutaCustom(e.target.value)} placeholder="Escribe la ruta del día…" />
          )}
        </div>

        <div>
          <label className="etiqueta">Meta del día</label>
          <select className="campo" value={meta} onChange={(e) => setMeta(e.target.value)}>
            {META_EJEMPLO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="etiqueta">Contactos</label>
            <input type="number" min={0} className="campo" value={metaContactos} onChange={(e) => setMetaContactos(Number(e.target.value))} />
          </div>
          <div>
            <label className="etiqueta">Seguimientos</label>
            <input type="number" min={0} className="campo" value={metaSeguimientos} onChange={(e) => setMetaSeguimientos(Number(e.target.value))} />
          </div>
          <div>
            <label className="etiqueta">Llamadas</label>
            <input type="number" min={0} className="campo" value={metaLlamadas} onChange={(e) => setMetaLlamadas(Number(e.target.value))} />
          </div>
          <div>
            <label className="etiqueta">Duración (min)</label>
            <input type="number" min={5} className="campo" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} />
          </div>
        </div>

        <button className="btn-primario w-full" onClick={crear}>
          <Play size={16} /> Crear sesión de hoy
        </button>
      </div>
    </div>
  );
}

function SesionActiva({
  sesion,
  onActualizar,
  onToggle,
  onFinalizar,
}: {
  sesion: Sesion;
  onActualizar: (c: Partial<Sesion>) => void;
  onToggle: (bloqueId: string, itemId: string) => void;
  onFinalizar: () => void;
}) {
  const { data } = useStore();
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    if (sesion.estado !== "en_curso") return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sesion.estado]);

  const transcurridos = useMemo(() => {
    let seg = sesion.segundosTranscurridos;
    if (sesion.estado === "en_curso" && sesion.iniciadaEn) {
      seg += Math.floor((ahora - new Date(sesion.iniciadaEn).getTime()) / 1000);
    }
    return seg;
  }, [sesion, ahora]);

  const totalSeg = sesion.duracionMin * 60;
  const restante = Math.max(0, totalSeg - transcurridos);
  const pctTiempo = Math.min(100, (transcurridos / totalSeg) * 100);

  const bloqueActualIdx = useMemo(() => {
    const cortes = [5, 20, 35, 50, 60].map((m) => (m / 60) * totalSeg);
    const idx = cortes.findIndex((c) => transcurridos < c);
    return idx === -1 ? sesion.bloques.length - 1 : idx;
  }, [transcurridos, totalSeg, sesion.bloques.length]);

  const iniciar = () => onActualizar({ estado: "en_curso", iniciadaEn: new Date().toISOString() });
  const pausar = () => onActualizar({ estado: "pausada", segundosTranscurridos: transcurridos, iniciadaEn: undefined });
  const reanudar = () => onActualizar({ estado: "en_curso", iniciadaEn: new Date().toISOString() });
  const finalizar = () => {
    onActualizar({ estado: "finalizada", segundosTranscurridos: transcurridos, iniciadaEn: undefined });
    onFinalizar();
  };
  const reiniciar = () => onActualizar({ estado: "no_iniciada", segundosTranscurridos: 0, iniciadaEn: undefined });

  const totalItems = sesion.bloques.reduce((a, b) => a + b.items.length, 0);
  const hechos = sesion.bloques.reduce((a, b) => a + b.items.filter((i) => i.hecho).length, 0);
  const pctChecklist = totalItems ? (hechos / totalItems) * 100 : 0;

  const hoy = hoyISO();
  const pendientes = data.prospectos.filter((p) => ["nuevo", "apertura_enviada"].includes(p.estado));
  const respuestas = data.prospectos.filter((p) => p.estado === "respondio");
  const vencidos = data.prospectos.filter((p) => ["vencido", "hoy", "ultimo_intento"].includes(getFollowUpStatus(p, hoy, data.config.maxSeguimientos)));
  const oportunidades = data.prospectos.filter((p) => ["calificado", "llamada_propuesta", "llamada_agendada"].includes(p.estado));

  return (
    <div className="space-y-5">
      <div className="tarjeta overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap gap-2">
              <Badge color="carbon">Ruta: {sesion.ruta}</Badge>
              <Badge color="ambar">Contactos: {sesion.metaContactos}</Badge>
              <Badge color="ambar">Seguim.: {sesion.metaSeguimientos}</Badge>
              <Badge color="jade">Llamadas: {sesion.metaLlamadas}</Badge>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-carbon-400">Meta del día</p>
              <p className="text-sm text-carbon-800">{sesion.meta}</p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-carbon-500">
                <span>
                  Etapa: <b className="text-carbon-800">{sesion.bloques[bloqueActualIdx]?.titulo}</b>
                </span>
                <span>{Math.round(pctTiempo)}%</span>
              </div>
              <ProgressBar valor={pctTiempo} color="ambar" />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 border-t border-carbon-100 bg-carbon-900 p-6 text-white md:w-64 md:border-l md:border-t-0">
            <span className="text-xs uppercase tracking-widest text-carbon-300">
              {sesion.estado === "en_curso" ? "En curso" : sesion.estado === "pausada" ? "Pausada" : sesion.estado === "finalizada" ? "Finalizada" : "Lista"}
            </span>
            <div className="font-mono text-5xl font-bold tabular-nums text-ambar-300">{segundosAReloj(restante)}</div>
            <span className="text-xs text-carbon-400">de {sesion.duracionMin}:00 min</span>
            <div className="flex flex-wrap justify-center gap-2">
              {sesion.estado === "no_iniciada" && (
                <button className="btn bg-white text-carbon-900 hover:bg-carbon-50" onClick={iniciar}>
                  <Play size={15} /> Iniciar
                </button>
              )}
              {sesion.estado === "en_curso" && (
                <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={pausar}>
                  <Pause size={15} /> Pausar
                </button>
              )}
              {sesion.estado === "pausada" && (
                <button className="btn bg-white text-carbon-900 hover:bg-carbon-50" onClick={reanudar}>
                  <Play size={15} /> Reanudar
                </button>
              )}
              {sesion.estado !== "finalizada" && sesion.estado !== "no_iniciada" && (
                <button className="btn bg-ambar-500 text-white hover:bg-ambar-600" onClick={finalizar}>
                  <Square size={15} /> Finalizar
                </button>
              )}
              {sesion.estado === "finalizada" && (
                <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={reiniciar}>
                  <RotateCcw size={15} /> Reiniciar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TarjetaCola titulo="Pendientes" valor={pendientes.length} href="/prospectos?estado=nuevo" color="carbon" />
        <TarjetaCola titulo="Respuestas nuevas" valor={respuestas.length} href="/prospectos?estado=respondio" color="ambar" />
        <TarjetaCola titulo="Seguimientos" valor={vencidos.length} href="/seguimientos" color="ambar" />
        <TarjetaCola titulo="Oportunidades" valor={oportunidades.length} href="/pipeline" color="jade" />
      </div>

      <div className="tarjeta p-5">
        <SectionTitle right={<span className="text-xs text-carbon-400">Se guardan solos</span>}>Registro de la sesión</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Contador label="Contactos" valor={sesion.contactosHechos} meta={sesion.metaContactos} onChange={(v) => onActualizar({ contactosHechos: Math.max(0, v) })} />
          <Contador label="Seguimientos" valor={sesion.seguimientosHechos} meta={sesion.metaSeguimientos} onChange={(v) => onActualizar({ seguimientosHechos: Math.max(0, v) })} />
          <Contador label="Respuestas" valor={sesion.respuestas} onChange={(v) => onActualizar({ respuestas: Math.max(0, v) })} />
          <Contador label="Llamadas" valor={sesion.llamadasPropuestas} meta={sesion.metaLlamadas} onChange={(v) => onActualizar({ llamadasPropuestas: Math.max(0, v) })} />
        </div>
      </div>

      <div className="tarjeta p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-carbon-500">Checklist de la sesión</h2>
          <span className="text-xs font-medium text-carbon-500">
            {hechos}/{totalItems}
          </span>
        </div>
        <ProgressBar valor={pctChecklist} />
        <div className="mt-4 space-y-3">
          {sesion.bloques.map((b, idx) => (
            <div
              key={b.id}
              className={cx(
                "rounded-xl border p-3.5",
                idx === bloqueActualIdx && sesion.estado === "en_curso" ? "border-ambar-300 bg-ambar-50/50 ring-1 ring-ambar-200" : "border-carbon-100"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-carbon-900 text-xs font-bold text-white">{idx + 1}</span>
                <span className="text-sm font-semibold text-carbon-800">{b.titulo}</span>
                <span className="text-xs text-carbon-400">{b.rangoMinutos}</span>
                {idx === bloqueActualIdx && sesion.estado === "en_curso" && (
                  <Badge color="ambar" className="ml-auto">
                    <Flag size={11} /> Ahora
                  </Badge>
                )}
              </div>
              <ul className="space-y-1">
                {b.items.map((it) => (
                  <li key={it.id}>
                    <button onClick={() => onToggle(b.id, it.id)} className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-carbon-50">
                      {it.hecho ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-jade-500" /> : <Circle size={17} className="mt-0.5 shrink-0 text-carbon-300" />}
                      <span className={cx(it.hecho ? "text-carbon-400 line-through" : "text-carbon-700")}>{it.texto}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/nueva-conversacion" className="btn-ambar flex-1">
          <Target size={16} /> Nueva conversación
        </Link>
        <button className="btn-secundario" onClick={onFinalizar}>
          <TimerReset size={16} /> Registrar aprendizaje del día
        </button>
      </div>
    </div>
  );
}

function TarjetaCola({ titulo, valor, href, color }: { titulo: string; valor: number; href: string; color: "carbon" | "ambar" | "jade" }) {
  const map = { carbon: "text-carbon-800", ambar: "text-ambar-600", jade: "text-jade-600" };
  return (
    <Link href={href} className="tarjeta flex flex-col gap-1 p-4 transition hover:shadow-suave">
      <span className={cx("text-2xl font-bold tabular-nums", map[color])}>{valor}</span>
      <span className="text-xs text-carbon-500">{titulo}</span>
    </Link>
  );
}

function Contador({ label, valor, meta, onChange }: { label: string; valor: number; meta?: number; onChange: (v: number) => void }) {
  return (
    <div className="rounded-xl border border-carbon-100 p-3 text-center">
      <p className="mb-1 text-xs text-carbon-500">{label}</p>
      <div className="flex items-center justify-center gap-2">
        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-carbon-100 text-carbon-700 hover:bg-carbon-200" onClick={() => onChange(valor - 1)} aria-label="Restar">
          −
        </button>
        <span className="min-w-[2ch] text-xl font-bold text-carbon-900 tabular-nums">{valor}</span>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg bg-carbon-900 text-white hover:bg-carbon-800" onClick={() => onChange(valor + 1)} aria-label="Sumar">
          +
        </button>
      </div>
      {meta !== undefined && <p className="mt-1 text-[10px] text-carbon-400">meta: {meta}</p>}
    </div>
  );
}
