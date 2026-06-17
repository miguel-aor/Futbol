import { getActiveProviderMetadata, getAllProviderMetadata, listAllSnapshots } from "@/lib/data-providers/providerRegistry";
import { getOpportunityViews, getTeamCards, getUpcomingMatches } from "@/lib/data-access";
import { DashboardClient } from "@/components/DashboardClient";
import { MatchCard } from "@/components/MatchCard";
import { SnapshotStatus } from "@/components/SnapshotStatus";
import { DataSourceBadge } from "@/components/badges";
import { SectionTitle } from "@/components/primitives";
import { GROUP_IDS } from "@/data/worldcup-teams";
import { formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [meta, providers, snapshots, opportunities, teams, upcoming] = await Promise.all([
    getActiveProviderMetadata(),
    getAllProviderMetadata(),
    listAllSnapshots(),
    getOpportunityViews(),
    getTeamCards(),
    getUpcomingMatches(6),
  ]);

  const teamOptions = teams
    .map((t) => ({ id: t.id, name: t.name, groupId: t.groupId, confederation: t.confederation }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard de oportunidades</h1>
          <p className="text-sm text-slate-500">
            Filtra picks por seleccion, grupo, mercado, probabilidad, edge y fuente.
          </p>
        </div>
        <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
      </div>

      <section>
        <SectionTitle title="Partidos proximos" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Ranking de oportunidades" subtitle="Ordenadas por edge ponderado" />
        <DashboardClient opportunities={opportunities} teams={teamOptions} groups={[...GROUP_IDS]} />
      </section>

      <section>
        <SnapshotStatus providers={providers} snapshots={snapshots} />
      </section>
    </div>
  );
}
