"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { computeSlipSummary, selectionToSlipPick } from "@/lib/bet/buildPicks";
import type { BetSelection, BetSlipPick, BetSlipSummary } from "@/lib/bet/types";

interface BetSlipContextValue {
  picks: BetSlipPick[];
  summary: BetSlipSummary;
  add: (selection: BetSelection) => void;
  addPick: (pick: BetSlipPick) => void;
  remove: (pickId: string) => void;
  clear: () => void;
  has: (selectionId: string) => boolean;
}

const BetSlipContext = createContext<BetSlipContextValue | null>(null);

export function useBetSlip(): BetSlipContextValue {
  const ctx = useContext(BetSlipContext);
  if (!ctx) throw new Error("useBetSlip debe usarse dentro de <BetSlipProvider>");
  return ctx;
}

const STORAGE_KEY = "bet-slip-picks";

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<BetSlipPick[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setPicks(JSON.parse(raw) as BetSlipPick[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
    } catch {
      /* ignore */
    }
  }, [picks]);

  const add = (selection: BetSelection) =>
    setPicks((prev) =>
      prev.some((p) => p.selectionId === selection.id)
        ? prev
        : [...prev, selectionToSlipPick(selection)],
    );
  const addPick = (pick: BetSlipPick) =>
    setPicks((prev) => (prev.some((p) => p.selectionId === pick.selectionId) ? prev : [...prev, pick]));
  const remove = (pickId: string) => setPicks((prev) => prev.filter((p) => p.id !== pickId));
  const clear = () => setPicks([]);
  const has = (selectionId: string) => picks.some((p) => p.selectionId === selectionId);

  const summary = computeSlipSummary(picks);

  return (
    <BetSlipContext.Provider value={{ picks, summary, add, addPick, remove, clear, has }}>
      {children}
    </BetSlipContext.Provider>
  );
}
