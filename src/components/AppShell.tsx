import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { BetSlipProvider } from "./bet/BetSlipProvider";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-base-950">
      {/* Ambiente broadcast Mundial 2026 (dorado/morado/azul) en todo el sitio. */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-wc-radial" aria-hidden />
      {/* Skip link para usuarios de teclado (sitio con navbar densa). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-base-950"
      >
        Saltar al contenido
      </a>
      <BetSlipProvider>
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          {children}
        </main>
      </BetSlipProvider>
      <footer className="border-t border-base-800 px-4 py-6">
        <div className="mx-auto max-w-7xl text-xs text-slate-500">
          <p className="font-medium text-slate-400">
            Futbol · Prototipo interno de analisis del Mundial 2026
          </p>
          <p className="mt-1">
            Herramienta de analisis. No es consejo financiero ni una casa de apuestas. Sin enlaces a
            apuestas. Datos mock, snapshots manuales o recopilacion experimental.
          </p>
        </div>
      </footer>
    </div>
  );
}
