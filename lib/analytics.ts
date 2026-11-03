import { createClient } from "@/lib/supabase/client";

// Registro de visitas para el panel /admin/stats (tabla page_events, ver
// supabase/analytics.sql). Corre en el navegador: los robots que arman vistas
// previas (WhatsApp, Facebook) no ejecutan JS, así que no cuentan.

type EventName = "view" | "whatsapp_click";

const VISITOR_KEY = "tz_visitor_id";

// Id aleatorio por navegador para contar visitantes únicos. Sin datos personales.
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Modo privado o almacenamiento bloqueado: cuenta como visitante nuevo.
    return crypto.randomUUID();
  }
}

export async function trackEvent(event: EventName, productCode?: string | null) {
  try {
    const supabase = createClient();
    // No contar las visitas del admin con sesión iniciada.
    const { data } = await supabase.auth.getSession();
    if (data.session) return;

    await supabase.from("page_events").insert({
      event,
      path: window.location.pathname.slice(0, 200),
      product_code: productCode ?? null,
      visitor_id: getVisitorId(),
      referrer: document.referrer ? document.referrer.slice(0, 300) : null,
    });
  } catch {
    // Las estadísticas nunca deben romper la tienda.
  }
}
