// Configuración del CRUD genérico del panel. Cada recurso = un modelo de Prisma.
import { ICON_NAMES } from "@/components/Icon";
import { randomKey } from "./utils";

export type FieldType = "text" | "textarea" | "number" | "checkbox" | "select" | "url" | "slug" | "money" | "date" | "month" | "relation" | "email";

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  /** Para type "relation": modelo relacionado y campo que se muestra. */
  relation?: { model: RelatedModel; labelField: string; where?: Record<string, unknown> };
  /** Ocupa media fila en el formulario. */
  half?: boolean;
};

type RelatedModel = "client" | "employee";

export type ColumnFormat = "money" | "status" | "relation" | "bool" | "date";

export type ResourceConfig = {
  key: string;
  model: "service" | "product" | "plan" | "testimonial" | "caseStudy" | "faq" | "client" | "order" | "employee" | "payroll" | "staffRequest" | "linkPage" | "post" | "queue" | "menuBoard";
  label: string;
  singular: string;
  description: string;
  titleField: string;
  columns: { name: string; label: string; format?: ColumnFormat }[];
  fields: ResourceField[];
  /** Orden del listado. Por defecto: campo "order" y luego id. */
  sort?: Record<string, "asc" | "desc">[];
  /** Campo de estado para filtrar el listado y pintar etiquetas. */
  statusField?: string;
  /** Columnas de dinero que se suman al pie del listado. */
  totals?: string[];
  /** Valores iniciales de un registro nuevo. */
  defaults?: Record<string, string>;
  /** Ajusta los datos antes de guardar (cálculos, valores por defecto). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeSave?: (data: Record<string, any>) => Promise<void> | void;
};

const iconOptions = ICON_NAMES.map((n) => ({ value: n, label: n }));
const order: ResourceField = { name: "order", label: "Orden (menor aparece primero)", type: "number" };
const published: ResourceField = { name: "published", label: "Publicado (visible en el sitio)", type: "checkbox" };
const featuresHelp = "Una característica por línea.";

export const RESOURCES: ResourceConfig[] = [
  {
    key: "servicios",
    model: "service",
    label: "Servicios",
    singular: "servicio",
    description: "Servicios que aparecen en la portada y tienen página propia en /servicios/[slug].",
    titleField: "title",
    columns: [
      { name: "title", label: "Título" },
      { name: "slug", label: "Slug" },
      { name: "order", label: "Orden" },
      { name: "published", label: "Publicado" },
    ],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "slug", label: "Slug (URL)", type: "slug", help: "Se genera a partir del título si lo dejas vacío." },
      { name: "icon", label: "Ícono", type: "select", options: iconOptions },
      { name: "shortDescription", label: "Descripción corta (tarjeta)", type: "textarea", rows: 2, required: true },
      { name: "description", label: "Descripción completa", type: "textarea", rows: 8, help: "Separa párrafos con una línea en blanco.", required: true },
      { name: "features", label: "Qué incluye", type: "textarea", rows: 6, help: featuresHelp },
      order,
      published,
    ],
  },
  {
    key: "productos",
    model: "product",
    label: "Productos",
    singular: "producto",
    description: "Productos propios (como Castorly). Cada uno tiene página en /productos/[slug].",
    titleField: "name",
    columns: [
      { name: "name", label: "Nombre" },
      { name: "slug", label: "Slug" },
      { name: "featured", label: "Destacado" },
      { name: "published", label: "Publicado" },
    ],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "slug", label: "Slug (URL)", type: "slug", help: "Usa «castorly» para el producto Castorly." },
      { name: "tagline", label: "Frase corta", type: "text", required: true },
      { name: "description", label: "Descripción", type: "textarea", rows: 8, help: "Separa párrafos con una línea en blanco.", required: true },
      { name: "features", label: "Características", type: "textarea", rows: 6, help: featuresHelp },
      { name: "price", label: "Precio (texto libre)", type: "text", help: "Ej: Desde $49.900 COP/mes" },
      { name: "priceNote", label: "Nota del precio", type: "text" },
      { name: "ctaLabel", label: "Texto del botón", type: "text" },
      { name: "ctaUrl", label: "Enlace del botón (vacío = formulario de contacto)", type: "url" },
      { name: "imageUrl", label: "Imagen (URL)", type: "url" },
      { name: "featured", label: "Destacado en portada", type: "checkbox" },
      order,
      published,
    ],
  },
  {
    key: "planes",
    model: "plan",
    label: "Planes y precios",
    singular: "plan",
    description: "Planes de páginas web que se muestran en la sección de precios.",
    titleField: "name",
    columns: [
      { name: "name", label: "Nombre" },
      { name: "price", label: "Precio" },
      { name: "highlighted", label: "Recomendado" },
      { name: "published", label: "Publicado" },
    ],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "price", label: "Precio", type: "text", required: true },
      { name: "period", label: "Periodo / nota", type: "text", help: "Ej: pago único, /mes" },
      { name: "description", label: "Descripción", type: "textarea", rows: 2 },
      { name: "features", label: "Incluye", type: "textarea", rows: 6, help: featuresHelp },
      { name: "highlighted", label: "Marcar como recomendado", type: "checkbox" },
      order,
      published,
    ],
  },
  {
    key: "testimonios",
    model: "testimonial",
    label: "Testimonios",
    singular: "testimonio",
    description: "Opiniones de clientes.",
    titleField: "name",
    columns: [
      { name: "name", label: "Nombre" },
      { name: "company", label: "Empresa" },
      { name: "published", label: "Publicado" },
    ],
    fields: [
      { name: "name", label: "Nombre", type: "text", required: true },
      { name: "role", label: "Cargo", type: "text" },
      { name: "company", label: "Empresa", type: "text" },
      { name: "quote", label: "Testimonio", type: "textarea", rows: 4, required: true },
      order,
      published,
    ],
  },
  {
    key: "casos",
    model: "caseStudy",
    label: "Casos de éxito",
    singular: "caso",
    description: "Proyectos terminados con resultados. La sección aparece en el sitio cuando publicas el primero. Si aún no tienes clientes, muestra tus productos propios marcándolos como «Proyecto propio».",
    titleField: "title",
    columns: [
      { name: "title", label: "Título" },
      { name: "client", label: "Cliente" },
      { name: "own", label: "Propio", format: "bool" },
      { name: "published", label: "Publicado", format: "bool" },
    ],
    defaults: { published: "false" },
    fields: [
      { name: "title", label: "Título del caso", type: "text", required: true, help: "Ej.: «Café Laurel duplicó sus reseñas en Google en un mes»." },
      { name: "slug", label: "Slug (URL)", type: "slug", help: "Se genera a partir del título si lo dejas vacío." },
      { name: "client", label: "Cliente o proyecto", type: "text", half: true },
      { name: "industry", label: "Sector", type: "text", half: true, help: "Ej.: Restaurante, Clínica, Inmobiliaria." },
      { name: "own", label: "Proyecto propio de Aldore (no de un cliente)", type: "checkbox" },
      { name: "summary", label: "Resumen (tarjeta)", type: "textarea", rows: 2, required: true },
      { name: "challenge", label: "El reto", type: "textarea", rows: 4, help: "Qué problema tenía el cliente antes." },
      { name: "solution", label: "Lo que hicimos", type: "textarea", rows: 5, help: "Separa párrafos con una línea en blanco." },
      { name: "results", label: "Resultados en números", type: "textarea", rows: 4, help: "Uno por línea: número | qué significa. Ej.: 48% | más reservas en línea" },
      { name: "quote", label: "Testimonio del cliente", type: "textarea", rows: 3 },
      { name: "quoteAuthor", label: "Quién lo dice", type: "text", help: "Ej.: Laura Gómez, gerente de Café Laurel." },
      { name: "coverUrl", label: "Imagen de portada (URL)", type: "url" },
      { name: "tags", label: "Etiquetas", type: "text", help: "Separadas por coma: Página web, Puerta, Chatbot." },
      order,
      { ...published, label: "Publicado (visible en el sitio)" },
    ],
  },
  {
    key: "preguntas",
    model: "faq",
    label: "Preguntas frecuentes",
    singular: "pregunta",
    description: "Preguntas y respuestas de la portada.",
    titleField: "question",
    columns: [
      { name: "question", label: "Pregunta" },
      { name: "order", label: "Orden" },
      { name: "published", label: "Publicado" },
    ],
    fields: [
      { name: "question", label: "Pregunta", type: "text", required: true },
      { name: "answer", label: "Respuesta", type: "textarea", rows: 5, required: true },
      order,
      published,
    ],
  },
];

/* ---------------- Gestión del negocio ---------------- */

const opts = (...xs: [string, string][]) => xs.map(([value, label]) => ({ value, label }));

export const ORDER_STATUSES = opts(
  ["cotizacion", "Cotización"],
  ["aprobado", "Aprobado"],
  ["en_progreso", "En progreso"],
  ["entregado", "Entregado"],
  ["pagado", "Pagado"],
  ["cancelado", "Cancelado"],
);
export const PAYROLL_STATUSES = opts(["pendiente", "Pendiente"], ["pagado", "Pagado"]);
export const REQUEST_STATUSES = opts(["pendiente", "Pendiente"], ["aprobada", "Aprobada"], ["rechazada", "Rechazada"]);
export const REQUEST_TYPES = opts(
  ["vacaciones", "Vacaciones"],
  ["permiso", "Permiso"],
  ["incapacidad", "Incapacidad"],
  ["compra", "Compra o gasto"],
  ["equipo", "Equipo o acceso"],
  ["otro", "Otro"],
);
export const CONTRACT_TYPES = opts(
  ["indefinido", "Término indefinido"],
  ["fijo", "Término fijo"],
  ["prestacion", "Prestación de servicios"],
  ["aprendiz", "Aprendiz / practicante"],
);

/** Color de la etiqueta según el valor del estado. */
export const STATUS_COLORS: Record<string, string> = {
  cotizacion: "bg-slate-200 text-slate-700",
  aprobado: "bg-sky-100 text-sky-700",
  en_progreso: "bg-amber-100 text-amber-800",
  entregado: "bg-violet-100 text-violet-700",
  pagado: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
  pendiente: "bg-amber-100 text-amber-800",
  aprobada: "bg-emerald-100 text-emerald-700",
  rechazada: "bg-red-100 text-red-700",
};

export const BUSINESS_RESOURCES: ResourceConfig[] = [
  {
    key: "pedidos",
    model: "order",
    label: "Pedidos",
    singular: "pedido",
    description: "Proyectos y ventas: cotizaciones, trabajos en curso, entregas y pagos.",
    titleField: "title",
    sort: [{ createdAt: "desc" }],
    statusField: "status",
    totals: ["amount", "paid"],
    columns: [
      { name: "title", label: "Pedido" },
      { name: "clientId", label: "Cliente", format: "relation" },
      { name: "status", label: "Estado", format: "status" },
      { name: "amount", label: "Valor", format: "money" },
      { name: "paid", label: "Pagado", format: "money" },
      { name: "dueDate", label: "Entrega", format: "date" },
    ],
    fields: [
      { name: "title", label: "Nombre del pedido", type: "text", required: true, help: "Ej: Página web corporativa, Chatbot de WhatsApp" },
      { name: "clientId", label: "Cliente", type: "relation", relation: { model: "client", labelField: "name" }, half: true },
      { name: "service", label: "Servicio", type: "text", half: true },
      { name: "status", label: "Estado", type: "select", options: ORDER_STATUSES, half: true },
      { name: "amount", label: "Valor total (COP)", type: "money", half: true },
      { name: "paid", label: "Pagado hasta hoy (COP)", type: "money", half: true },
      { name: "startDate", label: "Fecha de inicio", type: "date", half: true },
      { name: "dueDate", label: "Fecha de entrega", type: "date", half: true },
      { name: "clientUpdate", label: "Novedad para el cliente", type: "textarea", rows: 3, help: "Lo ve el cliente en su portal. Ej: Ya está lista la primera versión, revísala y nos cuentas." },
      { name: "notes", label: "Notas internas", type: "textarea", rows: 4, help: "Solo las ves tú." },
    ],
  },
  {
    key: "clientes",
    model: "client",
    label: "Clientes",
    singular: "cliente",
    description: "Empresas y personas a las que les vendes.",
    titleField: "name",
    sort: [{ name: "asc" }],
    columns: [
      { name: "name", label: "Nombre" },
      { name: "company", label: "Empresa" },
      { name: "email", label: "Correo" },
      { name: "phone", label: "Teléfono" },
    ],
    fields: [
      { name: "name", label: "Nombre de contacto", type: "text", required: true, half: true },
      { name: "company", label: "Empresa", type: "text", half: true },
      { name: "taxId", label: "NIT / Cédula", type: "text", half: true },
      { name: "city", label: "Ciudad", type: "text", half: true },
      { name: "email", label: "Correo", type: "email", half: true },
      { name: "phone", label: "Teléfono / WhatsApp", type: "text", half: true },
      { name: "color", label: "Color para identificarlo en el panel", type: "text", half: true, help: "Código de color, ej: #1F5C45" },
      { name: "notes", label: "Notas (internas)", type: "textarea", rows: 4 },
      { name: "portalToken", label: "Clave del portal del cliente", type: "text", help: "Se crea sola. Cámbiala o bórrala y guarda para generar un enlace nuevo (el anterior deja de funcionar)." },
    ],
    beforeSave(data) {
      if (!String(data.portalToken || "").trim()) data.portalToken = randomKey();
    },
  },
  {
    key: "empleados",
    model: "employee",
    label: "Empleados",
    singular: "empleado",
    description: "Tu equipo: datos de contacto, cargo, contrato y salario.",
    titleField: "name",
    sort: [{ active: "desc" }, { name: "asc" }],
    totals: ["salary"],
    columns: [
      { name: "name", label: "Nombre" },
      { name: "position", label: "Cargo" },
      { name: "salary", label: "Salario", format: "money" },
      { name: "startDate", label: "Ingreso", format: "date" },
      { name: "active", label: "Activo", format: "bool" },
    ],
    fields: [
      { name: "name", label: "Nombre completo", type: "text", required: true, half: true },
      { name: "document", label: "Cédula", type: "text", half: true },
      { name: "email", label: "Correo", type: "email", half: true },
      { name: "phone", label: "Teléfono", type: "text", half: true },
      { name: "position", label: "Cargo", type: "text", half: true },
      { name: "contractType", label: "Tipo de contrato", type: "select", options: CONTRACT_TYPES, half: true },
      { name: "salary", label: "Salario mensual (COP)", type: "money", half: true },
      { name: "startDate", label: "Fecha de ingreso", type: "date", half: true },
      { name: "bank", label: "Banco", type: "text", half: true },
      { name: "bankAccount", label: "Número de cuenta", type: "text", half: true },
      { name: "notes", label: "Notas", type: "textarea", rows: 3 },
      { name: "active", label: "Empleado activo", type: "checkbox" },
    ],
  },
  {
    key: "nomina",
    model: "payroll",
    label: "Nómina",
    singular: "pago de nómina",
    description: "Pagos mensuales a cada empleado. El neto se calcula solo: salario + bonos − deducciones.",
    titleField: "period",
    sort: [{ period: "desc" }, { id: "asc" }],
    statusField: "status",
    totals: ["baseSalary", "bonuses", "deductions", "net"],
    columns: [
      { name: "period", label: "Periodo" },
      { name: "employeeId", label: "Empleado", format: "relation" },
      { name: "baseSalary", label: "Salario", format: "money" },
      { name: "bonuses", label: "Bonos", format: "money" },
      { name: "deductions", label: "Deducciones", format: "money" },
      { name: "net", label: "Neto", format: "money" },
      { name: "status", label: "Estado", format: "status" },
    ],
    fields: [
      { name: "employeeId", label: "Empleado", type: "relation", required: true, relation: { model: "employee", labelField: "name" }, half: true },
      { name: "period", label: "Periodo", type: "month", required: true, half: true },
      { name: "baseSalary", label: "Salario base (COP)", type: "money", half: true, help: "Si lo dejas en 0 se usa el salario del empleado." },
      { name: "bonuses", label: "Bonos, horas extra, comisiones", type: "money", half: true },
      { name: "deductions", label: "Deducciones (salud, pensión, préstamos)", type: "money", half: true },
      { name: "status", label: "Estado", type: "select", options: PAYROLL_STATUSES, half: true },
      { name: "paidDate", label: "Fecha de pago", type: "date", half: true },
      { name: "notes", label: "Notas", type: "textarea", rows: 3 },
    ],
    async beforeSave(data) {
      if (!data.baseSalary && data.employeeId) {
        const { prisma } = await import("./db");
        const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
        data.baseSalary = emp?.salary ?? 0;
      }
      data.net = (data.baseSalary || 0) + (data.bonuses || 0) - (data.deductions || 0);
      if (data.status === "pagado" && !data.paidDate) data.paidDate = new Date().toISOString().slice(0, 10);
    },
  },
  {
    key: "solicitudes",
    model: "staffRequest",
    label: "Solicitudes internas",
    singular: "solicitud",
    description: "Vacaciones, permisos, incapacidades, compras y otras solicitudes de tu equipo.",
    titleField: "title",
    sort: [{ createdAt: "desc" }],
    statusField: "status",
    columns: [
      { name: "title", label: "Solicitud" },
      { name: "employeeId", label: "Empleado", format: "relation" },
      { name: "type", label: "Tipo" },
      { name: "startDate", label: "Desde", format: "date" },
      { name: "endDate", label: "Hasta", format: "date" },
      { name: "status", label: "Estado", format: "status" },
    ],
    fields: [
      { name: "title", label: "Asunto", type: "text", required: true },
      { name: "employeeId", label: "Empleado", type: "relation", relation: { model: "employee", labelField: "name" }, half: true },
      { name: "type", label: "Tipo", type: "select", options: REQUEST_TYPES, half: true },
      { name: "startDate", label: "Desde", type: "date", half: true },
      { name: "endDate", label: "Hasta", type: "date", half: true },
      { name: "status", label: "Estado", type: "select", options: REQUEST_STATUSES, half: true },
      { name: "description", label: "Detalle", type: "textarea", rows: 4 },
    ],
  },
];

export const PUERTA_RESOURCE: ResourceConfig = {
  key: "puertas",
  model: "linkPage",
  label: "Puertas",
  singular: "puerta",
  description: "Páginas de un toque para tus clientes (QR o NFC). Cada una queda en aldore.co/p/su-nombre.",
  titleField: "name",
  sort: [{ createdAt: "desc" }],
  columns: [
    { name: "name", label: "Negocio" },
    { name: "slug", label: "Dirección" },
    { name: "clientId", label: "Cliente", format: "relation" },
    { name: "views", label: "Visitas" },
    { name: "clicks", label: "Toques" },
    { name: "published", label: "Publicada" },
  ],
  fields: [
    { name: "name", label: "Nombre del negocio", type: "text", required: true, half: true },
    { name: "slug", label: "Dirección (aldore.co/p/…)", type: "slug", half: true, help: "Se genera del nombre si lo dejas vacío. Ej: padre-nuestro-sabaneta" },
    { name: "subtitle", label: "Texto bajo el nombre", type: "text", half: true, help: "Ej: Sabaneta · Cocina de autor" },
    { name: "clientId", label: "Cliente (para tu control)", type: "relation", relation: { model: "client", labelField: "name" }, half: true },
    { name: "logoUrl", label: "Logo (URL de la imagen)", type: "url", half: true, help: "Cuadrado, idealmente PNG o SVG. Si lo dejas vacío se muestran las iniciales." },
    { name: "coverUrl", label: "Imagen de portada (URL)", type: "url", half: true, help: "Foto horizontal del local, la comida o la marca. Opcional." },
    { name: "color", label: "Color principal de la marca", type: "text", half: true, help: "Código de color, ej: #1F5C45" },
    { name: "bgColor", label: "Color de fondo", type: "text", half: true, help: "Ej: #F3EADB. Vacío = usa el fondo de abajo." },
    {
      name: "theme",
      label: "Fondo base (si no hay color de fondo)",
      type: "select",
      half: true,
      options: [
        { value: "oscuro", label: "Oscuro" },
        { value: "claro", label: "Claro" },
      ],
    },
    {
      name: "font",
      label: "Tipografía",
      type: "select",
      half: true,
      options: [
        { value: "moderna", label: "Moderna (limpia)" },
        { value: "elegante", label: "Elegante (con serifa)" },
        { value: "redondeada", label: "Redondeada (amigable)" },
        { value: "tecnica", label: "Técnica (geométrica)" },
      ],
    },
    {
      name: "buttonStyle",
      label: "Estilo de los botones",
      type: "select",
      half: true,
      options: [
        { value: "tarjeta", label: "Tarjeta" },
        { value: "solido", label: "Sólido de color" },
        { value: "contorno", label: "Contorno" },
      ],
    },
    {
      name: "buttons",
      label: "Botones",
      type: "textarea",
      rows: 8,
      help:
        "Uno por línea: ícono | título | subtítulo | enlace. Íconos: carta, resena, whatsapp, wifi, pago, instagram, facebook, tiktok, mapa, web, llamar, reservar, link. Para WhatsApp o llamar basta el número. Para el WiFi escribe wifi como enlace.",
    },
    { name: "wifiName", label: "WiFi – nombre de la red", type: "text", half: true },
    { name: "wifiPass", label: "WiFi – clave", type: "text", half: true },
    { name: "published", label: "Publicada (visible)", type: "checkbox" },
  ],
  defaults: {
    color: "#e2471c",
    buttons: [
      "carta | Nuestra carta | Mira lo que tenemos hoy | https://",
      "resena | ¿Cómo te fue hoy? | Déjanos tu reseña | https://g.page/r/",
      "whatsapp | Escríbenos por WhatsApp | Pedidos y reservas | +57",
      "wifi | Conéctate a nuestro WiFi | Toca para ver la clave | wifi",
      "pago | Nuestros métodos de pago | Nequi, Daviplata y tarjetas | https://",
    ].join("\n"),
  },
  beforeSave(data) {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(String(data.color || ""))) data.color = "#e2471c";
  },
};

export const BLOG_RESOURCE: ResourceConfig = {
  key: "blog",
  model: "post",
  label: "Blog",
  singular: "artículo",
  description: "Artículos del blog en aldore.co/blog. Ayudan a que te encuentren en Google.",
  titleField: "title",
  sort: [{ publishedAt: "desc" }, { id: "desc" }],
  columns: [
    { name: "title", label: "Título" },
    { name: "publishedAt", label: "Fecha", format: "date" },
    { name: "tags", label: "Etiquetas" },
    { name: "published", label: "Publicado", format: "bool" },
  ],
  fields: [
    { name: "title", label: "Título", type: "text", required: true },
    { name: "slug", label: "Dirección (aldore.co/blog/…)", type: "slug", half: true, help: "Se genera del título si lo dejas vacío." },
    { name: "publishedAt", label: "Fecha de publicación", type: "date", half: true, help: "Vacía = hoy." },
    { name: "excerpt", label: "Resumen", type: "textarea", rows: 2, help: "Una o dos frases. Sale en el listado y en Google." },
    { name: "coverUrl", label: "Imagen de portada (URL)", type: "url", help: "Horizontal, idealmente 1200×630." },
    {
      name: "content",
      label: "Contenido",
      type: "textarea",
      rows: 22,
      required: true,
      help: "Separa párrafos con una línea en blanco. ## Título, ### Subtítulo, - lista, 1. lista numerada, > cita destacada, **negrita**, *cursiva*, [texto](enlace), ![descripción](url-de-imagen).",
    },
    { name: "tags", label: "Etiquetas", type: "text", half: true, help: "Separadas por coma. Ej: Páginas web, Precios" },
    { name: "author", label: "Autor", type: "text", half: true },
    { name: "published", label: "Publicado (visible en el sitio)", type: "checkbox" },
  ],
  defaults: { author: "Equipo Aldore" },
  beforeSave(data) {
    if (!data.publishedAt) data.publishedAt = new Date().toISOString().slice(0, 10);
    if (!data.author) data.author = "Equipo Aldore";
  },
};

const hex = (v: unknown, fallback = "#e2471c") => (/^#[0-9a-fA-F]{3,8}$/.test(String(v || "")) ? String(v) : fallback);

export const QUEUE_RESOURCE: ResourceConfig = {
  key: "turnos",
  model: "queue",
  label: "Turnos con QR",
  singular: "fila de turnos",
  description: "Filas de turnos para tus clientes: escanean un QR, toman turno y ven en el celular cuándo les toca.",
  titleField: "name",
  sort: [{ createdAt: "desc" }],
  columns: [
    { name: "name", label: "Negocio" },
    { name: "slug", label: "Dirección" },
    { name: "currentNumber", label: "Turno actual" },
    { name: "lastNumber", label: "Dados hoy" },
    { name: "open", label: "Abierta", format: "bool" },
  ],
  fields: [
    { name: "name", label: "Nombre del negocio o la fila", type: "text", required: true, half: true, help: "Ej: Peluquería Ola, Caja 1, Laboratorio" },
    { name: "slug", label: "Dirección (aldore.co/t/…)", type: "slug", half: true },
    { name: "subtitle", label: "Texto bajo el nombre", type: "text", half: true, help: "Ej: Envigado · Sin cita previa" },
    { name: "clientId", label: "Cliente (para tu control)", type: "relation", relation: { model: "client", labelField: "name" }, half: true },
    { name: "logoUrl", label: "Logo (URL)", type: "url", half: true },
    { name: "color", label: "Color", type: "text", half: true, help: "Ej: #FF4D6D" },
    { name: "prefix", label: "Letra del turno", type: "text", half: true, help: "Ej: A → A01, A02…" },
    { name: "avgMinutes", label: "Minutos promedio por turno", type: "number", half: true, help: "Para calcular la espera aproximada." },
    { name: "open", label: "Recibiendo turnos", type: "checkbox" },
    { name: "staffKey", label: "Clave del panel de atención", type: "text", help: "Se crea sola. Bórrala y guarda para generar otra (el enlace anterior deja de funcionar)." },
  ],
  defaults: { color: "#e2471c", prefix: "A", avgMinutes: "5", open: "true" },
  beforeSave(data) {
    data.color = hex(data.color);
    data.prefix = String(data.prefix || "A").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2) || "A";
    if (!data.avgMinutes) data.avgMinutes = 5;
    if (!String(data.staffKey || "").trim()) data.staffKey = randomKey();
  },
};

export const MENU_RESOURCE: ResourceConfig = {
  key: "menus",
  model: "menuBoard",
  label: "Menú del día",
  singular: "menú",
  description: "El almuerzo o menú del día de cada restaurante. El restaurante lo cambia desde el celular con su enlace privado.",
  titleField: "name",
  sort: [{ updatedAt: "desc" }],
  columns: [
    { name: "name", label: "Restaurante" },
    { name: "slug", label: "Dirección" },
    { name: "date", label: "Menú de", format: "date" },
    { name: "price", label: "Precio" },
    { name: "published", label: "Publicado", format: "bool" },
  ],
  fields: [
    { name: "name", label: "Nombre del restaurante", type: "text", required: true, half: true },
    { name: "slug", label: "Dirección (aldore.co/menu/…)", type: "slug", half: true },
    { name: "subtitle", label: "Texto bajo el nombre", type: "text", half: true, help: "Ej: Laureles · Comida casera" },
    { name: "clientId", label: "Cliente (para tu control)", type: "relation", relation: { model: "client", labelField: "name" }, half: true },
    { name: "logoUrl", label: "Logo (URL)", type: "url", half: true },
    { name: "color", label: "Color", type: "text", half: true },
    { name: "whatsapp", label: "WhatsApp para pedidos", type: "text", half: true, help: "Con indicativo: +57300…" },
    { name: "hours", label: "Horario", type: "text", half: true, help: "Ej: Almuerzos de 11:30 a. m. a 3:00 p. m." },
    { name: "date", label: "Fecha del menú", type: "date", half: true },
    { name: "price", label: "Precio", type: "text", half: true, help: "Ej: $18.000 · Con jugo y postre" },
    {
      name: "items",
      label: "Menú",
      type: "textarea",
      rows: 9,
      help: "Una línea por plato: Sección | Plato | detalle (opcional). Ej: Sopa | Sancocho de gallina. Una línea con ! al inicio se marca como agotada.",
    },
    { name: "notes", label: "Nota", type: "textarea", rows: 2, help: "Ej: Domicilios gratis en Laureles." },
    { name: "published", label: "Publicado", type: "checkbox" },
    { name: "staffKey", label: "Clave para editar desde el celular", type: "text", help: "Se crea sola. Bórrala y guarda para generar otra." },
  ],
  defaults: {
    color: "#e2471c",
    published: "true",
    items: ["Sopa | Sancocho de gallina", "Principio | Frijoles con garra", "Proteína | Carne asada | o pechuga a la plancha", "Acompañantes | Arroz, maduro, ensalada", "Bebida | Jugo de mora", "Postre | Arroz con leche"].join("\n"),
  },
  beforeSave(data) {
    data.color = hex(data.color);
    if (!data.date) data.date = new Date().toISOString().slice(0, 10);
    if (!String(data.staffKey || "").trim()) data.staffKey = randomKey();
  },
};

RESOURCES.push(...BUSINESS_RESOURCES, PUERTA_RESOURCE, BLOG_RESOURCE, QUEUE_RESOURCE, MENU_RESOURCE);

/** Etiqueta legible de un valor de select (estado, tipo…). */
export function optionLabel(res: ResourceConfig, field: string, value: string) {
  return res.fields.find((f) => f.name === field)?.options?.find((o) => o.value === value)?.label ?? value;
}

export function getResource(key: string) {
  return RESOURCES.find((r) => r.key === key);
}
