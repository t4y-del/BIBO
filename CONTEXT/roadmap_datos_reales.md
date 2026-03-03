# BIBO — Roadmap: Datos Reales

## Contexto actual
- Auth funcionando (Supabase `auth.users`)
- Todas las pantallas usan **mock data** hardcodeada
- Sin tablas propias todavía (solo las de Supabase Auth)

---

## Arquitectura propuesta

### Principios
- **Un usuario → sus propios datos** — Row Level Security (RLS) en cada tabla
- **Escalable** — estructura pensada para N usuarios simultáneos
- **Tiempo real** — Supabase Realtime para sincronizar agenda/hábitos al instante

---

## Fase 1 — Base de datos (Supabase)

### Tablas a crear (en orden)

```
profiles          ← extiende auth.users (nombre, avatar, nivel)
habits            ← hábitos del usuario (nombre, frecuencia, color, ícono)
habit_logs        ← registro diario de cada hábito (fecha, completado)
objectives        ← objetivos (título, fecha límite, progreso)
objective_tasks   ← sub-tareas de cada objetivo
agenda_events     ← eventos manuales del calendario
```

### RLS (Row Level Security)
Cada tabla tendrá una política del tipo:
```sql
-- Solo el dueño puede ver/modificar sus datos
USING (auth.uid() = user_id)
```
Esto garantiza **aislamiento total entre usuarios** sin lógica extra en el frontend.

---

## Fase 2 — Hooks de datos en el frontend

Crear `src/hooks/` con un hook por dominio:

| Hook | Qué hace |
|---|---|
| `useProfile()` | Lee y actualiza `profiles` |
| `useHabits()` | CRUD de `habits` + `habit_logs` de hoy |
| `useObjectives()` | CRUD de `objectives` + `objective_tasks` |
| `useAgenda(date)` | Lista combinada de hábitos + objetivos + eventos para una fecha |
| `useHomeStats()` | Agrega datos para la Home (resumen) |

Cada hook usa **`useEffect` + Supabase Realtime** para actualizaciones en tiempo real.

---

## Fase 3 — Migrar pantallas (orden sugerido)

```
1. HabitosScreen   ← más independiente, buen punto de entrada
2. ObjetivosScreen ← depende solo de objectives + tasks
3. AgendaScreen    ← consume habits + objectives combinados
4. HomeScreen      ← consume todos los hooks anteriores (solo lectura)
5. ProfileScreen   ← conectar a profiles real
6. FinanzasScreen  ← último (requiere APIs externas de precio BTC)
```

---

## Fase 4 — Finanzas (al final)
- **Precio BTC en tiempo real** → API pública (CoinGecko / Binance WebSocket)
- **Historial de compras** → tabla `btc_purchases`
- **Ahorros** → tabla `savings_logs`

---

## Estructura de carpetas propuesta

```
src/
├── config/
│   └── supabase.ts
├── hooks/
│   ├── useProfile.ts
│   ├── useHabits.ts
│   ├── useObjectives.ts
│   ├── useAgenda.ts
│   └── useHomeStats.ts
├── CONTEXT/
│   ├── DBs/
│   │   ├── auth_schema.md
│   │   ├── habits_schema.md
│   │   └── objectives_schema.md
│   └── SCREENS/
│       └── screens_overview.md
└── screens/ (existing)
```

---

## Próximo paso concreto

> **Crear las tablas en Supabase + habilitar RLS**
> Empezamos con `profiles` y `habits` / `habit_logs` como prueba de concepto.
> Una vez que `HabitosScreen` funcione con datos reales, el patrón se repite para el resto.

---
*Última actualización: 2026-02-22*
