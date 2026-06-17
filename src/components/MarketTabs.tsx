"use client";

import { useState, type ReactNode } from "react";

export interface MarketTab {
  key: string;
  label: string;
  content: ReactNode;
}

export function MarketTabs({ tabs }: { tabs: MarketTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-base-700/60 bg-base-900/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active === t.key ? "bg-base-700 text-slate-100" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
