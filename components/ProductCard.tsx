import Link from "next/link";
import type { Product } from "@/lib/types";
import { productImageList } from "@/lib/drive";

export default function ProductCard({ product }: { product: Product }) {
  const image = productImageList(product)[0] ?? null;

  return (
    <Link
      href={`/product/${product.code}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="aspect-square w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${product.brand} ${product.model}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
        <span className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
          Bs {product.sale_price}
        </span>
      </div>
    </Link>
  );
}
