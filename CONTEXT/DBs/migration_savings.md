# Savings Tables — migration_savings.sql

## savings_entries

Registra cada ingreso de ahorro por mes (una fila por usuario/año/mes, con UNIQUE constraint).

| Columna      | Tipo           | Descripción                              |
|--------------|----------------|------------------------------------------|
| `id`         | uuid (PK)      | Identificador único                      |
| `user_id`    | uuid (FK)      | Referencia a `auth.users`                |
| `year`       | int            | Año (ej: 2026)                           |
| `month`      | int            | Mes 1-12                                 |
| `amount_ars` | numeric(18,2)  | Monto ahorrado en ARS                    |
| `saved_at`   | date           | Fecha de registro                        |
| `note`       | text           | Nota opcional                            |

UNIQUE: `(user_id, year, month)` — se usa `upsert` para actualizar.  
RLS: `auth.uid() = user_id`

---

## savings_goals

Una fila por usuario por año, meta mensual de ahorro.

| Columna          | Tipo          | Descripción                           |
|------------------|---------------|---------------------------------------|
| `id`             | uuid (PK)     |                                       |
| `user_id`        | uuid (FK)     | Referencia a `auth.users`             |
| `year`           | int           | Año de la meta (ej: 2026)             |
| `monthly_target` | numeric(18,2) | Meta mensual en ARS                    |

UNIQUE: `(user_id, year)` — se usa `upsert` para actualizar.  
RLS: `auth.uid() = user_id`

---

## SQL de migración

```sql
CREATE TABLE savings_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year         int  NOT NULL,
  month        int  NOT NULL,
  amount_ars   numeric(18,2) NOT NULL DEFAULT 0,
  saved_at     date NOT NULL DEFAULT CURRENT_DATE,
  note         text,
  UNIQUE(user_id, year, month)
);
ALTER TABLE savings_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_savings" ON savings_entries USING (auth.uid() = user_id);

CREATE TABLE savings_goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year            int NOT NULL,
  monthly_target  numeric(18,2) NOT NULL DEFAULT 0,
  UNIQUE(user_id, year)
);
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_savings_goals" ON savings_goals USING (auth.uid() = user_id);
```
