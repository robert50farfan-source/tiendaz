import { createClient } from "@/lib/supabase/server";
import CatalogFilters, { type CatalogFilterValues } from "@/components/CatalogFilters";
import HowToBuy from "@/components/HowToBuy";
import SizeGuide from "@/components/SizeGuide";
import WhatsappFloatingButton from "@/components/WhatsappFloatingButton";
import { buildWhatsappMessageLink } from "@/lib/whatsapp";
import type { Product, Settings } from "@/lib/types";

export const revalidate = 0;

function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const initialFilters: CatalogFilterValues = {
    q: param(sp.q),
    marca: param(sp.marca),
    talla: param(sp.talla),
    max: param(sp.max),
    orden: param(sp.orden) || "nuevos",
  };

  const supabase = await createClient();
  const [{ data: products, error }, { data: settings }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("status", "disponible")
      .order("created_at", { ascending: false }),
    supabase.from("settings").select("*").eq("id", 1).single<Settings>(),
  ]);

  const whatsappNumber = settings?.whatsapp_number ?? null;
  const contactLink = buildWhatsappMessageLink(
    whatsappNumber,
    "Hola, vi el catálogo y tengo una consulta."
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-8 pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Zapatillas seminuevas
        </h1>
        <p className="text-sm text-zinc-500">
          Pares únicos, revisados y listos para usar. Te los llevamos para que te los pruebes.
        </p>
      </header>

      <HowToBuy />

      <SizeGuide />

      {error ? (
        <p className="text-sm text-red-500">
          No se pudo cargar el catálogo: {error.message}
        </p>
      ) : (
        <CatalogFilters
          products={(products ?? []) as Product[]}
          initialFilters={initialFilters}
          whatsappNumber={whatsappNumber}
        />
      )}

      {contactLink && <WhatsappFloatingButton href={contactLink} />}
    </div>
  );
}
