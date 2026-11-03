import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { productImageList } from "@/lib/drive";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { getSiteUrl } from "@/lib/site-url";
import ProductGallery from "@/components/ProductGallery";
import HowToBuy from "@/components/HowToBuy";
import SizeGuide from "@/components/SizeGuide";
import PageViewTracker from "@/components/PageViewTracker";
import WhatsappLink from "@/components/WhatsappLink";
import { PUBLIC_PRODUCT_COLUMNS, type PublicProduct, type Settings } from "@/lib/types";

export const revalidate = 0;

type Props = { params: Promise<{ code: string }> };

// Memoizado para que generateMetadata y la página compartan una sola consulta.
const getProduct = cache(async (code: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("code", code)
    .single<PublicProduct>();
  return data;
});

// Vista previa al compartir el link por WhatsApp/Instagram: foto, talla y precio.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const product = await getProduct(code);
  if (!product) return {};

  const title = `${product.brand} ${product.model} · US ${product.size_us ?? "-"} · Bs ${product.sale_price}`;
  const description =
    product.status === "vendido"
      ? "Este par ya se vendió. Mira otros pares disponibles en el catálogo."
      : `Estado ${product.condition?.toLowerCase() ?? "revisado"}. Pídelas por WhatsApp y te las llevamos para probártelas.`;
  const image = productImageList(product, 1200)[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image
        ? [{ url: image, width: 1200, height: 1200 }]
        : [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();
  const [product, { data: settings }] = await Promise.all([
    getProduct(code),
    supabase.from("settings").select("*").eq("id", 1).single<Settings>(),
  ]);

  if (!product) notFound();

  const images = productImageList(product, 1200);
  const siteUrl = await getSiteUrl();
  const productUrl = siteUrl ? `${siteUrl}/product/${encodeURIComponent(product.code)}` : null;
  const whatsappLink =
    product.status === "disponible"
      ? buildWhatsappLink(settings?.whatsapp_number, product, productUrl)
      : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <PageViewTracker productCode={product.code} />
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        &larr; Volver al catálogo
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
        <ProductGallery images={images} alt={`${product.brand} ${product.model}`} />

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            {product.brand}
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {product.model}
          </h1>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Bs {product.sale_price}
          </span>

          {product.status === "vendido" && (
            <span className="text-xl font-bold tracking-wide text-red-600">VENDIDO</span>
          )}

          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-zinc-500">Talla US</dt>
            <dd>{product.size_us ?? "-"}</dd>
            <dt className="text-zinc-500">Talla BOL</dt>
            <dd>{product.size_bol ?? "-"}</dd>
            <dt className="text-zinc-500">Color</dt>
            <dd>{product.color ?? "-"}</dd>
            <dt className="text-zinc-500">Estado</dt>
            <dd>{product.condition ?? "-"}</dd>
            <dt className="text-zinc-500">Nivel de uso</dt>
            <dd>{product.usage_level ?? "-"}</dd>
            <dt className="text-zinc-500">Código</dt>
            <dd>{product.code}</dd>
          </dl>

          {product.notes && product.notes !== "Sin observaciones" && (
            <p className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              {product.notes}
            </p>
          )}

          {whatsappLink && (
            <WhatsappLink
              href={whatsappLink}
              productCode={product.code}
              className="mt-2 flex w-fit items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Contactar por WhatsApp
            </WhatsappLink>
          )}

          {product.status === "vendido" && product.size_us && (
            <Link
              href={`/?talla=${encodeURIComponent(product.size_us)}`}
              className="mt-2 w-fit rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Ver otros pares en talla US {product.size_us}
            </Link>
          )}

          {product.status === "disponible" && <HowToBuy compact />}

          <SizeGuide />
        </div>
      </div>
    </div>
  );
}
