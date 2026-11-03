"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export default function PageViewTracker({ productCode }: { productCode?: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("view", productCode);
  }, [productCode]);

  return null;
}
