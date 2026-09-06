// =============================================================
// Capa de Supabase (opcional). Si NO hay variables de entorno,
// la app funciona en modo local (localStorage), como en el MVP.
// Cuando existen las claves, activa datos compartidos + login.
// =============================================================
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppData } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cliente único (o null si no está configurado).
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const supabaseEnabled = !!supabase;

// Todo el equipo comparte un único "workspace" de IMAGE.
export const WORKSPACE_ID = "image";
const TABLE = "workspaces";

// -------- Autenticación --------
export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (haySesion: boolean) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(!!session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase no está configurado." };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return error ? { ok: false, error: traducirError(error.message) } : { ok: true };
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Falta confirmar el correo en Supabase.";
  return msg;
}

// -------- Datos del workspace (una fila JSON compartida) --------
export async function cargarWorkspace(): Promise<AppData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("data").eq("id", WORKSPACE_ID).maybeSingle();
  if (error) {
    console.error("Supabase cargar:", error.message);
    return null;
  }
  return (data?.data as AppData) ?? null;
}

export async function guardarWorkspace(data: AppData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: WORKSPACE_ID, data, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) console.error("Supabase guardar:", error.message);
}

// Suscripción en tiempo real a los cambios del workspace.
export function suscribirWorkspace(cb: (data: AppData) => void): () => void {
  if (!supabase) return () => {};
  const canal = supabase
    .channel("workspace-image")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${WORKSPACE_ID}` },
      (payload) => {
        const nuevo = (payload.new as { data?: AppData })?.data;
        if (nuevo) cb(nuevo);
      }
    )
    .subscribe();
  return () => {
    supabase.removeChannel(canal);
  };
}
