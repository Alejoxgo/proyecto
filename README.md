# Aldore · Sitio web + panel de administración

Sitio web corporativo (en español) para **Aldore**, empresa de servicios TI: páginas web, aplicaciones a la medida, chatbots con IA, integraciones TI, nube/soporte, ciberseguridad y la app propia **Castorly**.

Todo el contenido es administrable desde `/admin` (protegido con usuario y contraseña).

## Qué incluye

**Sitio público**
- Portada: hero, servicios, bloque destacado de Castorly, productos, proceso de trabajo, planes y precios, testimonios, preguntas frecuentes y formulario de contacto.
- Página propia por servicio (`/servicios/[slug]`) y por producto (`/productos/[slug]`). `/castorly` lleva a la página del producto Castorly.
- Página `/contacto`, botón flotante de WhatsApp, SEO básico (títulos, descripción, Open Graph, `robots.txt`) y diseño responsive.

**Panel admin (`/admin`)**
| Sección | Qué puedes hacer |
|---|---|
| Resumen | Conteos y últimos contactos |
| Leads / contactos | Ver mensajes del formulario, buscar, filtrar, cambiar estado (nuevo → contactado → en negociación → ganado/perdido), notas internas, abrir WhatsApp, exportar CSV |
| Textos del sitio | Nombre de la marca, SEO, hero, títulos de secciones, pasos del proceso, sección Castorly, datos de contacto, redes sociales, pie de página |
| Servicios / Productos / Planes / Testimonios / Preguntas | Crear, editar, ordenar, ocultar/publicar y eliminar |
| Usuarios | Crear y eliminar administradores, cambiar tu contraseña |

Los cambios se ven en el sitio de inmediato.

## Stack

- **Next.js 15** (App Router, Server Actions) + **React 19** + **TypeScript**
- **Prisma 6** con **SQLite** (cambiable a PostgreSQL)
- **Tailwind CSS**
- Autenticación propia: contraseñas con bcrypt, sesión en cookie `httpOnly` firmada (JWT con `jose`), middleware que protege `/admin` y `/api/admin`, y límite de intentos de login.

## Instalación local

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env          # edita AUTH_SECRET, ADMIN_EMAIL y ADMIN_PASSWORD
npm run setup                 # crea la base de datos y carga el contenido inicial
npm run dev                   # http://localhost:3000
```

Ingresa a http://localhost:3000/admin con `ADMIN_EMAIL` / `ADMIN_PASSWORD` y cambia la contraseña en **Usuarios**.

> El contenido inicial (servicios, precios, testimonios, textos de Castorly) es de ejemplo. Reemplázalo desde el panel con la información real.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | `file:./dev.db` para SQLite o una URL `postgresql://…` |
| `AUTH_SECRET` | Secreto de al menos 32 caracteres (`openssl rand -base64 48`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Primer administrador; solo se usan si no existe ningún usuario |
| `SITE_URL` | URL pública, por defecto `https://aldore.co` (SEO, sitemap) |
| `SETUP_CODE` | Código para crear el primer administrador desde `/admin/login` cuando la base está vacía |
| `GROQ_API_KEY` | (Opcional) Clave de Groq para que Aldo, el chat del sitio, responda con IA. Sin ella responde por palabras clave |
| `GROQ_MODEL` | (Opcional) Modelo de Groq. Por defecto `llama-3.3-70b-versatile` |
| `RESEND_API_KEY` | (Opcional) Clave de [Resend](https://resend.com) para los avisos por correo de nuevas solicitudes y la respuesta automática. El remitente y el destino se configuran en el panel → Textos del sitio → Avisos por correo |
| `INSECURE_COOKIES` | Pon `true` solo si pruebas en producción **sin HTTPS** (no recomendado) |

## Despliegue

### Opción recomendada · Cloudflare Workers + D1 (dominio aldore.co)

El proyecto está listo para Cloudflare con [OpenNext](https://opennext.js.org/cloudflare) y la base de datos **D1**.

1. **Crear la base D1:** Cloudflare → Storage & Databases → D1 → *Create* → nombre `aldore-db`. Copia su **Database ID** y pégalo en `wrangler.jsonc` (`database_id`).
2. **Conectar el repositorio:** Workers & Pages → Create → Import a repository → `Alejoxgo/proyecto`:
   - Project name: `aldore` (debe coincidir con `name` en `wrangler.jsonc`)
   - Build command: `npm run cf:build`
   - Deploy command: `npm run cf:deploy` (aplica las migraciones de D1 y publica)
3. **Secretos** (Worker → Settings → Variables and Secrets, tipo *Secret*):
   - `AUTH_SECRET`: texto aleatorio de 32+ caracteres
   - `SETUP_CODE`: un código que solo tú conozcas, para crear el primer administrador
   - `GROQ_API_KEY` (opcional): tu clave de Groq para que Aldo responda con IA
4. **Primer administrador:** abre `https://aldore.co/admin/login`. Como la base está vacía, verás «Configura tu panel»: escribe el `SETUP_CODE`, tu nombre, correo y contraseña.
5. **Dominio:** Worker → Settings → Domains & Routes → *Add* → Custom domain → `aldore.co` y `www.aldore.co`. Cloudflare crea los DNS y el certificado.

Si el paso de migraciones falla por permisos, ejecuta el SQL de `migrations/0001_init.sql` y luego `migrations/0002_contenido_inicial.sql` en la consola de D1 y cambia el Deploy command a `npx opennextjs-cloudflare deploy`.

Probar localmente con el runtime de Cloudflare: crea `.dev.vars` con `AUTH_SECRET` y `SETUP_CODE`, y ejecuta `npm run cf:preview`.

Cambios de esquema: tras editar `schema.prisma`, crea una nueva migración en `migrations/` (puedes partir de `npx prisma migrate diff`).

### Opción A · VPS o servidor propio con Docker (SQLite)

```bash
cp .env.example .env     # define AUTH_SECRET y ADMIN_PASSWORD
docker compose up -d --build
```

La base de datos queda en el volumen `aldore-data`, así que sobrevive a reinicios y actualizaciones. Pon delante un proxy con HTTPS (Caddy, Nginx + Certbot, Cloudflare). Ejemplo con Caddy:

```
aldore.co {
  reverse_proxy localhost:3000
}
```

Para actualizar: `git pull && docker compose up -d --build`.

### Opción B · Railway / Render / Fly.io

1. Crea el servicio desde este repositorio (detectan el `Dockerfile`).
2. Agrega un **volumen persistente** montado en `/data` y define `DATABASE_URL=file:/data/aldore.db`.
3. Define `AUTH_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

### Opción C · Vercel (con PostgreSQL)

Vercel no tiene disco persistente, así que usa PostgreSQL (Neon, Supabase, Vercel Postgres):

1. En `prisma/schema.prisma` cambia `provider = "sqlite"` por `provider = "postgresql"`.
2. Define en Vercel `DATABASE_URL` (la de Postgres), `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. Desde tu equipo, con esa `DATABASE_URL` en `.env`, ejecuta una vez `npm run setup` para crear las tablas y el contenido.
4. Despliega. El comando de build (`npm run build`) ya ejecuta `prisma generate`.

### Servidor Node sin Docker

```bash
npm ci
npm run setup
npm run build
PORT=3000 npm start      # usa pm2 o systemd para mantenerlo arriba
```

## Estructura

```
prisma/schema.prisma          Modelos: User, Service, Product, Plan, Testimonial, Faq, Setting, Lead
prisma/seed.mjs               Contenido inicial y usuario admin (idempotente)
src/app/(site)/               Sitio público
src/app/admin/                Login, panel y server actions del admin
src/lib/settings.ts           Lista de textos editables (agrega un campo aquí y aparece en el panel)
src/lib/resources.ts          Configuración del CRUD genérico (campos de servicios, productos, etc.)
src/components/               Componentes del sitio y del panel
```

## Identidad visual

- **Logo:** arco ojival (la «A» de Aldore y una puerta) con la entrada en bermellón. Archivos: `public/logo-mark.svg` y `src/app/icon.svg` (favicon). Componente: `src/components/Logo.tsx`.
- **Colores:** papel `#f4f1ea`, tinta `#16130f`, bermellón `#e2471c`.
- **Tipografías:** Space Grotesk (títulos), Geist (texto), JetBrains Mono (etiquetas y código) y Fraunces solo en el logotipo, servidas localmente con Fontsource.
- En los títulos editables puedes encerrar una palabra entre `*asteriscos*` para resaltarla en cursiva.

## Personalización rápida

- **Nuevo texto editable:** agrégalo en `SETTINGS_GROUPS` (`src/lib/settings.ts`) y úsalo con `s["tu.clave"]`.
- **Nuevo campo en servicios/productos:** agrégalo al modelo en `schema.prisma`, ejecuta `npm run db:push` y añádelo en `src/lib/resources.ts`.
- **Colores de marca:** `tailwind.config.ts` (`brand`, `paper`, `ink`).
