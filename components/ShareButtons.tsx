"use client";

import { useState, useSyncExternalStore } from "react";

// Botones para difundir un par. En el celular abren el menú nativo de compartir
// (WhatsApp, estados, Instagram...). Donde no existe (computadoras), muestran
// opciones de respaldo: WhatsApp web y copiar el link.

const noopSubscribe = () => () => {};

// Detecta en el navegador si se pueden compartir archivos (la foto). En el servidor
// devuelve false, así el HTML inicial coincide y no hay errores de hidratación.
function useCanShareFiles(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        const probe = new File([""], "par.jpg", { type: "image/jpeg" });
        return Boolean(navigator.canShare?.({ files: [probe] }));
      } catch {
        return false;
      }
    },
    () => false
  );
}

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

const buttonClass =
  "flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900";

export default function ShareButtons({
  url,
  title,
  text,
  imageUrl,
  code,
}: {
  url: string;
  title: string;
  text: string;
  imageUrl: string | null;
  code: string;
}) {
  const canShareFiles = useCanShareFiles();
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function shareLink() {
    setError(null);
    if (!navigator.share) {
      setShowFallback((v) => !v);
      return;
    }
    try {
      await navigator.share({ title, text, url });
    } catch (e) {
      if (!isAbort(e)) setShowFallback(true);
    }
  }

  // Comparte la foto como imagen: es lo que piden los estados de WhatsApp y las
  // historias de Instagram. El texto con el link va aparte (algunas apps lo ignoran).
  async function sharePhoto() {
    if (!imageUrl) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const ext = blob.type === "image/png" ? "png" : "jpg";
      const file = new File([blob], `${code}.${ext}`, { type: blob.type || "image/jpeg" });
      await navigator.share({ files: [file], title, text: `${text}\n${url}` });
    } catch (e) {
      if (!isAbort(e)) setError("No se pudo compartir la foto. Prueba con «Compartir».");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No se pudo copiar el link.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={shareLink} className={buttonClass}>
          <ShareIcon />
          Compartir
        </button>
        {canShareFiles && imageUrl && (
          <button type="button" onClick={sharePhoto} disabled={busy} className={buttonClass}>
            {busy ? "Preparando foto…" : "Compartir foto"}
          </button>
        )}
      </div>

      {showFallback && (
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-green-600 px-3 py-1.5 font-semibold text-white hover:bg-green-700"
          >
            Enviar por WhatsApp
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {copied ? "¡Link copiado!" : "Copiar link"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
