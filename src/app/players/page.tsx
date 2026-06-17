import { getActiveProviderMetadata } from "@/lib/data-providers/providerRegistry";
import { getPlayerCards, getTeamCards } from "@/lib/data-access";
import { PlayersClient } from "@/components/PlayersClient";
import { DataSourceBadge } from "@/components/badges";
import { GROUP_IDS } from "@/data/worldcup-teams";
import { formatUpdatedAt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const [meta, players, teams] = await Promise.all([
    getActiveProviderMetadata(),
    getPlayerCards(),
    getTeamCards(),
  ]);

  const teamOptions = teams
    .map((t) => ({ id: t.id, name: t.name, groupId: t.groupId }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Jugadores</h1>
          <p className="text-sm text-slate-500">
            Solo jugadores de selecciones mundialistas. Busca y filtra por seleccion, grupo, posicion o stat.
          </p>
        </div>
        <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
      </div>
      <PlayersClient players={players} teams={teamOptions} groups={[...GROUP_IDS]} />
    </div>
  );
}
