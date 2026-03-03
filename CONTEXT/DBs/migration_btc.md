# BTC Tables — migration_btc.sql

## btc_purchases

Registra cada compra de Bitcoin del usuario.

| Columna      | Tipo           | Descripción                                      |
|--------------|----------------|--------------------------------------------------|
| `id`         | uuid (PK)      | Identificador único                              |
| `user_id`    | uuid (FK)      | Referencia a `auth.users`                        |
| `bought_at`  | date           | Fecha de compra (YYYY-MM-DD)                     |
| `btc_amount` | numeric(18,8)  | Cantidad de BTC comprada                         |
| `price_usd`  | numeric(18,2)  | Precio BTC/USD al momento de la compra           |
| `total_usd`  | numeric(18,2)  | Total pagado en USD (si `currency = 'USD'`)      |
| `total_ars`  | numeric(18,2)  | Total pagado en ARS (si `currency = 'ARS'`)      |
| `total_usdt` | numeric(18,2)  | Total pagado en USDT (if `currency = 'USDT'`)   |
| `currency`   | text           | Moneda usada: `'USD'` \| `'ARS'` \| `'USDT'`   |
| `note`       | text           | Nota opcional                                    |

RLS: `auth.uid() = user_id`

---

## btc_goals

Una fila por usuario por año, configuración de meta anual de compras.

| Columna            | Tipo          | Descripción                           |
|--------------------|---------------|---------------------------------------|
| `id`               | uuid (PK)     |                                       |
| `user_id`          | uuid (FK)     | Referencia a `auth.users`             |
| `year`             | int           | Año de la meta (ej: 2026)             |
| `target_ars`       | numeric(18,2) | Meta total en ARS para el año         |
| `target_usd`       | numeric(18,2) | Meta total en USD para el año         |
| `target_purchases` | int           | Número de compras objetivo (ej: 12)   |

UNIQUE: `(user_id, year)` — se usa `upsert` para actualizar.
RLS: `auth.uid() = user_id`

---

## SQL de migración

```sql
CREATE TABLE btc_purchases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bought_at   date NOT NULL DEFAULT CURRENT_DATE,
  btc_amount  numeric(18,8) NOT NULL,
  price_usd   numeric(18,2) NOT NULL,
  total_usd   numeric(18,2),
  total_ars   numeric(18,2),
  total_usdt  numeric(18,2),
  currency    text NOT NULL DEFAULT 'ARS',
  note        text
);
ALTER TABLE btc_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_purchases" ON btc_purchases USING (auth.uid() = user_id);

CREATE TABLE btc_goals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year             int NOT NULL,
  target_ars       numeric(18,2),
  target_usd       numeric(18,2),
  target_purchases int,
  UNIQUE(user_id, year)
);
ALTER TABLE btc_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_goals" ON btc_goals USING (auth.uid() = user_id);
```
