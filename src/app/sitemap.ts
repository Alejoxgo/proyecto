import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { enabledLangs } from "@/lib/langs";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.SITE_URL || "https://aldore.co").replace(/\/$/, "");
  const [services, products, posts, cases] = await Promise.all([
    prisma.service.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.caseStudy.findMany({ where: { published: true }, select: { slug: true } }).catch(() => []),
  ]);
  const es: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/servicios`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/puerta`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cotizar`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/nosotros`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/agendar`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/marca`, changeFrequency: "yearly", priority: 0.4 },
    ...(cases.length ? [{ url: `${base}/casos`, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    ...cases.map((c) => ({ url: `${base}/casos/${c.slug}`, priority: 0.7 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
    ...services.map((s) => ({ url: `${base}/servicios/${s.slug}`, lastModified: s.updatedAt, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/productos/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
  ];
  // Versión traducida de cada página (/en/..., /pt/...) según los idiomas activos.
  const row = await prisma.setting.findUnique({ where: { key: "site.langs" } }).catch(() => null);
  const other = enabledLangs(row?.value).filter((l) => l !== "es");
  const tr = other.flatMap((l) => es.map((e) => ({ ...e, url: e.url.replace(base, `${base}/${l}`).replace(new RegExp(`/${l}/$`), `/${l}`), priority: Math.max(0.3, (e.priority ?? 0.5) - 0.2) })));
  return [...es, ...tr];
}
