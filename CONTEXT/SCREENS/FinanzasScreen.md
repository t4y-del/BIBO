# FinanzasScreen

## Descripción general

Pantalla de gestión financiera con tres tabs: **BTC**, **Ahorros** y **Resumen**.

---

## Tab: BTC (datos reales)

### Precio BTC — `useBtcPrice`
- API: CoinGecko `GET /simple/price?ids=bitcoin&vs_currencies=usd,ars,usdt`
- Auto-refresh cada 5 minutos. Selector 🇦🇷 ARS / 🇺🇸 USD / 🔵 USDT

### Portfolio Bitcoin — `useBtcData` + `useBtcPrice`
- Valor = `totalBtc × btcPrice[currency]`. Toggle ARS ↔ USD en el header.
- P&L vs costo promedio. Stats: ARS invertido, BTC acumulado, # compras.

### Mis Compras — `AddPurchaseModal`
- CRUD sobre `btc_purchases`. Auto-cálculo de BTC desde precio + monto.

### Meta Anual BTC — `GoalModal` / `btc_goals`
- Meta en ARS y número de compras.

---

## Tab: Ahorros (datos reales)

### Summary card — `useSavings` / `savings_entries` + `savings_goals`
- Total acumulado ARS, meta mensual, meses OK, cumplimiento %.
- Badge "En meta" cuando compliance = 100%.

### Proyección anual
- Gráfico Views (sin SVG): curva real (verde sólida) vs proyectada (dashed).
- Botón "Meta" → modal para configurar `monthly_target` en `savings_goals`.

### Historial — `AddSavingsModal`
- Lista de `savings_entries` del año (desc). Progress bar por entrada.
- Selector de mes 1-12, monto ARS, fecha, nota opcional.
- Alerta si ya existe entrada para el mes → ofrece reemplazar.

### Año completo
- Grid 3×4 de 12 meses. Checkmark ✓ si cumplió meta, "—" si no, gris si futuro.

---

## Tab: Resumen (datos reales)

### Patrimonio total
- `totalArs = btcValueArs + savingsArs` (live via `useBtcPrice`)
- Distribution bar BTC % vs Ahorros %

### Mini cards BTC + Ahorros
- BTC: valor ARS, valor USD, ₿ acumulado, # compras
- Ahorros: total ARS, meses OK, % cumplimiento

---

## Archivos relacionados

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useBtcPrice.ts`            | Fetch CoinGecko, auto-refresh |
| `src/hooks/useBtcData.ts`             | CRUD compras + metas BTC |
| `src/hooks/useSavings.ts`             | CRUD ahorros + metas anuales |
| `src/components/AddPurchaseModal.tsx` | Modal compra BTC |
| `src/components/AddSavingsModal.tsx`  | Modal ahorro mensual |
| `CONTEXT/DBs/migration_btc.md`        | Schema btc_purchases + btc_goals |
| `CONTEXT/DBs/migration_savings.md`    | Schema savings_entries + savings_goals |
