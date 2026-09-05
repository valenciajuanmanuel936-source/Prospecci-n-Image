"use client";
import { useState } from "react";
import { Aprendizaje } from "@/lib/types";
import { uid } from "@/lib/utils";
import { hoyISO } from "@/lib/rules-engine";
import { Modal } from "./ui";

export function AprendizajeModal({
  abierto,
  onCerrar,
  onGuardar,
  ruta,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (a: Aprendizaje) => void;
  ruta?: string;
}) {
  const [patron, setPatron] = useState("");
  const [objecion, setObjecion] = useState("");
  const [problemaLiteral, setProblema] = useState("");
  const [mejorMensaje, setMejor] = useState("");
  const [probarManana, setProbar] = useState("");
  const [frase, setFrase] = useState("");

  const guardar = () => {
    onGuardar({
      id: uid("apr"),
      fecha: hoyISO(),
      ruta,
      patron,
      objecion,
      problemaLiteral,
      mejorMensaje,
      probarManana,
      frasePrincipal: frase,
    });
    setPatron("");
    setObjecion("");
    setProblema("");
    setMejor("");
    setProbar("");
    setFrase("");
    onCerrar();
  };

  const campos = [
    { label: "¿Qué patrón se repitió hoy?", value: patron, set: setPatron },
    { label: "¿Qué objeción apareció?", value: objecion, set: setObjecion },
    { label: "¿Qué problema mencionaron literalmente?", value: problemaLiteral, set: setProblema },
    { label: "¿Qué mensaje recibió mejores respuestas?", value: mejorMensaje, set: setMejor },
    { label: "¿Qué deberíamos probar mañana?", value: probarManana, set: setProbar },
  ];

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Aprendizaje del día" ancho="max-w-xl">
      <div className="space-y-4">
        {campos.map((c) => (
          <div key={c.label}>
            <label className="etiqueta">{c.label}</label>
            <textarea className="campo min-h-[56px]" value={c.value} onChange={(e) => c.set(e.target.value)} />
          </div>
        ))}
        <div>
          <label className="etiqueta">Aprendizaje principal en una frase</label>
          <input className="campo" value={frase} onChange={(e) => setFrase(e.target.value)} placeholder="La idea clave del día…" />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-secundario" onClick={onCerrar} type="button">
            Ahora no
          </button>
          <button className="btn-primario" onClick={guardar} type="button">
            Guardar aprendizaje
          </button>
        </div>
      </div>
    </Modal>
  );
}
