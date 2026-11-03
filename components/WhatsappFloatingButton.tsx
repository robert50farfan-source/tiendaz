import WhatsappLink from "./WhatsappLink";

export default function WhatsappFloatingButton({ href }: { href: string }) {
  return (
    <WhatsappLink
      href={href}
      className="fixed bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-700"
    >
      Escríbenos por WhatsApp
    </WhatsappLink>
  );
}
