# Futbol ⚽ — Análisis del Mundial 2026

Prototipo **interno de investigación y análisis** enfocado **únicamente** en el
**Mundial 2026** y las **selecciones participantes**. No es un producto comercial,
no es una casa de apuestas y no incluye enlaces a apuestas. Es una herramienta de
análisis con probabilidades, cuota justa, edge y picks.

> **Importante:** no garantiza resultados, no es consejo financiero. Los datos
> pueden provenir de mock data, snapshots manuales o recopilación experimental.

## Alcance

Incluido:
- Mundial 2026, selecciones participantes, fase de grupos y eliminación directa (placeholder).
- Amistosos / eliminatorias / partidos internacionales de esas selecciones.
- Jugadores convocados o convocables de esas selecciones.

**No** incluido (a propósito): clubes, Premier League, LaLiga, Champions, MLS,
ligas nacionales, apuestas reales ni enlaces a casas de apuestas.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS** (dark mode como estilo principal)
- **Route Handlers** de Next.js para la API interna
- Componentes propios, responsivos, UI en español
- Preparado para deploy en **Railway** (`output: "standalone"`)

## Arquitectura de datos (providers)

La app consume **siempre** una capa de providers (`src/lib/data-providers`), nunca
mock data directa en los componentes:

| Provider | Fuente | Notas |
| --- | --- | --- |
| `mockProvider` | Datos mock deterministas | Por defecto. Funciona **sin internet**. |
| `manualJsonProvider` | `data/snapshots/manual/*.json` | Cargas/pegas snapshots a mano. |
| `365ScoresExperimentalProvider` | `data/snapshots/365scores/normalized/*.json` | Solo **lee** snapshots; nunca llama en vivo. |

El `providerRegistry` elige el provider según `DATA_PROVIDER` y **siempre** hace
fallback a mock si el elegido no está disponible o falla. La fuente y la fecha de
actualización de cada dato se muestran en la UI (badges).

## Correr en local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Build y producción

```bash
npm run build     # next build + copia de assets a .next/standalone
npm start         # node .next/standalone/server.js  (modo Railway)
# alternativa: npm run start:next  (next start)
```

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción (standalone) + postbuild de assets. |
| `npm start` | Arranca el servidor standalone (compatible Railway). |
| `npm run lint` | ESLint. |
| `npm run ingest:365` | **Ingesta experimental manual** de 365Scores. |
| `npm run normalize:data` | Re-normaliza snapshots raw ya descargados (sin red). |

## Datos: reales + modelo

Por defecto `DATA_PROVIDER=mock`, pero el dataset combina:

- **Reales** (fuentes públicas ESPN/Wikipedia, capturados el 17 jun 2026): los
  48 equipos y sus **grupos del sorteo**, el **calendario completo** de fase de
  grupos (72 partidos con sede y fecha) y los **resultados ya jugados** (jornada
  1). Viven en `src/data/worldcup-teams.ts` y `src/data/worldcup-fixtures.ts`.
  En la UI llevan el badge **"Snapshot manual"** con su marca de tiempo.
- **Generados por el modelo** (badge **"Mock"**): plantillas de jugadores,
  stats, probabilidades, cuotas justas, edge y picks. Son deterministas (mismo
  resultado en servidor y cliente, sin errores de hidratación).

Las posiciones de cada grupo se calculan en vivo a partir de los resultados
reales. No requiere internet ni variables de entorno.

> Para actualizar resultados (o seguir partidos en curso) se reejecuta la
> ingesta manual; los datos no son un feed en vivo segundo a segundo, son un
> snapshot con timestamp. Ver más abajo y en `/methodology`.

## Ingesta experimental de 365Scores

```bash
npm run ingest:365
```

Reglas de diseño (deliberadas):
- **Manual**, nunca en build ni en cada request de usuario.
- No scraping agresivo, sin proxies, sin evadir captchas/bloqueos, sin saturar.
- **Rate limit** + **cache local** + **timestamp** + **fuente** en cada snapshot.
- Si una URL falla, registra el error y **continúa**; nunca rompe build/deploy.
- No requiere secretos.
- Guarda raw en `data/snapshots/365scores/raw` y normalizado en `.../normalized`.
- La app **lee** esos snapshots; no depende de llamadas en vivo.

Las URLs se configuran en `src/data/source-urls.ts` (no se hardcodean en el script).
Cada URL declara su `kind` (match/team/player/competition/referee/coach) y el
script guarda los snapshots en subcarpetas por entidad:

```
data/snapshots/365scores/
  raw/{matches,teams,players,competitions,referees,coaches}/
  normalized/{matches,teams,players,reports}/
```

Como 365Scores es muy dinámico, hay un **parser experimental de subtabs** en
`normalizers.ts` (`parseScores365Sections`) que detecta de forma tolerante las
secciones **Match Page, Lineups, Stats, Groups, Head-to-head, Odds, Events,
Player stats, Team form, Standings y News** y normaliza games/competitors cuando
los encuentra. El snapshot guarda `sectionsFound`. El parsing fino donde la
estructura no está confirmada queda como `TODO`. Si no se puede extraer, **la app
sigue funcionando con mock data** (fallback seguro).

Resumen final del script: URLs procesadas, exitosas, fallidas, archivos generados,
subtabs detectadas y advertencias.

## World Cup Intelligence Mapping

Capa de **inteligencia** que construye un mapa analítico profundo de cada
selección y de cada partido próximo. Los **datos base** viajan en el `DataBundle`
(entrenadores, árbitros y partidos históricos); los **perfiles y reportes son
derivados** y se computan en `src/lib/prediction/intelligence.ts` (puro y
determinista, sin persistir).

Entidades nuevas (en `src/lib/data-providers/types.ts`):
- **`Coach`** — entrenador por selección (`src/data/worldcup-coaches.ts`); nombres
  de conocimiento público, métricas estimadas por el modelo. Factor de ajuste vía
  `calculateCoachImpact` (sesgo ofensivo, presión, disciplina, rotación).
- **`Referee`** — pool de árbitros (`src/data/worldcup-referees.ts`); ajusta los
  mercados de tarjetas/faltas/penal vía `calculateRefereeImpact` con explicación
  legible ("árbitro estricto → sube tarjetas", etc.).
- **`HistoricalMatch`** — partidos anteriores relevantes (generados deterministas);
  se filtran con `getRelevantHistoricalMatches(teamId, options)` por últimos
  5/10/20, oficiales, amistosos, rivales fuertes, similitud con el próximo rival,
  confederación y enfoque de mercado.
- **`TeamIntelligenceProfile`** — identidad, rendimiento reciente (5/10/20),
  rendimiento contextual, scores 0-100 (forma/ataque/defensa/disciplina/corners/
  tiros), jugadores clave y **calidad de datos**.
- **`PlayerIntelligenceProfile`** — perfil expandido por jugador (forma, balón
  parado, penalero, riesgo de rotación, minutos esperados…).
- **`MatchIntelligenceReport`** — reporte por partido: comparativas, árbitro,
  entrenadores, forma, factores (resultado/goles/corners/tarjetas), picks con
  razones a favor/en contra, narrativa y calidad de datos.
- **`DataQualityScore`** — completeness, recency, sourceReliability, sampleSize,
  consistency → `finalScore` y nivel **alta/media/baja** (con advertencias).

UI:
- `/matches/[id]` ahora con pestañas: **Resumen · Probabilidades · Estadísticas ·
  Alineaciones · Historial · Árbitro · Entrenadores · Jugadores · Intelligence**.
- `/teams/[id]` con sección **"Mapa de rendimiento"** (radar de scores, ventanas
  5/10/20, entrenador, históricos y jugadores clave).
- **Dashboard** con filtros avanzados: árbitro conocido, alta calidad de datos,
  respaldado por últimos 10, modelo y tendencia coinciden, excluir/solo oficiales,
  rival similar/parejo, campo neutral.
- Cada pick muestra **calidad de datos**; si es baja, advierte muestra limitada.

## API interna (Route Handlers)

`GET /api/health`, `/api/data-source`, `/api/matches`, `/api/matches/[id]`,
`/api/matches/[id]/intelligence`, `/api/worldcup`, `/api/teams`,
`/api/teams/[id]`, `/api/teams/[id]/intelligence`, `/api/opportunities`,
`/api/players`, `/api/players/[id]`, `/api/player-props?playerId=...`,
`/api/snapshots`. Todos consumen la capa de providers.

## Páginas

`/` (landing), `/dashboard`, `/worldcup`, `/matches/[id]` (con pestaña
**Intelligence**), `/teams`, `/teams/[id]` (con **Mapa de rendimiento**),
`/players`, `/players/[id]`, `/methodology`.

## Variables de entorno

La app funciona **sin ninguna**. Ver `.env.example`:

```env
DATA_PROVIDER=mock
ENABLE_365_EXPERIMENTAL=false
SPORTS_API_KEY=
SPORTS_API_BASE_URL=
DATABASE_URL=
```

No subas secretos reales. El deploy no se rompe si faltan variables.

## Deploy en Railway

1. Sube el repo a GitHub.
2. En Railway: **New Project → Deploy from GitHub repo** y elige este repo.
3. Railway detecta Node y usa `npm run build` (build) y `npm start` (start),
   ya configurados en `package.json` y `railway.json`.
4. (Opcional) Agrega variables de entorno si en el futuro se usan. No son necesarias.
5. **Generate Domain** para obtener una URL pública.

Notas:
- **No** se ejecuta scraping durante el build ni automáticamente en producción.
- La app funciona **sin internet** usando mock data.

## Estructura

```
src/
├── app/                # App Router: páginas + /api Route Handlers
├── components/         # UI (cards, tablas, badges, filtros, shell, IntelligencePanels)
├── data/               # mock-builder, worldcup-{teams,fixtures,players,coaches,referees}
│                       #   + intelligence-builder.ts + source-urls.ts
└── lib/
    ├── data-providers/ # types, mock/manual/365scores, registry, normalizers
    ├── prediction/     # motor de probabilidades/edge/props + intelligence.ts
    ├── data-access.ts  # view models para API y server components
    └── format.ts       # helpers de formato deterministas
scripts/                # ingest-365scores.ts, normalize-snapshots.ts, postbuild
data/snapshots/         # manual/ y 365scores/{raw,normalized}/<entidad>/
```
