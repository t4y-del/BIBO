-- ============================================================
-- BIBO — Migration v1
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES
--    Extiende auth.users con datos del perfil de la app
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  full_name     text,
  avatar_url    text,
  nivel         int not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner access"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-crear profile cuando se registra un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. HABITS
--    Hábitos definidos por el usuario
-- ────────────────────────────────────────────────────────────
create table if not exists public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  icon          text not null default '⭐',
  color         text not null default '#6C63FF',
  -- frecuencia: 'daily' | 'weekdays' | 'custom'
  frequency     text not null default 'daily',
  -- días activos para frecuencia custom: [0,1,2,3,4,5,6] = Dom..Sáb
  active_days   int[] not null default '{0,1,2,3,4,5,6}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "habits: owner access"
  on public.habits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index habits_user_id_idx on public.habits(user_id);


-- ────────────────────────────────────────────────────────────
-- 3. HABIT_LOGS
--    Registro diario: un row por (hábito, día)
-- ────────────────────────────────────────────────────────────
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  habit_id   uuid not null references public.habits(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  completed  boolean not null default false,
  note       text,
  created_at timestamptz not null default now(),

  -- Un solo registro por hábito por día
  unique (habit_id, log_date)
);

alter table public.habit_logs enable row level security;

create policy "habit_logs: owner access"
  on public.habit_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index habit_logs_user_date_idx on public.habit_logs(user_id, log_date);
create index habit_logs_habit_id_idx  on public.habit_logs(habit_id);


-- ────────────────────────────────────────────────────────────
-- 4. OBJECTIVES
--    Objetivos del usuario con deadline y progreso
-- ────────────────────────────────────────────────────────────
create table if not exists public.objectives (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  icon         text not null default '🎯',
  color        text not null default '#6C63FF',
  deadline     date,
  -- status: 'active' | 'completed' | 'paused'
  status       text not null default 'active',
  -- progreso calculado desde las tareas (0-100)
  progress     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.objectives enable row level security;

create policy "objectives: owner access"
  on public.objectives
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index objectives_user_id_idx on public.objectives(user_id);


-- ────────────────────────────────────────────────────────────
-- 5. OBJECTIVE_TASKS
--    Sub-tareas de cada objetivo
-- ────────────────────────────────────────────────────────────
create table if not exists public.objective_tasks (
  id           uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  completed    boolean not null default false,
  due_date     date,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.objective_tasks enable row level security;

create policy "objective_tasks: owner access"
  on public.objective_tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index objective_tasks_objective_id_idx on public.objective_tasks(objective_id);

-- Función para recalcular progreso de un objetivo automáticamente
create or replace function public.update_objective_progress()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  total_tasks int;
  done_tasks  int;
begin
  select count(*), count(*) filter (where completed)
  into total_tasks, done_tasks
  from public.objective_tasks
  where objective_id = coalesce(new.objective_id, old.objective_id);

  update public.objectives
  set progress = case when total_tasks = 0 then 0
                      else round((done_tasks::numeric / total_tasks) * 100)
                 end,
      updated_at = now()
  where id = coalesce(new.objective_id, old.objective_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_task_change on public.objective_tasks;
create trigger on_task_change
  after insert or update or delete on public.objective_tasks
  for each row execute function public.update_objective_progress();


-- ────────────────────────────────────────────────────────────
-- 6. AGENDA_EVENTS
--    Eventos manuales del calendario (no hábitos ni objetivos)
-- ────────────────────────────────────────────────────────────
create table if not exists public.agenda_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  event_date  date not null,
  event_time  time,
  color       text not null default '#6C63FF',
  -- type: 'event' | 'reminder' | 'milestone'
  type        text not null default 'event',
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.agenda_events enable row level security;

create policy "agenda_events: owner access"
  on public.agenda_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index agenda_events_user_date_idx on public.agenda_events(user_id, event_date);


-- ────────────────────────────────────────────────────────────
-- DONE ✓
-- Tablas: profiles, habits, habit_logs, objectives,
--         objective_tasks, agenda_events
-- RLS habilitado en todas las tablas
-- Trigger: auto-create profile on signup
-- Trigger: auto-recalculate objective progress
-- ────────────────────────────────────────────────────────────
