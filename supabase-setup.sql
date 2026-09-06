-- =====================================================================
-- IMAGE · Configuración de Supabase (pega y ejecuta esto UNA vez)
-- En Supabase: menú "SQL Editor" → New query → pega todo → RUN.
-- =====================================================================

-- 1) Tabla del workspace compartido: una sola fila JSON para todo el equipo.
create table if not exists public.workspaces (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Seguridad: solo usuarios con sesión iniciada pueden leer y escribir.
alter table public.workspaces enable row level security;

drop policy if exists "leer autenticado" on public.workspaces;
create policy "leer autenticado" on public.workspaces
  for select using (auth.uid() is not null);

drop policy if exists "insertar autenticado" on public.workspaces;
create policy "insertar autenticado" on public.workspaces
  for insert with check (auth.uid() is not null);

drop policy if exists "actualizar autenticado" on public.workspaces;
create policy "actualizar autenticado" on public.workspaces
  for update using (auth.uid() is not null);

-- 3) Tiempo real: para que los cambios se vean al instante en todos los equipos.
alter publication supabase_realtime add table public.workspaces;
