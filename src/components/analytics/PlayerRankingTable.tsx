"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => ReactNode;
}

/** Tabla genérica, limpia y responsiva, para rankings de jugadores/equipos. */
export function PlayerRankingTable<T>({
  columns,
  rows,
  rowKey,
  highlightTop = 0,
  emptyMessage = "Sin resultados para los filtros actuales.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  highlightTop?: number;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm text-wc-muted">
        {emptyMessage}
      </div>
    );
  }
  const alignCls = { left: "text-left", right: "text-right", center: "text-center" };
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-wc-muted ${
                  alignCls[c.align ?? "left"]
                }`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row, i)}
              className={`border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.03] ${
                i < highlightTop ? "bg-wc-gold/[0.06]" : ""
              }`}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`px-3 py-2.5 text-wc-text tabular-nums ${alignCls[c.align ?? "left"]}`}
                >
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
