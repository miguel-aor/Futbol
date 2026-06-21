import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchDetail, getMatchIntelligence, getTeamLabels } from "@/lib/data-access";
import { TrendMiniChart } from "@/components/TrendMiniChart";
import { MarketTabs } from "@/components/MarketTabs";
import { DataQualityBadge, DataSourceBadge } from "@/components/badges";
import { EmptyState, SectionTitle, StatCard } from "@/components/primitives";
import {
  CoachCard,
  ComparisonRow,
  FactorList,
  HistoricalMatchList,
  KeyPlayerCard,
  MatchPickCard,
  PerformanceWindowGrid,
  RefereeCard,
  RefereeUnconfirmedCard,
} from "@/components/IntelligencePanels";
import { getMatchScenario } from "@/lib/worldcup/scenarios";
import { calculateExactScoreMatrix } from "@/lib/bet/exactScoreModel";
import { getTodayMatchContext } from "@/lib/bet/statScreenshotContext";
import { buildMatchProjectionPicks } from "@/lib/bet/matchPicks";
import { PickTable } from "@/components/bet/PickTable";
import {
  FIXTURE_LABELS,
  formatDate,
  formatDateTime,
  formatPercent,
  formatTime,
  formatUpdatedAt,
} from "@/lib/format";
import { calculateCoachImpact } from "@/lib/prediction/intelligence";
import { ArrowLeftIcon, ClockIcon, CompassIcon, PinIcon, StadiumIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, report, labels] = await Promise.all([
    getMatchDetail(id),
    getMatchIntelligence(id),
    getTeamLabels(),
  ]);
  if (!detail) notFound();

  const { match, home, away } = detail;
  const p = match.prediction;
  const homeName = home?.name ?? match.homeTeamId;
  const awayName = away?.name ?? match.awayTeamId;
  const homeCode = home?.code ?? match.homeTeamId.toUpperCase();
  const awayCode = away?.code ?? match.awayTeamId.toUpperCase();

  const homeTrend = match.trends.find((t) => t.teamId === match.homeTeamId);
  const awayTrend = match.trends.find((t) => t.teamId === match.awayTeamId);

  // -------------------------------------------------------------------
  // Contenido de cada pestaña
  // -------------------------------------------------------------------

  const tabResumen = (
    <div className="space-y-6">
      {report ? (
        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-100">Resumen del análisis</h3>
            <DataQualityBadge quality={report.dataQuality} />
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{report.narrative}</p>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={homeName} value={formatPercent(p.homeWin)} accent="brand" hint="Gana local" />
        <StatCard label="Empate" value={formatPercent(p.draw)} hint="X" />
        <StatCard label={awayName} value={formatPercent(p.awayWin)} hint="Gana visitante" />
      </div>
      {report ? (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-100">Comparativa rápida</h3>
          <div className="space-y-3">
            <ComparisonRow comp={report.comparisons.attack} homeCode={homeCode} awayCode={awayCode} />
            <ComparisonRow comp={report.comparisons.defense} homeCode={homeCode} awayCode={awayCode} />
            <ComparisonRow comp={report.comparisons.shots} homeCode={homeCode} awayCode={awayCode} />
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>{homeCode}</span><span>{awayCode}</span>
          </div>
        </div>
      ) : null}
      {report && report.picks.length > 0 ? (
        <div>
          <SectionTitle title="Pick destacado" />
          <MatchPickCard pick={[...report.picks].sort((a, b) => b.edge - a.edge)[0]} />
        </div>
      ) : null}
    </div>
  );

  const tabProbabilidades = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={homeName} value={formatPercent(p.homeWin)} accent="brand" hint="Gana local" />
        <StatCard label="Empate" value={formatPercent(p.draw)} hint="X" />
        <StatCard label={awayName} value={formatPercent(p.awayWin)} hint="Gana visitante" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Goles esperados" value={p.expectedGoals.toFixed(2)} hint={`Over 2.5: ${formatPercent(p.over25)}`} />
        <StatCard label="Ambos anotan" value={formatPercent(p.bttsYes)} hint="Probabilidad BTTS" />
        <StatCard label="Corners esperados" value={p.expectedCorners.toFixed(1)} />
        <StatCard label="Tarjetas esperadas" value={p.expectedCards.toFixed(1)} />
      </div>
    </div>
  );

  const tabEstadisticas = report ? (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-slate-100">Comparativa por mercado</h3>
        <div className="space-y-3">
          <ComparisonRow comp={report.comparisons.attack} homeCode={homeCode} awayCode={awayCode} />
          <ComparisonRow comp={report.comparisons.defense} homeCode={homeCode} awayCode={awayCode} />
          <ComparisonRow comp={report.comparisons.corners} homeCode={homeCode} awayCode={awayCode} />
          <ComparisonRow comp={report.comparisons.cards} homeCode={homeCode} awayCode={awayCode} />
          <ComparisonRow comp={report.comparisons.shots} homeCode={homeCode} awayCode={awayCode} />
        </div>
        <div className="mt-3 flex justify-between text-xs text-slate-500">
          <span>{home?.flag} {homeCode}</span><span>{awayCode} {away?.flag}</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-200">{homeName} · últimos {report.homeForm.sampleSize}</h4>
          <PerformanceWindowGrid window={report.homeForm} />
        </div>
        <div className="card p-5">
          <h4 className="mb-3 text-sm font-semibold text-slate-200">{awayName} · últimos {report.awayForm.sampleSize}</h4>
          <PerformanceWindowGrid window={report.awayForm} />
        </div>
      </div>
    </div>
  ) : (
    <EmptyState title="Sin estadísticas" message="No hay reporte de inteligencia para este partido." />
  );

  const tabAlineaciones = report ? (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Alineaciones probables aproximadas (jugadores destacados / titulares probables). No oficial.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {[{ team: report.homeTeam, players: report.keyPlayers.filter((k) => k.teamId === report.homeTeam.id) },
          { team: report.awayTeam, players: report.keyPlayers.filter((k) => k.teamId === report.awayTeam.id) }].map((side) => (
          <div key={side.team.id}>
            <h4 className="mb-2 text-sm font-semibold text-slate-200">{side.team.flag} {side.team.name}</h4>
            <div className="grid gap-2">
              {side.players.map((pl) => <KeyPlayerCard key={pl.playerId} player={pl} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <EmptyState title="Sin alineaciones" />
  );

  const tabHistorial = (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="mb-3 font-semibold text-slate-100">Head to head</h3>
        <div className="space-y-2 text-sm">
          {match.headToHead.map((h, i) => (
            <div key={i} className="flex items-center justify-between border-b border-base-800/50 pb-2 last:border-0">
              <span className="text-slate-400">{formatDate(h.date)} · {h.competition}</span>
              <span className="tabular-nums font-semibold text-slate-100">{h.homeScore} - {h.awayScore}</span>
            </div>
          ))}
        </div>
      </div>
      {report ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-200">{homeName}: partidos recientes</h4>
            <HistoricalMatchList matches={report.homeRelevantMatches} labels={labels} limit={8} />
          </div>
          <div className="card p-5">
            <h4 className="mb-3 text-sm font-semibold text-slate-200">{awayName}: partidos recientes</h4>
            <HistoricalMatchList matches={report.awayRelevantMatches} labels={labels} limit={8} />
          </div>
        </div>
      ) : null}
    </div>
  );

  const tabArbitro = report?.referee && report.refereeImpact ? (
    <RefereeCard referee={report.referee} impact={report.refereeImpact} />
  ) : (
    <RefereeUnconfirmedCard />
  );

  const tabEntrenadores = report && (report.homeCoach || report.awayCoach) ? (
    <div className="grid gap-4 lg:grid-cols-2">
      {report.homeCoach ? <CoachCard coach={report.homeCoach} impact={calculateCoachImpact(report.homeCoach)} /> : null}
      {report.awayCoach ? <CoachCard coach={report.awayCoach} impact={calculateCoachImpact(report.awayCoach)} /> : null}
    </div>
  ) : (
    <EmptyState title="Sin entrenadores" icon={<CompassIcon className="h-6 w-6" />} />
  );

  const tabJugadores = report && report.keyPlayers.length > 0 ? (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {report.keyPlayers.map((pl) => (
        <KeyPlayerCard key={pl.playerId} player={pl} teamFlag={pl.teamId === report.homeTeam.id ? report.homeTeam.flag : report.awayTeam.flag} />
      ))}
    </div>
  ) : (
    <EmptyState title="Sin jugadores destacados" />
  );

  const tabIntelligence = report ? (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-100">Reporte de inteligencia</h3>
          <DataQualityBadge quality={report.dataQuality} />
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{report.narrative}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FactorList title="Factores · resultado" factors={report.factorsResult} />
        <FactorList title="Factores · goles" factors={report.factorsGoals} />
        <FactorList title="Factores · corners" factors={report.factorsCorners} />
        <FactorList title="Factores · tarjetas" factors={report.factorsCards} />
      </div>
      <div>
        <SectionTitle title="Picks recomendados" subtitle="Razones a favor y en contra, con calidad de datos" />
        <div className="grid gap-3 lg:grid-cols-2">
          {report.picks.map((pick, i) => <MatchPickCard key={i} pick={pick} />)}
        </div>
      </div>
      {report.dataQuality.warnings.length > 0 ? (
        <div className="card border-edge-mid/30 p-4">
          <h4 className="mb-2 text-sm font-semibold text-edge-mid">Riesgos del análisis</h4>
          <ul className="space-y-1 text-xs text-slate-400">
            {report.dataQuality.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Calidad de datos: {report.dataQuality.level} ({Math.round(report.dataQuality.finalScore * 100)}/100)</span>
        <DataSourceBadge source={report.source} updatedAt={formatUpdatedAt(report.lastUpdated)} />
      </div>
    </div>
  ) : (
    <EmptyState title="Sin reporte de inteligencia" />
  );

  return (
    <div className="space-y-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
        <ArrowLeftIcon className="h-4 w-4" /> Volver
      </Link>

      {/* Cabecera */}
      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="chip bg-base-700/60 text-slate-300">
            {FIXTURE_LABELS[match.fixtureType]}
            {match.groupId ? ` · Grupo ${match.groupId}` : ""} · {match.competition}
          </span>
          <DataSourceBadge source={match.source} updatedAt={formatUpdatedAt(match.updatedAt)} />
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <TeamHead flag={home?.flag ?? "🏳️"} name={homeName} id={match.homeTeamId} />
          <div className="text-center">
            {match.status === "finished" ? (
              <div className="text-3xl font-bold text-slate-100">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold text-slate-100">{formatTime(match.kickoff)}</div>
                <div className="text-xs text-slate-500">{formatDate(match.kickoff)}</div>
              </div>
            )}
            <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
              {match.status === "finished" ? "Finalizado" : "Programado"}
            </div>
          </div>
          <TeamHead flag={away?.flag ?? "🏳️"} name={awayName} id={match.awayTeamId} align="right" />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><StadiumIcon className="h-4 w-4" /> {match.venue}</span>
          <span className="inline-flex items-center gap-1.5"><PinIcon className="h-4 w-4" /> {match.city || "Sede por confirmar"}</span>
          <span className="inline-flex items-center gap-1.5"><ClockIcon className="h-4 w-4" /> {formatDateTime(match.kickoff)}</span>
          {match.neutralVenue ? <span className="chip bg-base-700/60 text-slate-400">Campo neutral</span> : null}
        </div>
      </section>

      {/* Tendencias rápidas */}
      <section className="card p-5">
        <h3 className="mb-4 font-semibold text-slate-100">Tendencias (últimos 5)</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <TrendRow name={homeName} trend={homeTrend} />
          <TrendRow name={awayName} trend={awayTrend} />
        </div>
      </section>

      {/* Contexto de grupo (posiciones + escenario) */}
      {(() => {
        const sc = getMatchScenario(match.homeTeamId, match.awayTeamId);
        if (!sc.home && !sc.away) return null;
        const row = (t: typeof sc.home) =>
          t ? (
            <div className="flex-1 rounded-lg bg-base-900/50 p-3">
              <div className="mb-1 text-sm font-semibold text-slate-100">
                {t.group}{t.position} · {t.teamName}
                <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] text-slate-400">
                  {t.points} pts · {t.played} PJ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{t.summary}</p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-400">
                <span className="chip bg-base-800/60">Debe ganar {Math.round(t.mustWinPressure * 100)}%</span>
                <span className="chip bg-base-800/60">Rotación {Math.round(t.rotationRisk * 100)}%</span>
                <span className="chip bg-base-800/60">Motivación {Math.round(t.motivationScore * 100)}%</span>
              </div>
            </div>
          ) : null;
        return (
          <section className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-100">Contexto de grupo</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              {row(sc.home)}
              {row(sc.away)}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Posiciones manual_screenshot (corte 21-06-2026 03:00 CDMX). Contexto que ajusta las picks; no reemplaza
              el modelo base.
            </p>
          </section>
        );
      })()}

      {/* Contexto último partido (stats 365Scores) */}
      {(() => {
        const c = getTodayMatchContext(match.id);
        if (!c || !c.hasContext) return null;
        const col = (s: typeof c.homeStats) =>
          s ? (
            <div className="flex-1 rounded-lg bg-base-900/50 p-3">
              <div className="mb-1 text-sm font-semibold text-slate-100">{s.teamName} <span className="text-[11px] font-normal text-slate-500">vs {s.opponentName} ({s.scoreFor}-{s.scoreAgainst})</span></div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                <span>Posesión {s.possession}%</span><span>xG {s.xg}</span>
                <span>Remates {s.shots} ({s.shotsOnTarget} a puerta)</span><span>Corners {s.corners}{s.cornersAgainst != null ? ` (${s.cornersAgainst} conc.)` : ""}</span>
                <span>Faltas {s.fouls}</span><span>Amarillas {s.yellowCards}</span>
                <span>Despejes {s.clearances}</span><span>Atajadas {s.gkSaves}</span>
              </div>
            </div>
          ) : null;
        return (
          <section className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-100">Contexto último partido <span className="chip ml-1 bg-base-700/60 text-[10px] text-slate-400">365Scores screenshot · 1 partido</span></h3>
            <div className="flex flex-col gap-3 sm:flex-row">{col(c.homeStats)}{col(c.awayStats)}</div>
          </section>
        );
      })()}

      {/* Marcadores exactos más probables */}
      {(() => {
        const es = calculateExactScoreMatrix(match.id);
        if (!es) return null;
        return (
          <section className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-100">Marcadores exactos más probables</h3>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="chip bg-base-700/60 text-slate-400">Poisson matrix</span>
                <span className="chip bg-amber-500/15 text-amber-300">High variance</span>
                {es.hasRecentContext ? <span className="chip bg-base-700/60 text-slate-400">+ contexto reciente</span> : null}
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
              <span>1X2: <b className="text-slate-200">{Math.round(es.homeWin * 100)}</b> / {Math.round(es.draw * 100)} / {Math.round(es.awayWin * 100)}</span>
              <span>xG: {es.xgHome} – {es.xgAway} (tot {es.expectedGoals})</span>
              <span>BTTS sí: {Math.round(es.bttsYes * 100)}%</span>
              <span>O2.5: {Math.round(es.over25 * 100)}%</span>
              <span>{es.homeName} CS: {Math.round(es.homeCleanSheet * 100)}%</span>
            </div>
            <ol className="space-y-1">
              {es.topScores.slice(0, 5).map((s, i) => (
                <li key={s.scoreline} className="flex items-center justify-between rounded bg-base-900/40 px-3 py-1.5 text-sm">
                  <span className="text-slate-200">{i + 1}. {es.homeName} {s.homeGoals}-{s.awayGoals} {es.awayName}</span>
                  <span className="tabular-nums text-slate-400">{(s.probability * 100).toFixed(1)}% · cuota {s.fairOddsDecimal}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11px] text-slate-500">
              Correct score = alta varianza: predicción del modelo, no Strong Value automático. La misma matriz
              alimenta 1X2, goles, BTTS, team totals, hándicap y portería a cero.
            </p>
          </section>
        );
      })()}

      {/* Pestañas */}
      <section>
        <MarketTabs
          tabs={[
            { key: "resumen", label: "Resumen", content: tabResumen },
            { key: "prob", label: "Probabilidades", content: tabProbabilidades },
            { key: "stats", label: "Estadísticas", content: tabEstadisticas },
            { key: "lineups", label: "Alineaciones", content: tabAlineaciones },
            { key: "hist", label: "Historial", content: tabHistorial },
            { key: "ref", label: "Árbitro", content: tabArbitro },
            { key: "coach", label: "Entrenadores", content: tabEntrenadores },
            { key: "players", label: "Jugadores", content: tabJugadores },
            { key: "intel", label: "Intelligence", content: tabIntelligence },
          ]}
        />
      </section>

      {/* Picks del partido (modelo real: líneas dinámicas, sin mock) */}
      {(() => {
        const projection = buildMatchProjectionPicks(match.id);
        return (
          <section>
            <SectionTitle
              title="Picks del partido"
              subtitle="Proyecciones del modelo: línea dinámica por mercado, contexto reciente y árbitro. Sin plantillas fijas ni mock."
            />
            {projection.length ? (
              <PickTable rows={projection} />
            ) : (
              <EmptyState title="Sin picks proyectables" message="No hay proyección de modelo para este partido (¿finalizado o sin datos?)." />
            )}
            <p className="mt-2 text-[11px] text-slate-500">
              Cuotas mostradas = cuota justa del modelo (no hay momio de mercado conectado). Importa momios en{" "}
              <Link href="/importar" className="text-edge-mid hover:underline">/importar</Link> para calcular edge/EV reales.
            </p>
          </section>
        );
      })()}
    </div>
  );
}

function TeamHead({ flag, name, id, align = "left" }: { flag: string; name: string; id: string; align?: "left" | "right" }) {
  return (
    <Link href={`/teams/${id}`} className={`flex flex-col items-center gap-1 hover:opacity-80 ${align === "right" ? "sm:items-end" : "sm:items-start"}`}>
      <span className="text-4xl">{flag}</span>
      <span className="text-center text-sm font-semibold text-slate-100">{name}</span>
    </Link>
  );
}

function TrendRow({ name, trend }: { name: string; trend?: { formGoals: number[]; formCorners: number[]; formCards: number[] } }) {
  if (!trend) return null;
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-200">{name}</div>
      <div className="flex flex-wrap gap-5">
        <TrendMiniChart values={trend.formGoals} label="Goles" color="#34d399" />
        <TrendMiniChart values={trend.formCorners} label="Corners" color="#60a5fa" />
        <TrendMiniChart values={trend.formCards} label="Tarjetas" color="#fbbf24" />
      </div>
    </div>
  );
}
