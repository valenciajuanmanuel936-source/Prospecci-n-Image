"use client";
// =============================================================
// Contexto global de IMAGE: estado en memoria + autoguardado.
// =============================================================
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cargarDatos, guardarDatos } from "./storage";
import { crearSesionVacia, datosIniciales, prospectosDemo } from "./seed";
import { hoyISO } from "./rules-engine";
import {
  AppData,
  Aprendizaje,
  Config,
  MensajeHistorial,
  Plantilla,
  Prospecto,
  Sesion,
} from "./types";

interface StoreCtx {
  data: AppData;
  cargando: boolean;
  actualizarConfig: (c: Partial<Config>) => void;
  agregarProspecto: (p: Prospecto) => void;
  actualizarProspecto: (id: string, cambios: Partial<Prospecto>) => void;
  eliminarProspecto: (id: string) => void;
  agregarMensaje: (id: string, m: MensajeHistorial) => void;
  actualizarMensaje: (id: string, mid: string, cambios: Partial<MensajeHistorial>) => void;
  eliminarMensaje: (id: string, mid: string) => void;
  sesionDeHoy: () => Sesion | undefined;
  crearSesion: (s: Sesion) => void;
  actualizarSesion: (id: string, cambios: Partial<Sesion>) => void;
  toggleChecklist: (sesionId: string, bloqueId: string, itemId: string) => void;
  agregarAprendizaje: (a: Aprendizaje) => void;
  agregarPlantilla: (p: Plantilla) => void;
  actualizarPlantilla: (id: string, cambios: Partial<Plantilla>) => void;
  eliminarPlantilla: (id: string) => void;
  toggleFavorito: (id: string) => void;
  reemplazarDatos: (d: AppData) => void;
  cargarDemo: () => void;
  eliminarDemo: () => void;
  reiniciarTodo: () => void;
}

const Ctx = createContext<StoreCtx | null>(null);
const KEY = "copiloto_image_v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => datosIniciales(true));
  const [cargando, setCargando] = useState(true);
  const primeraCarga = useRef(true);

  useEffect(() => {
    setData(cargarDatos());
    setCargando(false);
  }, []);

  useEffect(() => {
    if (cargando) return;
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    guardarDatos(data);
  }, [data, cargando]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const actualizarConfig = useCallback((c: Partial<Config>) => {
    setData((d) => ({ ...d, config: { ...d.config, ...c } }));
  }, []);

  const agregarProspecto = useCallback((p: Prospecto) => {
    setData((d) => ({ ...d, prospectos: [p, ...d.prospectos] }));
  }, []);

  const actualizarProspecto = useCallback((id: string, cambios: Partial<Prospecto>) => {
    setData((d) => ({
      ...d,
      prospectos: d.prospectos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
    }));
  }, []);

  const eliminarProspecto = useCallback((id: string) => {
    setData((d) => ({ ...d, prospectos: d.prospectos.filter((p) => p.id !== id) }));
  }, []);

  const agregarMensaje = useCallback((id: string, m: MensajeHistorial) => {
    setData((d) => ({
      ...d,
      prospectos: d.prospectos.map((p) =>
        p.id === id
          ? {
              ...p,
              historial: [...p.historial, m],
              fechaUltimoMensaje: m.fecha,
              fechaPrimerContacto: p.fechaPrimerContacto ?? m.fecha,
            }
          : p
      ),
    }));
  }, []);

  const actualizarMensaje = useCallback((id: string, mid: string, cambios: Partial<MensajeHistorial>) => {
    setData((d) => ({
      ...d,
      prospectos: d.prospectos.map((p) =>
        p.id === id
          ? { ...p, historial: p.historial.map((m) => (m.id === mid ? { ...m, ...cambios } : m)) }
          : p
      ),
    }));
  }, []);

  const eliminarMensaje = useCallback((id: string, mid: string) => {
    setData((d) => ({
      ...d,
      prospectos: d.prospectos.map((p) =>
        p.id === id ? { ...p, historial: p.historial.filter((m) => m.id !== mid) } : p
      ),
    }));
  }, []);

  const sesionDeHoy = useCallback((): Sesion | undefined => {
    const hoy = hoyISO();
    return data.sesiones.find((s) => s.fecha === hoy);
  }, [data.sesiones]);

  const crearSesion = useCallback((s: Sesion) => {
    setData((d) => ({ ...d, sesiones: [s, ...d.sesiones.filter((x) => x.fecha !== s.fecha)] }));
  }, []);

  const actualizarSesion = useCallback((id: string, cambios: Partial<Sesion>) => {
    setData((d) => ({ ...d, sesiones: d.sesiones.map((s) => (s.id === id ? { ...s, ...cambios } : s)) }));
  }, []);

  const toggleChecklist = useCallback((sesionId: string, bloqueId: string, itemId: string) => {
    setData((d) => ({
      ...d,
      sesiones: d.sesiones.map((s) =>
        s.id === sesionId
          ? {
              ...s,
              bloques: s.bloques.map((b) =>
                b.id === bloqueId
                  ? { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, hecho: !it.hecho } : it)) }
                  : b
              ),
            }
          : s
      ),
    }));
  }, []);

  const agregarAprendizaje = useCallback((a: Aprendizaje) => {
    setData((d) => ({ ...d, aprendizajes: [a, ...d.aprendizajes] }));
  }, []);

  const agregarPlantilla = useCallback((p: Plantilla) => {
    setData((d) => ({ ...d, plantillasPersonalizadas: [p, ...d.plantillasPersonalizadas] }));
  }, []);

  const actualizarPlantilla = useCallback((id: string, cambios: Partial<Plantilla>) => {
    setData((d) => ({
      ...d,
      plantillasPersonalizadas: d.plantillasPersonalizadas.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
    }));
  }, []);

  const eliminarPlantilla = useCallback((id: string) => {
    setData((d) => ({ ...d, plantillasPersonalizadas: d.plantillasPersonalizadas.filter((p) => p.id !== id) }));
  }, []);

  const toggleFavorito = useCallback((id: string) => {
    setData((d) => {
      const esPersonal = d.plantillasPersonalizadas.some((p) => p.id === id);
      if (esPersonal) {
        return {
          ...d,
          plantillasPersonalizadas: d.plantillasPersonalizadas.map((p) =>
            p.id === id ? { ...p, favorito: !p.favorito } : p
          ),
        };
      }
      const yaEs = d.favoritos.includes(id);
      return { ...d, favoritos: yaEs ? d.favoritos.filter((f) => f !== id) : [...d.favoritos, id] };
    });
  }, []);

  const reemplazarDatos = useCallback((d: AppData) => setData(d), []);

  const cargarDemo = useCallback(() => {
    setData((d) => {
      const idsDemo = new Set(d.prospectos.filter((p) => p.esDemo).map((p) => p.id));
      const sinDemo = d.prospectos.filter((p) => !idsDemo.has(p.id));
      return { ...d, prospectos: [...prospectosDemo(), ...sinDemo] };
    });
  }, []);

  const eliminarDemo = useCallback(() => {
    setData((d) => ({ ...d, prospectos: d.prospectos.filter((p) => !p.esDemo) }));
  }, []);

  const reiniciarTodo = useCallback(() => setData(datosIniciales(true)), []);

  const value = useMemo<StoreCtx>(
    () => ({
      data,
      cargando,
      actualizarConfig,
      agregarProspecto,
      actualizarProspecto,
      eliminarProspecto,
      agregarMensaje,
      actualizarMensaje,
      eliminarMensaje,
      sesionDeHoy,
      crearSesion,
      actualizarSesion,
      toggleChecklist,
      agregarAprendizaje,
      agregarPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      toggleFavorito,
      reemplazarDatos,
      cargarDemo,
      eliminarDemo,
      reiniciarTodo,
    }),
    [
      data,
      cargando,
      actualizarConfig,
      agregarProspecto,
      actualizarProspecto,
      eliminarProspecto,
      agregarMensaje,
      actualizarMensaje,
      eliminarMensaje,
      sesionDeHoy,
      crearSesion,
      actualizarSesion,
      toggleChecklist,
      agregarAprendizaje,
      agregarPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      toggleFavorito,
      reemplazarDatos,
      cargarDemo,
      eliminarDemo,
      reiniciarTodo,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}

export { crearSesionVacia };
