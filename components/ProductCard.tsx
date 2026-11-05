import Link from "next/link";
import type { PublicProduct } from "@/lib/types";
import { productImageList } from "@/lib/drive";

// Texto corto para la etiqueta de la tarjeta ("SIN USO" -> "Sin uso", "POCO" -> "Poco uso").
function usageLabel(usage: string | null): string | null {
  if (!usage) return null;
  const text = usage.trim().toLowerCase();
  if (text === "poco") return "Poco uso";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function ProductCard({ product }: { product: PublicProduct }) {
  const image = productImageList(product)[0] ?? null;
  const usage = usageLabel(product.usage_level);
  const sold = product.status === "vendido";

  return (
    <Link
      href={`/product/${product.code}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {!sold && usage && (
          <span className="absolute left-2 top-2 z-[1] rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-zinc-900 shadow-sm">
            {usage}
          </span>
        )}
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${product.brand} ${product.model}`}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform group-hover:scale-105 ${
              sold ? "opacity-60 grayscale" : ""
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            Sin foto
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {product.brand}
        </span>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {product.model}
        </h3>
        <span className="text-xs text-zinc-500">
          US {product.size_us ?? "-"} / BOL {product.size_bol ?? "-"}
        </span>
        {sold ? (
          <span className="mt-1 text-base font-bold text-red-600">VENDIDO</span>
        ) : product.status === "reservado" ? (
          // El precio sigue visible: un reservado puede liberarse.
          <span className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold text-amber-700 dark:text-amber-400">RESERVADO</span>
            <span className="text-xs text-zinc-500">Bs {product.sale_price}</span>
          </span>
        ) : (
          <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
            Bs {product.sale_price}
          </span>
        )}
      </div>
    </Link>
  );
}
