// =============================================================
// Almacenamiento de IMAGE (localStorage, namespace propio).
// Clave EXCLUSIVA de IMAGE: nunca lee ni escribe datos de otras marcas.
// Aislado para poder migrar a Supabase sin tocar la UI.
// =============================================================
import { datosIniciales, DATA_VERSION } from "./seed";
import { AppData, Prospecto } from "./types";

// Namespace propio de IMAGE.
const STORAGE_KEY = "copiloto_image_v1";

export function cargarDatos(): AppData {
  if (typeof window === "undefined") return datosIniciales(true);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const inicial = datosIniciales(true);
      guardarDatos(inicial);
      return inicial;
    }
    return migrar(JSON.parse(raw) as AppData);
  } catch {
    return datosIniciales(true);
  }
}

export function guardarDatos(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("No se pudo guardar en localStorage", e);
  }
}

function migrar(data: AppData): AppData {
  return {
    ...datosIniciales(false),
    ...data,
    version: data.version || DATA_VERSION,
    marca: "IMAGE",
    prospectos: data.prospectos ?? [],
    sesiones: data.sesiones ?? [],
    aprendizajes: data.aprendizajes ?? [],
    plantillasPersonalizadas: data.plantillasPersonalizadas ?? [],
    favoritos: data.favoritos ?? [],
  };
}

// -------- Exportación / Importación --------
export function exportarJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function validarImportacion(raw: string): { ok: boolean; data?: AppData; error?: string } {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, error: "El archivo no contiene un objeto válido." };
    }
    if (parsed.marca && parsed.marca !== "IMAGE") {
      return { ok: false, error: `El archivo pertenece a otra marca ('${parsed.marca}'). No se puede importar en IMAGE.` };
    }
    if (!Array.isArray(parsed.prospectos)) {
      return { ok: false, error: "Falta el arreglo 'prospectos'." };
    }
    if (typeof parsed.config !== "object") {
      return { ok: false, error: "Falta el objeto 'config'." };
    }
    return { ok: true, data: migrar(parsed as AppData) };
  } catch (e) {
    return { ok: false, error: "El JSON no se pudo leer: " + (e as Error).message };
  }
}

export function prospectosACSV(prospectos: Prospecto[]): string {
  const cols: (keyof Prospecto)[] = [
    "id",
    "nombre",
    "usuarioInstagram",
    "ciudad",
    "tipoProspecto",
    "cercania",
    "fase",
    "temperatura",
    "estado",
    "problema",
    "intencion",
    "momento",
    "ofertaPresentada",
    "facturacionContratada",
    "dineroCobrado",
    "motivoPerdida",
    "fechaPrimerContacto",
    "fechaUltimoMensaje",
    "proximoSeguimiento",
    "seguimientosRealizados",
    "resultadoComercial",
  ];
  const escapar = (v: unknown): string => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const filas = prospectos.map((p) => cols.map((c) => escapar(p[c])).join(","));
  return [header, ...filas].join("\n");
}

export function descargarArchivo(nombre: string, contenido: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
