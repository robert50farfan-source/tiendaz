"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

type Props = {
  product?: Product;
};

const emptyForm = {
  code: "",
  brand: "",
  model: "",
  category: "TRAINING",
  size_us: "",
  size_bol: "",
  color: "",
  condition: "EXCELENTE",
  usage_level: "SIN USO",
  buy_price: "",
  sale_price: "",
  provider: "",
  location: "",
  notes: "",
  image_url: "",
  status: "disponible" as "disponible" | "vendido",
};

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState(
    product
      ? {
          code: product.code,
          brand: product.brand,
          model: product.model,
          category: product.category ?? "",
          size_us: product.size_us ?? "",
          size_bol: product.size_bol ?? "",
          color: product.color ?? "",
          condition: product.condition ?? "",
          usage_level: product.usage_level ?? "",
          buy_price: product.buy_price?.toString() ?? "",
          sale_price: product.sale_price.toString(),
          provider: product.provider ?? "",
          location: product.location ?? "",
          notes: product.notes ?? "",
          image_url: product.image_url ?? "",
          status: product.status,
        }
      : emptyForm
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const path = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      setError(`Error al subir imagen: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    update("image_url", data.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      code: form.code,
      brand: form.brand,
      model: form.model,
      category: form.category || null,
      size_us: form.size_us || null,
      size_bol: form.size_bol || null,
      color: form.color || null,
      condition: form.condition || null,
      usage_level: form.usage_level || null,
      buy_price: form.buy_price ? Number(form.buy_price) : null,
      sale_price: Number(form.sale_price),
      provider: form.provider || null,
      location: form.location || null,
      notes: form.notes || null,
      image_url: form.image_url || null,
      status: form.status,
    };

    const result = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Código
        <input
          required
          value={form.code}
          onChange={(e) => update("code", e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Marca
          <input
            required
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Modelo
          <input
            required
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Talla US
          <input
            value={form.size_us}
            onChange={(e) => update("size_us", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Talla BOL
          <input
            value={form.size_bol}
            onChange={(e) => update("size_bol", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Color
        <input
          value={form.color}
          onChange={(e) => update("color", e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Estado (calidad)
          <select
            value={form.condition}
            onChange={(e) => update("condition", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="EXCELENTE">EXCELENTE</option>
            <option value="BUENO">BUENO</option>
            <option value="REGULAR">REGULAR</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nivel de uso
          <select
            value={form.usage_level}
            onChange={(e) => update("usage_level", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="SIN USO">SIN USO</option>
            <option value="POCO">POCO</option>
            <option value="MODERADO">MODERADO</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Precio compra (Bs)
          <input
            type="number"
            value={form.buy_price}
            onChange={(e) => update("buy_price", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Precio venta (Bs)
          <input
            required
            type="number"
            value={form.sale_price}
            onChange={(e) => update("sale_price", e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Proveedor
        <input
          value={form.provider}
          onChange={(e) => update("provider", e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Ubicación
        <input
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Observaciones
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Foto
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {uploading && <span className="text-xs text-zinc-500">Subiendo...</span>}
        {form.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.image_url}
            alt="preview"
            className="mt-2 h-32 w-32 rounded-lg object-cover"
          />
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Estado publicación
        <select
          value={form.status}
          onChange={(e) => update("status", e.target.value as "disponible" | "vendido")}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
        </select>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
