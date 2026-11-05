# Tiendaz — catálogo de zapatillas

Catálogo web de [tiendaz.online](https://tiendaz.online): una tienda pequeña en Bolivia que vende pares únicos de zapatillas (sin uso o con poco uso, revisados). No hay tienda física ni pagos en línea: el cliente elige un par, consulta por WhatsApp y se le lleva para que se lo pruebe antes de pagar.

## Qué incluye

**Para los clientes**

- Catálogo con buscador, filtros (marca, talla, precio máximo) y orden. Los filtros quedan en la URL, así que se pueden compartir (`/?talla=10`).
- Ficha de cada par con galería de fotos, tallas US y BOL, estado y botón de WhatsApp con un mensaje ya escrito que incluye el link del par.
- Cada par tiene uno de tres estados: **disponible**, **reservado** (alguien coordinó para verlo; "RESERVADO" en ámbar) o **vendido** ("VENDIDO" en rojo). El catálogo muestra primero los disponibles, después los reservados y al final los vendidos. En un par reservado, el botón de WhatsApp pide que avisen si se libera.
- Guía de tallas US ↔ BOL armada con las tallas cargadas en el inventario.
- Vista previa al compartir links: la página principal muestra un collage (`public/og-image.jpg`) y cada ficha muestra la foto del par, con talla y precio.
- **Asistente de compra con IA** (Claude Haiku 5.5): recomienda pares disponibles (nunca reservados ni vendidos) según talla, presupuesto y uso, y deriva a WhatsApp.

**Para el admin** (`/admin`, con sesión)

- Alta, edición y baja de productos; cambio de estado (disponible / reservado / vendido) con un clic desde la lista o el formulario. Las fotos se reducen en el navegador antes de subirlas (máximo 1600 px, ~300 KB).
- Configuración del número de WhatsApp de la tienda.
- Estadísticas (`/admin/stats`): visitas, visitantes únicos, clics en WhatsApp, pares más vistos y de dónde llegan las visitas.

## Tecnologías

- [Next.js](https://nextjs.org) 16 (App Router) con React 19 y Tailwind CSS 4. Esta versión de Next tiene cambios importantes respecto a versiones anteriores; antes de tocar código, revisar la guía correspondiente en `node_modules/next/dist/docs/` (ver [AGENTS.md](AGENTS.md)).
- [Supabase](https://supabase.com): base de datos Postgres, autenticación del admin y almacenamiento de fotos (bucket `product-images`).
- [Anthropic API](https://console.anthropic.com) para el asistente de compra.
- Docker, desplegado en Hostinger con [Dokploy](https://dokploy.com).

## Estructura

```
app/
  page.tsx                 Catálogo (página principal)
  product/[code]/          Ficha de producto
  admin/                   Panel admin: productos, configuración, estadísticas, login
  api/assistant/route.ts   Endpoint del asistente de compra (streaming)
components/                Componentes de la interfaz
lib/
  types.ts                 Tipos y PUBLIC_PRODUCT_COLUMNS (columnas visibles al público)
  supabase/                Clientes de Supabase (navegador, servidor, middleware)
  analytics.ts             Registro de visitas y clics en WhatsApp
  resize-image.ts          Reducción de fotos antes de subirlas
supabase/
  schema.sql               Tablas, permisos y bucket de fotos
  analytics.sql            Tabla de estadísticas y función admin_stats
  migration-reservado.sql  Migración que agrega el estado "reservado" (bases creadas antes)
scripts/                   Scripts de mantenimiento (ver abajo)
data/inventario.csv        Inventario original exportado de Google Sheets
public/og-image.jpg        Imagen de vista previa del catálogo
```

## Puesta en marcha local

Requisitos: Node.js 22 y un proyecto de Supabase.

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.local.example` a `.env.local` y completar los valores (ver [Variables de entorno](#variables-de-entorno)).

3. Preparar Supabase (solo la primera vez), en **SQL Editor → New query**:
   - ejecutar todo [supabase/schema.sql](supabase/schema.sql);
   - ejecutar todo [supabase/analytics.sql](supabase/analytics.sql).

   `schema.sql` ya incluye el estado "reservado". En una base creada antes de ese cambio, basta con ejecutar [supabase/migration-reservado.sql](supabase/migration-reservado.sql).

4. Crear el usuario admin en Supabase: **Authentication → Users → Add user**, con email y contraseña. El registro público está desactivado ("Allow new users to sign up" en **Authentication → Sign In / Providers**) y debe seguir así: cualquier usuario con sesión puede editar y borrar productos.

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   El catálogo queda en [http://localhost:3000](http://localhost:3000) y el admin en [http://localhost:3000/admin](http://localhost:3000/admin).

Otros comandos: `npm run build` (build de producción), `npm run start` (servir el build) y `npm run lint`.

## Variables de entorno

| Variable | Dónde se usa | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | App y scripts. Se incrusta en el build. | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App y scripts. Es pública; los permisos los controla Supabase. | Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo los scripts de `scripts/`. Tiene acceso total: **nunca** cargarla en el servidor de producción ni exponerla. | Solo para scripts |
| `ANTHROPIC_API_KEY` | Asistente de compra (solo servidor). Sin ella, el asistente no aparece y el resto funciona igual. | No |
| `ASSISTANT_LIMIT_PER_IP_HOUR` | Mensajes por hora por visitante en el asistente (por defecto 20). | No |
| `ASSISTANT_LIMIT_PER_DAY` | Mensajes por día en total en el asistente (por defecto 300). | No |
| `SITE_URL` | Dominio para los links absolutos (vista previa, link en WhatsApp). Por defecto `https://tiendaz.online`. | No |

## Despliegue (Dokploy)

La app está creada en Dokploy como **Application** con build por **Dockerfile** ([Dockerfile](Dockerfile), salida `standalone` de Next en el puerto 3000).

En la pestaña **Environment** de la aplicación:

- **Build Time Arguments:** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Next las incrusta en el código durante el build, por eso tienen que estar ahí.
- **Variables de entorno:** `ANTHROPIC_API_KEY` y, si hacen falta, las opcionales de la tabla anterior. Los secretos no van en los argumentos de build, porque quedarían guardados en la imagen.

Después de cambiar variables hay que volver a desplegar (**Deploy**/**Redeploy**): guardar no reinicia el contenedor.

Para publicar cambios de código: hacer push a `main` y desplegar desde Dokploy.

## Scripts de mantenimiento

Se corren desde la raíz del proyecto con `npx tsx scripts/<nombre>.ts` y leen `.env.local`. Los que modifican datos usan `SUPABASE_SERVICE_ROLE_KEY`.

| Script | Qué hace | Cuándo usarlo |
|---|---|---|
| `generate-og-image.ts` | Regenera `public/og-image.jpg` con las fotos de los 4 pares disponibles más recientes. | Para renovar la vista previa del catálogo. Después: commit y deploy. WhatsApp guarda en caché la vista previa anterior; para verla nueva, compartir el link con algo como `?v=4`. |
| `migrate-drive-images.ts` | Copia al bucket de Supabase las fotos que todavía apunten a Google Drive. Sin `--apply` solo informa; con `--apply` sube y actualiza. Se puede volver a correr. | Si alguna vez se carga un link de Drive como foto. |
| `migrate-sheet.ts` | Importa `data/inventario.csv` a Supabase. | Solo para la carga inicial; ya se usó. |
| `backfill-image-urls.ts` | Pasa el campo de foto antiguo (`image_url`) a la galería (`image_urls`). | Uso único; ya se usó. |

## Datos y permisos

- **Columnas públicas.** El público solo puede leer las columnas de venta de `products`. El precio de compra, el proveedor, la fecha de ingreso y la ubicación (`buy_price`, `provider`, `intake_date`, `location`) son solo para el admin. Si se agrega una columna que deba ser pública, sumarla en **los dos lugares**: `PUBLIC_PRODUCT_COLUMNS` en [lib/types.ts](lib/types.ts) y el `grant select (...)` de [supabase/schema.sql](supabase/schema.sql) (ejecutando de nuevo ese `grant` en Supabase). Las páginas públicas nunca deben usar `select("*")`.
- **Estadísticas.** La tabla `page_events` acepta registros de cualquier visitante, pero solo el admin puede leerlos (a través de la función `admin_stats`). Cada navegador se identifica con un id anónimo al azar; no se guardan datos personales. No se cuentan las visitas con la sesión de admin abierta.
- **Asistente.** Las conversaciones se envían a Anthropic para generar las respuestas. El asistente recibe solo los pares disponibles y sus columnas públicas. Conviene tener un límite de gasto mensual configurado en la consola de Anthropic (**Limits**).
