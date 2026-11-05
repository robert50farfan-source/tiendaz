"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const CATALOG_SEEN_KEY = "tz_catalog_viewed";

// Al volver al catálogo desde una ficha (o con "atrás") la página se monta de nuevo;
// para no inflar las estadísticas, el catálogo cuenta una sola vez por sesión de la
// pestaña. Las fichas cuentan cada vez que se abren.
function catalogAlreadyCounted(): boolean {
  try {
    if (sessionStorage.getItem(CATALOG_SEEN_KEY)) return true;
    sessionStorage.setItem(CATALOG_SEEN_KEY, "1");
  } catch {
    // Sin almacenamiento: se cuenta igual.
  }
  return false;
}

export default function PageViewTracker({ productCode }: { productCode?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    if (!productCode && catalogAlreadyCounted()) return;
    trackEvent("view", productCode);
  }, [productCode]);

  return null;
}
