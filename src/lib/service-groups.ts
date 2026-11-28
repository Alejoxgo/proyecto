import type { Service } from "@prisma/client";

/** Cómo se agrupan los servicios en /servicios. Un servicio nuevo que no esté aquí cae en "Más servicios". */
export const SERVICE_GROUPS = [
  {
    id: "software",
    title: "Software a la *medida*",
    text: "Páginas, aplicaciones y bots que hacemos desde cero para tu forma de trabajar. Sin plantillas que te amarren.",
    slugs: ["desarrollo-web", "aplicaciones", "chatbots", "integraciones-ti", "automatizaciones"],
  },
  {
    id: "negocio",
    title: "Tu negocio, más *digital*",
    text: "Herramientas listas para restaurantes, tiendas, consultorios y pymes: vendes más y pierdes menos tiempo.",
    slugs: ["carta-digital", "menu-del-dia", "turnos-qr", "catalogo-whatsapp", "agenda-online", "fidelizacion", "resenas-google", "facturacion-electronica"],
  },
  {
    id: "fisico",
    title: "Lo digital, en tus *manos*",
    text: "Cosas que se tocan: tarjetas que se acercan al celular, pantallas en tu local y piezas impresas en 3D.",
    slugs: ["tarjetas-nfc", "pantallas-digitales", "impresion-3d"],
  },
  {
    id: "respaldo",
    title: "Respaldo y *acompañamiento*",
    text: "Lo que no se ve pero sostiene todo: servidores, seguridad, mantenimiento y un equipo que te enseña.",
    slugs: ["nube-y-soporte", "ciberseguridad", "mantenimiento-web", "capacitaciones"],
  },
] as const;

export function groupServices(services: Service[]) {
  const used = new Set<string>();
  type Group = { id: string; title: string; text: string; items: Service[] };
  const groups: Group[] = SERVICE_GROUPS.map((g): Group => {
    const items = (g.slugs as readonly string[])
      .map((slug) => services.find((s) => s.slug === slug))
      .filter((s): s is Service => Boolean(s));
    items.forEach((s) => used.add(s.slug));
    return { id: g.id, title: g.title, text: g.text, items };
  }).filter((g) => g.items.length);
  const rest = services.filter((s) => !used.has(s.slug));
  if (rest.length) groups.push({ id: "mas", title: "Más *servicios*", text: "Otras cosas en las que te podemos ayudar.", items: rest });
  return groups;
}
