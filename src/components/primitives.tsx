import Link from "next/link";
import type { ReactNode } from "react";
import { InboxIcon } from "./icons";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "pos" | "mid" | "neg" | "brand";
}) {
  const accentCls = accent
    ? {
        pos: "text-edge-pos",
        mid: "text-edge-mid",
        neg: "text-edge-neg",
        brand: "text-brand-400",
      }[accent]
    : "text-slate-100";
  return (
    <div className="card p-4">
      <div className="label-dim">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accentCls}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, message, icon }: { title: string; message?: string; icon?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-base-800 text-slate-400">
        {icon ?? <InboxIcon className="h-6 w-6" />}
      </div>
      <div className="text-base font-semibold text-slate-200">{title}</div>
      {message ? <p className="max-w-sm text-sm text-slate-500">{message}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="card flex items-center justify-center gap-3 px-6 py-14 text-slate-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-600 border-t-brand-400" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="chip bg-base-700/60 text-slate-300">{children}</span>;
}

export function CardLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`card card-hover block ${className}`}>
      {children}
    </Link>
  );
}
