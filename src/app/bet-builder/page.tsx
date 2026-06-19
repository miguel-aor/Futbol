import type { Metadata } from "next";
import { BetBuilderClient } from "@/components/bet/BetBuilderClient";

export const metadata: Metadata = {
  title: "Bet Builder · Construye y evalúa picks",
  description: "Captura líneas y momios, evalúa el valor estadístico y genera parleys con riesgo medido.",
};

export default function BetBuilderPage() {
  return <BetBuilderClient />;
}
