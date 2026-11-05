import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DailyVisitsChart, { type DailyStat } from "@/components/DailyVisitsChart";

export const revalidate = 0;

const DAYS = 30;

type Summary = {
  views_today: number;
  visitors_today: number;
  views_7d: number;
  views_prev_7d: number;
  visitors_7d: number;
  visitors_prev_7d: number;
  whatsapp_7d: number;
  whatsapp_prev_7d: number;
  views_period: number;
  visitors_period: number;
  whatsapp_period: number;
};

type Stats = {
  days: number;
  summary: Partial<Summary>;
  daily: DailyStat[];
  top_products: {
    product_code: string;
    brand: string | null;
    model: string | null;
    status: string | null;
    views: number;
    whatsapp: number;
  }[];
  sources: { source: string; views: number }[];
};

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="text-zinc-500">sin datos de la semana anterior</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="text-zinc-500">igual que la semana anterior</span>;
  const up = pct > 0;
  return (
    <span className={up ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% vs. 7 días anteriores
    </span>
  );
}

function StatTile({
  label,
  value,
  children,
}: {
  label: string;
  value: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString("es-BO")}
      </span>
      {children && <span className="text-xs">{children}</span>}
    </div>
  );
}

export default async function StatsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_stats", { p_days: DAYS });
  const stats = data as Stats | null;
  const s = (key: keyof Summary) => Number(stats?.summary?.[key] ?? 0);

  const totalSourceViews = stats?.sources.reduce((sum, x) => sum + x.views, 0) ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
          &larr; Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Estadísticas</h1>
        <p className="text-sm text-zinc-500">
          Visitantes son las personas (navegadores distintos); páginas vistas, cada vez que
          abren el catálogo o una ficha. El catálogo cuenta una vez por visita. No cuenta tus
          visitas con sesión de admin iniciada.
        </p>
      </div>

      {error || !stats ? (
        <p className="text-sm text-red-500">
          No se pudieron cargar las estadísticas{error ? `: ${error.message}` : ""}. ¿Ya se
          ejecutó supabase/analytics.sql en Supabase?
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Visitantes hoy" value={s("visitors_today")}>
              <span className="text-zinc-500">{s("views_today")} páginas vistas</span>
            </StatTile>
            <StatTile label="Visitantes (7 días)" value={s("visitors_7d")}>
              <Delta current={s("visitors_7d")} previous={s("visitors_prev_7d")} />
            </StatTile>
            <StatTile label="Páginas vistas (7 días)" value={s("views_7d")}>
              <Delta current={s("views_7d")} previous={s("views_prev_7d")} />
            </StatTile>
            <StatTile label="Clics en WhatsApp (7 días)" value={s("whatsapp_7d")}>
              <Delta current={s("whatsapp_7d")} previous={s("whatsapp_prev_7d")} />
            </StatTile>
          </div>

          <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Visitantes por día
              </h2>
              <p className="text-xs text-zinc-500">
                Últimos {DAYS} días: {s("visitors_period")} visitantes, {s("views_period")}{" "}
                páginas vistas, {s("whatsapp_period")} clics en WhatsApp
              </p>
            </div>
            <DailyVisitsChart data={stats.daily} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Pares más vistos ({DAYS} días)
              </h2>
              {stats.top_products.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no hay visitas a fichas.</p>
              ) : (
                <table className="w-full text-left text-sm tabular-nums">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="py-1 font-medium">Par</th>
                      <th className="py-1 text-right font-medium">Vistas</th>
                      <th className="py-1 text-right font-medium">Clics WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_products.map((p) => (
                      <tr key={p.product_code} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-2">
                          <Link href={`/product/${p.product_code}`} className="hover:underline">
                            <span className="font-medium text-zinc-900 dark:text-zinc-50">
                              {p.brand ? `${p.brand} ${p.model}` : p.product_code}
                            </span>
                          </Link>
                          <span className="ml-2 text-xs text-zinc-500">{p.product_code}</span>
                          {p.status === "vendido" && (
                            <span className="ml-2 text-xs font-bold text-red-600">VENDIDO</span>
                          )}
                          {p.status === "reservado" && (
                            <span className="ml-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                              RESERVADO
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">{p.views}</td>
                        <td className="py-2 text-right">{p.whatsapp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                De dónde llegan (páginas vistas, {DAYS} días)
              </h2>
              {stats.sources.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no hay visitas.</p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {stats.sources.map((src) => {
                    const pct = totalSourceViews ? (src.views / totalSourceViews) * 100 : 0;
                    return (
                      <li key={src.source} className="flex flex-col gap-1">
                        <div className="flex justify-between tabular-nums">
                          <span className="text-zinc-900 dark:text-zinc-50">{src.source}</span>
                          <span className="text-zinc-500">
                            {src.views} · {Math.round(pct)}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-2 rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-xs text-zinc-500">
                Los links abiertos desde WhatsApp normalmente no indican de dónde vienen, por
                eso se cuentan junto con las visitas directas.
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
