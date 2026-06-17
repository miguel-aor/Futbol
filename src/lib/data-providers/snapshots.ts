// Utilidades de lectura de snapshots persistidos en /data/snapshots.
// Solo servidor. Tolerante a ausencia de archivos: nunca lanza por
// "no existe", para que la app siga funcionando con mock data.
import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DataSnapshot, DataSource } from "./types";

export const DATA_ROOT = path.join(process.cwd(), "data", "snapshots");
export const MANUAL_DIR = path.join(DATA_ROOT, "manual");
export const SCORES_RAW_DIR = path.join(DATA_ROOT, "365scores", "raw");
export const SCORES_NORMALIZED_DIR = path.join(DATA_ROOT, "365scores", "normalized");

export async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

export async function listJsonFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

/** Lee los metadatos de todos los snapshots de un directorio. */
export async function readSnapshotIndex(dir: string, source: DataSource): Promise<DataSnapshot[]> {
  const files = await listJsonFiles(dir);
  const snapshots: DataSnapshot[] = [];
  for (const file of files) {
    const data = await readJsonFile<Partial<DataSnapshot> & { capturedAt?: string }>(file);
    if (!data) continue;
    snapshots.push({
      id: data.id ?? path.basename(file, ".json"),
      source,
      capturedAt: data.capturedAt ?? "desconocido",
      origin: data.origin ?? file,
      counts: {
        teams: data.counts?.teams ?? 0,
        matches: data.counts?.matches ?? 0,
        players: data.counts?.players ?? 0,
        opportunities: data.counts?.opportunities ?? 0,
      },
    });
  }
  return snapshots;
}
