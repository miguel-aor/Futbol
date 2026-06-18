import { getActiveProviderMetadata } from "@/lib/data-providers/providerRegistry";
import { getPlayerCards, getTeamCards } from "@/lib/data-access";
import { PlayerSelector } from "@/components/worldcup/PlayerSelector";
import { DataSourceBadge } from "@/components/badges";
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
          <h1 className="text-2xl font-bold text-wc-text">Jugadores</h1>
          <p className="text-sm text-wc-muted">
            Convocatorias reales del Mundial 2026. Busca, filtra por posición y compara dos jugadores.
          </p>
        </div>
        <DataSourceBadge source={meta.id} updatedAt={meta.lastUpdated ? formatUpdatedAt(meta.lastUpdated) : undefined} />
      </div>
      <PlayerSelector players={players} teams={teamOptions} />
    </div>
  );
}
