"use client";

import { useState } from "react";
import { Field, Select } from "@/components/analytics/primitives";
import type { BetSelection } from "@/lib/bet/types";
import { PickTable } from "./PickTable";
import { DisclaimerBar } from "./ui";

const EXAMPLE_CSV = `matchId,homeTeam,awayTeam,marketType,selection,line,americanOdds,provider,lastUpdated
wc-C-3,Escocia,Marruecos,match_result,Marruecos,,-120,MiFuente,2026-06-19
wc-C-3,Escocia,Marruecos,total_goals,Over 2.5,2.5,105,MiFuente,2026-06-19
wc-C-4,Brasil,Haiti,match_result,Brasil,,-450,MiFuente,2026-06-19
wc-C-4,Brasil,Haiti,both_teams_score,Sí,,120,MiFuente,2026-06-19`;

const STORAGE_KEY = "imported-picks";

export function ImportOddsClient() {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [content, setContent] = useState("");
  const [picks, setPicks] = useState<BetSelection[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);

  const runImport = async () => {
    setLoading(true);
    setSaved(false);
    setTouched(true);
    try {
      const res = await fetch("/api/import-odds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, content }),
      });
      const json = await res.json();
      if (json?.ok) {
        setPicks(json.data.picks as BetSelection[]);
        setWarnings(json.data.warnings as string[]);
      } else {
        setWarnings(["No se pudo importar."]);
        setPicks([]);
      }
    } catch {
      setWarnings(["Error de red al importar."]);
      setPicks([]);
    } finally {
      setLoading(false);
    }
  };

  const saveForValuePicks = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
      setSaved(true);
    } catch {
      /* ignore */
    }
  };

  const clearSaved = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setSaved(false);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-wc-text">Importar momios</h1>
        <p className="text-sm text-wc-muted">
          Pega momios en CSV o JSON desde una fuente externa. La app{" "}
          <strong className="text-wc-text">no hace scraping</strong>: solo procesa lo que tú pegas. Se marcan como{" "}
          <em>Imported CSV / JSON</em> y se evalúan con el modelo (edge, EV, confianza, riesgo).
        </p>
      </div>
      <DisclaimerBar compact />

      <div className="wc-card space-y-3 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field label="Formato">
            <Select value={format} onChange={(v) => setFormat(v as "csv" | "json")} options={[{ value: "csv", label: "CSV" }, { value: "json", label: "JSON" }]} />
          </Field>
          <button
            type="button"
            onClick={() => setContent(EXAMPLE_CSV)}
            className="min-h-[40px] rounded-lg border border-white/10 px-3 py-2 text-sm text-wc-muted hover:bg-white/5"
          >
            Cargar ejemplo CSV
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder={"matchId,homeTeam,awayTeam,marketType,selection,line,americanOdds,provider,lastUpdated\n..."}
          className="w-full rounded-lg border border-white/10 bg-wc-card px-3 py-2 font-mono text-xs text-wc-text placeholder:text-wc-muted/50 focus:border-wc-gold focus:outline-none focus:ring-1 focus:ring-wc-gold/40"
        />
        <p className="text-[11px] text-wc-muted">
          Columnas: matchId, homeTeam, awayTeam, marketType, selection, team, playerName, line, americanOdds,
          provider, lastUpdated. Requeridos: <strong>matchId</strong> y <strong>americanOdds</strong>. Usa matchId
          reales (p. ej. <code>wc-C-3</code>) para que se evalúen con el modelo del partido.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runImport}
            disabled={loading}
            className="min-h-[40px] rounded-lg bg-wc-gold/15 px-4 py-2 text-sm font-semibold text-wc-gold hover:bg-wc-gold/25 disabled:opacity-50"
          >
            {loading ? "Importando…" : "Importar y evaluar"}
          </button>
          {picks.length ? (
            <button
              type="button"
              onClick={saveForValuePicks}
              className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-wc-text hover:bg-white/5"
            >
              {saved ? "Guardado para Value Picks ✓" : "Guardar para Value Picks"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearSaved}
            className="min-h-[40px] rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-wc-muted hover:bg-white/5"
          >
            Limpiar guardados
          </button>
        </div>
      </div>

      {warnings.length ? (
        <ul className="space-y-1 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-[11px] text-amber-100/90">
          {warnings.map((w, i) => (
            <li key={i}>• {w}</li>
          ))}
        </ul>
      ) : null}

      {touched ? (
        picks.length ? (
          <div>
            <h2 className="mb-2 text-lg font-semibold text-wc-text">{picks.length} momios importados y evaluados</h2>
            <PickTable rows={picks} />
          </div>
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-wc-muted">
            No se importaron momios válidos. Revisa el formato y que cada fila tenga matchId y americanOdds.
          </p>
        )
      ) : null}
    </div>
  );
}
