"use client";

export interface RadarSeries {
  name: string;
  color: string;
  /** Valores 0..max, en el mismo orden que `axes`. */
  values: number[];
}

/**
 * Radar / spider chart en SVG puro (sin dependencias). Compara una o varias
 * series sobre los mismos ejes. Accesible: role="img" + <desc> + una tabla
 * sr-only con los valores numéricos por eje.
 */
export function RadarChart({
  axes,
  series,
  max = 100,
  size = 320,
  ariaSummary,
}: {
  axes: string[];
  series: RadarSeries[];
  max?: number;
  size?: number;
  ariaSummary?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const pad = 60;
  const radius = size / 2 - pad;
  const n = axes.length;

  const angle = (i: number) => ((-90 + (360 / n) * i) * Math.PI) / 180;
  const at = (value: number, i: number): [number, number] => {
    const r = radius * Math.max(0, Math.min(1, value / max));
    return [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  };
  const ring = (level: number) =>
    axes
      .map((_, i) => {
        const r = radius * level;
        return `${(cx + r * Math.cos(angle(i))).toFixed(1)},${(cy + r * Math.sin(angle(i))).toFixed(1)}`;
      })
      .join(" ");

  const levels = [0.25, 0.5, 0.75, 1];
  const summary =
    ariaSummary ??
    `Gráfica radar comparando ${series.map((s) => s.name).join(" y ")} en los ejes ${axes.join(", ")}.`;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-xs sm:max-w-sm">
        <svg
          viewBox={`-52 -22 ${size + 104} ${size + 44}`}
          className="w-full"
          role="img"
          aria-label={summary}
        >
          <desc>{summary}</desc>

          {/* anillos concéntricos */}
          {levels.map((lv, idx) => (
            <polygon
              key={idx}
              points={ring(lv)}
              fill={idx === levels.length - 1 ? "rgba(255,255,255,0.02)" : "none"}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
          ))}

          {/* radios + etiquetas de eje */}
          {axes.map((label, i) => {
            const [ox, oy] = at(max, i);
            const a = angle(i);
            const cos = Math.cos(a);
            const lx = cx + (radius + 16) * cos;
            const ly = cy + (radius + 16) * Math.sin(a);
            const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
            return (
              <g key={label}>
                <line x1={cx} y1={cy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className="fill-wc-muted"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* polígonos de cada serie */}
          {series.map((s) => {
            const pts = s.values.map((v, i) => at(v, i));
            const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
            return (
              <g key={s.name}>
                <polygon
                  points={poly}
                  fill={s.color}
                  fillOpacity={0.16}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {pts.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={2.6} fill={s.color} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* leyenda visible */}
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-wc-muted">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      {/* tabla de valores para lectores de pantalla (no solo visual) */}
      <table className="sr-only">
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th>Métrica</th>
            {series.map((s) => (
              <th key={s.name}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {axes.map((a, i) => (
            <tr key={a}>
              <th>{a}</th>
              {series.map((s) => (
                <td key={s.name}>{Math.round(s.values[i])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
