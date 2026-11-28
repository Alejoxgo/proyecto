import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { COLUMN_GUARD, SCHEMA_GUARD } from "./schema-guard";
import { PUERTA_DEMOS } from "./puerta-demos";
import { BLOG_SEED } from "./blog-seed";
import { DEMO_MENU, DEMO_QUEUE, NEW_SERVICES_2 } from "./seed-extra";
import { randomKey } from "./utils";

/**
 * Cliente de base de datos.
 * - En Cloudflare Workers usa D1 (binding "DB") con el adaptador de Prisma.
 * - En Node (local, Docker, VPS) usa DATABASE_URL (SQLite o PostgreSQL).
 */

const isWorker = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const d1Clients = new WeakMap<object, PrismaClient>();

function nodeClient() {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = new PrismaClient();
  return globalForPrisma.prisma;
}

type D1Stmt = { bind(...v: unknown[]): D1Stmt; run(): Promise<unknown>; all<T = unknown>(): Promise<{ results: T[] }> };
type D1Like = { prepare(sql: string): D1Stmt; batch(stmts: unknown[]): Promise<unknown> };

/**
 * Crea (si faltan) las tablas y columnas más recientes, y los ejemplos de Puerta.
 * Así el sitio no se cae si las migraciones no se aplicaron.
 */
async function ensureSchema(db: D1Like) {
  try {
    await db.batch(SCHEMA_GUARD.map((s) => db.prepare(s)));
    const tables = [...new Set(COLUMN_GUARD.map((c) => c.table))];
    for (const table of tables) {
      const { results } = await db.prepare(`PRAGMA table_info("${table}")`).all<{ name: string }>();
      const have = new Set(results.map((r) => r.name));
      for (const c of COLUMN_GUARD.filter((c) => c.table === table && !have.has(c.column))) {
        await db.prepare(c.ddl).run().catch((e) => console.error("Columna", c.column, e));
      }
    }
    await seedOnce(db, "seed.puerta-demos", puertaDemoStatements(db));
    await seedOnce(db, "seed.blog", blogStatements(db));
    await seedOnce(db, "seed.turnos-menu", turnosMenuStatements(db));
  } catch (e) {
    console.error("No se pudo verificar el esquema de D1", e);
  }
}

/** Ejecuta un contenido inicial una sola vez (queda marcado en Setting). Si luego lo borras, no vuelve. */
async function seedOnce(db: D1Like, key: string, stmts: D1Stmt[]) {
  const { results } = await db.prepare(`SELECT 1 AS x FROM "Setting" WHERE "key" = ?`).bind(key).all();
  if (results.length) return;
  await db.batch([...stmts, db.prepare(`INSERT OR IGNORE INTO "Setting" ("key","value") VALUES (?, ?)`).bind(key, new Date().toISOString())]);
}

/** Negocios de ejemplo de Puerta, y la identidad nueva para la demo original si nadie la había tocado. */
function puertaDemoStatements(db: D1Like) {
  return PUERTA_DEMOS.flatMap((d) => [
    db
      .prepare(
        `INSERT OR IGNORE INTO "LinkPage" ("slug","name","subtitle","logoUrl","coverUrl","color","bgColor","theme","font","buttonStyle","buttons","wifiName","wifiPass") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .bind(d.slug, d.name, d.subtitle, d.logoUrl, d.coverUrl, d.color, d.bgColor, d.theme, d.font, d.buttonStyle, d.buttons, d.wifiName, d.wifiPass),
    db
      .prepare(
        `UPDATE "LinkPage" SET "subtitle"=?,"logoUrl"=?,"coverUrl"=?,"color"=?,"bgColor"=?,"theme"=?,"font"=?,"buttonStyle"=?,"buttons"=? WHERE "slug"=? AND "logoUrl"='' AND "coverUrl"='' AND "color"='#e2471c'`,
      )
      .bind(d.subtitle, d.logoUrl, d.coverUrl, d.color, d.bgColor, d.theme, d.font, d.buttonStyle, d.buttons, d.slug),
  ]);
}

function turnosMenuStatements(db: D1Like) {
  const now = new Date().toISOString();
  const q = DEMO_QUEUE;
  const m = DEMO_MENU;
  return [
    ...NEW_SERVICES_2.map((s) =>
      db
        .prepare(`INSERT OR IGNORE INTO "Service" ("slug","title","shortDescription","description","icon","features","order","published","updatedAt") VALUES (?,?,?,?,?,?,?,1,?)`)
        .bind(s.slug, s.title, s.shortDescription, s.description, s.icon, s.features, s.order, now),
    ),
    db
      .prepare(`INSERT OR IGNORE INTO "Queue" ("slug","name","subtitle","logoUrl","color","prefix","avgMinutes","staffKey") VALUES (?,?,?,?,?,?,?,?)`)
      .bind(q.slug, q.name, q.subtitle, q.logoUrl, q.color, q.prefix, q.avgMinutes, q.staffKey),
    db
      .prepare(`INSERT OR IGNORE INTO "MenuBoard" ("slug","name","subtitle","logoUrl","color","whatsapp","date","items","price","notes","hours","staffKey") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(m.slug, m.name, m.subtitle, m.logoUrl, m.color, m.whatsapp, now.slice(0, 10), m.items, m.price, m.notes, m.hours, randomKey()),
  ];
}

function blogStatements(db: D1Like) {
  return BLOG_SEED.map((p) =>
    db
      .prepare(`INSERT OR IGNORE INTO "Post" ("slug","title","excerpt","content","coverUrl","tags","publishedAt") VALUES (?,?,?,?,?,?,?)`)
      .bind(p.slug, p.title, p.excerpt, p.content, p.coverUrl, p.tags, p.publishedAt),
  );
}

function workerClient(): PrismaClient {
  const env = getCloudflareContext().env as unknown as { DB: D1Like };
  let client = d1Clients.get(env.DB);
  if (!client) {
    const ready = ensureSchema(env.DB);
    client = new PrismaClient({ adapter: new PrismaD1(env.DB as never) }).$extends({
      query: {
        async $allOperations({ args, query }) {
          await ready;
          return query(args);
        },
      },
    }) as unknown as PrismaClient;
    d1Clients.set(env.DB, client);
  }
  return client;
}

export function getPrisma(): PrismaClient {
  return isWorker ? workerClient() : nodeClient();
}

/**
 * Campos que se muestran en el sitio público y se traducen cuando la visita es en inglés.
 * La traducción solo ocurre si el middleware marcó la petición como inglés; el panel siempre ve el español.
 */
const TR_FIELDS: Record<string, string[]> = {
  service: ["title", "shortDescription", "description", "features"],
  product: ["tagline", "description", "price", "priceNote", "features", "ctaLabel"],
  plan: ["name", "price", "period", "description", "features"],
  testimonial: ["role", "quote"],
  faq: ["question", "answer"],
  caseStudy: ["title", "industry", "summary", "challenge", "solution", "results", "quote", "tags"],
  post: ["title", "excerpt", "content", "tags", "author"],
};
const READS = new Set(["findMany", "findFirst", "findUnique", "findFirstOrThrow", "findUniqueOrThrow"]);

function translatedModel(model: Record<string, unknown>, fields: string[]) {
  return new Proxy(model, {
    get(m, op) {
      const fn = m[op as string];
      if (typeof fn !== "function") return fn;
      if (!READS.has(op as string)) return (fn as (...a: unknown[]) => unknown).bind(m);
      return async (...args: unknown[]) => {
        const r = await (fn as (...a: unknown[]) => Promise<unknown>).apply(m, args);
        if (!r) return r;
        const { trList } = await import("./i18n");
        if (Array.isArray(r)) return trList(r as Record<string, unknown>[], fields);
        return (await trList([r as Record<string, unknown>], fields))[0];
      };
    },
  });
}

/** Acceso perezoso: resuelve el cliente correcto en cada uso. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const client = getPrisma() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    if (typeof prop === "string" && TR_FIELDS[prop] && value) return translatedModel(value as Record<string, unknown>, TR_FIELDS[prop]);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});
