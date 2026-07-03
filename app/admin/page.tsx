import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminProductTable from "@/components/AdminProductTable";
import LogoutButton from "@/components/LogoutButton";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Panel admin
          </h1>
          <p className="text-sm text-zinc-500">
            {products?.length ?? 0} productos en inventario
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Nuevo producto
          </Link>
          <LogoutButton />
        </div>
      </header>

      {error ? (
        <p className="text-sm text-red-500">Error: {error.message}</p>
      ) : (
        <AdminProductTable products={(products ?? []) as Product[]} />
      )}
    </div>
  );
}
