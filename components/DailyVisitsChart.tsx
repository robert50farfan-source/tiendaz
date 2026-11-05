"use client";

import { useEffect, useRef, useState } from "react";

export type DailyStat = { day: string; views: number; visitors: number; whatsapp: number };

const HEIGHT = 200;
const PAD = { top: 12, right: 4, bottom: 24, left: 32 };
const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// "2026-11-03" -> "03/11" (sin pasar por Date para no correr el día por zona horaria).
function shortDate(day: string): string {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

function weekday(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// Máximo "redondo" del eje Y para que las marcas caigan en números enteros.
function niceMax(max: number): number {
  if (max <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(max / 4)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (step * m * 4 >= max) return step * m * 4;
  }
  return max;
}

// Barra con las esquinas superiores redondeadas y la base recta sobre el eje.
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

export default function DailyVisitsChart({ data }: { data: DailyStat[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // null hasta medir el contenedor: así el SVG nunca se dibuja más ancho que la pantalla.
  const [measured, setMeasured] = useState<number | null>(null);
  const width = measured ?? 0;
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setMeasured(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const yMax = niceMax(Math.max(0, ...data.map((d) => d.visitors)));
  const ticks = [0, yMax / 2, yMax];
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const colW = data.length ? plotW / data.length : 0;
  const barW = Math.max(1, colW - 2);
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  // Etiquetas del eje X cada 5 días, contando desde hoy hacia atrás.
  const showLabel = (i: number) => (data.length - 1 - i) % 5 === 0;

  const current = active !== null ? data[active] : null;

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="relative w-full" style={{ height: HEIGHT }}>
        {measured !== null && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Visitantes por día" className="block">
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-zinc-500 text-[11px] tabular-nums"
                >
                  {t}
                </text>
              </g>
            ))}

            {data.map((d, i) => {
              const x = PAD.left + i * colW + 1;
              const h = y(0) - y(d.visitors);
              return (
                <g key={d.day}>
                  {d.visitors > 0 && (
                    <path
                      d={barPath(x, y(d.visitors), barW, h)}
                      className={`fill-[#2a78d6] dark:fill-[#3987e5] ${
                        active === i ? "opacity-75" : ""
                      }`}
                    />
                  )}
                  {showLabel(i) && (
                    <text
                      // La última fecha se alinea al borde para que no quede cortada.
                      x={i === data.length - 1 ? width - PAD.right : x + barW / 2}
                      y={HEIGHT - 6}
                      textAnchor={i === data.length - 1 ? "end" : "middle"}
                      className="fill-zinc-500 text-[11px] tabular-nums"
                    >
                      {shortDate(d.day)}
                    </text>
                  )}
                  {/* Zona de hover/foco: la columna completa, más grande que la barra. */}
                  <rect
                    x={PAD.left + i * colW}
                    y={PAD.top}
                    width={colW}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${shortDate(d.day)}: ${d.visitors} visitantes`}
                    onPointerEnter={() => setActive(i)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="outline-none"
                  />
                </g>
              );
            })}
          </svg>
        )}

        {current && active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900"
            style={{
              left: Math.min(
                Math.max(PAD.left + (active + 0.5) * colW, 90),
                Math.max(width - 90, 90)
              ),
            }}
          >
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
              {weekday(current.day)} {shortDate(current.day)}
            </div>
            <div className="text-zinc-600 dark:text-zinc-300">
              {current.visitors} visitantes · {current.views} páginas vistas
            </div>
            <div className="text-zinc-600 dark:text-zinc-300">
              {current.whatsapp} clics en WhatsApp
            </div>
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:underline">Ver como tabla</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 font-medium">Día</th>
                <th className="py-1 text-right font-medium">Visitantes</th>
                <th className="py-1 text-right font-medium">Páginas vistas</th>
                <th className="py-1 text-right font-medium">Clics WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.day} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1">
                    {weekday(d.day)} {shortDate(d.day)}
                  </td>
                  <td className="py-1 text-right">{d.visitors}</td>
                  <td className="py-1 text-right">{d.views}</td>
                  <td className="py-1 text-right">{d.whatsapp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
