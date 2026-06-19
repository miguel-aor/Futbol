"use client";

import type { Shot } from "@/lib/analytics/types";

/**
 * Shot map sobre una media cancha (ataque hacia la derecha). El radio del
 * punto crece con el xG; los goles van rellenos en dorado.
 */
export function ShotMap({
  shots,
  homeTeamId,
}: {
  shots: Shot[];
  /** id del equipo "local" para colorear sus tiros distinto del rival. */
  homeTeamId?: string;
}) {
  // viewBox: mitad ofensiva. x del shot (50..100) → 0..100; y (0..100) → 0..68.
  const W = 100;
  const H = 68;
  const mapX = (x: number) => ((Math.max(50, x) - 50) / 50) * W;
  const mapY = (y: number) => (y / 100) * H;

  return (
    <div className="w-full">
      <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="w-full" role="img" aria-label="Mapa de tiros">
        {/* césped */}
        <rect x={0} y={0} width={W} height={H} rx={2} fill="#0d1a12" stroke="rgba(255,255,255,0.12)" />
        {/* línea de medio campo (izquierda) */}
        <line x1={0} y1={0} x2={0} y2={H} stroke="rgba(255,255,255,0.12)" />
        <circle cx={0} cy={H / 2} r={9} fill="none" stroke="rgba(255,255,255,0.1)" />
        {/* área grande */}
        <rect x={W - 32} y={H / 2 - 20} width={32} height={40} fill="none" stroke="rgba(255,255,255,0.15)" />
        {/* área chica */}
        <rect x={W - 12} y={H / 2 - 9} width={12} height={18} fill="none" stroke="rgba(255,255,255,0.15)" />
        {/* portería */}
        <rect x={W} y={H / 2 - 4} width={1.5} height={8} fill="#D6B15E" />
        {/* punto de penal */}
        <circle cx={W - 22} cy={H / 2} r={0.6} fill="rgba(255,255,255,0.4)" />

        {shots.map((s) => {
          const cx = mapX(s.x);
          const cy = mapY(s.y);
          const r = 1.6 + s.xg * 6;
          const isHome = homeTeamId ? s.teamId === homeTeamId : true;
          const stroke = isHome ? "#E7C77C" : "#2563EB";
          return (
            <circle
              key={s.id}
              cx={cx}
              cy={cy}
              r={r}
              fill={s.isGoal ? stroke : "transparent"}
              fillOpacity={s.isGoal ? 0.9 : 0}
              stroke={stroke}
              strokeWidth={s.isGoal ? 0 : 1}
            >
              <title>{`${s.playerName} · ${s.minute}' · xG ${s.xg.toFixed(2)}${s.isGoal ? " · GOL" : ""}`}</title>
            </circle>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-wc-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-wc-gold" /> Gol
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-wc-gold" /> Tiro local
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-wc-blue" /> Tiro visita
        </span>
        <span>Tamaño del punto = xG del tiro</span>
      </div>
    </div>
  );
}
