# BIBO — Database Schema v1

## Diagrama de relaciones

```
auth.users
    │
    ├──► profiles        (1:1) — datos del perfil de la app
    ├──► habits          (1:N) — hábitos definidos por el usuario
    │       └──► habit_logs   (1:N) — un registro por día por hábito
    ├──► objectives      (1:N) — objetivos del usuario
    │       └──► objective_tasks (1:N) — sub-tareas de cada objetivo
    └──► agenda_events   (1:N) — eventos manuales del calendario
```

---

## Tabla: `profiles`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `uuid` PK | — | = `auth.users.id` |
| `display_name` | `text` | — | Primer nombre / apodo |
| `full_name` | `text` | — | Nombre completo |
| `avatar_url` | `text` | — | URL foto de perfil |
| `nivel` | `int` | `1` | Nivel de gamificación |
| `created_at` | `timestamptz` | `now()` | — |
| `updated_at` | `timestamptz` | `now()` | — |

**Trigger:** `on_auth_user_created` → auto-crea el profile al registrar usuario, copiando `display_name` y `full_name` desde `raw_user_meta_data`.

---

## Tabla: `habits`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` FK | — | → `auth.users.id` |
| `name` | `text` | — | Nombre del hábito |
| `icon` | `text` | `'⭐'` | Emoji / ícono |
| `color` | `text` | `'#6C63FF'` | Color hex |
| `frequency` | `text` | `'daily'` | `daily` \| `weekdays` \| `custom` |
| `active_days` | `int[]` | `{0..6}` | Días activos (0=Dom, 6=Sáb) |
| `is_active` | `bool` | `true` | Soft delete / pausa |
| `created_at` | `timestamptz` | `now()` | — |

---

## Tabla: `habit_logs`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | — |
| `habit_id` | `uuid` FK | — | → `habits.id` |
| `user_id` | `uuid` FK | — | → `auth.users.id` |
| `log_date` | `date` | — | Fecha del registro |
| `completed` | `bool` | `false` | ¿Completado ese día? |
| `note` | `text` | — | Nota opcional |

**Constraint:** `UNIQUE (habit_id, log_date)` — un solo registro por hábito por día.

**Índices:** `(user_id, log_date)` para consultas de agenda por fecha.

---

## Tabla: `objectives`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` FK | — | → `auth.users.id` |
| `title` | `text` | — | Título del objetivo |
| `description` | `text` | — | Descripción detallada |
| `icon` | `text` | `'🎯'` | Emoji |
| `color` | `text` | `'#6C63FF'` | Color hex |
| `deadline` | `date` | — | Fecha límite |
| `status` | `text` | `'active'` | `active` \| `completed` \| `paused` |
| `progress` | `int` | `0` | 0–100, calculado automáticamente |

---

## Tabla: `objective_tasks`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | — |
| `objective_id` | `uuid` FK | — | → `objectives.id` |
| `user_id` | `uuid` FK | — | → `auth.users.id` |
| `title` | `text` | — | Texto de la tarea |
| `completed` | `bool` | `false` | ¿Completada? |
| `due_date` | `date` | — | Vencimiento opcional |
| `sort_order` | `int` | `0` | Orden de visualización |

**Trigger:** `on_task_change` → tras cada INSERT/UPDATE/DELETE recalcula `objectives.progress` como `(tareas_completadas / total_tareas) * 100`.

---

## Tabla: `agenda_events`

| Columna | Tipo | Default | Descripción |
|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | — |
| `user_id` | `uuid` FK | — | → `auth.users.id` |
| `title` | `text` | — | Título del evento |
| `description` | `text` | — | Detalle |
| `event_date` | `date` | — | Fecha del evento |
| `event_time` | `time` | — | Hora (opcional) |
| `color` | `text` | `'#6C63FF'` | Color hex |
| `type` | `text` | `'event'` | `event` \| `reminder` \| `milestone` |
| `completed` | `bool` | `false` | Estado |

**Índice:** `(user_id, event_date)` para cargar agenda de un día específico.

---

## RLS — Row Level Security

Todas las tablas tienen RLS habilitado con la misma política:

```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

Esto garantiza a nivel base de datos que **ningún usuario puede ver ni modificar datos de otro**, sin importar el query que se haga desde el frontend.

---

## Índices para escala

| Tabla | Índice | Por qué |
|---|---|---|
| `habits` | `(user_id)` | Filtrar hábitos por usuario |
| `habit_logs` | `(user_id, log_date)` | Agenda del día |
| `habit_logs` | `(habit_id)` | Historial por hábito |
| `objectives` | `(user_id)` | Objetivos por usuario |
| `objective_tasks` | `(objective_id)` | Tareas de un objetivo |
| `agenda_events` | `(user_id, event_date)` | Eventos del día |

---
*Migración:* `CONTEXT/DBs/migration_v1.sql`
*Última actualización:* 2026-02-22
