// =====================================================================
// Proveedor EXPERIMENTAL de 365Scores.
//
// REGLAS (criticas):
//  - NUNCA hace llamadas en vivo a 365Scores. Solo LEE snapshots
//    normalizados ya generados por `npm run ingest:365`.
//  - No es obligatorio: si no hay snapshots o ENABLE_365_EXPERIMENTAL no
//    esta activo, se reporta como NO disponible y el registry usa mock.
//  - Si algo falla, no rompe la app.
// =====================================================================
import "server-only";
import type {
  DataBundle,
  DataProvider,
  DataSnapshot,
  Match,
  ProviderMetadata,
  Team,
} from "./types";
import { buildMockBundle } from "@/data/mock-builder";
import {
  SCORES_NORMALIZED_DIR,
  listJsonFiles,
  readJsonFile,
  readSnapshotIndex,
} from "./snapshots";

interface ScoresNormalizedSnapshot {
  id?: string;
  capturedAt?: string;
  origin?: string;
  teams?: Team[];
  matches?: Match[];
}

function enabled(): boolean {
  return process.env.ENABLE_365_EXPERIMENTAL === "true";
}

async function loadNormalized(): Promise<ScoresNormalizedSnapshot[]> {
  const files = await listJsonFiles(SCORES_NORMALIZED_DIR);
  const out: ScoresNormalizedSnapshot[] = [];
  for (const file of files) {
    const data = await readJsonFile<ScoresNormalizedSnapshot>(file);
    if (data) out.push(data);
  }
  return out;
}

export const scores365ExperimentalProvider: DataProvider = {
  id: "365scores",

  async getMetadata(): Promise<ProviderMetadata> {
    const snaps = enabled() ? await loadNormalized() : [];
    const available = enabled() && snaps.length > 0;
    const lastUpdated = snaps.map((s) => s.capturedAt).filter(Boolean).sort().pop() ?? null;
    return {
      id: "365scores",
      label: "Snapshot 365Scores (experimental)",
      description: enabled()
        ? "Lee snapshots normalizados generados con npm run ingest:365."
        : "Deshabilitado (ENABLE_365_EXPERIMENTAL=false).",
      available,
      lastUpdated,
    };
  },

  async getBundle(): Promise<DataBundle> {
    const base = buildMockBundle();
    if (!enabled()) return base;
    const snaps = await loadNormalized();
    if (snaps.length === 0) return base;

    const teams = new Map(base.teams.map((t) => [t.id, t]));
    const matches = new Map(base.matches.map((m) => [m.id, m]));
    for (const s of snaps) {
      s.teams?.forEach((t) => teams.set(t.id, { ...t, source: "365scores" }));
      s.matches?.forEach((m) => matches.set(m.id, { ...m, source: "365scores" }));
    }

    return {
      ...base,
      meta: {
        id: "365scores",
        label: "Snapshot 365Scores (experimental)",
        description: "Mock + overlay de snapshots normalizados de 365Scores.",
        available: true,
        lastUpdated: snaps.map((s) => s.capturedAt).filter(Boolean).sort().pop() ?? base.meta.lastUpdated,
      },
      teams: [...teams.values()],
      matches: [...matches.values()],
    };
  },

  async listSnapshots(): Promise<DataSnapshot[]> {
    if (!enabled()) return [];
    return readSnapshotIndex(SCORES_NORMALIZED_DIR, "365scores");
  },
};
