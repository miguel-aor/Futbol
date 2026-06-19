import type { Metadata } from "next";
import { DisclaimerBar } from "@/components/bet/ui";

export const metadata: Metadata = {
  title: "Metodología · Cómo se calcula el valor",
  description: "Probabilidad modelo, momio implícito, edge, EV, confianza, riesgo, correlación y rol de la IA.",
};

const ITEMS: Array<{ term: string; def: string }> = [
  { term: "Probabilidad del modelo", def: "Estimación de que ocurra un evento según modelos estadísticos (Elo/SPI, Poisson/Dixon-Coles, xG, Monte Carlo, conteo y scouting). Es una estimación, no una certeza." },
  { term: "Momio implícito", def: "La probabilidad que implica el momio ofrecido. +200 ≈ 33.3%, −150 ≈ 60%. Incluye el margen de la casa." },
  { term: "Cuota justa (no-vig)", def: "Probabilidad sin el margen de la casa, normalizando ambos lados de un mercado de dos resultados." },
  { term: "Edge", def: "Diferencia entre la probabilidad del modelo y la implícita. Edge positivo sugiere valor estadístico." },
  { term: "Expected Value (EV)", def: "Valor esperado por unidad apostada: probModelo × (decimal − 1) − (1 − probModelo). EV positivo = valor estimado a favor." },
  { term: "Confianza", def: "Score 0-100 que combina edge, EV, calidad/origen del dato, volatilidad del mercado y riesgo. No es probabilidad de acertar." },
  { term: "Riesgo", def: "Nivel (bajo/medio/alto) según volatilidad del mercado, muestra, origen del dato y correlación." },
  { term: "Correlación en parley", def: "Cuando dos picks dependen entre sí (ej. over goles + ambos anotan), la probabilidad combinada no se multiplica de forma ingenua: se penaliza y se avisa." },
];

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-wc-text">Metodología</h1>
        <p className="text-sm text-wc-muted">Qué significan las métricas que ves en cada pick y ticket.</p>
      </div>

      <DisclaimerBar />

      <dl className="space-y-3">
        {ITEMS.map((it) => (
          <div key={it.term} className="wc-card p-4">
            <dt className="text-sm font-semibold text-wc-gold">{it.term}</dt>
            <dd className="mt-1 text-sm text-wc-muted">{it.def}</dd>
          </div>
        ))}
      </dl>

      <div className="wc-card p-4">
        <h2 className="text-sm font-semibold text-wc-gold">Fuentes de datos</h2>
        <p className="mt-1 text-sm text-wc-muted">
          Cada dato lleva su <strong>fuente</strong> y <strong>confiabilidad</strong>. Cuando hay datos reales
          (calendario y resultados del Mundial), se usan y se marcan; cuando son de ejemplo, se muestran como{" "}
          <strong>Demo data</strong>; si capturas un momio a mano, queda como <strong>Manual input</strong>. No se
          afirma que un dato viene de 365Scores si no fue verificado ahí.
        </p>
      </div>

      <div className="wc-card p-4">
        <h2 className="text-sm font-semibold text-wc-gold">Fuentes de momios</h2>
        <p className="mt-1 text-sm text-wc-muted">
          Los momios pueden provenir de captura manual, importación CSV/JSON o una API autorizada de odds. La
          aplicación <strong>no realiza scraping</strong> ni automatiza acceso a casas de apuestas. Cada pick
          muestra su fuente y confiabilidad. Solo se generan picks de{" "}
          <strong>partidos próximos por jugar</strong>; los finalizados alimentan el modelo como histórico.
        </p>
      </div>

      <div className="wc-card p-4">
        <h2 className="text-sm font-semibold text-wc-gold">Rol del AI Parlay Generator</h2>
        <p className="mt-1 text-sm text-wc-muted">
          El AI Parlay Generator no inventa picks ni calcula las probabilidades base. Primero se generan
          combinaciones con modelos estadísticos locales y después la IA ayuda a explicar, clasificar y resumir
          los tickets según EV, edge, confianza, riesgo y correlación. Si la IA no está disponible, se usa un
          ranking local.
        </p>
      </div>
    </div>
  );
}
