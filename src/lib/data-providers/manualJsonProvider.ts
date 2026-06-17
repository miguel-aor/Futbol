// Proveedor manual: carga snapshots JSON guardados a mano en
// /data/snapshots/manual. Permite pegar/importar datos sin depender de
// ninguna API en vivo. Si no hay snapshots, no esta "available" y el
// registry hace fallback a mock.
import "server-only";
import type {
  DataBundle,
  DataProvider,
  DataSnapshot,
  Match,
  Opportunity,
  Player,
  ProviderMetadata,
  Team,
} from "./types";
import { buildMockBundle } from "@/data/mock-builder";
import { MANUAL_DIR, listJsonFiles, readJsonFile, readSnapshotIndex } from "./snapshots";

/** Estructura esperada de un snapshot manual (todo opcional). */
interface ManualSnapshot {
  id?: string;
  capturedAt?: string;
  origin?: string;
  teams?: Team[];
  matches?: Match[];
  players?: Player[];
  opportunities?: Opportunity[];
}

async function loadSnapshots(): Promise<ManualSnapshot[]> {
  const files = await listJsonFiles(MANUAL_DIR);
  const out: ManualSnapshot[] = [];
  for (const file of files) {
    const data = await readJsonFile<ManualSnapshot>(file);
    if (data) out.push(data);
  }
  return out;
}

export const manualJsonProvider: DataProvider = {
  id: "manual",

  async getMetadata(): Promise<ProviderMetadata> {
    const snaps = await loadSnapshots();
    const available = snaps.length > 0;
    const lastUpdated = snaps
      .map((s) => s.capturedAt)
      .filter(Boolean)
      .sort()
      .pop() ?? null;
    return {
      id: "manual",
      label: "Snapshot manual",
      description: "Datos cargados manualmente desde /data/snapshots/manual.",
      available,
      lastUpdated,
    };
  },

  async getBundle(): Promise<DataBundle> {
    // Base mock para mantener la UI completa; se superponen entidades
    // provenientes de snapshots manuales (marcadas como source "manual").
    const base = buildMockBundle();
    const snaps = await loadSnapshots();
    if (snaps.length === 0) return base;

    const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));
    const teams = byId(base.teams);
    const matches = byId(base.matches);
    const players = byId(base.players);
    const opportunities = byId(base.opportunities);

    for (const s of snaps) {
      s.teams?.forEach((t) => teams.set(t.id, { ...t, source: "manual" }));
      s.matches?.forEach((m) => matches.set(m.id, { ...m, source: "manual" }));
      s.players?.forEach((p) => players.set(p.id, { ...p, source: "manual" }));
      s.opportunities?.forEach((o) => opportunities.set(o.id, { ...o, source: "manual" }));
    }

    return {
      ...base,
      meta: {
        id: "manual",
        label: "Snapshot manual",
        description: "Mock + overlay de snapshots manuales.",
        available: true,
        lastUpdated: snaps.map((s) => s.capturedAt).filter(Boolean).sort().pop() ?? base.meta.lastUpdated,
      },
      teams: [...teams.values()],
      matches: [...matches.values()],
      players: [...players.values()],
      opportunities: [...opportunities.values()],
    };
  },

  async listSnapshots(): Promise<DataSnapshot[]> {
    return readSnapshotIndex(MANUAL_DIR, "manual");
  },
};
