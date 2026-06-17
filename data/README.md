# /data/snapshots

Snapshots de datos que la app puede leer mediante la capa de providers.
La app **funciona sin nada de esto** (usa mock data por defecto).

## Estructura

```
data/snapshots/
├── manual/                       # snapshots manuales (DATA_PROVIDER=manual)
│   └── *.json
└── 365scores/
    ├── raw/                      # HTML/JSON crudo descargado (no versionado)
    └── normalized/               # snapshots normalizados (DATA_PROVIDER=365scores)
        └── *.json
```

## Snapshot manual (formato)

Un archivo JSON en `manual/` puede traer cualquiera de estas listas
(todas opcionales). Se superponen sobre el mock manteniendo la UI completa:

```json
{
  "id": "mi-snapshot",
  "capturedAt": "2026-06-17T08:00:00.000Z",
  "origin": "captura manual",
  "teams": [],
  "matches": [],
  "players": [],
  "opportunities": []
}
```

Activa este origen con `DATA_PROVIDER=manual` en tu `.env.local`.

## Snapshots 365Scores (experimental)

Se generan con `npm run ingest:365` (manual, con rate limit y cache).
- `raw/` guarda el contenido crudo con timestamp y URL de origen.
- `normalized/` guarda el resultado normalizado que lee la app.

Actívalos con `DATA_PROVIDER=365scores` y `ENABLE_365_EXPERIMENTAL=true`.
Si no hay snapshots o algo falla, la app vuelve a mock automáticamente.
