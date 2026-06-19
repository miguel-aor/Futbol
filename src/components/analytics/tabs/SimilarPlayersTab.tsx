"use client";

import { useMemo, useState } from "react";
import { MOCK_SCOUTING_PLAYERS } from "@/data/footballAnalyticsMock";
import { findSimilarPlayers } from "@/lib/scoutingModels";
import { Field, InfoBox, RadialScore, SectionHeading, Select, SourceBadge, Tag } from "../primitives";

export function SimilarPlayersTab() {
  const [baseId, setBaseId] = useState(MOCK_SCOUTING_PLAYERS[2]?.id ?? MOCK_SCOUTING_PLAYERS[0].id);
  const base = MOCK_SCOUTING_PLAYERS.find((p) => p.id === baseId)!;
  const similar = useMemo(() => findSimilarPlayers(base, MOCK_SCOUTING_PLAYERS, 5), [base]);

  return (
    <div className="space-y-5">
      <InfoBox title="Similar Players">
        Encuentra jugadores con un perfil estadístico parecido al de un jugador base, comparando producción por
        90 minutos, perfil ofensivo/defensivo, xG/xA, intercepciones, entradas, rating y edad. El similarity
        score va de 0 a 100.
      </InfoBox>

      <div className="wc-card p-4">
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field label="Jugador base">
            <Select
              value={baseId}
              onChange={setBaseId}
              options={MOCK_SCOUTING_PLAYERS.map((p) => ({ value: p.id, label: `${p.name} · ${p.team}` }))}
            />
          </Field>
          <div className="text-sm text-wc-muted">
            <span className="font-semibold text-wc-text">{base.name}</span> — {base.position} · {base.team} · {base.age} años · {base.league}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <SectionHeading title="Top 5 jugadores similares" />
        <SourceBadge source="Demo" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {similar.map((s) => (
          <div key={s.playerId} className="wc-card flex items-center gap-4 p-4">
            <RadialScore value={s.similarityScore} label="Similitud" size={76} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-wc-text">{s.name}</div>
              <div className="text-xs text-wc-muted">{s.position} · {s.team} · {s.age} años · {s.league}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {s.keyDifferences.map((d, i) => (
                  <Tag key={i}>{d}</Tag>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
