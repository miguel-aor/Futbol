import type { DataSnapshot, ProviderMetadata } from "@/lib/data-providers/types";
import { DataSourceBadge } from "./badges";

export function SnapshotStatus({
  providers,
  snapshots,
}: {
  providers: ProviderMetadata[];
  snapshots: DataSnapshot[];
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-semibold text-slate-100">Estado de fuentes de datos</div>
      <div className="space-y-2">
        {providers.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-base-900/60 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <DataSourceBadge source={p.id} />
              <span className="text-slate-400">{p.description}</span>
            </div>
            <span
              className={`chip ${
                p.available ? "bg-edge-pos/15 text-edge-pos" : "bg-base-700/60 text-slate-400"
              }`}
            >
              {p.available ? "Disponible" : "Inactivo"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-slate-500">
        {snapshots.length === 0 ? (
          <p>No hay snapshots guardados. La app funciona con mock data.</p>
        ) : (
          <ul className="space-y-1">
            {snapshots.map((s) => (
              <li key={`${s.source}-${s.id}`} className="flex items-center justify-between">
                <span className="text-slate-400">
                  {s.id} · {s.origin}
                </span>
                <span>{s.capturedAt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
