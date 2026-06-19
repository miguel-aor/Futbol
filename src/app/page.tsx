import type { Metadata } from "next";
import { OverviewClient } from "@/components/bet/OverviewClient";

export const metadata: Metadata = {
  title: "Picks con valor · Análisis estadístico de fútbol",
  description:
    "Encuentra picks con valor usando modelos estadísticos de fútbol: edge, EV, confianza y riesgo. Estimaciones, no garantías.",
};

export default function HomePage() {
  return <OverviewClient />;
}
