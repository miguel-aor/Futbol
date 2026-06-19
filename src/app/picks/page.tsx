import type { Metadata } from "next";
import { ValuePicksClient } from "@/components/bet/ValuePicksClient";

export const metadata: Metadata = {
  title: "Value Picks · Ranking de oportunidades",
  description: "Ranking de picks por valor estadístico: edge, EV, confianza, riesgo y fuente.",
};

export default function ValuePicksPage() {
  return <ValuePicksClient />;
}
