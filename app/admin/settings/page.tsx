import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";
import type { Settings } from "@/lib/types";

export const revalidate = 0;

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single<Settings>();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          &larr; Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Configuración
        </h1>
      </div>

      {error || !settings ? (
        <p className="text-sm text-red-500">
          No se pudo cargar la configuración{error ? `: ${error.message}` : ""}.
        </p>
      ) : (
        <SettingsForm settings={settings} />
      )}
    </div>
  );
}
