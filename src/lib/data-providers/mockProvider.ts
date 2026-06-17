// Proveedor principal: datos mock deterministas. Funciona sin internet.
import "server-only";
import type { DataBundle, DataProvider, DataSnapshot, ProviderMetadata } from "./types";
import { buildMockBundle } from "@/data/mock-builder";

let cached: DataBundle | null = null;

function bundle(): DataBundle {
  // Se construye una sola vez por proceso (determinista).
  if (!cached) cached = buildMockBundle();
  return cached;
}

export const mockProvider: DataProvider = {
  id: "mock",
  async getMetadata(): Promise<ProviderMetadata> {
    return bundle().meta;
  },
  async getBundle(): Promise<DataBundle> {
    return bundle();
  },
  async listSnapshots(): Promise<DataSnapshot[]> {
    // El proveedor mock no tiene snapshots persistidos.
    return [];
  },
};
