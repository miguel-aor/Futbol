import type { Metadata } from "next";
import { PosicionesClient } from "@/components/worldcup/PosicionesClient";

export const metadata: Metadata = {
  title: "Posiciones y llaves · Mundial 2026",
  description: "Posiciones de grupos, escenarios de clasificación y llaves proyectadas (corte 21-06-2026 CDMX).",
};

export default function PosicionesPage() {
  return <PosicionesClient />;
}
