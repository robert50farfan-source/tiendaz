// Explica cómo se compra: no hay tienda física, todo se coordina por WhatsApp
// y los pares se muestran en persona. Si en el futuro abren local, cambiar aquí.
const STEPS = [
  {
    title: "Elige tu par",
    text: "Mira el catálogo y filtra por tu talla. Cada par es único.",
  },
  {
    title: "Escríbenos por WhatsApp",
    text: "Confirmamos que sigue disponible y resolvemos tus dudas.",
  },
  {
    title: "Pruébatelas antes de pagar",
    text: "Te las llevamos para que las veas, o pasas a verlas con cita previa.",
  },
];

export default function HowToBuy({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        ¿Cómo comprar?
      </h2>
      <ol className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`}>
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {i + 1}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {step.title}
              </span>
              <span className="text-xs text-zinc-500">{step.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
