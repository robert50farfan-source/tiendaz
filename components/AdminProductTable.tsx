"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

export default function AdminProductTable({ products }: { products: Product[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.code, p.brand, p.model, p.color, p.size_us, p.size_bol]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    );
  }, [products, search]);

  async function toggleStatus(product: Product) {
    setBusyId(product.id);
    const newStatus = product.status === "disponible" ? "vendido" : "disponible";
    await supabase.from("products").update({ status: newStatus }).eq("id", product.id);
    setBusyId(null);
    router.refresh();
  }

  async function remove(product: Product) {
    if (!confirm(`¿Eliminar ${product.code}?`)) return;
    setBusyId(product.id);
    await supabase.from("products").delete().eq("id", product.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por código, marca, modelo, color o talla..."
        className="w-full max-w-sm rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Marca / Modelo</th>
              <th className="px-3 py-2">Talla</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
            <tr key={p.id} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="px-3 py-2 font-mono text-xs">{p.code}</td>
              <td className="px-3 py-2">
                {p.brand} {p.model}
              </td>
              <td className="px-3 py-2">
                US {p.size_us ?? "-"} / BOL {p.size_bol ?? "-"}
              </td>
              <td className="px-3 py-2">Bs {p.sale_price}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    p.status === "disponible"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
                  }
                >
                  {p.status}
                </span>
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-3">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => toggleStatus(p)}
                    className="text-xs font-medium text-amber-600 hover:underline disabled:opacity-50"
                  >
                    {p.status === "disponible" ? "Marcar vendido" : "Marcar disponible"}
                  </button>
                  <button
                    disabled={busyId === p.id}
                    onClick={() => remove(p)}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
