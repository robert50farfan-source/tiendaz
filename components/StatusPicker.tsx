"use client";

import { PRODUCT_STATUSES, STATUS_LABELS, type ProductStatus } from "@/lib/types";

const ACTIVE: Record<ProductStatus, string> = {
  disponible: "bg-green-600 text-white dark:bg-green-500 dark:text-zinc-950",
  reservado: "bg-amber-500 text-zinc-950 dark:bg-amber-400",
  vendido: "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900",
};

// Selector de estado de un clic, para la lista del admin y el formulario de edición.
export default function StatusPicker({
  value,
  onChange,
  disabled = false,
  size = "sm",
}: {
  value: ProductStatus;
  onChange: (status: ProductStatus) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="group"
      aria-label="Estado"
      className="inline-flex overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700"
    >
      {PRODUCT_STATUSES.map((status) => {
        const active = status === value;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => !active && onChange(status)}
            className={`border-l border-zinc-300 font-medium first:border-l-0 disabled:opacity-50 dark:border-zinc-700 ${
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
            } ${
              active
                ? ACTIVE[status]
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}
