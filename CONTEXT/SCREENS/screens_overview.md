# Screens Overview — BIBO App

## Estructura de Navegación

```
App.tsx (State Router)
├── AUTH FLOW
│   ├── WelcomeScreen       → onNavigate('Register') | onNavigate('Login')
│   ├── RegisterScreen      → onNavigate('Home') | onNavigate('Login') | onNavigate('Welcome')
│   └── LoginScreen         → onNavigate('Home') | onNavigate('Register') | onNavigate('Welcome')
│
├── MAIN APP (con BottomTabBar)
│   ├── HomeScreen          → onNavigate('Profile')
│   ├── HabitosScreen
│   ├── ObjetivosScreen
│   ├── AgendaScreen
│   └── FinanzasScreen
│
└── OVERLAY (sin tab bar)
    └── ProfileScreen       → onBack() | onLogout() → Welcome
```

---

## Pantallas de Auth

### WelcomeScreen (`src/screens/WelcomeScreen.tsx`)
- **Propósito:** Pantalla de entrada con branding BIBO
- **UI:** Fondo starfield animado, logo flotante, pills de categorías, 2 botones
- **Props:** `onNavigate(screen: string)`
- **Navegación:** → Register | → Login

### RegisterScreen (`src/screens/RegisterScreen.tsx`)
- **Propósito:** Alta de nuevo usuario
- **Auth:** `supabase.auth.signUp()` con metadata `full_name` y `display_name`
- **Campos:** Nombre, Apellido (opcional), Email, Contraseña
- **Features:** Strength indicator para contraseña, aceptación de términos, loading/error states
- **Validaciones:** nombre requerido, email requerido, contraseña ≥6 chars, términos aceptados
- **Errores manejados:** email ya registrado, genérico
- **Props:** `onNavigate(screen: string)`

### LoginScreen (`src/screens/LoginScreen.tsx`)
- **Propósito:** Inicio de sesión de usuario existente
- **Auth:** `supabase.auth.signInWithPassword()`
- **Campos:** Email, Contraseña (toggle mostrar/ocultar)
- **Features:** Social login placeholders (Google/Apple), forgot password link (pendiente)
- **Errores manejados:** credenciales inválidas, email no confirmado, genérico
- **Props:** `onNavigate(screen: string)`

---

## Pantallas Principales (Tab Bar)

### HomeScreen (`src/screens/HomeScreen.tsx`)
- **Propósito:** Dashboard principal
- **Secciones:**
  - Header: fecha actual, saludo, subtítulo "Mercado crypto", avatar → Profile
  - Crypto cards: BTC / USDT / ETH con precio y % cambio (mock)
  - Resumen 2×2 grid: Objetivos activos, Días de racha, Invertido ARS, Ahorro 2026
  - Hábitos hoy: lista con ícono, nombre, racha, checkbox
  - Objetivos próximos: cards con progreso y badge
- **Data:** Mock (pendiente conectar a Supabase)
- **Props:** `onNavigate(screen: string)`
- **Íconos:** `@expo/vector-icons` (Ionicons)

### HabitosScreen (`src/screens/HabitosScreen.tsx`)
- **Propósito:** Gestión y tracking de hábitos diarios
- **Secciones:**
  - Strip semanal de progreso
  - Card resumen con % completados y ring visual
  - Lista de hábitos: toggle completado, historial 7 días, rachas
  - Estadísticas: mejor racha, tasa de cumplimiento
  - FAB (+) para agregar hábito
- **State:** Local (pendiente conectar a Supabase)

### ObjetivosScreen (`src/screens/ObjetivosScreen.tsx`)
- **Propósito:** Gestión de objetivos y metas
- **Secciones:**
  - Card resumen: total objetivos, progreso promedio
  - Filtro tabs: Todos | En progreso | Completados
  - Cards expandibles: tareas, barra progreso, badge, fecha límite
- **State:** Local (pendiente conectar a Supabase)

### AgendaScreen (`src/screens/AgendaScreen.tsx`)
- **Propósito:** Calendario y planificación
- **Secciones:**
  - Grilla de calendario mensual: días seleccionables, puntos de eventos, resaltado hoy
  - Tareas del día: hábitos/objetivos con checkboxes
  - Próximos Hitos section
  - FAB (+) para agregar evento
- **State:** Local (pendiente conectar a Supabase)

### FinanzasScreen (`src/screens/FinanzasScreen.tsx`)
- **Propósito:** Seguimiento financiero (BTC + Ahorros)
- **Tabs:** BTC | Ahorros | Resumen
- **BTC tab:**
  - Portfolio card: total valorizado, P&L, stats (invertido/BTC/compras)
  - Gráfico precio BTC (sparkline, mock)
  - Historial de compras con P&L por compra
  - Meta anual: $3.600.000 / 12 meses, barra progreso 16.7%
- **Ahorros tab:**
  - Card acumulado: $1.000.000, meta mensual $500k
  - Proyección anual: gráfico dual real vs proyectado
  - Historial mensual con estado cumplimiento
- **Resumen tab:** tabla consolidada de métricas
- **State:** Local / Mock (pendiente conectar a Supabase)

---

## Pantalla Overlay

### ProfileScreen (`src/screens/ProfileScreen.tsx`)
- **Acceso:** Avatar button en HomeScreen (no tab bar)
- **Secciones:**
  - Hero: avatar, nombre, handle, nivel badge
  - Stats: Objetivos / Rachas / BTC compras
  - CUENTA: editar perfil, email, contraseña
  - PREFERENCIAS: toggles notificaciones/dark mode, selectores moneda/semana
  - APP: sync, exportar data, calificar
  - SESIÓN: Cerrar sesión (→ Welcome), Eliminar cuenta
- **Props:** `onBack: () => void`, `onLogout: () => void`
- **Auth:** `onLogout` → llama a `supabase.auth.signOut()` (pendiente implementar)

---

## App.tsx — Router Principal

**Estado gestionado:**
```ts
authScreen: 'Welcome' | 'Register' | 'Login' | null
activeTab: TabName  // 'Home' | 'Hábitos' | 'Objetivos' | 'Agenda' | 'Finanzas'
showProfile: boolean
```

**Flujos:**
- `authScreen !== null` → muestra pantalla de auth correspondiente
- `showProfile === true` → muestra ProfileScreen (overlay)
- Default → muestra main app con BottomTabBar

**Pendiente:**
- [ ] `useEffect` con `supabase.auth.getSession()` al iniciar → skip Welcome si hay sesión
- [ ] Listener `supabase.auth.onAuthStateChange()` para logout global

---

## Componentes Compartidos

### BottomTabBar (`src/components/BottomTabBar.tsx`)
- 5 tabs: Home, Hábitos, Objetivos, Agenda, Finanzas
- Usa `Ionicons` de `@expo/vector-icons`
- Tab activo: ícono filled + pill violeta de fondo
- **Props:** `active: TabName`, `onTabPress: (tab: TabName) => void`

---
*Última actualización: 2026-02-22*
