"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { computeSlipSummary, selectionToSlipPick } from "@/lib/bet/buildPicks";
import { isBettableMatchId } from "@/lib/bet/bettable";
import type { BetSelection, BetSlipPick, BetSlipSummary } from "@/lib/bet/types";

interface BetSlipContextValue {
  picks: BetSlipPick[];
  summary: BetSlipSummary;
  add: (selection: BetSelection) => void;
  addPick: (pick: BetSlipPick) => void;
  remove: (pickId: string) => void;
  clear: () => void;
  has: (selectionId: string) => boolean;
  /** Aviso transitorio (p. ej. se quitaron picks de partidos finalizados). */
  notice: string | null;
  dismissNotice: () => void;
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
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as BetSlipPick[];
      // Limpia picks de partidos ya finalizados / no apostables.
      const bettable = stored.filter((p) => isBettableMatchId(p.matchId));
      setPicks(bettable);
      if (bettable.length < stored.length) setNotice("Se quitaron picks de partidos finalizados.");
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

  // No se permiten picks de partidos finalizados / no apostables.
  const add = (selection: BetSelection) => {
    if (!isBettableMatchId(selection.matchId)) {
      setNotice("Ese partido ya finalizó: no se puede agregar al ticket.");
      return;
    }
    setPicks((prev) =>
      prev.some((p) => p.selectionId === selection.id) ? prev : [...prev, selectionToSlipPick(selection)],
    );
  };
  const addPick = (pick: BetSlipPick) => {
    if (!isBettableMatchId(pick.matchId)) {
      setNotice("Ese partido ya finalizó: no se puede agregar al ticket.");
      return;
    }
    setPicks((prev) => (prev.some((p) => p.selectionId === pick.selectionId) ? prev : [...prev, pick]));
  };
  const remove = (pickId: string) => setPicks((prev) => prev.filter((p) => p.id !== pickId));
  const clear = () => setPicks([]);
  const has = (selectionId: string) => picks.some((p) => p.selectionId === selectionId);
  const dismissNotice = () => setNotice(null);

  const summary = computeSlipSummary(picks);

  return (
    <BetSlipContext.Provider value={{ picks, summary, add, addPick, remove, clear, has, notice, dismissNotice }}>
      {children}
    </BetSlipContext.Provider>
  );
}
