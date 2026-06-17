import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-base-950">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
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
