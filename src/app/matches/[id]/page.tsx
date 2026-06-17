import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchDetail } from "@/lib/data-access";
import { OpportunityTable } from "@/components/OpportunityTable";
import { TrendMiniChart } from "@/components/TrendMiniChart";
import { DataSourceBadge } from "@/components/badges";
import { SectionTitle, StatCard } from "@/components/primitives";
import { MARKET_BY_KEY } from "@/data/markets";
import {
  FIXTURE_LABELS,
  formatDate,
  formatDateTime,
  formatPercent,
  formatTime,
  formatUpdatedAt,
} from "@/lib/format";
import type { OpportunityView } from "@/lib/data-access";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) notFound();

  const { match, home, away, opportunities, keyPlayers } = detail;
  const p = match.prediction;
  const homeName = home?.name ?? match.homeTeamId;
  const awayName = away?.name ?? match.awayTeamId;
  const opViews: OpportunityView[] = opportunities.map((o) => ({
    ...o,
    match: {
      id: match.id,
      fixtureType: match.fixtureType,
      competition: match.competition,
      groupId: match.groupId,
      kickoff: match.kickoff,
      status: match.status,
      venue: match.venue,
      city: match.city,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      home: { id: match.homeTeamId, name: homeName, code: home?.code ?? "", flag: home?.flag ?? "🏳️", groupId: match.groupId, confederation: home?.confederation ?? "UEFA" },
      away: { id: match.awayTeamId, name: awayName, code: away?.code ?? "", flag: away?.flag ?? "🏳️", groupId: match.groupId, confederation: away?.confederation ?? "UEFA" },
      source: match.source,
      updatedAt: match.updatedAt,
    },
    player: o.playerId ? { id: o.playerId, name: keyPlayers.find((k) => k.id === o.playerId)?.name ?? o.playerId, teamId: "" } : null,
  }));

  const homeTrend = match.trends.find((t) => t.teamId === match.homeTeamId);
  const awayTrend = match.trends.find((t) => t.teamId === match.awayTeamId);

  return (
    <div className="space-y-8">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300">← Volver</Link>

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
          <span>🏟️ {match.venue}</span>
          <span>📍 {match.city || "Sede por confirmar"}</span>
          <span>🕒 {formatDateTime(match.kickoff)}</span>
          {match.neutralVenue ? <span>Campo neutral</span> : null}
        </div>
      </section>

      {/* Probabilidades 1X2 */}
      <section>
        <SectionTitle title="Probabilidades 1X2" />
        <div className="grid grid-cols-3 gap-3">
          <StatCard label={homeName} value={formatPercent(p.homeWin)} accent="brand" hint="Gana local" />
          <StatCard label="Empate" value={formatPercent(p.draw)} hint="X" />
          <StatCard label={awayName} value={formatPercent(p.awayWin)} hint="Gana visitante" />
        </div>
      </section>

      {/* Predicciones de mercado */}
      <section>
        <SectionTitle title="Predicciones del partido" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Goles esperados" value={p.expectedGoals.toFixed(2)} hint={`Over 2.5: ${formatPercent(p.over25)}`} />
          <StatCard label="Ambos anotan" value={formatPercent(p.bttsYes)} hint="Probabilidad BTTS" />
          <StatCard label="Corners esperados" value={p.expectedCorners.toFixed(1)} />
          <StatCard label="Tarjetas esperadas" value={p.expectedCards.toFixed(1)} />
        </div>
      </section>

      {/* Tendencias + H2H */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-slate-100">Tendencias (ultimos 5)</h3>
          <div className="space-y-4">
            <TrendRow name={homeName} trend={homeTrend} />
            <TrendRow name={awayName} trend={awayTrend} />
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-slate-100">Head to head (mock)</h3>
          <div className="space-y-2 text-sm">
            {match.headToHead.map((h, i) => (
              <div key={i} className="flex items-center justify-between border-b border-base-800/50 pb-2 last:border-0">
                <span className="text-slate-400">{formatDate(h.date)} · {h.competition}</span>
                <span className="font-semibold text-slate-100">{h.homeScore} - {h.awayScore}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jugadores destacados */}
      {keyPlayers.length > 0 ? (
        <section>
          <SectionTitle title="Jugadores destacados" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {keyPlayers.map((pl) => (
              <Link key={pl.id} href={`/players/${pl.id}`} className="card card-hover flex items-center justify-between p-3">
                <span className="text-sm font-medium text-slate-100">{pl.name}</span>
                <span className="text-xs text-slate-500">{pl.stats.avgShots.toFixed(1)} tiros · {pl.stats.avgGoals.toFixed(2)} g</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Picks recomendados */}
      <section>
        <SectionTitle title="Picks recomendados" subtitle="Con explicacion breve por pick" />
        <OpportunityTable opportunities={opViews} />
        <div className="mt-4 space-y-2">
          {opViews.slice(0, 5).map((o) => (
            <div key={o.id} className="card p-3 text-sm">
              <span className="font-medium text-slate-100">{o.pick}</span>
              <span className="text-slate-500"> · {MARKET_BY_KEY[o.marketKey]?.label}</span>
              <p className="mt-1 text-xs text-slate-500">{o.reason}</p>
            </div>
          ))}
        </div>
      </section>
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
