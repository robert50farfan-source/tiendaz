"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function CatalogFilters({ products }: { products: Product[] }) {
  const [brand, setBrand] = useState("");
  const [sizeUs, setSizeUs] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );
  const sizes = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.size_us).filter(Boolean))).sort(
        (a, b) => Number(a) - Number(b)
      ),
    [products]
  );

  const filtered = products.filter((p) => {
    if (brand && p.brand !== brand) return false;
    if (sizeUs && p.size_us !== sizeUs) return false;
    if (maxPrice && p.sale_price > Number(maxPrice)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select
          value={sizeUs}
          onChange={(e) => setSizeUs(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todas las tallas (US)</option>
          {sizes.map((s) => (
            <option key={s} value={s ?? ""}>
              US {s}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Precio máx (Bs)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay pares que coincidan con el filtro.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
