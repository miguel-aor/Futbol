# PROGRESO — Futbol (prototipo de análisis del Mundial 2026)

> Documento de continuidad. Resume **qué se hizo, cómo está armado y qué falta**
> para poder retomar en otra sesión. Última actualización: **17 jun 2026**.

---

## 1. Qué es

Prototipo **interno de análisis** (no producto comercial, no casa de apuestas)
enfocado **solo** en el Mundial 2026 y selecciones mundialistas. Muestra
partidos, probabilidades del modelo, cuota justa, edge, picks y props de
jugador. Ubicación local: `C:\Users\santi\Desktop\slprj`.

Repo destino (todavía **sin push**): https://github.com/a01769810-svg/Futbol

---

## 2. Estado actual — TODO funciona

- `npm run build` ✅ compila · `npm run lint` ✅ sin errores
- `npm run dev` / `npm start` (standalone) ✅ todas las rutas responden 200
- `npm run ingest:365` ✅ corre y sale con código 0 aunque fallen URLs
- 4 commits locales en rama `master` (ver §8). **Falta hacer `git push`.**

---

## 3. Stack

Next.js 15.5.19 (App Router) · React 19 · TypeScript · Tailwind v3 (dark mode) ·
Route Handlers para API · `output: "standalone"` para Railway · UI en español.

---

## 4. Lo que se construyó (orden cronológico)

### A. App completa con datos mock + arquitectura de providers
- Capa **data-providers** (`src/lib/data-providers/`): `mockProvider`,
  `manualJsonProvider`, `scores365ExperimentalProvider`, `providerRegistry`
  (elige por `DATA_PROVIDER`, **siempre cae a mock** si falla), `normalizers.ts`,
  `types.ts`, `snapshots.ts`.
- **Motor de predicción** (`src/lib/prediction/`): Poisson para 1X2, goles,
  córners, tarjetas, tiros y props de jugador; edge, cuota justa, confianza,
  ranking. Determinista (sin `Math.random` en runtime → sin errores de
  hidratación).
- **API interna** (12 route handlers en `src/app/api/`).
- **9 páginas**: `/`, `/dashboard`, `/worldcup`, `/matches/[id]`, `/teams`,
  `/teams/[id]`, `/players`, `/players/[id]`, `/methodology`.
- **Componentes** en `src/components/` (cards, tablas, badges, filtros, navbar,
  shell, charts mini). Filtros y búsqueda funcionan en cliente.
- **Scripts de ingesta** (`scripts/ingest-365scores.ts`,
  `normalize-snapshots.ts`): manuales, con rate limit, cache, timestamp y
  manejo resiliente de errores. **Nunca** corren en build ni por request.
- Config de deploy: `next.config.ts` (con `outputFileTracingRoot`),
  `railway.json`, `scripts/postbuild.mjs` (copia assets al standalone),
  `.env.example`, `.gitignore`, `README.md`.

### B. Mejora UI/UX (skill ui-ux-pro-max)
- Confirmado estilo **Dark Mode (OLED)**.
- Íconos **SVG** (`src/components/icons.tsx`) en lugar de emojis decorativos
  (se mantienen las banderas 🇦🇷 de selecciones: son contenido).
- `cursor-pointer` en botones, `:focus-visible` global, `prefers-reduced-motion`,
  números tabulares en tablas.

### C. DATOS REALES del Mundial 2026 (corrección importante)
Se reemplazaron las selecciones/grupos inventados por datos reales investigados
en **ESPN + Wikipedia** (capturados 17 jun 2026):
- `src/data/worldcup-teams.ts` → 48 selecciones reales con sus **grupos del
  sorteo** (5 dic 2025).
- `src/data/worldcup-fixtures.ts` → **72 partidos** de fase de grupos con sede y
  fecha reales + **resultados reales de la jornada 1** (Mx 2-0 RSA, USA 4-1 PAR,
  Alemania 7-1 Curazao, Argentina 3-0 Argelia, Portugal 1-1 RD Congo, etc.).
- Las **posiciones de cada grupo se calculan** desde esos resultados.
- Estado `live` para partidos del día sin marcador.

### D. JUGADORES REALES
- `src/data/worldcup-players.ts` → 3 figuras reales por selección (144 en total:
  Messi, Mbappé, Ronaldo, Haaland, Salah, Son, Bellingham, Lamine Yamal…).

---

## 5. Provenance de los datos (importante para entender la UI)

| Dato | Origen | Badge en UI |
|------|--------|-------------|
| Equipos, grupos, calendario, resultados jugados | **Real** (ESPN/Wikipedia, captura 17 jun) | **Snapshot manual** + timestamp |
| Nombres y posiciones de jugadores | **Real** | **Snapshot manual** |
| Stats de jugador, probabilidades, cuotas, edge, picks, props | **Modelo** | **Mock** |
| Ranking FIFA, head-to-head | Aproximado/generado | — |

> **No es un feed en vivo.** Es un *snapshot* con marca de tiempo. Para
> actualizar resultados o seguir partidos en curso hay que reejecutar la ingesta
> manual. Un feed automático real requeriría una API deportiva con key
> (`SPORTS_API_KEY` ya está reservado en `.env.example`).

---

## 6. Cómo correr (recordatorio)

```bash
npm install
npm run dev            # http://localhost:3000
# build de producción:
npm run build && npm start
# ingesta experimental (manual):
npm run ingest:365
```

---

## 7. Estructura de archivos clave

```
src/
├── app/                     # páginas + /api (route handlers)
├── components/              # UI (incluye icons.tsx, badges, tablas, filtros)
├── data/
│   ├── worldcup-teams.ts    # 48 selecciones reales + grupos  ← FUENTE CENTRAL
│   ├── worldcup-fixtures.ts # 72 partidos reales + resultados J1
│   ├── worldcup-players.ts  # 144 jugadores reales destacados
│   ├── mock-builder.ts      # arma el dataset (real + modelo)
│   ├── markets.ts · source-urls.ts · names.ts
└── lib/
    ├── data-providers/      # providers, registry, types, normalizers
    ├── prediction/          # motor de probabilidades/edge
    ├── data-access.ts       # view models para API y páginas
    └── format.ts            # formato determinista (fechas, %, cuotas)
scripts/                     # ingest-365scores · normalize-snapshots · postbuild
data/snapshots/              # manual/ y 365scores/{raw,normalized}
```

---

## 8. Commits (rama `master`, local)

1. `d65a935` — Initial commit: app + mock + providers
2. `ce4a167` — UI/UX polish: iconos SVG, cursor, focus, reduced-motion
3. `f9c2a28` — Datos reales del Mundial 2026 (grupos, calendario, resultados J1)
4. `ff04a15` — Jugadores reales destacados (144 internacionales)

**Pendiente: push.** Para subirlo:
```bash
git remote add origin https://github.com/a01769810-svg/Futbol.git
git branch -M main
git push -u origin main
```

---

## 9. Próximos pasos sugeridos (TODO)

- [ ] **Hacer `git push`** al repo de GitHub (requiere auth del usuario).
- [ ] **Deploy en Railway**: New Project → Deploy from GitHub repo → Generate Domain.
- [ ] **Actualizar resultados**: a medida que avanza el torneo, agregar marcadores
      reales en `src/data/worldcup-fixtures.ts` (jornadas 2 y 3 hoy están en
      `null` = programadas). Hoy solo está completa la jornada 1.
- [ ] **Eliminación directa**: cuando se definan octavos, agregar esos partidos
      (estructura ya soporta cualquier fixture).
- [ ] **Datos en vivo automáticos**: conectar una API deportiva oficial usando
      `SPORTS_API_KEY` / `SPORTS_API_BASE_URL`, o terminar el parsing real de
      365Scores en `src/lib/data-providers/normalizers.ts` (hay `TODO` marcados).
- [ ] **Stats reales de jugador** (opcional): hoy las stats/props son del modelo;
      podrían venir de una API si se quiere precisión.
- [ ] Verificar convocatorias finales de jugadores (las 144 son figuras reales
      pero la lista de convocados puede ajustarse).

---

## 10. Notas / gotchas

- **No correr `npm run build` con `npm run dev` activo**: corrompe `.next`
  (`Cannot find module './331.js'`). Si pasa: detener node, `rm -rf .next`,
  reiniciar dev. Ya ocurrió y se resolvió así.
- En Windows aparecen warnings `LF will be replaced by CRLF` al commitear: son
  inofensivos.
- La app funciona **sin internet** y **sin variables de entorno**.
- Fecha simulada del entorno: 2026-06-17 (mitad de fase de grupos).
