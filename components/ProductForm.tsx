"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/resize-image";
import type { Product } from "@/lib/types";

type Props = {
  product?: Product;
};

const MAX_IMAGES = 4;

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
  image_urls: [] as string[],
  status: "disponible" as "disponible" | "vendido",
};

function buildForm(product?: Product) {
  return product
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
        image_urls:
          product.image_urls && product.image_urls.length > 0
            ? product.image_urls
            : product.image_url
              ? [product.image_url]
              : [],
        status: product.status,
      }
    : emptyForm;
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [initialForm] = useState(() => buildForm(product));
  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef(false);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm]
  );

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isDirty || savedRef.current) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleBack() {
    if (isDirty && !confirm("Tienes cambios sin guardar. ¿Deseas salir sin guardar?")) {
      return;
    }
    router.push("/admin");
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - form.image_urls.length;
    if (remaining <= 0) {
      setError(`Máximo ${MAX_IMAGES} fotos por producto.`);
      return;
    }
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    for (const original of toUpload) {
      const file = await resizeImage(original);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (uploadError) {
        setError(`Error al subir imagen: ${uploadError.message}`);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    update("image_urls", [...form.image_urls, ...uploadedUrls]);
    setUploading(false);
  }

  function removeImage(index: number) {
    update(
      "image_urls",
      form.image_urls.filter((_, i) => i !== index)
    );
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
      image_urls: form.image_urls,
      image_url: form.image_urls[0] ?? null,
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
    savedRef.current = true;
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-3">
      <button
        type="button"
        onClick={handleBack}
        className="mb-1 flex w-fit items-center gap-1 text-sm text-zinc-500 hover:underline"
      >
        &larr; Volver
      </button>

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

      <div className="flex flex-col gap-2 text-sm">
        <span>Fotos ({form.image_urls.length}/{MAX_IMAGES})</span>

        {form.image_urls.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {form.image_urls.map((url, i) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`preview ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {form.image_urls.length < MAX_IMAGES && (
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
        )}
        {uploading && <span className="text-xs text-zinc-500">Optimizando y subiendo fotos...</span>}
      </div>

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
