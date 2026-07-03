import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { driveThumbnailUrl } from "@/lib/drive";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("code", code)
    .single<Product>();

  if (!product) notFound();

  const image = driveThumbnailUrl(product.image_url, 1200);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:underline">
        &larr; Volver al catálogo
      </Link>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={`${product.brand} ${product.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
              Sin foto
            </div>
          )}
        </div>

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
            <span className="w-fit rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              Vendido
            </span>
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
        </div>
      </div>
    </div>
  );
}
