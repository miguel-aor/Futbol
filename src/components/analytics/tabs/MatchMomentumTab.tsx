"use client";

import { FEATURED_MATCH_ID, MOCK_MATCHES, MOCK_MOMENTUM } from "@/data/footballAnalyticsMock";
import { InfoBox, MetricCard, SectionHeading, SourceBadge } from "../primitives";

export function MatchMomentumTab() {
  const match = MOCK_MATCHES.find((m) => m.id === FEATURED_MATCH_ID)!;
  const pts = MOCK_MOMENTUM;

  const W = 600;
  const H = 200;
  const mid = H / 2;
  const maxMin = pts[pts.length - 1].minute || 90;
  const x = (m: number) => (m / maxMin) * W;
  const y = (v: number) => mid - (v / 100) * (mid - 10);

  const homeShare = Math.round(
    (pts.filter((p) => p.value > 0).length / pts.length) * 100,
  );

  // área bajo la curva separada por signo
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.minute).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  return (
    <div className="space-y-5">
      <InfoBox title="Match Momentum">
        El momentum muestra qué equipo dominó en cada tramo del partido combinando posesión, tiros y peligro
        generado. Barras hacia arriba = presión del local; hacia abajo = presión del visitante.
      </InfoBox>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-wc-muted">
          Partido: <span className="font-semibold text-wc-text">{match.homeTeamName} {match.homeGoals}-{match.awayGoals} {match.awayTeamName}</span>
        </div>
        <SourceBadge source="Demo" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label={`Dominio ${match.homeTeamName}`} value={`${homeShare}%`} accent="gold" />
        <MetricCard label={`Dominio ${match.awayTeamName}`} value={`${100 - homeShare}%`} accent="blue" />
        <MetricCard label="Tramos analizados" value={`${pts.length}`} />
      </div>

      <div className="wc-card p-4">
        <SectionHeading title="Gráfica de momentum" subtitle={`Arriba: ${match.homeTeamName} · Abajo: ${match.awayTeamName}`} />
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Momentum del partido">
          {/* franjas */}
          <rect x={0} y={0} width={W} height={mid} fill="rgba(214,177,94,0.05)" />
          <rect x={0} y={mid} width={W} height={mid} fill="rgba(37,99,235,0.05)" />
          {/* barras por tramo */}
          {pts.map((p) => (
            <rect
              key={p.minute}
              x={x(p.minute) - 6}
              y={p.value >= 0 ? y(p.value) : mid}
              width={12}
              height={Math.abs(mid - y(p.value))}
              rx={2}
              fill={p.value >= 0 ? "#D6B15E" : "#2563EB"}
              opacity={0.55}
            >
              <title>{`${p.minute}' · ${p.value >= 0 ? match.homeTeamName : match.awayTeamName} +${Math.abs(p.value)}`}</title>
            </rect>
          ))}
          {/* línea suavizada */}
          <path d={line} fill="none" stroke="#E7C77C" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* eje central */}
          <line x1={0} y1={mid} x2={W} y2={mid} stroke="rgba(255,255,255,0.25)" />
        </svg>
        <div className="mt-1 flex justify-between text-[11px] text-wc-muted">
          <span>0&apos;</span>
          <span>45&apos;</span>
          <span>90&apos;</span>
        </div>
      </div>
    </div>
  );
}
