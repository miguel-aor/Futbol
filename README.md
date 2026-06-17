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

## Mock data

Por defecto `DATA_PROVIDER=mock`. Todo el dataset (48 selecciones, 12 grupos,
partidos de grupo + internacionales, jugadores, picks) se genera de forma
**determinista** en `src/data/` a partir de `src/data/worldcup-teams.ts` (la
fuente central de selecciones). No requiere internet ni variables de entorno.

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
Como 365Scores es muy dinámico, el script deja el **pipeline completo** listo y el
parsing fino marcado como `TODO` en `src/lib/data-providers/normalizers.ts`. Si no
se puede extraer todo, **la app sigue funcionando con mock data**.

Resumen final del script: URLs procesadas, exitosas, fallidas, archivos generados
y advertencias.

## API interna (Route Handlers)

`GET /api/health`, `/api/data-source`, `/api/matches`, `/api/matches/[id]`,
`/api/worldcup`, `/api/teams`, `/api/teams/[id]`, `/api/opportunities`,
`/api/players`, `/api/players/[id]`, `/api/player-props?playerId=...`,
`/api/snapshots`. Todos consumen la capa de providers.

## Páginas

`/` (landing), `/dashboard`, `/worldcup`, `/matches/[id]`, `/teams`,
`/teams/[id]`, `/players`, `/players/[id]`, `/methodology`.

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
├── components/         # UI (cards, tablas, badges, filtros, shell)
├── data/               # mock data + worldcup-teams.ts + source-urls.ts
└── lib/
    ├── data-providers/ # types, mock/manual/365scores, registry, normalizers
    ├── prediction/     # motor de probabilidades/edge/props
    ├── data-access.ts  # view models para API y server components
    └── format.ts       # helpers de formato deterministas
scripts/                # ingest-365scores.ts, normalize-snapshots.ts, postbuild
data/snapshots/         # manual/ y 365scores/{raw,normalized}
```
