import "server-only";
import { prisma } from "./db";
import { getSettings } from "./settings";
import { buildAldo } from "./aldo";
import { getT } from "./i18n";

/** Traduce todos los textos de un objeto (lo que sabe Aldo) cuando la visita es en inglés. */
function deepTr<T>(v: T, tx: (s: string) => string): T {
  if (typeof v === "string") return tx(v) as T;
  if (Array.isArray(v)) return v.map((x) => deepTr(x, tx)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === "href" || k === "id" || k === "keywords" ? x : deepTr(x, tx)])) as T;
  return v;
}

/** Carga lo que Aldo sabe: textos del sitio, servicios, productos, planes y preguntas frecuentes. */
export async function loadAldo() {
  const pub = { where: { published: true }, orderBy: { order: "asc" as const } };
  const [s, services, products, plans, faqs] = await Promise.all([
    getSettings(),
    prisma.service.findMany({ ...pub, select: { slug: true, title: true, shortDescription: true, features: true } }),
    prisma.product.findMany({ ...pub, select: { slug: true, name: true, tagline: true, features: true, price: true } }),
    prisma.plan.findMany({ ...pub, select: { name: true, price: true, period: true } }),
    prisma.faq.findMany({ ...pub, select: { question: true, answer: true } }),
  ]);
  const { lang, tx } = await getT();
  const built = buildAldo(s, services, products, plans, faqs);
  // Los textos que vienen de la base y los ajustes ya llegan traducidos; aquí se traducen las respuestas fijas de Aldo.
  const knowledge = { ...(lang !== "es" ? deepTr(built, tx) : built), ai: Boolean(process.env.GROQ_API_KEY), lang };
  return { s, services, knowledge };
}
