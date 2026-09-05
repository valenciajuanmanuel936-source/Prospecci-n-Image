"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarPlus, Check, Save, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { Cercania, CERCANIAS, Fase, FASES, Prospecto, Senal, SENALES } from "@/lib/types";
import { buildRecommendation, hoyISO } from "@/lib/rules-engine";
import { cx, sumarDias, uid } from "@/lib/utils";
import { Modal, PillSelect, useToast } from "@/components/ui";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { ProspectoForm } from "@/components/ProspectoForm";

export default function NuevaConversacionPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-carbon-400">Cargando…</div>}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const { data, cargando, agregarProspecto, actualizarProspecto, agregarMensaje } = useStore();
  const params = useSearchParams();
  const { mostrar, nodo } = useToast();

  const [modo, setModo] = useState<"asistente" | "rapido">("asistente");
  const [paso, setPaso] = useState(1);
  const [prospectoId, setProspectoId] = useState(params.get("prospecto") ?? "");
  const [cercania, setCercania] = useState<Cercania>("cercana");
  const [fase, setFase] = useState<Fase>("apertura");
  const [senales, setSenales] = useState<Senal[]>([]);
  const [respuesta, setRespuesta] = useState("");
  const [notas, setNotas] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);

  const prospecto = data.prospectos.find((p) => p.id === prospectoId);

  const seleccionar = (p: Prospecto) => {
    setProspectoId(p.id);
    setCercania(p.cercania);
    setFase(p.fase);
  };

  const hayRespuesta = senales.length > 0 || respuesta.trim().length > 0;
  const rec = useMemo(() => {
    if (!prospecto) return null;
    return buildRecommendation({ prospecto, faseActual: fase, senales, hayRespuesta }, data.config);
  }, [prospecto, fase, senales, hayRespuesta, data.config]);

  const toggleSenal = (s: Senal) => setSenales((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const registrarYAplicar = () => {
    if (!prospecto || !rec) return;
    if (respuesta.trim()) {
      agregarMensaje(prospecto.id, {
        id: uid("m"),
        fecha: new Date().toISOString(),
        emisor: "prospecto",
        texto: respuesta.trim(),
        fase,
        senales,
        proximoPaso: rec.objetivo,
      });
    }
    actualizarProspecto(prospecto.id, {
      fase: rec.fase,
      temperatura: rec.temperatura,
      notas: notas.trim() ? `${prospecto.notas ? prospecto.notas + "\n" : ""}${notas.trim()}` : prospecto.notas,
    });
    mostrar("Respuesta registrada y fase actualizada ✅");
    setRespuesta("");
    setNotas("");
    setSenales([]);
  };

  const marcarEnviado = () => {
    if (!prospecto || !rec) return;
    const c3 = cercania === "muy_cercana" ? rec.mensajes.muyCercana : cercania === "cercana" ? rec.mensajes.cercana : rec.mensajes.menosCercana;
    agregarMensaje(prospecto.id, {
      id: uid("m"),
      fecha: new Date().toISOString(),
      emisor: "operador",
      texto: c3,
      fase: rec.fase,
      senales: [],
      enviado: true,
    });
    if (prospecto.estado === "nuevo") actualizarProspecto(prospecto.id, { estado: "apertura_enviada" });
    mostrar("Mensaje marcado como enviado");
  };

  const programarSeguimiento = () => {
    if (!prospecto) return;
    actualizarProspecto(prospecto.id, { proximoSeguimiento: sumarDias(hoyISO(), 2), estado: "seguimiento" });
    mostrar("Seguimiento programado (+2 días)");
  };

  if (cargando) return <div className="py-20 text-center text-carbon-400">Cargando…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-carbon-900">Nueva conversación</h1>
          <p className="text-sm text-carbon-500">Registra una respuesta y recibe la recomendación exacta.</p>
        </div>
        <button className={cx("btn", modo === "rapido" ? "btn-ambar" : "btn-secundario")} onClick={() => setModo((m) => (m === "rapido" ? "asistente" : "rapido"))}>
          <Zap size={16} /> Modo rápido
        </button>
      </div>

      {modo === "rapido" ? (
        <div className="space-y-4">
          <div className="tarjeta space-y-4 p-5">
            <SelectorProspecto prospectos={data.prospectos} valor={prospectoId} onSelect={seleccionar} onNuevo={() => setModalNuevo(true)} />
            {prospecto && (
              <>
                <div>
                  <label className="etiqueta">Pega la respuesta del prospecto</label>
                  <textarea className="campo min-h-[70px]" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} placeholder="Lo que respondió…" />
                </div>
                <SenalesSelector senales={senales} onToggle={toggleSenal} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="etiqueta">Fase actual</label>
                    <select className="campo" value={fase} onChange={(e) => setFase(e.target.value as Fase)}>
                      {FASES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.orden}. {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="etiqueta">Cercanía</label>
                    <PillSelect opciones={CERCANIAS.map((c) => ({ value: c.value, label: c.label }))} valor={cercania} onChange={setCercania} />
                  </div>
                </div>
              </>
            )}
          </div>
          {rec && (
            <>
              <RecommendationPanel rec={rec} cercania={cercania} />
              <AccionesRapidas onRegistrar={registrarYAplicar} onEnviado={marcarEnviado} onSeguimiento={programarSeguimiento} />
            </>
          )}
        </div>
      ) : (
        <AsistentePasos
          paso={paso}
          setPaso={setPaso}
          prospectos={data.prospectos}
          prospecto={prospecto}
          onSeleccionar={seleccionar}
          onNuevo={() => setModalNuevo(true)}
          cercania={cercania}
          setCercania={setCercania}
          fase={fase}
          setFase={setFase}
          senales={senales}
          toggleSenal={toggleSenal}
          respuesta={respuesta}
          setRespuesta={setRespuesta}
          notas={notas}
          setNotas={setNotas}
          rec={rec}
          onRegistrar={registrarYAplicar}
          onEnviado={marcarEnviado}
          onSeguimiento={programarSeguimiento}
        />
      )}

      <Modal abierto={modalNuevo} onCerrar={() => setModalNuevo(false)} titulo="Nuevo prospecto" ancho="max-w-2xl">
        <ProspectoForm
          onGuardar={(p) => {
            agregarProspecto(p);
            seleccionar(p);
            setModalNuevo(false);
            mostrar("Prospecto creado ✅");
          }}
          onCancelar={() => setModalNuevo(false)}
        />
      </Modal>

      {nodo}
    </div>
  );
}

function AccionesRapidas({ onRegistrar, onEnviado, onSeguimiento }: { onRegistrar: () => void; onEnviado: () => void; onSeguimiento: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <button className="btn-primario" onClick={onRegistrar}>
        <Save size={15} /> Registrar y aplicar fase
      </button>
      <button className="btn-secundario" onClick={onEnviado}>
        <Check size={15} /> Marcar mensaje enviado
      </button>
      <button className="btn-secundario" onClick={onSeguimiento}>
        <CalendarPlus size={15} /> Programar seguimiento
      </button>
    </div>
  );
}

function SelectorProspecto({ prospectos, valor, onSelect, onNuevo }: { prospectos: Prospecto[]; valor: string; onSelect: (p: Prospecto) => void; onNuevo: () => void }) {
  return (
    <div>
      <label className="etiqueta">Prospecto</label>
      <div className="flex gap-2">
        <select
          className="campo"
          value={valor}
          onChange={(e) => {
            const p = prospectos.find((x) => x.id === e.target.value);
            if (p) onSelect(p);
          }}
        >
          <option value="">Selecciona un prospecto…</option>
          {prospectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} ({p.usuarioInstagram})
            </option>
          ))}
        </select>
        <button className="btn-secundario shrink-0" onClick={onNuevo}>
          + Nuevo
        </button>
      </div>
    </div>
  );
}

function SenalesSelector({ senales, onToggle }: { senales: Senal[]; onToggle: (s: Senal) => void }) {
  return (
    <div>
      <label className="etiqueta">Señales detectadas en la respuesta</label>
      <div className="flex flex-wrap gap-1.5">
        {SENALES.map((s) => (
          <button
            key={s.value}
            onClick={() => onToggle(s.value)}
            className={cx(
              "rounded-full border px-3 py-1.5 text-xs transition",
              senales.includes(s.value) ? "border-carbon-800 bg-carbon-900 text-white" : "border-carbon-200 bg-white text-carbon-600 hover:border-carbon-400"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface AsistenteProps {
  paso: number;
  setPaso: (n: number) => void;
  prospectos: Prospecto[];
  prospecto?: Prospecto;
  onSeleccionar: (p: Prospecto) => void;
  onNuevo: () => void;
  cercania: Cercania;
  setCercania: (c: Cercania) => void;
  fase: Fase;
  setFase: (f: Fase) => void;
  senales: Senal[];
  toggleSenal: (s: Senal) => void;
  respuesta: string;
  setRespuesta: (s: string) => void;
  notas: string;
  setNotas: (s: string) => void;
  rec: ReturnType<typeof buildRecommendation> | null;
  onRegistrar: () => void;
  onEnviado: () => void;
  onSeguimiento: () => void;
}

function AsistentePasos(p: AsistenteProps) {
  const pasos = ["Prospecto", "Cercanía", "Fase", "Respuesta", "Recomendación"];
  const puedeAvanzar = p.paso === 1 ? !!p.prospecto : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {pasos.map((nombre, i) => {
          const n = i + 1;
          const activo = n === p.paso;
          const completo = n < p.paso;
          return (
            <div key={nombre} className="flex items-center">
              <button
                onClick={() => (n <= p.paso || p.prospecto) && p.setPaso(n)}
                className={cx(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  activo ? "bg-carbon-900 text-white" : completo ? "bg-jade-100 text-jade-600" : "bg-carbon-50 text-carbon-400"
                )}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">{completo ? <Check size={11} /> : n}</span>
                {nombre}
              </button>
              {i < pasos.length - 1 && <div className="h-px w-3 bg-carbon-200" />}
            </div>
          );
        })}
      </div>

      <div className="tarjeta p-5">
        {p.paso === 1 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-carbon-900">1. ¿Con quién hablamos?</h2>
            <SelectorProspecto prospectos={p.prospectos} valor={p.prospecto?.id ?? ""} onSelect={p.onSeleccionar} onNuevo={p.onNuevo} />
            {p.prospecto && (
              <p className="rounded-lg bg-carbon-50 px-3 py-2 text-xs text-carbon-600">
                {p.prospecto.nombre} · {p.prospecto.ciudad} · fase actual: {FASES.find((f) => f.value === p.prospecto!.fase)?.label}
              </p>
            )}
          </div>
        )}

        {p.paso === 2 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-carbon-900">2. Nivel de cercanía con Juan Manuel</h2>
            <PillSelect opciones={CERCANIAS} valor={p.cercania} onChange={p.setCercania} columnas={1} />
          </div>
        )}

        {p.paso === 3 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-carbon-900">3. Fase actual de la conversación</h2>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {FASES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => p.setFase(f.value)}
                  className={cx("rounded-xl border px-3 py-2 text-left text-sm transition", p.fase === f.value ? "border-carbon-800 bg-carbon-50 ring-1 ring-carbon-300" : "border-carbon-200 hover:border-carbon-300")}
                >
                  <span className="text-xs text-carbon-400">{f.orden}.</span> <span className="font-medium text-carbon-800">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {p.paso === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-carbon-900">4. ¿Qué dijo el prospecto?</h2>
            <div>
              <label className="etiqueta">Pega su respuesta (opcional)</label>
              <textarea className="campo min-h-[80px]" value={p.respuesta} onChange={(e) => p.setRespuesta(e.target.value)} placeholder="Lo que respondió…" />
            </div>
            <SenalesSelector senales={p.senales} onToggle={p.toggleSenal} />
            <div>
              <label className="etiqueta">Notas</label>
              <textarea className="campo min-h-[54px]" value={p.notas} onChange={(e) => p.setNotas(e.target.value)} />
            </div>
            <p className="rounded-lg bg-carbon-50 px-3 py-2 text-xs text-carbon-500">
              El análisis es determinista: sale de las señales marcadas y de las reglas del setting, no de una IA.
            </p>
          </div>
        )}

        {p.paso === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-carbon-900">5. Recomendación</h2>
            {p.rec ? (
              <>
                <RecommendationPanel rec={p.rec} cercania={p.cercania} />
                <AccionesRapidas onRegistrar={p.onRegistrar} onEnviado={p.onEnviado} onSeguimiento={p.onSeguimiento} />
              </>
            ) : (
              <p className="text-sm text-carbon-400">Selecciona un prospecto para ver la recomendación.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button className="btn-secundario" onClick={() => p.setPaso(Math.max(1, p.paso - 1))} disabled={p.paso === 1}>
          <ArrowLeft size={16} /> Atrás
        </button>
        {p.paso < 5 ? (
          <button className="btn-primario" onClick={() => p.setPaso(p.paso + 1)} disabled={!puedeAvanzar}>
            Siguiente <ArrowRight size={16} />
          </button>
        ) : (
          <Link href={p.prospecto ? `/prospectos/${p.prospecto.id}` : "/prospectos"} className="btn-secundario">
            Ver prospecto
          </Link>
        )}
      </div>
    </div>
  );
}
