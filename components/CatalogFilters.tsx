"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicProduct } from "@/lib/types";
import { buildWhatsappMessageLink } from "@/lib/whatsapp";
import ProductCard from "./ProductCard";

export type CatalogFilterValues = {
  q: string;
  marca: string;
  talla: string;
  max: string;
  orden: string;
};

const SORTS: Record<string, { label: string; compare: (a: PublicProduct, b: PublicProduct) => number }> = {
  nuevos: {
    label: "Más nuevos",
    compare: (a, b) => b.created_at.localeCompare(a.created_at),
  },
  "precio-asc": {
    label: "Menor precio",
    compare: (a, b) => a.sale_price - b.sale_price,
  },
  "precio-desc": {
    label: "Mayor precio",
    compare: (a, b) => b.sale_price - a.sale_price,
  },
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default function CatalogFilters({
  products,
  initialFilters,
  whatsappNumber,
}: {
  products: PublicProduct[];
  initialFilters: CatalogFilterValues;
  whatsappNumber: string | null;
}) {
  const [filters, setFilters] = useState(initialFilters);

  function update<K extends keyof CatalogFilterValues>(key: K, value: string) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  // Refleja los filtros en la URL para que se mantengan al volver
  // desde un producto y se puedan compartir (ej. "/?talla=10").
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value && !(key === "orden" && value === "nuevos")) params.set(key, value);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters]);

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

  const q = filters.q.trim().toLowerCase();
  const sort = SORTS[filters.orden] ?? SORTS.nuevos;
  const filtered = products
    .filter((p) => {
      if (q && !`${p.brand} ${p.model} ${p.color ?? ""}`.toLowerCase().includes(q)) return false;
      if (filters.marca && p.brand !== filters.marca) return false;
      if (filters.talla && p.size_us !== filters.talla) return false;
      if (filters.max && p.sale_price > Number(filters.max)) return false;
      return true;
    })
    .sort(sort.compare);

  const hasFilters = Boolean(filters.q || filters.marca || filters.talla || filters.max);

  const requestLink = buildWhatsappMessageLink(
    whatsappNumber,
    filters.talla
      ? `Hola, busco zapatillas talla US ${filters.talla}. ¿Les llegó algo o les llegará pronto?`
      : "Hola, estoy buscando un par que no encontré en el catálogo. ¿Me pueden ayudar?"
  );

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        placeholder="Buscar modelo o color..."
        value={filters.q}
        onChange={(e) => update("q", e.target.value)}
        className={`${inputClass} w-full`}
      />

      <div className="flex flex-wrap gap-3">
        <select value={filters.marca} onChange={(e) => update("marca", e.target.value)} className={inputClass}>
          <option value="">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <select value={filters.talla} onChange={(e) => update("talla", e.target.value)} className={inputClass}>
          <option value="">Todas las tallas (US)</option>
          {sizes.map((s) => (
            <option key={s} value={s ?? ""}>
              US {s}
            </option>
          ))}
        </select>

        <input
          type="number"
          inputMode="numeric"
          placeholder="Precio máx (Bs)"
          value={filters.max}
          onChange={(e) => update("max", e.target.value)}
          className={`${inputClass} w-40`}
        />

        <select value={filters.orden} onChange={(e) => update("orden", e.target.value)} className={inputClass}>
          {Object.entries(SORTS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <span>
          {filtered.length} {filtered.length === 1 ? "par" : "pares"}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, q: "", marca: "", talla: "", max: "" }))}
            className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No hay pares que coincidan con tu búsqueda. Nos llegan pares nuevos seguido:
            escríbenos y te avisamos cuando llegue algo en tu talla.
          </p>
          {requestLink && (
            <a
              href={requestLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Avisarme por WhatsApp
            </a>
          )}
        </div>
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
