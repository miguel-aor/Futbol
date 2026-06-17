// Mini grafico de barras SVG, sin dependencias. Determinista.
export function TrendMiniChart({
  values,
  color = "#34d399",
  label,
}: {
  values: number[];
  color?: string;
  label?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 0.0001);
  const w = 88;
  const h = 28;
  const gap = 3;
  const barW = (w - gap * (values.length - 1)) / values.length;
  return (
    <div className="flex flex-col gap-1">
      {label ? <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span> : null}
      <svg width={w} height={h} className="overflow-visible">
        {values.map((v, i) => {
          const bh = Math.max(2, (v / max) * h);
          return (
            <rect
              key={i}
              x={i * (barW + gap)}
              y={h - bh}
              width={barW}
              height={bh}
              rx={1.5}
              fill={color}
              opacity={0.45 + (i / values.length) * 0.55}
            />
          );
        })}
      </svg>
    </div>
  );
}

/** Mini visualizacion de forma W/D/L. */
export function FormDots({ form }: { form: Array<"W" | "D" | "L"> }) {
  const map = { W: "bg-edge-pos", D: "bg-slate-500", L: "bg-edge-neg" };
  return (
    <div className="flex items-center gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold text-base-950 ${map[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
