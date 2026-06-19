/* =====================================================================
 * Utilidades del pipeline de datos del Mundial 2026.
 *
 * REGLAS (compartidas por todos los scripts):
 *  - Nunca inventar datos. Si un stat no existe → null, no 0.
 *  - Guardar sourceUrl y collectedAt por cada dato/bloque.
 *  - Si una fuente falla, registrar el error y CONTINUAR con las demás.
 *  - Solo JSON locales (sin base de datos).
 *
 * Salidas en data/worldcup-2026/. sources-log.json y errors.json se mergean
 * por `script` (idempotente: re-correr un script reemplaza sus entradas).
 * ===================================================================== */

import { promises as fs } from "node:fs";
import path from "node:path";

export const OUT_DIR = path.resolve(process.cwd(), "data", "worldcup-2026");
const SOURCES_LOG = "sources-log.json";
const ERRORS_LOG = "errors.json";

export function nowIso(): string {
  return new Date().toISOString();
}

export async function ensureOutDir(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
}

export async function writeJson(filename: string, data: unknown): Promise<void> {
  await ensureOutDir();
  await fs.writeFile(path.join(OUT_DIR, filename), JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function readJsonSafe<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(OUT_DIR, filename), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface SourceLogEntry {
  script: string;
  source: string;
  sourceUrl: string | null;
  status: "ok" | "fallback" | "unavailable" | "skipped";
  records: number | null;
  collectedAt: string;
  note?: string;
}

export interface ErrorLogEntry {
  script: string;
  source: string;
  sourceUrl: string | null;
  message: string;
  collectedAt: string;
}

async function mergeByScript<T extends { script: string }>(
  filename: string,
  script: string,
  entries: T[],
): Promise<void> {
  const existing = await readJsonSafe<T[]>(filename, []);
  const kept = existing.filter((e) => e.script !== script);
  await writeJson(filename, [...kept, ...entries]);
}

export async function logSources(script: string, entries: SourceLogEntry[]): Promise<void> {
  await mergeByScript(SOURCES_LOG, script, entries);
}

export async function logErrors(script: string, entries: ErrorLogEntry[]): Promise<void> {
  await mergeByScript(ERRORS_LOG, script, entries);
}

/** Fetch best-effort con timeout. Nunca lanza: devuelve un resultado tipado. */
export async function tryFetchText(
  url: string,
  timeoutMs = 12000,
): Promise<{ ok: true; status: number; text: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "user-agent": "wc2026-pipeline" } });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, status: res.status, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

/** Imprime un resumen estándar al final de cada script. */
export function summarize(script: string, lines: string[]): void {
  // eslint-disable-next-line no-console
  console.log(`\n[${script}]\n  ${lines.join("\n  ")}\n`);
}
