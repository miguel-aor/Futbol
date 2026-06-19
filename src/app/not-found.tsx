import Link from "next/link";
import { EmptyState } from "@/components/primitives";
import { CompassIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-12">
      <EmptyState title="No encontrado" message="La pagina o el recurso que buscas no existe." icon={<CompassIcon className="h-6 w-6" />} />
      <div className="mt-4 text-center">
        <Link href="/" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-base-950 hover:bg-brand-500">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
