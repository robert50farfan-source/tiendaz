import { createClient } from "@/lib/supabase/server";
import CatalogFilters from "@/components/CatalogFilters";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "disponible")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Zapatillas seminuevas
        </h1>
        <p className="text-sm text-zinc-500">
          Pares únicos, revisados y listos para usar.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-red-500">
          No se pudo cargar el catálogo: {error.message}
        </p>
      ) : (
        <CatalogFilters products={(products ?? []) as Product[]} />
      )}
    </div>
  );
}
