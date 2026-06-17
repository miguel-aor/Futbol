import { getActiveProviderMetadata } from "@/lib/data-providers/providerRegistry";
import { getTeamCards } from "@/lib/data-access";
import { TeamsClient } from "@/components/TeamsClient";
import { DataSourceBadge } from "@/components/badges";
import { GROUP_IDS } from "@/data/worldcup-teams";
import { formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [meta, teams] = await Promise.all([getActiveProviderMetadata(), getTeamCards()]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Selecciones mundialistas</h1>
          <p className="text-sm text-slate-500">48 selecciones participantes. Busca y filtra por grupo o confederacion.</p>
        </div>
        <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
      </div>
      <TeamsClient teams={teams} groups={[...GROUP_IDS]} />
    </div>
  );
}
