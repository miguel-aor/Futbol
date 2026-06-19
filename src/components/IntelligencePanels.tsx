// =====================================================================
// Paneles de "World Cup Intelligence Mapping" (server components, sin
// estado ni dependencias de charting: SVG inline + Tailwind dark OLED).
// Azul = datos, ambar = destacado/edge. Numeros tabulares.
// =====================================================================

import Link from "next/link";
import type {
  Coach,
  CoachImpact,
  DataQualityScore,
  HistoricalMatch,
  IntelligenceFactor,
  MarketComparison,
  MatchPick,
  PerformanceWindow,
  PlayerIntelligenceProfile,
  Referee,
  RefereeImpact,
  TeamScoreBreakdown,
} from "@/lib/data-providers/types";
import { ConfidenceBadge, DataQualityBadge, EdgeBadge } from "./badges";
import { formatDate, formatPercent } from "@/lib/format";

const IMPACT_CLS: Record<IntelligenceFactor["impact"], string> = {
  alta: "bg-edge-pos/15 text-edge-pos",
  media: "bg-edge-mid/15 text-edge-mid",
  baja: "bg-base-700/70 text-slate-400",
};

// ---------------------------------------------------------------------
// Comparativa local vs visitante (barras enfrentadas)
// ---------------------------------------------------------------------
export function ComparisonRow({
  comp,
  homeCode,
  awayCode,
}: {
  comp: MarketComparison;
  homeCode: string;
  awayCode: string;
}) {
  const total = Math.abs(comp.home) + Math.abs(comp.away) || 1;
  const homePct = Math.round((Math.abs(comp.home) / total) * 100);
  const awayPct = 100 - homePct;
  const homeHi = comp.edgeTo === "home";
  const awayHi = comp.edgeTo === "away";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className={`tabular-nums font-semibold ${homeHi ? "text-edge-mid" : "text-slate-300"}`}>
          {comp.home}
        </span>
        <span>{comp.label}</span>
        <span className={`tabular-nums font-semibold ${awayHi ? "text-edge-mid" : "text-slate-300"}`}>
          {comp.away}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-base-900">
        <div
          className={`h-full ${homeHi ? "bg-edge-mid" : "bg-sky-500/70"}`}
          style={{ width: `${homePct}%` }}
          aria-label={`${homeCode} ${comp.home}`}
        />
        <div className="h-full w-px bg-base-950" />
        <div
          className={`h-full ${awayHi ? "bg-edge-mid" : "bg-indigo-400/60"}`}
          style={{ width: `${awayPct}%` }}
          aria-label={`${awayCode} ${comp.away}`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Radar de scores (6 ejes, 0..100) — SVG inline
// ---------------------------------------------------------------------
const RADAR_AXES: Array<{ key: keyof TeamScoreBreakdown; label: string }> = [
  { key: "form", label: "Forma" },
  { key: "attack", label: "Ataque" },
  { key: "defense", label: "Defensa" },
  { key: "discipline", label: "Disciplina" },
  { key: "corners", label: "Corners" },
  { key: "shots", label: "Tiros" },
];

export function ScoreRadar({ scores }: { scores: TeamScoreBreakdown }) {
  const cx = 110;
  const cy = 110;
  const r = 78;
  const n = RADAR_AXES.length;
  const pointAt = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rad = (value / 100) * r;
    return [cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)] as const;
  };
  const polygon = RADAR_AXES.map((a, i) => pointAt(i, scores[a.key]).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];
  return (
    <figure className="flex flex-col items-center">
      <svg viewBox="0 0 220 220" className="h-56 w-56" role="img" aria-label="Radar de perfil del equipo">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={RADAR_AXES.map((_, i) => pointAt(i, ring * 100).join(",")).join(" ")}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}
        {RADAR_AXES.map((a, i) => {
          const [x, y] = pointAt(i, 100);
          return <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />;
        })}
        <polygon points={polygon} fill="rgba(0,128,255,0.2)" stroke="#0080ff" strokeWidth="2" />
        {RADAR_AXES.map((a, i) => {
          const [x, y] = pointAt(i, scores[a.key]);
          return <circle key={a.key} cx={x} cy={y} r="2.5" fill="#38bdf8" />;
        })}
        {RADAR_AXES.map((a, i) => {
          const [x, y] = pointAt(i, 118);
          return (
            <text key={a.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[9px]">
              {a.label}
            </text>
          );
        })}
      </svg>
      <figcaption className="mt-1 grid grid-cols-3 gap-x-4 gap-y-1 text-[11px] tabular-nums text-slate-400">
        {RADAR_AXES.map((a) => (
          <span key={a.key}>
            {a.label}: <span className="font-semibold text-slate-200">{scores[a.key]}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------
// Lista de factores que afectan un mercado
// ---------------------------------------------------------------------
export function FactorList({ title, factors }: { title: string; factors: IntelligenceFactor[] }) {
  if (factors.length === 0) return null;
  return (
    <div className="card p-4">
      <h4 className="mb-3 text-sm font-semibold text-slate-200">{title}</h4>
      <ul className="space-y-2.5">
        {factors.map((f, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-100">{f.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{f.favors}</span>
                <span className={`chip ${IMPACT_CLS[f.impact]}`}>{f.impact}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{f.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------
// Stats de una ventana de rendimiento
// ---------------------------------------------------------------------
export function PerformanceWindowGrid({ window: w }: { window: PerformanceWindow }) {
  if (w.sampleSize === 0) {
    return <p className="text-sm text-slate-500">Sin partidos en la ventana.</p>;
  }
  const items: Array<[string, string]> = [
    ["Récord", `${w.wins}-${w.draws}-${w.losses}`],
    ["Goles a favor", w.goalsFor.toFixed(2)],
    ["Goles en contra", w.goalsAgainst.toFixed(2)],
    ["Porterías 0", formatPercent(w.cleanSheets)],
    ["BTTS", formatPercent(w.bttsRate)],
    ["Over 2.5", formatPercent(w.over25)],
    ["Corners a favor", w.cornersFor.toFixed(1)],
    ["Tarjetas a favor", w.cardsFor.toFixed(1)],
    ["Tiros", w.shots.toFixed(1)],
    ["Tiros a puerta", w.shotsOnTarget.toFixed(1)],
    ["Posesión", `${w.possession}%`],
    ["xG / xGA", w.xg != null ? `${w.xg} / ${w.xga}` : "—"],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between border-b border-base-800/50 pb-1 text-sm">
          <span className="text-slate-500">{label}</span>
          <span className="tabular-nums font-semibold text-slate-200">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Árbitro
// ---------------------------------------------------------------------
const REF_RELIABILITY_BADGE: Record<string, { cls: string; label: string }> = {
  confirmed: { cls: "bg-emerald-500/15 text-emerald-300", label: "Confirmado" },
  reported: { cls: "bg-sky-500/15 text-sky-300", label: "Reportado" },
  unconfirmed: { cls: "bg-amber-500/15 text-amber-300", label: "Sin verificar" },
  demo: { cls: "bg-base-700/60 text-slate-400", label: "Demo" },
};

export function RefereeCard({ referee, impact }: { referee: Referee; impact: RefereeImpact }) {
  const stat = (label: string, value: string) => (
    <div className="flex items-baseline justify-between border-b border-base-800/50 pb-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums font-semibold text-slate-200">{value}</span>
    </div>
  );
  const rel = REF_RELIABILITY_BADGE[referee.reliability] ?? REF_RELIABILITY_BADGE.unconfirmed;
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-100">{referee.name}</div>
          <div className="text-xs text-slate-500">{referee.nationality}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`chip ${rel.cls}`}>{rel.label}</span>
          <span className="chip bg-base-700/60 capitalize text-slate-300">{referee.gameFlowStyle}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {stat("Amarillas/partido", referee.yellowCardsPerMatch.toFixed(2))}
        {stat("Rojas/partido", referee.redCardsPerMatch.toFixed(2))}
        {stat("Faltas/partido", referee.foulsPerMatch.toFixed(1))}
        {stat("Penales/partido", referee.penaltiesPerMatch.toFixed(2))}
        {stat("Partidos", String(referee.matchesCount))}
      </div>
      <p className="mt-3 rounded-lg bg-base-900/60 p-3 text-xs text-slate-400">{impact.explanation}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
        <span className="chip bg-base-800/60">Tarjetas ×{impact.cardsMultiplier}</span>
        <span className="chip bg-base-800/60">Faltas ×{impact.foulsMultiplier}</span>
        <span className="chip bg-base-800/60">Penal ×{impact.penaltyMultiplier}</span>
      </div>
      <div className="mt-2 text-[11px] text-slate-500">
        Fuente: {referee.source} · Actualizado: {referee.lastUpdated}
      </div>
    </div>
  );
}

/** Tarjeta cuando NO hay designación arbitral confirmada (no se inventa nombre). */
export function RefereeUnconfirmedCard() {
  return (
    <div className="card p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-semibold text-slate-100">Árbitro no confirmado</div>
        <span className={`chip ${REF_RELIABILITY_BADGE.unconfirmed.cls}`}>Sin verificar</span>
      </div>
      <p className="rounded-lg bg-base-900/60 p-3 text-sm text-slate-400">
        La designación arbitral todavía no está verificada. El modelo usa promedios del torneo, equipos y mercado,
        no estadísticas de un árbitro específico.
      </p>
      <p className="mt-2 text-xs text-amber-300/90">
        Las proyecciones disciplinarias (tarjetas/faltas/penales) tienen mayor riesgo hasta que se confirme la
        designación por fuente oficial (FIFA Match Centre).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------
// Entrenador
// ---------------------------------------------------------------------
export function CoachCard({ coach, impact }: { coach: Coach; impact: CoachImpact | null }) {
  const bar = (label: string, value: number) => (
    <div>
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-base-900">
        <div className="h-full bg-sky-500/70" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-100">{coach.name}</div>
          <div className="text-xs text-slate-500">{coach.nationality} · {coach.preferredFormation}</div>
        </div>
        <span className="chip bg-base-700/60 tabular-nums text-slate-300">{formatPercent(coach.winRate)} victorias</span>
      </div>
      <p className="text-sm text-slate-300">{coach.tacticalStyle}</p>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <Stat label="GF/partido" value={coach.goalsForPerMatch.toFixed(2)} />
        <Stat label="GC/partido" value={coach.goalsAgainstPerMatch.toFixed(2)} />
        <Stat label="Tarjetas/p" value={coach.cardsPerMatch.toFixed(2)} />
        <Stat label="Dirigidos" value={String(coach.matchesManaged)} />
      </div>
      {impact ? (
        <div className="mt-3 space-y-2">
          {bar("Sesgo ofensivo", (impact.attackingBias + 1) / 2)}
          {bar("Presión alta", impact.pressIntensity)}
          {bar("Disciplina", impact.discipline)}
          {bar("Estabilidad", impact.projectStability)}
        </div>
      ) : null}
      <p className="mt-3 text-[11px] text-slate-600">{coach.notes}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-base-800/50 pb-1">
      <span className="text-slate-500">{label}</span>
      <span className="tabular-nums font-semibold text-slate-200">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
// Pick del reporte
// ---------------------------------------------------------------------
export function MatchPickCard({ pick }: { pick: MatchPick }) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">{pick.market}</div>
          <div className="font-semibold text-slate-100">{pick.pick}</div>
        </div>
        <div className="flex items-center gap-2">
          <EdgeBadge edge={pick.edge} />
          <ConfidenceBadge confidence={pick.confidence} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs tabular-nums text-slate-400">
        <span>Prob. modelo <b className="text-slate-200">{formatPercent(pick.modelProbability)}</b></span>
        <span>Cuota justa <b className="text-slate-200">{pick.fairOdds.toFixed(2)}</b></span>
        <span>Cuota mercado <b className="text-slate-200">{pick.marketOdds.toFixed(2)}</b></span>
      </div>
      {pick.reasonsFor.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-slate-400">
          {pick.reasonsFor.map((r, i) => (
            <li key={i} className="flex gap-1.5"><span className="text-edge-pos">+</span>{r}</li>
          ))}
        </ul>
      ) : null}
      {pick.reasonsAgainst.length > 0 ? (
        <ul className="mt-1.5 space-y-1 text-xs text-slate-500">
          {pick.reasonsAgainst.map((r, i) => (
            <li key={i} className="flex gap-1.5"><span className="text-edge-neg">−</span>{r}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3">
        <DataQualityBadge quality={pick.dataQuality} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Lista de jugadores clave
// ---------------------------------------------------------------------
export function KeyPlayerCard({ player, teamFlag }: { player: PlayerIntelligenceProfile; teamFlag?: string }) {
  return (
    <Link href={`/players/${player.playerId}`} className="card card-hover block p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-100">
          {teamFlag ? <span className="mr-1">{teamFlag}</span> : null}
          {player.name}
        </span>
        <span className="chip bg-base-800/60 text-[11px] text-slate-400">{player.position}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums text-slate-500">
        <span>G+A <b className="text-slate-300">{player.goalContributions}</b></span>
        <span>Tiros <b className="text-slate-300">{player.shots}</b></span>
        <span>Min <b className="text-slate-300">{player.expectedMinutes}</b></span>
        <span>Rotación: {player.rotationRisk}</span>
      </div>
      {(player.penaltyTaker || player.freeKicks || player.corners) ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {player.penaltyTaker ? <span className="chip bg-base-800/60 text-[10px] text-edge-mid">Penaltis</span> : null}
          {player.freeKicks ? <span className="chip bg-base-800/60 text-[10px] text-slate-400">Tiros libres</span> : null}
          {player.corners ? <span className="chip bg-base-800/60 text-[10px] text-slate-400">Corners</span> : null}
        </div>
      ) : null}
    </Link>
  );
}

// ---------------------------------------------------------------------
// Lista de partidos historicos
// ---------------------------------------------------------------------
export function HistoricalMatchList({
  matches,
  labels,
  limit,
}: {
  matches: HistoricalMatch[];
  labels: Record<string, { name: string; flag: string }>;
  limit?: number;
}) {
  const rows = typeof limit === "number" ? matches.slice(0, limit) : matches;
  if (rows.length === 0) return <p className="text-sm text-slate-500">Sin partidos históricos.</p>;
  const lab = (id: string) => labels[id] ?? { name: id, flag: "🏳️" };
  return (
    <div className="space-y-1.5">
      {rows.map((m) => {
        const h = lab(m.homeTeam);
        const a = lab(m.awayTeam);
        return (
          <div key={m.id} className="flex items-center justify-between gap-2 border-b border-base-800/50 pb-1.5 text-sm last:border-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-24 shrink-0 text-[11px] text-slate-500">{formatDate(m.date)}</span>
              <span className="truncate text-slate-300">
                {h.flag} {h.name} <span className="tabular-nums font-semibold text-slate-100">{m.homeScore}-{m.awayScore}</span> {a.name} {a.flag}
              </span>
            </div>
            <span className="chip shrink-0 bg-base-800/60 text-[10px] capitalize text-slate-400">{m.matchType}</span>
          </div>
        );
      })}
    </div>
  );
}
