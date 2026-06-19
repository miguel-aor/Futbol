"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, NumberInput, Select, TextInput } from "@/components/analytics/primitives";
import { evaluateMarket } from "@/lib/bet/buildPicks";
import { createManualQuote, oddsQuoteToMarket, ODDS_MANUAL_NOTICE } from "@/lib/bet/oddsProvider";
import {
  getDefaultLambda,
  getDefaultLineForMarket,
  getMarketCategoryOptions,
  getMarketLineOptions,
  getMarketSelectionOptions,
  getMarketTypeOptions,
  getPlayersForMatch,
  getTeamsForMatch,
  marketRequiresLambda,
  marketRequiresLine,
  marketRequiresPlayer,
  marketRequiresTeam,
} from "@/lib/bet/marketHelpers";
import type { MarketCategory, MarketType, MatchModelParams } from "@/lib/bet/types";
import { useBetSlip } from "./BetSlipProvider";
import {
  BetSourceBadge,
  EdgeBadge,
  EVBadge,
  RatingBadge,
  RiskBadge,
  ValueMeter,
  fmtPct,
} from "./ui";

export interface BuilderMatch {
  id: string;
  name: string;
  params: MatchModelParams;
  isDemo: boolean;
  eligible?: boolean;
}

export function MarketEntryForm({ match }: { match: BuilderMatch }) {
  const { add } = useBetSlip();
  const [category, setCategory] = useState<MarketCategory>("match");
  const [marketType, setMarketType] = useState<MarketType>("match_result");
  const [teamId, setTeamId] = useState<string>(match.params.homeId);
  const [playerId, setPlayerId] = useState<string>("");
  const [manualPlayer, setManualPlayer] = useState<string>("");
  const [selection, setSelection] = useState<string>("");
  const [line, setLine] = useState<number>(2.5);
  const [americanOdds, setAmericanOdds] = useState<number>(-110);
  const [lambda, setLambda] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [added, setAdded] = useState(false);

  const teams = useMemo(() => getTeamsForMatch(match), [match]);
  const players = useMemo(() => getPlayersForMatch(match.id), [match.id]);

  // Reset al cambiar categoría → primer mercado de esa categoría.
  useEffect(() => {
    setMarketType(getMarketTypeOptions(category)[0].value);
  }, [category]);

  // Reset dependientes al cambiar mercado o partido.
  useEffect(() => {
    setTeamId(match.params.homeId);
    setLine(getDefaultLineForMarket(marketType));
    setLambda(getDefaultLambda(marketType, match, match.params.homeId));
    if (players.length) setPlayerId(players[0].id);
    const opts = getMarketSelectionOptions(marketType, match);
    setSelection(opts[0] ?? "Over");
  }, [marketType, match, players]);

  const needsLine = marketRequiresLine(marketType);
  const needsTeam = marketRequiresTeam(marketType);
  const needsPlayer = marketRequiresPlayer(marketType);
  const needsLambda = marketRequiresLambda(marketType) || marketType === "team_total_goals";
  const teamName = teams.find((t) => t.id === teamId)?.name ?? "";
  const playerName = players.find((p) => p.id === playerId)?.name ?? manualPlayer;
  const selectionOptions = getMarketSelectionOptions(marketType, match, teamName);
  const isScorer = marketType === "anytime_goalscorer" || marketType === "first_goalscorer";

  // Construye la pick final (selección legible + teamId/playerId/lambda).
  const evaluated = useMemo(() => {
    const label = getMarketTypeOptions(category).find((o) => o.value === marketType)?.label ?? marketType;
    let finalSelection = selection;
    let finalTeamId: string | undefined;
    let finalLambda: number | null = null;

    if (needsPlayer) {
      const pname = playerName || "Jugador";
      finalSelection = isScorer ? pname : `${pname} ${selection} ${line}`;
      finalLambda = lambda;
    } else if (needsTeam) {
      finalTeamId = teamId;
      finalSelection =
        marketType === "team_win_either_half"
          ? `${teamName} gana alguna mitad`
          : `${teamName} ${selection} ${line}`;
      finalLambda = lambda;
    } else {
      // Mercados de partido
      if (marketType === "match_result" || marketType === "asian_handicap") {
        if (selection === match.params.awayName) finalTeamId = match.params.awayId;
        else if (selection === match.params.homeName) finalTeamId = match.params.homeId;
      }
      finalSelection = needsLine ? `${selection} ${line}` : selection;
    }

    const quote = createManualQuote(
      {
        matchId: match.id,
        marketType,
        selection: finalSelection,
        line: needsLine ? line : null,
        americanOdds,
        label,
        modelLambda: needsLambda ? finalLambda : null,
        playerId: needsPlayer && players.find((p) => p.id === playerId) ? playerId : undefined,
        teamId: finalTeamId,
      },
      new Date().toISOString(),
    );
    return evaluateMarket(oddsQuoteToMarket(quote, `manual-${match.id}`), match.params, match.name);
  }, [
    category,
    marketType,
    selection,
    line,
    americanOdds,
    lambda,
    teamId,
    teamName,
    playerId,
    playerName,
    players,
    needsLine,
    needsTeam,
    needsPlayer,
    needsLambda,
    isScorer,
    match,
  ]);

  const canAdd = match.eligible !== false;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="wc-card space-y-3 p-4">
        <h3 className="text-base font-semibold text-wc-text">Capturar mercado</h3>
        <p className="text-xs text-wc-muted">
          Partido seleccionado: <span className="text-wc-text">{match.name}</span>.{" "}
          {match.isDemo ? <em>Datos demo.</em> : <em>Modelo ponderado con la forma del Mundial.</em>}
        </p>
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-wc-muted">
          {ODDS_MANUAL_NOTICE}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoría">
            <Select value={category} onChange={(v) => setCategory(v as MarketCategory)} options={getMarketCategoryOptions()} />
          </Field>
          <Field label="Mercado">
            <Select value={marketType} onChange={(v) => setMarketType(v as MarketType)} options={getMarketTypeOptions(category)} />
          </Field>
        </div>

        {needsTeam ? (
          <Field label="Equipo">
            <Select value={teamId} onChange={setTeamId} options={teams.map((t) => ({ value: t.id, label: t.name }))} />
          </Field>
        ) : null}

        {needsPlayer ? (
          players.length ? (
            <Field label="Jugador">
              <Select value={playerId} onChange={setPlayerId} options={players.map((p) => ({ value: p.id, label: `${p.name} (${p.position})` }))} />
            </Field>
          ) : (
            <Field label="Jugador (captura manual)" hint="No hay jugadores confirmados para este partido; el riesgo será mayor.">
              <TextInput value={manualPlayer} onChange={setManualPlayer} placeholder="Nombre del jugador" />
            </Field>
          )
        ) : null}

        {selectionOptions.length && !isScorer ? (
          <Field label="Selección">
            <Select value={selection} onChange={setSelection} options={selectionOptions.map((s) => ({ value: s, label: s }))} />
          </Field>
        ) : isScorer ? (
          <p className="text-[11px] text-wc-muted">Selección: {playerName || "elige un jugador"} (marca / anota).</p>
        ) : null}

        {needsLine ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Línea">
              <Select
                value={`${line}`}
                onChange={(v) => setLine(Number(v))}
                options={getMarketLineOptions(marketType).map((n) => ({ value: `${n}`, label: `${n}` }))}
              />
            </Field>
            <Field label="Momio americano">
              <NumberInput value={americanOdds} onChange={setAmericanOdds} step={5} />
            </Field>
          </div>
        ) : (
          <Field label="Momio americano">
            <NumberInput value={americanOdds} onChange={setAmericanOdds} step={5} />
          </Field>
        )}

        {needsLambda ? (
          <Field label="Expectativa del modelo (λ por partido)" hint="conteo esperado del equipo/jugador">
            <NumberInput value={lambda} onChange={setLambda} step={0.1} />
          </Field>
        ) : null}

        <Field label="Nota (opcional)" hint="Si anotas una casa como referencia, se guarda como nota, no como fuente.">
          <TextInput value={notes} onChange={setNotes} placeholder="Referencia / contexto…" />
        </Field>
      </div>

      <div className="wc-card space-y-3 p-4">
        <h3 className="text-base font-semibold text-wc-text">Análisis del valor</h3>
        <ValueMeter modelProbability={evaluated.modelProbability} impliedProbability={evaluated.impliedProbability} />
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <div className="text-sm font-bold text-wc-text">{fmtPct(evaluated.modelProbability, 0)}</div>
            <div className="text-[10px] uppercase text-wc-muted">Prob. modelo</div>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <div className="text-sm font-bold text-wc-muted">{fmtPct(evaluated.impliedProbability, 0)}</div>
            <div className="text-[10px] uppercase text-wc-muted">Implícita</div>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-2 text-center">
            <div className="text-sm font-bold tabular-nums text-wc-gold">{evaluated.decimalOdds.toFixed(2)}</div>
            <div className="text-[10px] uppercase text-wc-muted">Decimal</div>
          </div>
        </div>
        <div className="text-sm text-wc-text">{evaluated.selection}</div>
        <div className="flex flex-wrap gap-1.5">
          <RatingBadge rating={evaluated.rating} />
          <EdgeBadge edge={evaluated.edge} />
          <EVBadge ev={evaluated.expectedValue} />
          <RiskBadge risk={evaluated.riskLevel} />
          <BetSourceBadge source="Manual input" reliability="medium" />
        </div>
        <div className="text-[11px] text-wc-muted">Motor: {evaluated.models.join(" · ")}</div>
        {canAdd ? (
          <button
            type="button"
            onClick={() => {
              add(evaluated);
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1500);
            }}
            className="min-h-[40px] w-full rounded-lg bg-wc-gold/15 px-3 py-2 text-sm font-semibold text-wc-gold transition-colors hover:bg-wc-gold/25"
          >
            {added ? "Agregada ✓" : "+ Agregar al ticket"}
          </button>
        ) : (
          <p className="rounded-lg border border-wc-red/30 bg-wc-red/5 px-3 py-2 text-xs text-wc-red">
            Este partido ya no es elegible para nuevas picks.
          </p>
        )}
        <p className="text-[10px] text-wc-muted/70">La probabilidad del modelo es una estimación, no garantía.</p>
      </div>
    </div>
  );
}
