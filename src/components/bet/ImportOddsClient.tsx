"use client";

import { useRef, useState } from "react";
import { Field, Select } from "@/components/analytics/primitives";
import type { BetSelection } from "@/lib/bet/types";
import type { ImportMetrics, UnmatchedOdd } from "@/lib/odds/types";
import { PickTable } from "./PickTable";
import { DisclaimerBar } from "./ui";

const EXAMPLE_CSV = `matchId,homeTeam,awayTeam,marketType,selection,line,americanOdds,provider,lastUpdated
66456934,Escocia,Marruecos,match_result,Marruecos,,-120,PlayDoit,2026-06-19
66456934,Escocia,Marruecos,total_goals,Más de,2.5,105,PlayDoit,2026-06-19
66456932,Brasil,Haiti,match_result,Brasil,,-450,PlayDoit,2026-06-19
66456932,Brasil,Haiti,both_teams_score,Sí,,120,PlayDoit,2026-06-19
,Turquia,Paraguay,match_result,Turquia,,-140,PlayDoit,2026-06-19`;

const STORAGE_KEY = "imported-picks";

export function ImportOddsClient() {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [content, setContent] = useState("");
  const [picks, setPicks] = useState<BetSelection[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ImportMetrics | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedOdd[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = async (file: File) => {
    const text = await file.text();
    setContent(text);
    setFileName(file.name);
    setSaved(false);
    // Autodetecta formato por extensión / contenido.
    const isJson = /\.json$/i.test(file.name) || /^\s*[[{]/.test(text);
    setFormat(isJson ? "json" : "csv");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void loadFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

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
        setMetrics((json.data.metrics as ImportMetrics) ?? null);
        setUnmatched((json.data.unmatched as UnmatchedOdd[]) ?? []);
      } else {
        setWarnings(["No se pudo importar."]);
        setPicks([]);
        setMetrics(null);
        setUnmatched([]);
      }
    } catch {
      setWarnings(["Error de red al importar."]);
      setPicks([]);
      setMetrics(null);
      setUnmatched([]);
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[40px] rounded-lg border border-white/10 px-3 py-2 text-sm text-wc-text hover:bg-white/5"
            >
              Subir archivo…
            </button>
            <button
              type="button"
              onClick={() => {
                setContent(EXAMPLE_CSV);
                setFormat("csv");
                setFileName("");
              }}
              className="min-h-[40px] rounded-lg border border-white/10 px-3 py-2 text-sm text-wc-muted hover:bg-white/5"
            >
              Cargar ejemplo CSV
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-center text-xs text-wc-muted hover:border-wc-gold/40 hover:bg-white/[0.04]"
        >
          {fileName ? (
            <span className="text-wc-green">Archivo cargado: {fileName} · puedes editarlo abajo antes de importar.</span>
          ) : (
            <>Arrastra aquí un archivo <strong className="text-wc-text">.csv</strong> o <strong className="text-wc-text">.json</strong>, o haz clic para elegirlo.</>
          )}
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
          provider, lastUpdated. Requeridos: <strong>americanOdds</strong> y (<strong>matchId</strong> ó{" "}
          <strong>homeTeam+awayTeam</strong>). Se resuelve el partido por matchId interno (<code>wc-C-3</code>), por
          ID de proveedor (p. ej. <code>66456934</code>) o por nombres de equipo (ES/EN). Si no se reconoce, no se
          calcula value.
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

      {metrics ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { label: "Importados", value: metrics.totalImported, tone: "text-wc-text" },
            { label: "Partidos resueltos", value: metrics.resolvedMatches, tone: "text-wc-green" },
            { label: "No reconocidos", value: metrics.unmatchedMatches, tone: metrics.unmatchedMatches ? "text-wc-red" : "text-wc-muted" },
            { label: "Listos p/ modelo", value: metrics.selectionsReadyForModel, tone: "text-wc-green" },
            { label: "Omitidos", value: metrics.selectionsSkipped, tone: metrics.selectionsSkipped ? "text-amber-300" : "text-wc-muted" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-center">
              <div className={`text-lg font-bold tabular-nums ${m.tone}`}>{m.value}</div>
              <div className="text-[10px] uppercase text-wc-muted">{m.label}</div>
            </div>
          ))}
        </div>
      ) : null}

      {unmatched.length ? (
        <div className="space-y-2 rounded-xl border border-wc-red/30 bg-wc-red/5 p-3">
          <p className="text-xs font-semibold text-wc-red">
            Hay momios importados cuyo partido no fue reconocido. No se calcularán picks hasta resolverlos.
          </p>
          <ul className="space-y-1 text-[11px] text-wc-text/90">
            {unmatched.map((u) => (
              <li key={u.externalMatchId} className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-black/30 px-1.5 py-0.5 text-wc-muted">{u.externalMatchId}</code>
                <span>
                  {u.homeTeam ?? "?"} vs {u.awayTeam ?? "?"}
                </span>
                <span className="text-wc-muted">· {u.count} selección{u.count === 1 ? "" : "es"}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-wc-muted">
            Corrige el matchId (usa <code>wc-C-3</code> o el ID de proveedor mapeado) o los nombres de equipo y vuelve
            a importar.
          </p>
        </div>
      ) : null}

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
