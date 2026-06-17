/* =====================================================================
 * Re-normaliza los snapshots RAW ya descargados (sin volver a la red).
 * Util para reprocesar cuando se mejora el parsing en normalizers.ts.
 *
 * MANUAL: `npm run normalize:data`. No hace requests. No rompe si no hay
 * archivos. Muestra resumen final.
 * ===================================================================== */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractJsonCandidatesFromHtml,
  normalizeMatch,
  normalizeTeam,
} from "../src/lib/data-providers/normalizers";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data", "snapshots", "365scores", "raw");
const NORM_DIR = path.join(ROOT, "data", "snapshots", "365scores", "normalized");

async function listRaw(): Promise<string[]> {
  try {
    const files = await fs.readdir(RAW_DIR);
    return files.filter((f) => f.endsWith(".raw.json")).map((f) => path.join(RAW_DIR, f));
  } catch {
    return [];
  }
}

async function main() {
  console.log("=== Re-normalizacion de snapshots 365Scores ===");
  await fs.mkdir(NORM_DIR, { recursive: true });

  const rawFiles = await listRaw();
  if (rawFiles.length === 0) {
    console.log("No hay snapshots raw en data/snapshots/365scores/raw.");
    console.log("Ejecuta primero: npm run ingest:365");
    process.exit(0);
  }

  let ok = 0;
  let failed = 0;
  const generated: string[] = [];
  let warnings = 0;

  for (const file of rawFiles) {
    try {
      const raw = JSON.parse(await fs.readFile(file, "utf8"));
      const id: string = raw.id ?? path.basename(file, ".raw.json");
      const capturedAt: string = raw.capturedAt ?? new Date().toISOString();
      const ctx = { source: "365scores" as const, capturedAt, origin: raw.url ?? id };

      const body: string = raw.body ?? "";
      const contentType: string = raw.contentType ?? "";
      const isJson = contentType.includes("application/json") || body.trim().startsWith("{");
      const candidates = isJson
        ? safeParseArray(body)
        : extractJsonCandidatesFromHtml(body);

      const teams: unknown[] = [];
      const matches: unknown[] = [];
      for (const c of candidates) {
        const t = normalizeTeam(c, ctx);
        if (t.ok && t.data) teams.push(t.data);
        const m = normalizeMatch(c, ctx);
        if (m.ok && m.data) matches.push(m.data);
        warnings += t.warnings.length + m.warnings.length;
      }

      const out = path.join(NORM_DIR, `${id}.json`);
      await fs.writeFile(
        out,
        JSON.stringify(
          {
            id,
            source: "365scores",
            origin: ctx.origin,
            capturedAt,
            counts: { teams: teams.length, matches: matches.length, players: 0, opportunities: 0 },
            teams,
            matches,
          },
          null,
          2,
        ),
        "utf8",
      );
      generated.push(path.relative(ROOT, out));
      ok++;
      console.log(`✓ ${id}: ${teams.length} equipos, ${matches.length} partidos`);
    } catch (err) {
      failed++;
      console.log(`✗ ${path.basename(file)}: ${(err as Error).message}`);
    }
  }

  console.log("\n=== Resumen ===");
  console.log(`Raw procesados : ${rawFiles.length}`);
  console.log(`Exitosos       : ${ok}`);
  console.log(`Fallidos       : ${failed}`);
  console.log(`Archivos generados: ${generated.length}`);
  console.log(`Advertencias   : ${warnings}`);
  process.exit(0);
}

function safeParseArray(text: string): unknown[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

main().catch((err) => {
  console.error("Error inesperado (continuando sin romper):", err);
  process.exit(0);
});
