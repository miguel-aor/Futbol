import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway-compatible standalone output: produces .next/standalone/server.js
  output: "standalone",
  // Fija la raiz de tracing al directorio del proyecto. Sin esto, si existe
  // un lockfile en un directorio padre, Next anida server.js en subcarpetas
  // y `node .next/standalone/server.js` no lo encuentra.
  outputFileTracingRoot: process.cwd(),
  // El scraping experimental NUNCA corre en build. Solo via scripts manuales.
  reactStrictMode: true,
  eslint: {
    // El build de Railway no debe romperse por warnings de lint.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
