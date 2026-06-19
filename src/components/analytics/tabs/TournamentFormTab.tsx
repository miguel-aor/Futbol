"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  MatchupPrediction,
  TeamPredictionFeatures,
  TournamentTeamForm,
} from "@/lib/worldcup-2026/types";
import type { MatchEvents } from "@/data/worldcup2026Events";
import {
  Field,
  FormDots,
  InfoBox,
  MetricCard,
  ProbabilityBar,
  SectionHeading,
  Select,
  SourceBadge,
  StatBar,
  pct,
} from "../primitives";

function trendOf(f: TournamentTeamForm): string {
  if (f.played === 0) return "Aún no debuta en el Mundial.";
  const t: string[] = [];
  if (f.defensePerMatch != null && f.defensePerMatch <= 0.5) t.push("defensa fuerte, pocos goles concedidos");
  if (f.attackPerMatch != null && f.attackPerMatch >= 2) t.push("ataque potente");
  if (f.goalsAgainst === 0) t.push("portería en cero");
  if (f.wins === f.played) t.push("puntaje perfecto");
  if (f.losses === f.played) t.push("aún sin sumar");
  return t.length ? t.join(" · ") : "rendimiento equilibrado";
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    const j = await r.json();
    return j?.ok ? (j.data as T) : null;
  } catch {
    return null;
  }
}

export function TournamentFormTab() {
  const [forms, setForms] = useState<TournamentTeamForm[] | null>(null);
  const [features, setFeatures] = useState<TeamPredictionFeatures[] | null>(null);
  const [events, setEvents] = useState<MatchEvents[]>([]);
  const [homeId, setHomeId] = useState("mex");
  const [awayId, setAwayId] = useState("kor");
  const [matchup, setMatchup] = useState<MatchupPrediction | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getJson<TournamentTeamForm[]>("/api/worldcup-2026/team-current-tournament-form"),
      getJson<TeamPredictionFeatures[]>("/api/worldcup-2026/prediction-features"),
      getJson<MatchEvents[]>("/api/worldcup-2026/match-events"),
    ]).then(([f, ft, ev]) => {
      if (!active) return;
      setForms(f);
      setFeatures(ft);
      setEvents(ev ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  const eventsByMatch = useMemo(
    () => new Map(events.map((e) => [e.matchId, e])),
    [events],
  );

  useEffect(() => {
    let active = true;
    getJson<MatchupPrediction>(`/api/worldcup-2026/matchup?home=${homeId}&away=${awayId}`).then((m) => {
      if (active) setMatchup(m);
    });
    return () => {
      active = false;
    };
  }, [homeId, awayId]);

  const teamOptions = useMemo(
    () =>
      (forms ?? [])
        .slice()
        .sort((a, b) => a.teamName.localeCompare(b.teamName))
        .map((f) => ({ value: f.teamId, label: `${f.teamName} (${f.group})` })),
    [forms],
  );

  const home = forms?.find((f) => f.teamId === homeId);
  const away = forms?.find((f) => f.teamId === awayId);
  const homeFeat = features?.find((f) => f.teamId === homeId);

  if (!forms || !features) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-wc-muted">
        Cargando datos del Mundial…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <InfoBox title="Predicción con forma del Mundial actual">
        Los <strong className="text-wc-text">partidos ya jugados del Mundial 2026 pesan más</strong> que el
        historial viejo o los rankings: reflejan forma actual, alineaciones reales, ritmo del torneo y minutos.
        Si un equipo ya jugó 2+ partidos, su peso sube aún más (0.50 → 0.65). Datos reales de los partidos
        disputados; lo no disponible (xG, tiros, etc.) se muestra como “—”, no como 0.
      </InfoBox>

      <div className="wc-card p-4">
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field label="Equipo local">
            <Select value={homeId} onChange={setHomeId} options={teamOptions} />
          </Field>
          <Field label="Equipo visitante">
            <Select value={awayId} onChange={setAwayId} options={teamOptions} />
          </Field>
        </div>
      </div>

      {/* Predicción */}
      {matchup ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label={`xG ${matchup.homeName}`} value={matchup.homeXG.toFixed(2)} accent="gold" />
            <MetricCard label={`xG ${matchup.awayName}`} value={matchup.awayXG.toFixed(2)} accent="blue" />
            <MetricCard
              label="Peso del Mundial actual"
              value={pct(matchup.weightsHome.currentWorldCup)}
              accent="green"
              hint={`vs ranking ${pct(matchup.weightsHome.eloRanking)}`}
            />
          </div>
          <div className="wc-card p-4">
            <SectionHeading
              title="Predicción del partido"
              subtitle="Mezcla ponderada: Mundial actual (peso alto) + forma reciente + ranking."
              right={<SourceBadge source="Snapshot" />}
            />
            <ProbabilityBar
              segments={[
                { label: matchup.homeName, value: matchup.homeWin, color: "bg-wc-gold" },
                { label: "Empate", value: matchup.draw, color: "bg-white/30" },
                { label: matchup.awayName, value: matchup.awayWin, color: "bg-wc-blue" },
              ]}
            />
          </div>
        </div>
      ) : null}

      {/* Forma en este Mundial (ambos equipos) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {home ? <WorldCupFormCard form={home} events={eventsByMatch} /> : null}
        {away ? <WorldCupFormCard form={away} events={eventsByMatch} /> : null}
      </div>

      {/* Diferenciación de capas + pesos */}
      {homeFeat ? (
        <div className="wc-card p-4">
          <SectionHeading
            title={`Capas de información para ${homeFeat.teamName}`}
            subtitle="La UI separa estas tres fuentes; NO se mezclan en una sola variable."
          />
          <div className="space-y-2">
            {homeFeat.layers.map((l) => (
              <div key={l.label} className="flex items-center gap-3 rounded-lg border border-white/[0.06] p-2">
                <span className="w-44 shrink-0 text-sm font-medium text-wc-text">{l.label}</span>
                <span className="w-24 shrink-0">
                  <StatBar label="" value={l.weight} max={1} display={pct(l.weight)} color="bg-wc-gold/70" />
                </span>
                <span
                  className={`chip shrink-0 ${l.hasRealData ? "bg-wc-green/15 text-wc-green" : "bg-white/5 text-wc-muted"}`}
                >
                  {l.hasRealData ? "Dato real" : "Baseline"}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-wc-muted">{l.note}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-wc-muted">
            <strong className="text-wc-gold">Forma en este Mundial</strong> es la capa de mayor peso; “Historial
            general” y “Forma reciente” son contexto/baseline y no la superan.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function WorldCupFormCard({
  form,
  events,
}: {
  form: TournamentTeamForm;
  events: Map<string, MatchEvents>;
}) {
  return (
    <div className="wc-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-wc-text">
            {form.teamName} <span className="text-xs text-wc-muted">· Grupo {form.group}</span>
          </h3>
          <p className="text-xs text-wc-muted">Forma en este Mundial</p>
        </div>
        <FormDots form={form.form} />
      </div>

      {form.played === 0 ? (
        <p className="py-4 text-center text-sm text-wc-muted">Aún no debuta en el Mundial.</p>
      ) : (
        <>
          <ul className="mb-3 space-y-1.5">
            {form.results.map((r) => {
              const ev = events.get(r.matchId);
              const myGoals = ev?.goals.filter((g) => g.teamId === form.teamId) ?? [];
              const st = ev?.teamStats.find((s) => s.teamId === form.teamId);
              const na = (v: number | null | undefined) => (v == null ? "—" : v);
              return (
                <li key={r.matchId} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 text-center text-[10px] font-bold ${
                        r.result === "W" ? "text-wc-green" : r.result === "L" ? "text-wc-red" : "text-amber-300"
                      }`}
                    >
                      {r.result}
                    </span>
                    <span className="font-semibold tabular-nums text-wc-gold">
                      {r.gf}-{r.ga}
                    </span>
                    <span className="text-wc-muted">vs {r.opponentName}</span>
                  </div>
                  {myGoals.length ? (
                    <div className="ml-7 text-[11px] text-wc-muted">
                      Goles:{" "}
                      {myGoals
                        .map(
                          (g) =>
                            `${g.player} ${g.minute}${g.penalty ? " (pen)" : ""}${g.ownGoal ? " (a.g.)" : ""}${g.assist ? ` (as. ${g.assist})` : ""}`,
                        )
                        .join(", ")}
                    </div>
                  ) : null}
                  {st ? (
                    <div className="ml-7 text-[11px] text-wc-muted/90">
                      xG {na(st.xg)} · {na(st.shots)} tiros ({na(st.shotsOnTarget)} a puerta)
                      {st.possession != null ? ` · ${st.possession}% pos.` : ""}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-4 gap-2">
            <MetricCard label="GF" value={`${form.goalsFor}`} accent="green" />
            <MetricCard label="GC" value={`${form.goalsAgainst}`} accent="red" />
            <MetricCard label="Dif" value={`${form.goalDifference >= 0 ? "+" : ""}${form.goalDifference}`} />
            <MetricCard label="Pts" value={`${form.points}`} accent="gold" />
          </div>

          <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-2 text-xs text-wc-muted">
            <strong className="text-wc-text">Tendencia:</strong> {trendOf(form)}
          </p>

          <p className="mt-3 text-[10px] text-wc-muted/70">
            xG y tiros son totales de equipo por partido (Opta). “—” = no publicado (no se asume 0).
          </p>
        </>
      )}
      <div className="mt-3">
        <SourceBadge source="Snapshot" />
      </div>
    </div>
  );
}
