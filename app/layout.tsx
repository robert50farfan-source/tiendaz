import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  // Base para las URLs absolutas de los meta tags (ej. og:image). SITE_URL permite
  // cambiar de dominio sin tocar código.
  metadataBase: new URL(process.env.SITE_URL ?? "https://tiendaz.online"),
  title: "Tienda de Zapatillas",
  description: "Catálogo de zapatillas revisadas y listas para usar.",
  openGraph: {
    title: "Tienda de Zapatillas",
    description: "Pares únicos, revisados y listos para usar. Pídelos por WhatsApp.",
    type: "website",
    locale: "es_BO",
    // Collage generado con scripts/generate-og-image.ts.
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Zapatillas" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
