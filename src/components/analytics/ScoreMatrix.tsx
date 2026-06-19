"use client";

import { pct } from "./primitives";

/**
 * Heatmap de la matriz de marcadores (Poisson/Dixon-Coles).
 * matrix[h][a] = probabilidad del marcador exacto h-a.
 */
export function ScoreMatrix({
  matrix,
  homeName,
  awayName,
  best,
}: {
  matrix: number[][];
  homeName: string;
  awayName: string;
  best?: { home: number; away: number };
}) {
  const flat = matrix.flat();
  const max = Math.max(...flat, 0.0001);
  const size = matrix.length;

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="mb-1 text-center text-[11px] font-medium uppercase tracking-wide text-wc-muted">
          {awayName} →
        </div>
        <div className="flex">
          <div className="flex flex-col justify-center pr-1">
            <span className="-rotate-180 text-center text-[11px] font-medium uppercase tracking-wide text-wc-muted [writing-mode:vertical-rl]">
              {homeName} →
            </span>
          </div>
          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-6" />
                {Array.from({ length: size }, (_, a) => (
                  <th key={a} className="w-9 text-center text-xs font-semibold text-wc-muted">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, h) => (
                <tr key={h}>
                  <td className="text-center text-xs font-semibold text-wc-muted">{h}</td>
                  {row.map((p, a) => {
                    const intensity = p / max;
                    const isBest = best && best.home === h && best.away === a;
                    return (
                      <td
                        key={a}
                        className={`h-9 w-9 rounded text-center align-middle text-[10px] font-semibold tabular-nums ${
                          isBest ? "ring-2 ring-wc-gold" : ""
                        }`}
                        style={{
                          backgroundColor: `rgba(214,177,94,${(0.08 + intensity * 0.85).toFixed(3)})`,
                          color: intensity > 0.5 ? "#07070A" : "#E6E8EE",
                        }}
                        title={`${homeName} ${h}-${a} ${awayName}: ${pct(p, 1)}`}
                      >
                        {(p * 100).toFixed(p >= 0.1 ? 0 : 1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center text-[11px] text-wc-muted">
          Celdas = probabilidad del marcador exacto (%). Resaltada = más probable.
        </div>
      </div>
    </div>
  );
}
