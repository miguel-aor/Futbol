import {
  REAL_LEADERBOARDS,
  TOURNAMENT_STATS_AS_OF,
  TOURNAMENT_STATS_SOURCES,
  type RealLeaderboard,
} from "@/data/tournament-stats";
import { TeamFlag } from "@/components/worldcup/TeamFlag";
import { SectionTitle } from "@/components/primitives";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-wc-text">Estadísticas</h1>
          <p className="text-sm text-wc-muted">
            Líderes reales del torneo: jornada 1 completa + jornada 2 de los grupos A y B. Goleadores,
            asistencias, tiros, tiros a puerta, faltas y entradas.
          </p>
        </div>
        <span className="chip border border-white/10 bg-white/5 text-wc-muted">
          Datos al {formatDate(`${TOURNAMENT_STATS_AS_OF}T12:00:00.000Z`)}
        </span>
      </div>

      <p className="wc-card p-3 text-xs text-wc-muted">
        Números <span className="text-wc-gold">reales</span> de lo ya jugado (28 partidos: J1 completa + J2 de
        los grupos A y B). <span className="text-wc-gold">Goleadores</span> y{" "}
        <span className="text-wc-gold">asistencias</span> ya incluyen la J2 de A/B (Opta Analyst/Wikipedia; ej.
        Jonathan David, hat-trick + asistencia vs Catar). Tiros, tiros a puerta, faltas y entradas{" "}
        <span className="text-wc-gold">por jugador</span> siguen solo tras la J1 (esas tablas individuales aún
        no se publican para la J2; sí hay totales de equipo por partido en Analytics). Fuentes:{" "}
        {TOURNAMENT_STATS_SOURCES.join(" · ")}.
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REAL_LEADERBOARDS.map((board) => (
          <LeaderboardCard key={board.key} board={board} />
        ))}
      </div>
    </div>
  );
}

function LeaderboardCard({ board }: { board: RealLeaderboard }) {
  const top = board.entries[0]?.value ?? 0;
  return (
    <section className="wc-card p-4 wc-fade-up">
      <SectionTitle title={board.label} subtitle={board.note} />
      <ol className="space-y-1">
        {board.entries.map((e, i) => (
          <li
            key={`${e.teamId}-${e.name}`}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 odd:bg-white/[0.02]"
          >
            <span
              className={`w-5 text-center text-xs font-bold tabular-nums ${i === 0 ? "text-wc-gold" : "text-wc-muted"}`}
            >
              {i + 1}
            </span>
            <TeamFlag teamId={e.teamId} size={18} title={e.country} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-wc-text">{e.name}</span>
            <span className="hidden text-[11px] text-wc-muted sm:inline">{e.country}</span>
            <span className="w-7 text-right tabular-nums text-sm font-bold text-wc-gold">{e.value}</span>
            {/* mini barra proporcional al líder */}
            <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-white/10 lg:inline-block">
              <span
                className="block h-full bg-wc-gold/70"
                style={{ width: `${top > 0 ? Math.round((e.value / top) * 100) : 0}%` }}
              />
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-2 text-right text-[11px] text-wc-muted">{board.unit}</div>
    </section>
  );
}
