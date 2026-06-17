// =====================================================================
// Registro central de proveedores. Selecciona el provider activo segun
// DATA_PROVIDER y SIEMPRE garantiza datos: si el provider elegido no
// esta disponible o falla, hace fallback a mock. Es el unico punto que
// la app (API y server components) debe consumir.
// =====================================================================
import "server-only";
import type { DataBundle, DataProvider, DataSnapshot, DataSource, ProviderMetadata } from "./types";
import { mockProvider } from "./mockProvider";
import { manualJsonProvider } from "./manualJsonProvider";
import { scores365ExperimentalProvider } from "./scores365ExperimentalProvider";

const PROVIDERS: Record<DataSource, DataProvider> = {
  mock: mockProvider,
  manual: manualJsonProvider,
  "365scores": scores365ExperimentalProvider,
};

function configuredProviderId(): DataSource {
  const raw = (process.env.DATA_PROVIDER ?? "mock").toLowerCase();
  if (raw === "manual") return "manual";
  if (raw === "365scores" || raw === "365") return "365scores";
  return "mock";
}

/** Bundle activo con fallback garantizado a mock. */
export async function getActiveBundle(): Promise<DataBundle> {
  const id = configuredProviderId();
  const provider = PROVIDERS[id];
  try {
    const meta = await provider.getMetadata();
    if (meta.available) {
      return await provider.getBundle();
    }
    // Provider configurado pero sin datos: usar mock, dejando claro el origen.
    if (id !== "mock") {
      const base = await mockProvider.getBundle();
      return {
        ...base,
        meta: {
          ...base.meta,
          description: `Provider "${id}" sin datos disponibles. Mostrando mock data como respaldo.`,
        },
      };
    }
    return await mockProvider.getBundle();
  } catch (err) {
    console.error(`[providerRegistry] Error en provider "${id}", usando mock:`, err);
    return mockProvider.getBundle();
  }
}

/** Metadata del provider activo (con fallback). */
export async function getActiveProviderMetadata(): Promise<ProviderMetadata> {
  return (await getActiveBundle()).meta;
}

/** Metadata de TODOS los providers (para UI de fuentes). */
export async function getAllProviderMetadata(): Promise<ProviderMetadata[]> {
  const ids: DataSource[] = ["mock", "manual", "365scores"];
  const out: ProviderMetadata[] = [];
  for (const id of ids) {
    try {
      out.push(await PROVIDERS[id].getMetadata());
    } catch {
      out.push({
        id,
        label: id,
        description: "No disponible.",
        available: false,
        lastUpdated: null,
      });
    }
  }
  return out;
}

/** Todos los snapshots de todos los providers. */
export async function listAllSnapshots(): Promise<DataSnapshot[]> {
  const all: DataSnapshot[] = [];
  for (const id of ["manual", "365scores"] as DataSource[]) {
    try {
      all.push(...(await PROVIDERS[id].listSnapshots()));
    } catch {
      // ignorar provider que falle al listar.
    }
  }
  return all;
}

export const activeProviderId = configuredProviderId;
