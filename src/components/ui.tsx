"use client";
import React, { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cx, copiarAlPortapapeles } from "@/lib/utils";
import { Cercania, Estado, ESTADOS, Fase, faseLabel, Temperatura } from "@/lib/types";

export function Badge({
  children,
  color = "carbon",
  className,
}: {
  children: React.ReactNode;
  color?: "carbon" | "ambar" | "jade" | "gris" | "rojo" | "azul";
  className?: string;
}) {
  const map: Record<string, string> = {
    carbon: "bg-carbon-100 text-carbon-800",
    ambar: "bg-ambar-100 text-ambar-800",
    jade: "bg-jade-100 text-jade-600",
    gris: "bg-carbon-100 text-carbon-500",
    rojo: "bg-red-100 text-red-700",
    azul: "bg-sky-100 text-sky-700",
  };
  return <span className={cx("chip", map[color], className)}>{children}</span>;
}

export function BadgeTemperatura({ t }: { t: Temperatura }) {
  const map = { frio: "azul", tibio: "ambar", caliente: "rojo" } as const;
  const label = { frio: "Frío", tibio: "Tibio", caliente: "Caliente" };
  const emoji = { frio: "🧊", tibio: "🌤️", caliente: "🔥" };
  return (
    <Badge color={map[t] as never}>
      {emoji[t]} {label[t]}
    </Badge>
  );
}

export function BadgeFase({ fase }: { fase: Fase }) {
  return <Badge color="ambar">{faseLabel(fase)}</Badge>;
}

export function BadgeEstado({ estado }: { estado: Estado }) {
  const label = ESTADOS.find((e) => e.value === estado)?.label ?? estado;
  const positivo: Estado[] = ["calificado", "llamada_propuesta", "llamada_agendada", "postllamada", "cerrado_ganado"];
  const negativo: Estado[] = ["cerrado_perdido", "descartado", "sin_fit", "no_asistio", "nutricion"];
  const color = positivo.includes(estado) ? "jade" : negativo.includes(estado) ? "gris" : "carbon";
  return <Badge color={color as never}>{label}</Badge>;
}

export function CopyButton({ texto, label = "Copiar", className }: { texto: string; label?: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copiarAlPortapapeles(texto);
        if (ok) {
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1600);
        }
      }}
      className={cx(
        "btn text-xs px-3 py-1.5",
        copiado ? "bg-jade-500 text-white" : "bg-carbon-900 text-white hover:bg-carbon-800",
        className
      )}
      aria-label={copiado ? "Copiado" : label}
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? "¡Copiado!" : label}
    </button>
  );
}

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = "max-w-lg",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-carbon-950/40 p-0 sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className={cx("w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-suave max-h-[92vh] overflow-y-auto", ancho)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-carbon-100 bg-white px-5 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-carbon-900">{titulo}</h2>
          <button onClick={onCerrar} className="rounded-lg p-1.5 text-carbon-400 hover:bg-carbon-50 hover:text-carbon-700" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icono,
  titulo,
  descripcion,
  accion,
}: {
  icono?: React.ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}) {
  return (
    <div className="tarjeta flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {icono && <div className="text-carbon-300">{icono}</div>}
      <h3 className="text-base font-semibold text-carbon-800">{titulo}</h3>
      {descripcion && <p className="max-w-md text-sm text-carbon-500">{descripcion}</p>}
      {accion}
    </div>
  );
}

export function ProgressBar({ valor, color = "carbon" }: { valor: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, valor));
  const bg = color === "ambar" ? "bg-ambar-500" : color === "jade" ? "bg-jade-500" : "bg-carbon-800";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-carbon-100">
      <div className={cx("h-full rounded-full transition-all", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide text-carbon-500">{children}</h2>
      {right}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const mostrar = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2600);
  };
  const nodo = msg ? (
    <div className="fixed bottom-24 sm:bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-carbon-900 px-4 py-2.5 text-sm font-medium text-white shadow-suave">
      {msg}
    </div>
  ) : null;
  return { mostrar, nodo };
}

export function PillSelect<T extends string>({
  opciones,
  valor,
  onChange,
  columnas = 2,
}: {
  opciones: { value: T; label: string; desc?: string }[];
  valor: T | undefined;
  onChange: (v: T) => void;
  columnas?: number;
}) {
  return (
    <div className={cx("grid gap-2", columnas === 1 ? "grid-cols-1" : "grid-cols-2")}>
      {opciones.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
            valor === o.value ? "border-carbon-800 bg-carbon-50 ring-1 ring-carbon-300" : "border-carbon-200 bg-white hover:border-carbon-300"
          )}
        >
          <span className="font-semibold text-carbon-800">{o.label}</span>
          {o.desc && <span className="mt-0.5 block text-xs text-carbon-500">{o.desc}</span>}
        </button>
      ))}
    </div>
  );
}

export function cercaniaLabel(c: Cercania): string {
  return { muy_cercana: "Muy cercana", cercana: "Cercana", poco_cercana: "Poco cercana", fria: "Fría" }[c];
}
