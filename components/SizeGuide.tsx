import { createClient } from "@/lib/supabase/server";

// Tabla US <-> BOL armada con las equivalencias que la tienda ya cargó en sus
// productos (incluye vendidos). Si una talla US tiene varias BOL, usa la más común.
async function getSizeChart(): Promise<{ us: string; bol: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("size_us, size_bol");

  const counts = new Map<string, Map<string, number>>();
  for (const row of data ?? []) {
    if (!row.size_us || !row.size_bol) continue;
    const byBol = counts.get(row.size_us) ?? new Map<string, number>();
    byBol.set(row.size_bol, (byBol.get(row.size_bol) ?? 0) + 1);
    counts.set(row.size_us, byBol);
  }

  return Array.from(counts, ([us, byBol]) => ({
    us,
    bol: Array.from(byBol).sort((a, b) => b[1] - a[1])[0][0],
  })).sort((a, b) => Number(a.us) - Number(b.us));
}

export default async function SizeGuide() {
  const chart = await getSizeChart();
  if (chart.length === 0) return null;

  return (
    <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Guía de tallas (US / Bolivia)
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="overflow-x-auto">
          <table className="text-sm">
            <tbody>
              <tr>
                <th className="pr-3 text-left font-medium text-zinc-500">US</th>
                {chart.map((s) => (
                  <td key={s.us} className="px-2 py-1 text-center">
                    {s.us}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="pr-3 text-left font-medium text-zinc-500">BOL</th>
                {chart.map((s) => (
                  <td key={s.us} className="px-2 py-1 text-center font-semibold">
                    {s.bol}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          La horma cambia un poco entre marcas y modelos. ¿No estás seguro de tu talla?
          Escríbenos y te llevamos el par para que te lo pruebes antes de comprar.
        </p>
      </div>
    </details>
  );
}
