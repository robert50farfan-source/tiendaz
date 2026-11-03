"use client";

import { trackEvent } from "@/lib/analytics";

// Link a WhatsApp que registra el clic para las estadísticas del admin.
export default function WhatsappLink({
  href,
  productCode,
  className,
  children,
}: {
  href: string;
  productCode?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("whatsapp_click", productCode)}
      className={className}
    >
      {children}
    </a>
  );
}
