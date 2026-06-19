import type { Metadata } from "next";
import { ImportOddsClient } from "@/components/bet/ImportOddsClient";

export const metadata: Metadata = {
  title: "Importar momios · CSV / JSON",
  description: "Importa momios por CSV o JSON y evalúalos con el modelo. Sin scraping.",
};

export default function ImportarPage() {
  return <ImportOddsClient />;
}
