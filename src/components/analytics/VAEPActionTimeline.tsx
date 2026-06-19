"use client";

import type { VAEPAction } from "@/lib/analytics/types";

const ACTION_LABEL: Record<VAEPAction["actionType"], string> = {
  pass: "Pase",
  cross: "Centro",
  dribble: "Regate",
  carry: "Conducción",
  shot: "Tiro",
  tackle: "Entrada",
  interception: "Intercepción",
  recovery: "Recuperación",
  foul: "Falta",
  clearance: "Despeje",
  take_on: "Encare",
};

/**
 * Línea de tiempo de acciones con su valor VAEP. Barras hacia arriba =
 * acciones positivas (suman prob. de anotar / restan de conceder); hacia
 * abajo = negativas.
 */
export function VAEPActionTimeline({ actions }: { actions: VAEPAction[] }) {
  const maxAbs = Math.max(...actions.map((a) => Math.abs(a.vaepValue)), 0.001);
  return (
    <div>
      <div className="relative flex h-44 items-stretch gap-1">
        {actions.map((a) => {
          const h = (Math.abs(a.vaepValue) / maxAbs) * 50; // % desde el centro
          const positive = a.vaepValue >= 0;
          return (
            <div
              key={a.id}
              className="group relative flex flex-1 flex-col items-center justify-center"
              title={`${a.minute}' ${ACTION_LABEL[a.actionType]} · VAEP ${a.vaepValue >= 0 ? "+" : ""}${a.vaepValue.toFixed(3)}`}
            >
              {/* mitad superior (positivo) */}
              <div className="flex h-1/2 w-full items-end justify-center">
                {positive ? (
                  <div
                    className="w-2.5 rounded-t bg-wc-green/80 transition-all group-hover:bg-wc-green"
                    style={{ height: `${h * 2}%` }}
                  />
                ) : null}
              </div>
              {/* mitad inferior (negativo) */}
              <div className="flex h-1/2 w-full items-start justify-center">
                {!positive ? (
                  <div
                    className="w-2.5 rounded-b bg-wc-red/80 transition-all group-hover:bg-wc-red"
                    style={{ height: `${h * 2}%` }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
        {/* eje central */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-white/15" />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-wc-muted">
        <span>{actions[0]?.minute}&apos;</span>
        <span>min →</span>
        <span>{actions[actions.length - 1]?.minute}&apos;</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-wc-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-wc-green" /> Acción positiva (+VAEP)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-wc-red" /> Acción negativa (−VAEP)
        </span>
      </div>
    </div>
  );
}
