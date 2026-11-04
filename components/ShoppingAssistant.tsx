"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PublicProduct } from "@/lib/types";
import { productImageList } from "@/lib/drive";
import { buildWhatsappMessageLink } from "@/lib/whatsapp";
import WhatsappLink from "./WhatsappLink";

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "tz_assistant_chat";
const MAX_CHARS = 600;
const SUGGESTIONS = [
  "Busco zapatillas talla 42 (BOL)",
  "¿Qué tienen hasta 220 Bs?",
  "Quiero algo para uso diario",
  "¿Cómo es la compra?",
];
const CODE_PATTERN = /\[\[([A-Z0-9-]+)\]\]/g;

function loadChat(): ChatMessage[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveChat(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Sin almacenamiento: la conversación se pierde al salir de la página.
  }
}

function ProductChip({ product }: { product: PublicProduct }) {
  const image = productImageList(product, 200)[0];
  return (
    <Link
      href={`/product/${product.code}`}
      className="my-1 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="h-12 w-12 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800" />
      )}
      <div className="flex min-w-0 flex-col text-xs">
        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
          {product.brand} {product.model}
        </span>
        <span className="text-zinc-500">
          US {product.size_us ?? "-"} / BOL {product.size_bol ?? "-"}
        </span>
        {product.status === "vendido" ? (
          <span className="font-bold text-red-600">VENDIDO</span>
        ) : (
          <span className="font-bold text-zinc-900 dark:text-zinc-50">Bs {product.sale_price}</span>
        )}
      </div>
    </Link>
  );
}

// Convierte los códigos [[IG-...]] de la respuesta en tarjetas de producto.
function AssistantText({
  text,
  productsByCode,
}: {
  text: string;
  productsByCode: Map<string, PublicProduct>;
}) {
  const parts = text.split(CODE_PATTERN);
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (i % 2 === 0) return part ? <span key={i}>{part}</span> : null;
        const product = productsByCode.get(part);
        return product ? <ProductChip key={i} product={product} /> : <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export default function ShoppingAssistant({
  products,
  whatsappNumber,
}: {
  products: PublicProduct[];
  whatsappNumber: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const productsByCode = new Map(products.map((p) => [p.code, p]));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || loading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setLoading(true);

    let reply = "";
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo conectar con el asistente.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
      const final: ChatMessage[] = [...history, { role: "assistant", content: reply }];
      setMessages(final);
      saveChat(final);
    } catch (e) {
      setError((e as Error).message);
      // Se quita la burbuja vacía; el mensaje del cliente queda para reintentar.
      setMessages(history.slice(0, -1));
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    saveChat([]);
    setError(null);
  }

  // Al pasar a WhatsApp se llevan los pares que recomendó el asistente.
  const mentioned = Array.from(
    new Set(
      messages
        .filter((m) => m.role === "assistant")
        .flatMap((m) => Array.from(m.content.matchAll(CODE_PATTERN), (match) => match[1]))
        .filter((code) => productsByCode.get(code)?.status === "disponible")
    )
  );
  const handoffLink = buildWhatsappMessageLink(
    whatsappNumber,
    mentioned.length
      ? `Hola, estuve viendo el catálogo con el asistente y me interesan estos pares: ${mentioned.join(", ")}. ¿Siguen disponibles?`
      : "Hola, estuve viendo el catálogo y tengo una consulta."
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // La conversación se mantiene al ir a una ficha y volver al catálogo.
          if (messages.length === 0) setMessages(loadChat());
          setOpen(true);
        }}
        className="fixed bottom-4 left-4 z-10 rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        ¿Te ayudo a elegir?
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Asistente de compra"
      className="fixed inset-0 z-20 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:left-4 sm:h-[34rem] sm:w-96 sm:rounded-2xl sm:border sm:border-zinc-200 sm:shadow-2xl dark:bg-zinc-900 sm:dark:border-zinc-700"
    >
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Asistente de compra
          </span>
          <span className="text-xs text-zinc-500">Te ayudo a encontrar tu par</span>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-xs text-zinc-500 hover:underline"
            >
              Nueva consulta
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar asistente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 text-sm">
        <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50">
          ¡Hola! Cuéntame qué buscas: tu talla, para qué las usarías o cuánto quieres gastar, y
          te recomiendo pares del catálogo.
        </div>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-zinc-900 px-3 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className="max-w-[90%] self-start rounded-2xl rounded-tl-sm bg-zinc-100 px-3 py-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {m.content ? (
                <AssistantText text={m.content} productsByCode={productsByCode} />
              ) : (
                <span className="text-zinc-500">Escribiendo…</span>
              )}
            </div>
          )
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {messages.length > 0 && handoffLink && (
        <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <WhatsappLink
            href={handoffLink}
            className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            {mentioned.length ? "Consultar estos pares por WhatsApp" : "Seguir por WhatsApp"}
          </WhatsappLink>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CHARS}
          placeholder="Escribe tu consulta…"
          aria-label="Tu consulta"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Enviar
        </button>
      </form>
      <p className="px-3 pb-2 text-center text-[11px] text-zinc-400">
        Asistente automático: confirma disponibilidad y precio por WhatsApp.
      </p>
    </div>
  );
}
