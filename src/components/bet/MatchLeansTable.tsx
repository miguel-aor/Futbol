import type { BetSelection } from "@/lib/bet/types";

const RISK_LABEL: Record<string, { label: string; cls: string }> = {
  low: { label: "Bajo", cls: "text-edge-pos" },
  medium: { label: "Medio", cls: "text-amber-300" },
  high: { label: "Alto", cls: "text-edge-neg" },
};

function fmtAmerican(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * Tabla de PREDICCIONES del modelo (leans) para "Picks del partido" cuando NO hay
 * momio de mercado: muestra prob. del modelo, cuota justa, confianza, riesgo y
 * explicación. No muestra edge/EV (no hay mercado) ni rating de "value".
 */
export function MatchLeansTable({ rows }: { rows: BetSelection[] }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-base-800 text-[11px] uppercase tracking-wide text-slate-500">
            <th className="py-2 text-left font-medium">Mercado</th>
            <th className="py-2 text-left font-medium">Pick</th>
            <th className="px-2 py-2 text-right font-medium">Prob. modelo</th>
            <th className="px-2 py-2 text-right font-medium">Cuota justa</th>
            <th className="px-2 py-2 text-right font-medium">Conf.</th>
            <th className="px-2 py-2 text-left font-medium">Riesgo</th>
            <th className="px-2 py-2 text-left font-medium">Fuente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const risk = RISK_LABEL[r.riskLevel] ?? RISK_LABEL.medium;
            const highVar = r.realismFlags?.some((f) => f.code === "high_variance");
            return (
              <tr key={r.id} className="border-b border-base-800/50 align-top">
                <td className="py-2 text-slate-400">{r.label}</td>
                <td className="py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-100">{r.selection}</span>
                    {highVar ? <span className="chip bg-amber-500/15 text-[10px] text-amber-300">Alta varianza</span> : null}
                    {r.explanation ? <span className="cursor-help text-slate-600" title={r.explanation}>ⓘ</span> : null}
                  </div>
                </td>
                <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-100">{Math.round(r.modelProbability * 100)}%</td>
                <td className="px-2 py-2 text-right tabular-nums text-slate-400">{fmtAmerican(r.americanOdds)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-slate-300">{r.confidenceScore}</td>
                <td className={`px-2 py-2 ${risk.cls}`}>{risk.label}</td>
                <td className="px-2 py-2 text-[11px] text-slate-500">Predicción del modelo</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
