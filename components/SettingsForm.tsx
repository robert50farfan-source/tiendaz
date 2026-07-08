"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const supabase = createClient();
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_number ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("settings")
      .update({ whatsapp_number: whatsappNumber || null })
      .eq("id", 1);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Número de WhatsApp de contacto
        <input
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="Ej: +591 70012345"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <span className="text-xs text-zinc-500">
          Incluye el código de país. Se usará para el botón &quot;Contactar por
          WhatsApp&quot; en la ficha de cada producto.
        </span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {saved && <p className="text-sm text-green-600">Guardado.</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-2 w-fit rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
