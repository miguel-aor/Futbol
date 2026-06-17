/* =====================================================================
 * Ingesta EXPERIMENTAL de 365Scores. MANUAL: `npm run ingest:365`.
 *
 * REGLAS (criticas, ver README):
 *  - No scraping agresivo, sin proxies, sin evadir captchas/bloqueos.
 *  - Rate limit entre requests + cache local.
 *  - Guarda timestamp de extraccion y fuente.
 *  - Si una URL falla, registra el error y CONTINUA con las demas.
 *  - Nunca corre en build ni en cada request del usuario.
 *  - Guarda raw en /data/snapshots/365scores/raw y normalizado en
 *    /data/snapshots/365scores/normalized. La app LEE esos snapshots.
 *
 * NOTA: 365Scores es muy dinamico. Este script crea el PIPELINE completo
 * (fetch -> raw -> extraccion de candidatos JSON -> normalizacion ->
 * snapshot). El parsing fino de cada pagina queda marcado como TODO en
 * los normalizadores, porque su estructura no esta garantizada.
 * ===================================================================== */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INGEST_CONFIG, SOURCE_URLS, type SourceUrl } from "../src/data/source-urls";
import {
  extractJsonCandidatesFromHtml,
  normalizeMatch,
  normalizeTeam,
} from "../src/lib/data-providers/normalizers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data", "snapshots", "365scores", "raw");
const NORM_DIR = path.join(ROOT, "data", "snapshots", "365scores", "normalized");

interface UrlResult {
  id: string;
  url: string;
  ok: boolean;
  fromCache: boolean;
  rawFile?: string;
  normalizedFile?: string;
  warnings: string[];
  error?: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIso() {
  return new Date().toISOString();
}

async function ensureDirs() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(NORM_DIR, { recursive: true });
}

/** Devuelve true si existe un raw reciente dentro del TTL de cache. */
async function freshCache(rawFile: string): Promise<boolean> {
  try {
    const stat = await fs.stat(rawFile);
    return Date.now() - stat.mtimeMs < INGEST_CONFIG.cacheTtlMs;
  } catch {
    return false;
  }
}

async function fetchPublic(url: string): Promise<{ body: string; contentType: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INGEST_CONFIG.requestTimeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": INGEST_CONFIG.userAgent,
        Accept: "text/html,application/json,application/xhtml+xml",
        "Accept-Language": "es,en;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    return { body, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

async function processUrl(src: SourceUrl): Promise<UrlResult> {
  const result: UrlResult = { id: src.id, url: src.url, ok: false, fromCache: false, warnings: [] };
  const rawFile = path.join(RAW_DIR, `${src.id}.raw.json`);
  const normFile = path.join(NORM_DIR, `${src.id}.json`);
  const capturedAt = nowIso();

  let body: string | null = null;
  let contentType = "";

  try {
    if (await freshCache(rawFile)) {
      const cached = JSON.parse(await fs.readFile(rawFile, "utf8"));
      body = cached.body ?? "";
      contentType = cached.contentType ?? "";
      result.fromCache = true;
      result.warnings.push("Usando raw en cache (dentro del TTL).");
    } else {
      const fetched = await fetchPublic(src.url);
      body = fetched.body;
      contentType = fetched.contentType;
      // Guardar raw con metadata de trazabilidad.
      await fs.writeFile(
        rawFile,
        JSON.stringify({ id: src.id, url: src.url, capturedAt, contentType, body }, null, 2),
        "utf8",
      );
      result.rawFile = path.relative(ROOT, rawFile);
    }
  } catch (err) {
    result.error = `No se pudo obtener la pagina: ${(err as Error).message}`;
    result.warnings.push("Se omite la normalizacion porque no hay contenido.");
    return result; // No rompe: el caller sigue con las demas URLs.
  }

  // --- Extraccion y normalizacion (best-effort) ---
  try {
    const ctx = { source: "365scores" as const, capturedAt, origin: src.url };
    const teams: unknown[] = [];
    const matches: unknown[] = [];

    if (body) {
      const isJson = contentType.includes("application/json") || body.trim().startsWith("{");
      const candidates = isJson ? safeParseArray(body) : extractJsonCandidatesFromHtml(body);

      if (candidates.length === 0) {
        result.warnings.push(
          "No se encontraron bloques JSON utilizables. Estructura dinamica: conectar parsing real en normalizers.ts (TODO).",
        );
      }

      // TODO: navegar `candidates` con la estructura real confirmada de
      // 365Scores y empujar a `teams`/`matches`. Por ahora solo se intenta
      // normalizar objetos que ya parezcan equipos/partidos sueltos.
      for (const c of candidates) {
        const t = normalizeTeam(c, ctx);
        if (t.ok && t.data) teams.push(t.data);
        const m = normalizeMatch(c, ctx);
        if (m.ok && m.data) matches.push(m.data);
        result.warnings.push(...t.warnings, ...m.warnings);
      }
    }

    const snapshot = {
      id: src.id,
      source: "365scores",
      kind: src.kind,
      origin: src.url,
      capturedAt,
      counts: { teams: teams.length, matches: matches.length, players: 0, opportunities: 0 },
      teams,
      matches,
      note:
        "Snapshot experimental. Si teams/matches estan vacios, el parsing real de 365Scores aun no esta conectado (ver TODO en normalizers.ts). La app sigue funcionando con mock data.",
    };
    await fs.writeFile(normFile, JSON.stringify(snapshot, null, 2), "utf8");
    result.normalizedFile = path.relative(ROOT, normFile);
    result.ok = true;
  } catch (err) {
    result.error = `Error normalizando: ${(err as Error).message}`;
  }

  return result;
}

function safeParseArray(text: string): unknown[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Ingesta experimental 365Scores ===");
  console.log(`URLs configuradas: ${SOURCE_URLS.length} (editar en src/data/source-urls.ts)`);
  console.log(`Rate limit: ${INGEST_CONFIG.minDelayMs}ms entre requests · cache TTL ${INGEST_CONFIG.cacheTtlMs}ms\n`);

  await ensureDirs();

  const results: UrlResult[] = [];
  for (let i = 0; i < SOURCE_URLS.length; i++) {
    const src = SOURCE_URLS[i];
    console.log(`→ [${i + 1}/${SOURCE_URLS.length}] ${src.id} :: ${src.url}`);
    const result = await processUrl(src);
    results.push(result);

    if (result.ok) console.log(`   ✓ ${result.fromCache ? "(cache) " : ""}normalizado: ${result.normalizedFile}`);
    else console.log(`   ✗ ${result.error}`);
    for (const w of result.warnings) console.log(`     · ${w}`);

    // Rate limit (solo si hubo request real y quedan URLs).
    if (!result.fromCache && i < SOURCE_URLS.length - 1) {
      await sleep(INGEST_CONFIG.minDelayMs);
    }
  }

  // --- Resumen final ---
  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const generated = results.flatMap((r) => [r.rawFile, r.normalizedFile].filter(Boolean));
  const warnings = results.flatMap((r) => r.warnings);

  console.log("\n=== Resumen ===");
  console.log(`URLs procesadas : ${results.length}`);
  console.log(`Exitosas        : ${ok.length}`);
  console.log(`Fallidas        : ${failed.length}`);
  console.log(`Archivos generados: ${generated.length}`);
  generated.forEach((f) => console.log(`   - ${f}`));
  console.log(`Advertencias    : ${warnings.length}`);
  if (failed.length > 0) {
    console.log("\nFallos (no fatales):");
    failed.forEach((f) => console.log(`   - ${f.id}: ${f.error}`));
  }
  console.log(
    "\nNota: la ingesta es experimental. La app NO depende de estos datos y sigue funcionando con mock.",
  );
  // Salida 0 SIEMPRE: el script no debe romper aunque fallen URLs.
  process.exit(0);
}

main().catch((err) => {
  // Incluso ante un error inesperado, no romper deploy/CI con codigo != 0.
  console.error("Error inesperado en la ingesta (continuando sin romper):", err);
  process.exit(0);
});
