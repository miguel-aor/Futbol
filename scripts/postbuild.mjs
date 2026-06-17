// Postbuild para output: "standalone".
// Next.js NO copia automaticamente los assets estaticos ni /public dentro de
// .next/standalone, por lo que `node .next/standalone/server.js` serviria 404s.
// Este script los copia de forma multiplataforma (Windows local + Linux Railway).
import { cp, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyInto(src, destRel) {
  if (!(await exists(src))) {
    console.warn(`[postbuild] omitido (no existe): ${src}`);
    return;
  }
  const dest = path.join(standalone, destRel);
  await cp(src, dest, { recursive: true });
  console.log(`[postbuild] copiado ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
}

async function main() {
  if (!(await exists(standalone))) {
    console.warn("[postbuild] .next/standalone no existe; nada que copiar.");
    return;
  }
  await copyInto(path.join(root, "public"), "public");
  await copyInto(path.join(root, ".next", "static"), path.join(".next", "static"));
  console.log("[postbuild] listo. Inicia con: node .next/standalone/server.js");
}

main().catch((err) => {
  console.error("[postbuild] error:", err);
  process.exit(1);
});
