"use client";
import { useState } from "react";
import {
  Cercania,
  CERCANIAS,
  Estado,
  ESTADOS,
  Fase,
  FASES,
  Prospecto,
  Temperatura,
  TipoProspecto,
  TIPOS_PROSPECTO,
} from "@/lib/types";
import { uid } from "@/lib/utils";

export function ProspectoForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: Prospecto;
  onGuardar: (p: Prospecto) => void;
  onCancelar?: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [usuario, setUsuario] = useState(inicial?.usuarioInstagram ?? "");
  const [url, setUrl] = useState(inicial?.urlInstagram ?? "");
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? "Bogotá");
  const [tipoProspecto, setTipo] = useState<TipoProspecto>(inicial?.tipoProspecto ?? "seguidor_reciente");
  const [cercania, setCercania] = useState<Cercania>(inicial?.cercania ?? "cercana");
  const [observacion, setObservacion] = useState(inicial?.observacion ?? "");
  const [fase, setFase] = useState<Fase>(inicial?.fase ?? "apertura");
  const [estado, setEstado] = useState<Estado>(inicial?.estado ?? "nuevo");
  const [temperatura, setTemperatura] = useState<Temperatura>(inicial?.temperatura ?? "frio");
  const [notas, setNotas] = useState(inicial?.notas ?? "");

  const esFrio = tipoProspecto === "contacto_frio";
  const faltaObservacion = esFrio && !observacion.trim();

  const guardar = () => {
    const base: Prospecto = {
      id: inicial?.id ?? uid("p"),
      nombre: nombre.trim() || "Sin nombre",
      usuarioInstagram: usuario.trim(),
      urlInstagram: url.trim(),
      ciudad: ciudad.trim(),
      tipoProspecto,
      cercania,
      observacion: observacion.trim() || undefined,
      fase,
      temperatura,
      estado,
      motivo: inicial?.motivo,
      situacionActual: inicial?.situacionActual,
      problema: inicial?.problema,
      frecuencia: inicial?.frecuencia,
      impacto: inicial?.impacto,
      resultadoDeseado: inicial?.resultadoDeseado,
      brecha: inicial?.brecha,
      intentosAnteriores: inicial?.intentosAnteriores,
      intencion: inicial?.intencion,
      momento: inicial?.momento,
      fitNotas: inicial?.fitNotas,
      ofertaPresentada: inicial?.ofertaPresentada,
      facturacionContratada: inicial?.facturacionContratada,
      dineroCobrado: inicial?.dineroCobrado,
      motivoPerdida: inicial?.motivoPerdida,
      asistioLlamada: inicial?.asistioLlamada,
      resultadoComercial: inicial?.resultadoComercial,
      fechaPrimerContacto: inicial?.fechaPrimerContacto,
      fechaUltimoMensaje: inicial?.fechaUltimoMensaje,
      proximoSeguimiento: inicial?.proximoSeguimiento,
      seguimientosRealizados: inicial?.seguimientosRealizados ?? 0,
      notas: notas.trim() || undefined,
      historial: inicial?.historial ?? [],
      esDemo: inicial?.esDemo,
      creadoEn: inicial?.creadoEn ?? new Date().toISOString(),
    };
    onGuardar(base);
  };

  const Sel = <T extends string>({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
  }) => (
    <div>
      <label className="etiqueta">{label}</label>
      <select className="campo" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="etiqueta">Nombre</label>
          <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del prospecto" />
        </div>
        <div>
          <label className="etiqueta">Usuario de Instagram</label>
          <input className="campo" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="@usuario" />
        </div>
        <div>
          <label className="etiqueta">URL de Instagram</label>
          <input className="campo" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <label className="etiqueta">Ciudad o zona</label>
          <input className="campo" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </div>
        <Sel label="Tipo / fuente" value={tipoProspecto} onChange={setTipo} options={TIPOS_PROSPECTO} />
        <Sel
          label="Cercanía con Juan Manuel"
          value={cercania}
          onChange={setCercania}
          options={CERCANIAS.map((c) => ({ value: c.value, label: c.label }))}
        />
      </div>

      <div>
        <label className="etiqueta">
          Observación real del perfil {esFrio && <span className="text-ambar-600">(obligatoria para contacto frío)</span>}
        </label>
        <textarea
          className="campo min-h-[60px]"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          placeholder="Algo real y verificable que viste en su perfil (se usa en la apertura fría)"
        />
        {faltaObservacion && (
          <p className="mt-1 text-xs text-ambar-600">
            Para un contacto frío, registra una observación real: la apertura la usa y no se debe inventar.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Sel label="Fase" value={fase} onChange={setFase} options={FASES.map((f) => ({ value: f.value, label: f.label }))} />
        <Sel label="Estado (pipeline)" value={estado} onChange={setEstado} options={ESTADOS} />
        <Sel
          label="Temperatura"
          value={temperatura}
          onChange={setTemperatura}
          options={[
            { value: "frio", label: "Frío" },
            { value: "tibio", label: "Tibio" },
            { value: "caliente", label: "Caliente" },
          ]}
        />
      </div>

      <div>
        <label className="etiqueta">Notas</label>
        <textarea className="campo min-h-[60px]" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancelar && (
          <button className="btn-secundario" onClick={onCancelar} type="button">
            Cancelar
          </button>
        )}
        <button className="btn-primario" onClick={guardar} type="button">
          Guardar prospecto
        </button>
      </div>
    </div>
  );
}
