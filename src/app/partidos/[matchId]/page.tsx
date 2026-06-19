import type { Metadata } from "next";
import { MatchAnalysisClient } from "@/components/bet/MatchAnalysisClient";

export const metadata: Metadata = {
  title: "Análisis del partido · Picks y mercados",
  description: "Picks recomendadas, mercados, jugadores y ticket del partido.",
};

export default async function MatchAnalysisPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <MatchAnalysisClient matchId={matchId} />;
}
