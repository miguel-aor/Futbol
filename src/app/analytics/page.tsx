import type { Metadata } from "next";
import { FootballAnalyticsDashboard } from "@/components/analytics/FootballAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Football Analytics · Modelos estadísticos",
  description:
    "Modelos estadísticos aplicados al fútbol: Elo/SPI, Poisson/Dixon-Coles, xG, Monte Carlo, VAEP y scouting estadístico. Datos demo, preparado para 365Scores y fuentes confiables.",
};

export default function AnalyticsPage() {
  return <FootballAnalyticsDashboard />;
}
