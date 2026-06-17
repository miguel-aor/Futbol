import Link from "next/link";
import { getActiveProviderMetadata } from "@/lib/data-providers/providerRegistry";
import { getBestPicksByCategory, getOpportunityViews, getUpcomingMatches } from "@/lib/data-access";
import type { OpportunityView } from "@/lib/data-access";
import { MatchCard } from "@/components/MatchCard";
import { DataSourceBadge, EdgeBadge, ProbabilityBadge } from "@/components/badges";
import { SectionTitle, StatCard } from "@/components/primitives";
import { MARKET_BY_KEY } from "@/data/markets";
import { formatUpdatedAt } from "@/lib/format";
import { BallIcon, CardIcon, FlagIcon, TargetIcon } from "@/components/icons";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [meta, upcoming, topOps, best] = await Promise.all([
    getActiveProviderMetadata(),
    getUpcomingMatches(6),
    getOpportunityViews(),
    getBestPicksByCategory(),
  ]);

  const positiveEdge = topOps.filter((o) => o.edge > 0).length;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="card relative overflow-hidden p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <span className="chip bg-brand-600/15 text-brand-400">Mundial 2026</span>
            <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
          </div>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
            Analiza partidos del Mundial con probabilidades inteligentes
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Prototipo interno de analisis enfocado solo en el Mundial 2026 y selecciones
            participantes: probabilidad del modelo, cuota justa, edge contra cuota de mercado mock y
            picks rankeados. Sin clubes, sin ligas, sin apuestas reales.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500">
              Ver dashboard
            </Link>
            <Link href="/worldcup" className="rounded-lg border border-base-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-base-800">
              Explorar el Mundial
            </Link>
          </div>
        </div>
      </section>

      {/* Resumen */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Partidos proximos" value={upcoming.length >= 6 ? "6+" : upcoming.length} hint="En analisis" />
        <StatCard label="Oportunidades" value={topOps.length} hint="Picks generados" accent="brand" />
        <StatCard label="Con edge positivo" value={positiveEdge} accent="pos" hint="Valor vs mercado mock" />
        <StatCard label="Fuente activa" value={meta.label} hint={meta.available ? "Disponible" : "Respaldo mock"} />
      </section>

      {/* Top oportunidades */}
      <section>
        <SectionTitle
          title="Top oportunidades del dia"
          subtitle="Mejores picks por edge ponderado"
          action={<Link href="/dashboard" className="text-sm font-medium text-brand-400 hover:text-brand-500">Ver todas →</Link>}
        />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <BestPickCard title="Mejor pick de goles" op={best.goals} icon={<BallIcon className="h-5 w-5 text-brand-400" />} />
          <BestPickCard title="Mejor pick de corners" op={best.corners} icon={<FlagIcon className="h-5 w-5 text-sky-400" />} />
          <BestPickCard title="Mejor pick de tarjetas" op={best.cards} icon={<CardIcon className="h-5 w-5 text-edge-mid" />} />
          <BestPickCard title="Mejor pick de jugador" op={best.player} icon={<TargetIcon className="h-5 w-5 text-fuchsia-400" />} />
        </div>
      </section>

      {/* Proximos partidos */}
      <section>
        <SectionTitle
          title="Partidos proximos"
          action={<Link href="/dashboard" className="text-sm font-medium text-brand-400 hover:text-brand-500">Mas →</Link>}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BestPickCard({ title, op, icon }: { title: string; op: OpportunityView | null; icon: ReactNode }) {
  if (!op) {
    return (
      <div className="card p-4">
        <div className="label-dim">{title}</div>
        <p className="mt-2 text-sm text-slate-500">Sin pick disponible.</p>
      </div>
    );
  }
  return (
    <Link href={op.match ? `/matches/${op.match.id}` : "/dashboard"} className="card card-hover block p-4">
      <div className="flex items-center justify-between">
        <span className="label-dim">{title}</span>
        {icon}
      </div>
      <div className="mt-2 font-semibold text-slate-100">{op.pick}</div>
      <div className="text-xs text-slate-500">
        {op.match ? `${op.match.home.code} vs ${op.match.away.code}` : ""} ·{" "}
        {MARKET_BY_KEY[op.marketKey]?.label ?? op.marketKey}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <ProbabilityBadge probability={op.modelProbability} />
        <EdgeBadge edge={op.edge} />
      </div>
    </Link>
  );
}
