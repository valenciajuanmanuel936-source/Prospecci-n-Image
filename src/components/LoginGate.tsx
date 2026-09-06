"use client";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { getSession, onAuthChange, signIn, supabaseEnabled } from "@/lib/supabase";

export function LoginGate({ children }: { children: React.ReactNode }) {
  // Sin Supabase configurado => modo local, sin login.
  const [estado, setEstado] = useState<"cargando" | "fuera" | "dentro">(
    supabaseEnabled ? "cargando" : "dentro"
  );

  useEffect(() => {
    if (!supabaseEnabled) return;
    let vivo = true;
    getSession().then((s) => vivo && setEstado(s ? "dentro" : "fuera"));
    const off = onAuthChange((hay) => setEstado(hay ? "dentro" : "fuera"));
    return () => {
      vivo = false;
      off();
    };
  }, []);

  if (estado === "cargando") {
    return <div className="flex min-h-screen items-center justify-center text-carbon-400">Cargando…</div>;
  }
  if (estado === "fuera") return <Login />;
  return <>{children}</>;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const r = await signIn(email, password);
    if (!r.ok) {
      setError(r.error ?? "No se pudo iniciar sesión.");
      setEnviando(false);
    }
    // Si es correcto, onAuthChange cambia el estado automáticamente.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-crema px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-carbon-900 font-bold text-ambar-400">IM</div>
          <h1 className="text-xl font-bold text-carbon-900">Copiloto de Setting · IMAGE</h1>
          <p className="text-sm text-carbon-500">Inicia sesión para continuar.</p>
        </div>
        <form onSubmit={entrar} className="tarjeta space-y-3 p-5">
          <div>
            <label className="etiqueta">Correo</label>
            <input
              type="email"
              className="campo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="etiqueta">Contraseña</label>
            <input
              type="password"
              className="campo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" className="btn-primario w-full" disabled={enviando}>
            <LogIn size={16} /> {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-carbon-400">
          El acceso lo crea Juan Manuel desde Supabase. Si olvidaste tu clave, pídesela a él.
        </p>
      </div>
    </div>
  );
}
