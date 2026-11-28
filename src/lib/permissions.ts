/**
 * Permisos del panel. Cada rol guarda una lista de estas claves; el administrador las tiene todas.
 * Agregar una sección nueva al panel = agregar aquí su permiso y su ruta.
 */
export type Perm =
  | "leads" | "pedidos" | "clientes" | "mailing"
  | "puertas" | "turnos" | "menus"
  | "empleados" | "nomina" | "solicitudes"
  | "editor" | "blog" | "catalogo" | "idiomas"
  | "usuarios";

export const PERM_GROUPS: { title: string; perms: { id: Perm; label: string; help: string }[] }[] = [
  {
    title: "Negocio",
    perms: [
      { id: "leads", label: "Solicitudes web", help: "Ver y responder lo que llega del sitio y el cotizador." },
      { id: "pedidos", label: "Pedidos", help: "Crear y actualizar proyectos, montos y pagos." },
      { id: "clientes", label: "Clientes", help: "Fichas de empresas, su espacio y su acceso al portal." },
      { id: "mailing", label: "Email marketing", help: "Contactos, campañas y envíos masivos." },
    ],
  },
  {
    title: "Productos para clientes",
    perms: [
      { id: "puertas", label: "Puertas (QR / NFC)", help: "Páginas de un toque de los clientes." },
      { id: "turnos", label: "Turnos con QR", help: "Filas de turnos y pantallas." },
      { id: "menus", label: "Menú del día", help: "Menús de restaurantes." },
    ],
  },
  {
    title: "Equipo",
    perms: [
      { id: "empleados", label: "Empleados", help: "Fichas del equipo. Incluye datos personales." },
      { id: "nomina", label: "Nómina", help: "Salarios y pagos. Información sensible." },
      { id: "solicitudes", label: "Solicitudes internas", help: "Vacaciones, permisos y aprobaciones." },
    ],
  },
  {
    title: "Sitio web",
    perms: [
      { id: "editor", label: "Textos, editor visual y temáticas", help: "Cambiar los textos del sitio y publicar." },
      { id: "blog", label: "Blog", help: "Escribir y publicar artículos." },
      { id: "catalogo", label: "Servicios, productos, planes, casos de éxito, testimonios y preguntas", help: "El catálogo que se ve en el sitio." },
      { id: "idiomas", label: "Idioma del sitio", help: "Traducciones al inglés y al portugués." },
    ],
  },
  {
    title: "Ajustes",
    perms: [{ id: "usuarios", label: "Usuarios y roles", help: "Crear usuarios, cambiar roles y permisos. Solo para personas de total confianza." }],
  },
];

export const ALL_PERMS: Perm[] = PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.id));

/** Ruta del panel → permiso que exige. Las rutas que no aparecen (resumen, correo, perfil) son para todos. */
const ROUTES: [RegExp, Perm][] = [
  [/^\/admin\/(leads|agenda)/, "leads"],
  [/^\/admin\/pedidos/, "pedidos"],
  [/^\/admin\/clientes/, "clientes"],
  [/^\/admin\/mailing/, "mailing"],
  [/^\/admin\/puertas/, "puertas"],
  [/^\/admin\/turnos/, "turnos"],
  [/^\/admin\/menus/, "menus"],
  [/^\/admin\/empleados/, "empleados"],
  [/^\/admin\/nomina/, "nomina"],
  [/^\/admin\/solicitudes/, "solicitudes"],
  [/^\/admin\/(editor|contenido|tematicas)/, "editor"],
  [/^\/admin\/blog/, "blog"],
  [/^\/admin\/(servicios|productos|planes|testimonios|casos|preguntas)/, "catalogo"],
  [/^\/admin\/idiomas/, "idiomas"],
  [/^\/admin\/usuarios/, "usuarios"],
];

export function permForPath(path: string | null | undefined): Perm | null {
  if (!path) return null;
  return ROUTES.find(([r]) => r.test(path))?.[1] ?? null;
}

/** Recurso genérico del panel (clave de src/lib/resources.ts) → permiso. */
export function permForResource(key: string): Perm | null {
  return permForPath(`/admin/${key}`);
}

export function parsePerms(v: string | null | undefined): Perm[] {
  const set = new Set(ALL_PERMS as string[]);
  return (v || "").split(/[\s,]+/).filter((x) => set.has(x)) as Perm[];
}

/** Roles que se crean la primera vez, para no empezar de cero. */
export const DEFAULT_ROLES: { name: string; description: string; perms: Perm[] }[] = [
  { name: "Editor de contenido", description: "Mantiene el sitio al día: textos, blog y catálogo.", perms: ["editor", "blog", "catalogo", "idiomas"] },
  { name: "Comercial", description: "Atiende solicitudes, clientes, pedidos y campañas.", perms: ["leads", "pedidos", "clientes", "mailing"] },
  { name: "Soporte a clientes", description: "Configura las Puertas, turnos y menús de los clientes.", perms: ["clientes", "puertas", "turnos", "menus"] },
  { name: "Recursos humanos", description: "Equipo, nómina y solicitudes internas.", perms: ["empleados", "nomina", "solicitudes"] },
];
