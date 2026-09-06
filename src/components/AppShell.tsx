"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  Home,
  KanbanSquare,
  LogOut,
  MessageSquarePlus,
  Settings,
  Users,
} from "lucide-react";
import { cx } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { supabaseEnabled, signOut } from "@/lib/supabase";

const NAV = [
  { href: "/", label: "Hoy", icon: Home, corto: "Hoy" },
  { href: "/prospectos", label: "Prospectos", icon: Users, corto: "Prosp." },
  { href: "/nueva-conversacion", label: "Nueva conversación", icon: MessageSquarePlus, corto: "Nueva" },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare, corto: "Pipeline" },
  { href: "/seguimientos", label: "Seguimientos", icon: CalendarClock, corto: "Seguim." },
  { href: "/metricas", label: "Métricas", icon: BarChart3, corto: "Métricas" },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen, corto: "Bibliot." },
  { href: "/configuracion", label: "Configuración", icon: Settings, corto: "Config" },
];

// Íconos en la barra inferior (móvil).
const BOTTOM = NAV.filter((n) => !["/biblioteca", "/configuracion"].includes(n.href));

function activo(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useStore();

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-carbon-100 bg-white">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-carbon-900 font-bold tracking-tight text-ambar-400">
            IM
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-carbon-900">Copiloto de Setting</p>
            <p className="text-xs text-carbon-500">{data.config.nombrePrograma}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const act = activo(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  act ? "bg-carbon-900 text-white" : "text-carbon-600 hover:bg-carbon-50 hover:text-carbon-900"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 px-6 py-4">
          <p className="text-xs text-carbon-400">
            {data.config.nombreOperadora} · desde la cuenta de {data.config.nombreLider}
          </p>
          {supabaseEnabled && (
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-carbon-500 hover:text-carbon-900"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-carbon-100 bg-crema/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-carbon-900 text-xs font-bold text-ambar-400">
              IM
            </div>
            <span className="text-sm font-bold text-carbon-900">IMAGE</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/biblioteca" className="rounded-lg p-2 text-carbon-500 hover:bg-carbon-50" aria-label="Biblioteca">
              <BookOpen size={18} />
            </Link>
            <Link href="/configuracion" className="rounded-lg p-2 text-carbon-500 hover:bg-carbon-50" aria-label="Configuración">
              <Settings size={18} />
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 md:pb-10">{children}</div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around border-t border-carbon-100 bg-white md:hidden">
        {BOTTOM.map((item) => {
          const Icon = item.icon;
          const act = activo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                act ? "text-carbon-900" : "text-carbon-400"
              )}
            >
              <Icon size={20} />
              <span className="leading-none">{item.corto}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
