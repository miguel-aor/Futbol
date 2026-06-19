"use client";

import { MOCK_HIDDEN_GEMS } from "@/data/footballAnalyticsMock";
import type { ScoutingPlayer } from "@/lib/analytics/types";
import { InfoBox, RadialScore, SectionHeading, SourceBadge, Tag, num } from "../primitives";

export function HiddenGemsTab({
  shortlistIds,
  onAdd,
}: {
  shortlistIds: Set<string>;
  onAdd: (p: ScoutingPlayer) => void;
}) {
  return (
    <div className="space-y-5">
      <InfoBox title="Hidden Gems">
        Jugadores potencialmente infravalorados: menores de 24, con buen rendimiento por 90 minutos, en ligas
        menos visibles o con baja exposición mediática. El score penaliza muestras pequeñas de minutos.
      </InfoBox>

      <div className="flex items-center justify-between">
        <SectionHeading title={`${MOCK_HIDDEN_GEMS.length} joyas detectadas`} subtitle="Ordenadas por hidden gem score." />
        <SourceBadge source="Demo" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {MOCK_HIDDEN_GEMS.map(({ player, hiddenGemScore, reasons }) => (
          <div key={player.id} className="wc-card p-4">
            <div className="flex items-start gap-4">
              <RadialScore value={hiddenGemScore} label="Gem" size={76} color="#00A86B" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-semibold text-wc-text">{player.name}</div>
                  <button
                    type="button"
                    onClick={() => onAdd(player)}
                    disabled={shortlistIds.has(player.id)}
                    className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${
                      shortlistIds.has(player.id) ? "cursor-default text-wc-muted" : "bg-wc-gold/15 text-wc-gold hover:bg-wc-gold/25"
                    }`}
                  >
                    {shortlistIds.has(player.id) ? "En shortlist ✓" : "+ Shortlist"}
                  </button>
                </div>
                <div className="text-xs text-wc-muted">{player.position} · {player.team} · {player.age} años · {player.league}</div>
                <div className="mt-1 text-xs text-wc-muted">
                  Scouting {player.scoutingScore} · Rating {num(player.rating365, 1)} · {player.minutes} min
                  {player.estimatedMarketValue != null ? ` · ~${player.estimatedMarketValue}M€` : ""}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {player.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
            {reasons.length ? (
              <ul className="mt-2 list-inside list-disc text-[11px] text-wc-muted">
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
