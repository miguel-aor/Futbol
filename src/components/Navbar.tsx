"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/worldcup", label: "Mundial" },
  { href: "/teams", label: "Selecciones" },
  { href: "/players", label: "Jugadores" },
  { href: "/methodology", label: "Metodologia" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-base-800 bg-base-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Futbol<span className="text-brand-400">·</span>
          </span>
          <span className="hidden rounded bg-base-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
            Mundial 2026
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "bg-base-800 text-brand-400"
                  : "text-slate-400 hover:bg-base-850 hover:text-slate-200"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-base-700 p-2 text-slate-300 md:hidden"
          aria-label="Menu"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
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
        </nav>
      ) : null}
    </header>
  );
}
