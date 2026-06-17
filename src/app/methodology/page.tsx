import { SectionTitle } from "@/components/primitives";

export const dynamic = "force-dynamic";

const CONCEPTS: { term: string; desc: string }[] = [
  { term: "Probabilidad del modelo", desc: "Estimacion (0-100%) de que ocurra un evento, calculada con un modelo Poisson sobre fuerzas ofensivas/defensivas, forma reciente y contexto del partido." },
  { term: "Cuota justa", desc: "La cuota decimal que reflejaria exactamente la probabilidad del modelo, sin margen. Se calcula como 1 / probabilidad." },
  { term: "Cuota de mercado", desc: "Cuota de referencia MOCK (simulada con un margen tipico). No proviene de ninguna casa de apuestas ni es una invitacion a apostar." },
  { term: "Edge", desc: "Valor esperado por unidad: probabilidad x cuota_mercado - 1. Positivo (verde) sugiere valor segun el modelo; negativo (rojo) sugiere evitar." },
  { term: "Hit rate", desc: "Porcentaje de veces que un prop se ha cumplido en los ultimos 5, ultimos 10 y la temporada internacional. Es historico, no una garantia." },
  { term: "Confianza", desc: "Etiqueta (baja / media / alta) que combina el edge, el tamano de muestra y la volatilidad. Mayor muestra y menor volatilidad elevan la confianza." },
  { term: "Forma reciente", desc: "Resumen de los ultimos resultados (W/D/L) y promedios de goles, corners, tarjetas y tiros de la seleccion." },
  { term: "Volatilidad", desc: "Que tan disperso/impredecible es un rendimiento. Alta volatilidad reduce la confianza aunque el edge sea positivo." },
  { term: "Fuente de datos", desc: "De donde viene cada dato: mock (generado), snapshot manual (importado a mano) o snapshot 365Scores experimental (recopilado con un script manual)." },
];

export default function MethodologyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Metodologia</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Como leer las metricas de esta herramienta y que significan.
        </p>
      </div>

      <section className="card border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="font-semibold text-amber-300">Aviso importante</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-300">
          <li>Esto es una herramienta de analisis. No garantiza resultados.</li>
          <li>No es consejo financiero ni de inversion.</li>
          <li>No es una casa de apuestas y no incluye enlaces a apuestas.</li>
          <li>Es un prototipo interno de investigacion, no un producto comercial.</li>
          <li>Los datos pueden venir de mock data, snapshots manuales o recopilacion experimental.</li>
        </ul>
      </section>

      <section>
        <SectionTitle title="Conceptos" />
        <div className="grid gap-3 md:grid-cols-2">
          {CONCEPTS.map((c) => (
            <div key={c.term} className="card p-4">
              <div className="font-semibold text-brand-400">{c.term}</div>
              <p className="mt-1 text-sm text-slate-400">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-100">Sobre las fuentes de datos</h2>
        <p className="mt-2 text-sm text-slate-400">
          La app funciona 100% sin internet usando <strong className="text-slate-200">mock data</strong> determinista.
          De forma opcional puede leer <strong className="text-slate-200">snapshots manuales</strong> (JSON importado) o
          <strong className="text-slate-200"> snapshots experimentales de 365Scores</strong> generados con
          <code className="mx-1 rounded bg-base-900 px-1.5 py-0.5 text-xs text-slate-300">npm run ingest:365</code>.
          La recopilacion experimental es manual, con rate limit y cache; nunca corre durante el build ni en cada
          request, y si falla, la app sigue funcionando con mock data.
        </p>
      </section>
    </div>
  );
}
