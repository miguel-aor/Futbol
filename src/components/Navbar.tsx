"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BallIcon, CloseIcon, MenuIcon } from "./icons";
import { useBetSlip } from "./bet/BetSlipProvider";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/partidos", label: "Partidos" },
  { href: "/picks", label: "Value Picks" },
  { href: "/bet-builder", label: "Bet Builder" },
  { href: "/methodology", label: "Metodología" },
];

// Secundario: el análisis estadístico profundo (motor interno) queda aquí,
// fuera del flujo principal de picks.
const RESEARCH = [
  { href: "/importar", label: "Importar momios" },
  { href: "/analytics", label: "Analytics (modelos)" },
  { href: "/worldcup", label: "Mundial 2026" },
  { href: "/stats", label: "Estadísticas" },
  { href: "/teams", label: "Selecciones" },
  { href: "/players", label: "Jugadores" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [research, setResearch] = useState(false);
  const { picks } = useBetSlip();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-base-800 bg-base-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <BallIcon className="h-6 w-6 text-brand-400" />
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Value<span className="text-brand-400">·</span>Picks
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href) ? "bg-base-800 text-brand-400" : "text-slate-400 hover:bg-base-850 hover:text-slate-200"
              }`}
            >
              {l.label}
            </Link>
          ))}

          {/* Research (secundario): click para abrir, click fuera para cerrar. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setResearch((v) => !v)}
              aria-expanded={research}
              aria-haspopup="menu"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                research ? "bg-base-800 text-slate-100" : "text-slate-400 hover:bg-base-850 hover:text-slate-200"
              }`}
            >
              Research ▾
            </button>
            {research ? (
              <>
                {/* Backdrop: cierra solo al hacer clic fuera (no al mover el mouse). */}
                <button
                  type="button"
                  aria-label="Cerrar menú Research"
                  tabIndex={-1}
                  onClick={() => setResearch(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div role="menu" className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-base-700 bg-base-900 p-1.5 shadow-wc-card">
                  {RESEARCH.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      onClick={() => setResearch(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-base-800 hover:text-slate-100"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Ticket */}
          <Link
            href="/bet-builder"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-wc-gold/30 bg-wc-gold/10 px-3 py-1.5 text-sm font-semibold text-wc-gold hover:bg-wc-gold/20"
          >
            Ticket
            {picks.length > 0 ? (
              <span className="rounded-full bg-wc-gold/30 px-1.5 text-xs tabular-nums">{picks.length}</span>
            ) : null}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-base-700 p-2 text-slate-300 transition-colors hover:bg-base-850 md:hidden"
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-base-800 px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(l.href) ? "bg-base-800 text-brand-400" : "text-slate-300"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-1 border-t border-base-800 pt-1">
            <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-slate-500">Research</div>
            {RESEARCH.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
