import type { Metadata } from "next";
import { PartidosClient } from "@/components/bet/PartidosClient";

export const metadata: Metadata = {
  title: "Partidos · Análisis y picks",
  description: "Partidos con picks disponibles y calendario real del Mundial 2026.",
};

export default function PartidosPage() {
  return <PartidosClient />;
}
