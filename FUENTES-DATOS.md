# Fuentes de datos — Mundial 2026 (cómo conseguir y verificar)

> Guía reproducible de **de dónde** salen los datos reales del proyecto y
> **cómo** obtenerlos otra vez. Última actualización: **19 jun 2026**.
>
> Principios (no negociables):
> 1. **Nunca inventar.** Si un dato no se confirma → `null` (nunca `0`).
> 2. **Verificar en ≥2 fuentes** antes de marcar algo como real.
> 3. Cada dato guarda **`source` + `sourceUrl` + `collectedAt`**.
> 4. **No afirmar que viene de 365Scores** si no se verificó ahí.
> 5. Lo no verificado se marca **"Demo data"** o **"Pending verification"**.

---

## 1. Flujo general para conseguir resultados/stats de un partido

Herramientas usadas: **WebSearch** (buscar) → **WebFetch** (extraer de una URL con
un prompt). Pasos:

1. **Buscar** el partido con términos de stats, p. ej.:
   `"Canada 6-0 Qatar 2026 World Cup match stats shots on target assists"`.
2. De los resultados, **priorizar Opta Analyst y Wikipedia** (las que dan datos
   estructurados). Quedarse con sus URLs.
3. **Fetch** de esas URLs con un prompt específico pidiendo: marcador, goleadores
   **con minuto y asistente**, tarjetas, y **totales de equipo** (posesión, tiros,
   tiros a puerta, xG, corners, faltas).
4. **Cruzar** Opta vs Wikipedia vs Sky/ESPN. Si discrepan (p. ej. 32 vs 33 tiros),
   usar Opta y, ante duda real, dejar `null`.
5. **Codificar** en el repo con procedencia (ver §5) y **regenerar** el pipeline.

> Ejemplo real de prompt de fetch que funcionó:
> *"Extract detailed stats for Canada 6-0 Qatar. Give: (1) team totals for both
> sides — possession %, total shots, shots on target, xG, corners, fouls. (2) For
> each goal, the scorer and the ASSIST provider if mentioned. (3) Any individual
> player stat lines. List names exactly."*

---

## 2. Fuentes que SÍ funcionaron

### Opta Analyst — `theanalyst.com` ⭐ (la mejor para stats)
- **Qué da:** totales de equipo (posesión, tiros, tiros a puerta, **xG**), goles
  **con asistente**, ocasiones creadas, toques, pases al último tercio.
- **Cómo:** `WebFetch` directo al artículo del partido. Patrón de URL:
  `https://theanalyst.com/articles/<local>-vs-<visita>-stats-world-cup-2026[-live]`
- **Ejemplos usados (J2 grupos A/B):**
  - https://theanalyst.com/articles/canada-vs-qatar-stats-world-cup-2026-live
  - https://theanalyst.com/articles/switzerland-vs-bosnia-herzegovina-stats-world-cup-2026-live
  - https://theanalyst.com/articles/mexico-vs-south-korea-stats-world-cup-2026-live
  - https://theanalyst.com/articles/czechia-vs-south-africa-stats-world-cup-2026
- **Fiabilidad:** alta para totales de equipo y asistencias. **No** publica la tabla
  de tiros **por jugador** tan temprano.

### Wikipedia — páginas de grupo y de partido ⭐ (la mejor para goleadores/tarjetas)
- **Qué da:** marcador exacto, **goleadores con minuto** (penal/autogol), **tarjetas
  (amarilla/roja) con jugador y minuto**, sede, asistencia. A veces totales de
  equipo en la caja de stats.
- **Cómo:** `WebFetch` a la página del grupo (trae las 6 cajas de partido).
  - https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_A
  - https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_Group_B
  - (patrón: `..._Group_<A..L>`)
- **Fiabilidad:** alta para goles/tarjetas; estructura estable y fácil de parsear.

### ESPN — `espn.com/soccer/match/_/gameId/<id>`
- **Qué da:** marcador final, a veces "Match Stats" de equipo. Útil para **corroborar**.
- **Cómo:** aparece en WebSearch; el `gameId` cambia por partido (p. ej. Canada-Qatar
  = `760440`, Mexico-Korea = `760441`).
- **Fiabilidad:** alta para marcador; stats variables.

### Sky Sports / World Soccer Talk / FIFA.com — corroboración y standings
- **Qué da:** crónicas, standings actualizados, confirmación de marcadores y
  jugadas clave. Se usaron para **verificación cruzada**, no como fuente única.
- **Cómo:** WebSearch de `"<equipos> 2026 World Cup standings/result"`.

### openfootball — `github.com/openfootball` (calendario/equipos)
- **Qué da:** calendario y grupos en JSON/TXT abierto.
- **Cómo:** lo intenta `scripts/sync-openfootball-worldcup.ts` por `raw.githubusercontent.com`.
  Si el remoto no está, **cae al snapshot en repo** (`src/data/worldcup-fixtures.ts`).
- **Fiabilidad:** media; cobertura de 2026 puede ir por detrás → por eso el fallback.

### martj42/international_results — `github.com/martj42/international_results`
- **Qué da:** CSV histórico de TODOS los partidos internacionales (para Elo/baseline).
- **Cómo:** `scripts/build-team-elo-history.ts` baja
  `https://raw.githubusercontent.com/martj42/international_results/master/results.csv`.
  **Este sí respondió** en las pruebas (parsing fino pendiente; hoy se usa baseline
  por ranking + ajuste por Mundial).
- **Fiabilidad:** alta (histórico verificado).

### FOX Sports — tablas de stats por jugador (sólo J1, manual)
- **Qué da:** las tablas **por jugador** de tiros/tiros a puerta/faltas de la J1
  (origen de esos leaderboards en `src/data/tournament-stats.ts`).
- **Cómo:** captura/lectura manual de sus tablas de stats.
- **Fiabilidad:** alta, pero **no automatizable fácil** (tabla interactiva).

---

## 3. Fuentes que NO funcionaron / no disponibles

| Fuente | Estado | Motivo |
| --- | --- | --- |
| **365Scores** | ❌ no usado | Sin API pública verificada; el proyecto no la asume. No se marca ningún dato como 365Scores sin verificar. |
| **PlayerStats.Football** | ❌ sin datos | Sin endpoint público/credenciales (`PLAYERSTATS_FOOTBALL_BASE`). Script listo, escribe `[]` y registra el faltante. |
| **Tiros/entradas por jugador (J2)** | ⚠️ no publicado | Opta/prensa sólo dan **totales de equipo** + "ocasiones creadas" tan temprano. Esos leaderboards siguen en J1. |
| FotMob / Sofascore | ⚠️ difícil | Render por JS / bloqueos; no se pudo extraer de forma confiable. |

---

## 4. Cómo reproducir el pipeline (scripts → JSON → API)

```bash
npm run wc:sync      # calendario/equipos → matches.json, jornada1.matches.json
npm run wc:playerstats  # PlayerStats.Football (hoy vacío, registrado)
npm run wc:365       # validación 365Scores (hoy no disponible)
npm run wc:elo       # baseline Elo (martj42 + ranking) → team-form-features.json
npm run wc:form      # forma del Mundial → team-current-tournament-form.json
npm run wc:features  # mezcla ponderada → prediction-features.json
npm run wc:props     # props por jugador (depende de playerstats)
npm run wc:events    # goles/tarjetas/stats de equipo → match-events.json
npm run wc:validate  # coherencia → errors.json + sources-log.json
# todo junto:
npm run wc:build
```

La **UI lee solo la API interna** `/api/worldcup-2026/<dataset>` con datasets:
`matches`, `team-current-tournament-form`, `prediction-features`, `match-events`,
`matchup?home=&away=`.

---

## 5. Dónde se codifica cada cosa (con procedencia)

| Dato | Archivo | source / nota |
| --- | --- | --- |
| Calendario + marcadores reales | `src/data/worldcup-fixtures.ts` | Snapshot público (Wikipedia/ESPN/Sky); J1 + J2 grupos A/B |
| Goles, tarjetas, asistencias, **stats de equipo** por partido | `src/data/worldcup2026Events.ts` | Opta Analyst / Wikipedia, con `source`/`sourceUrl`/`collectedAt` |
| Leaderboards (goleadores/asistencias/tiros…) | `src/data/tournament-stats.ts` | J1 (FOX/FIFA/ESPN); goleadores y asistencias ya con J2 A/B (Opta) |
| Forma en el Mundial (derivado) | `src/lib/worldcup-2026/tournament-form.ts` | Calculado desde fixtures; stats sin fuente = `null` |
| Logs de procedencia (máquina) | `data/worldcup-2026/sources-log.json`, `errors.json` | Generados por los scripts (qué fuente respondió/falló) |

> **Regla de oro al añadir datos nuevos:** rellenar `source`, `sourceUrl` y
> `collectedAt`; dejar `null` lo no confirmado; verificar en ≥2 fuentes; y
> re-correr `npm run wc:build` para propagar a la API y la UI.

---

## 6. Checklist para la próxima jornada

- [ ] WebSearch de cada partido nuevo (`"<A> vs <B> 2026 World Cup stats assists"`).
- [ ] WebFetch a **Opta Analyst** (totales + asistencias) y **Wikipedia** (goles/tarjetas).
- [ ] Cruzar con ESPN/Sky. Discrepancia sin resolver → `null`.
- [ ] Cargar marcadores en `worldcup-fixtures.ts` y eventos en `worldcup2026Events.ts`.
- [ ] Actualizar leaderboards en `tournament-stats.ts` (sólo lo verificado).
- [ ] `npm run wc:build` → revisar `sources-log.json` / `errors.json`.
- [ ] `npx tsc --noEmit && npm run lint && npm run build` en verde.
