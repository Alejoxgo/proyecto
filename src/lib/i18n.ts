import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { after } from "next/server";
import { prisma } from "./db";
import { groqChat } from "./groq";
import { enabledLangs, FOREIGN, isLang, LANG_ENGLISH, type Lang } from "./langs";

/**
 * Sitio en inglés y portugués con traducción automática (Groq).
 *
 * - El idioma lo decide el middleware (/en/..., /pt/... o la cookie `lang`) y llega como cabecera `x-lang`.
 *   El panel nunca recibe esa cabecera: allí todo sigue en español.
 * - Cada texto en español se traduce una sola vez y se guarda en la tabla Translation.
 * - Al guardar algo en el panel se traduce de inmediato (ver `translateNow`). Si al mostrar una
 *   página falta algún texto, se muestra en español y se traduce justo después de responder.
 */

export type { Lang } from "./langs";
export { LANGS } from "./langs";

export async function getLang(): Promise<Lang> {
  try {
    const v = (await headers()).get("x-lang");
    return isLang(v) ? v : "es";
  } catch {
    return "es";
  }
}

/** Idiomas extranjeros activos según el ajuste "site.langs" del panel. */
export async function activeForeign(): Promise<Exclude<Lang, "es">[]> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "site.langs" } });
    return enabledLangs(row?.value).filter((l): l is Exclude<Lang, "es"> => l !== "es");
  } catch {
    return [...FOREIGN];
  }
}

export function groqReady() {
  return Boolean(process.env.GROQ_API_KEY);
}

async function keyOf(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf).slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** ¿Vale la pena traducirlo? Deja quietos enlaces, correos, números, colores e identificadores. */
export function translatable(s: string) {
  const v = s.trim();
  if (!v || !/\p{L}/u.test(v)) return false;
  if (/^(https?:|mailto:|tel:|\/|#|www\.)/i.test(v)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(v)) return false;
  if (/^[a-z0-9_-]+$/.test(v)) return false; // ids, íconos, slugs
  if (/^[A-Z0-9_-]{1,4}$/.test(v)) return false; // siglas cortas
  return true;
}

const loadDict = cache(async (lang: Lang) => {
  const map = new Map<string, string>();
  try {
    const rows = await prisma.translation.findMany({ where: { lang }, select: { source: true, text: true } });
    for (const r of rows) map.set(r.source, r.text);
  } catch (e) {
    console.error("Traducciones", e);
  }
  return map;
});

const pending = cache(() => ({ set: new Set<string>(), scheduled: false }));

export type Translator = { lang: Lang; t: (s: string) => string; tx: (s: string) => string };

/** Traductor para la petición actual. `t` traduce un texto; `tx` respeta listas con | ; = y saltos de línea. */
export const getT = cache(async (): Promise<Translator> => {
  const lang = await getLang();
  if (lang === "es") return { lang, t: (s) => s, tx: (s) => s };
  const dict = await loadDict(lang);
  const p = pending();
  const t = (s: string) => {
    if (typeof s !== "string" || !translatable(s)) return s;
    const lead = s.match(/^\s*/)![0];
    const trail = s.match(/\s*$/)![0];
    const core = s.trim();
    const hit = dict.get(core);
    if (hit !== undefined) return lead + hit + trail;
    if (groqReady()) {
      p.set.add(core);
      if (!p.scheduled) {
        p.scheduled = true;
        try {
          after(() => translateNow([...p.set], lang).catch((e) => console.error("Traducción en segundo plano", e)));
        } catch {}
      }
    }
    return s;
  };
  return { lang, t, tx: (s: string) => structured(s, t) };
});

/** Separa un valor con estructura (líneas, columnas con |, opciones con ; y =) y traduce solo las partes de texto. */
export function pieces(value: string): string[] {
  const out: string[] = [];
  structured(value, (x) => {
    if (translatable(x)) out.push(x.trim());
    return x;
  });
  return out;
}

function structured(value: string, t: (s: string) => string): string {
  if (!value || typeof value !== "string") return value;
  if (!/[\n|]/.test(value)) return t(value);
  return value
    .split("\n")
    .map((line) => {
      if (!line.trim()) return line;
      if (!line.includes("|")) return t(line);
      return line
        .split("|")
        .map((cell) => {
          if (/\s=\s/.test(cell)) return cell.split(/(\s*[;=]\s*)/).map((part, i) => (i % 2 ? part : t(part))).join("");
          return t(cell);
        })
        .join("|");
    })
    .join("\n");
}

/** Traduce los campos indicados de una lista de registros (servicios, productos, artículos…). */
export async function trList<T extends Record<string, unknown>>(list: T[], fields: (keyof T)[]): Promise<T[]> {
  const { lang, tx } = await getT();
  if (lang === "es") return list;
  return list.map((r) => {
    const c = { ...r };
    for (const f of fields) if (typeof c[f] === "string") (c as Record<string, unknown>)[f as string] = tx(c[f] as string);
    return c;
  });
}

export async function trOne<T extends Record<string, unknown>>(r: T | null, fields: (keyof T)[]): Promise<T | null> {
  if (!r) return r;
  return (await trList([r], fields))[0];
}

/* ---------------- Groq ---------------- */

const SYSTEM = (lang: Lang) => `You translate website copy for Aldore, a software studio in Medellín, Colombia, from Spanish to natural, professional ${LANG_ENGLISH[lang]}.
Rules:
- Return ONLY JSON: {"t": [ ...translations in the same order... ]} with exactly as many items as you received.
- Keep brand and product names as they are: Aldore, Aldo, Castorly, Castorly Meet, Puerta, Cástor, WhatsApp, Wompi, Mercado Pago.
- Keep any markup exactly: *asterisks* around words (put them around the equivalent English words), markdown (#, ##, -, 1., >, **, [text](url)), emojis, URLs, emails, numbers, prices like $1.200.000 and "COP".
- Keep Colombian places as they are (Medellín, Colombia; translate Latinoamérica normally).
- Short UI labels stay short. Do not add quotes or explanations.`;

let lastGroqError = "";
let lastModel = "";

async function groqBatch(texts: string[], lang: Lang): Promise<string[] | null> {
  const r = await groqChat({
    model: process.env.GROQ_TRANSLATE_MODEL,
    temperature: 0.2,
    json: true,
    maxTokens: 4000,
    messages: [
      { role: "system", content: SYSTEM(lang) },
      { role: "user", content: JSON.stringify({ t: texts }) },
    ],
  });
  if (!r.ok) {
    lastGroqError = r.status ? `HTTP ${r.status}${r.model ? ` (${r.model})` : ""}: ${r.error}` : r.error;
    console.error("Groq traducción", lastGroqError);
    return null;
  }
  try {
    const out = JSON.parse(r.content.replace(/^```(?:json)?\s*|\s*```$/g, "")).t;
    if (Array.isArray(out) && out.length === texts.length) {
      lastModel = r.model;
      return out.map((x) => String(x ?? ""));
    }
  } catch {}
  lastGroqError = "Groq respondió en un formato inesperado.";
  console.error("Groq traducción: respuesta inválida");
  return null;
}

/**
 * Traduce y guarda los textos que todavía no tengan traducción. Devuelve cuántos tradujo.
 * No toca las traducciones corregidas a mano.
 */
export async function translateNow(texts: string[], lang: Lang): Promise<number> {
  if (lang === "es" || !groqReady()) return 0;
  const uniq = [...new Set(texts.map((x) => x.trim()).filter(translatable))];
  if (!uniq.length) return 0;
  const keys = await Promise.all(uniq.map(keyOf));
  const existing = new Set<string>();
  for (let i = 0; i < keys.length; i += 90) {
    const rows = await prisma.translation.findMany({ where: { lang, key: { in: keys.slice(i, i + 90) } }, select: { key: true } });
    rows.forEach((r) => existing.add(r.key));
  }
  const todo = uniq.map((s, i) => ({ s, k: keys[i] })).filter((x) => !existing.has(x.k));
  let done = 0;
  // Lotes de ~40 textos o ~6.000 caracteres para no pasarnos del límite de Groq.
  let batch: typeof todo = [];
  let size = 0;
  const flush = async () => {
    if (!batch.length) return;
    const out = await groqBatch(batch.map((x) => x.s), lang);
    if (out) {
      for (let i = 0; i < batch.length; i++) {
        const text = out[i].trim();
        if (!text) continue;
        await prisma.translation.upsert({
          where: { lang_key: { lang, key: batch[i].k } },
          create: { lang, key: batch[i].k, source: batch[i].s, text },
          update: {},
        });
        done++;
      }
    }
    batch = [];
    size = 0;
  };
  for (const x of todo) {
    if (batch.length >= 40 || size + x.s.length > 6000) await flush();
    batch.push(x);
    size += x.s.length;
  }
  await flush();
  return done;
}

/** Traduce en segundo plano (después de responder) los textos de lo que se acaba de guardar en el panel. */
export function translateLater(values: string[]) {
  if (!groqReady()) return;
  const texts = values.flatMap((v) => (typeof v === "string" ? pieces(v) : []));
  if (!texts.length) return;
  const run = async () => {
    for (const l of await activeForeign()) await translateNow(texts, l).catch((e) => console.error("Traducción al guardar", l, e));
  };
  try {
    after(run);
  } catch {
    void run().catch(() => {});
  }
}

/** Prueba rápida de la clave de Groq: traduce una frase corta sin guardarla. */
export async function groqPing(): Promise<{ ok: boolean; detail: string; ms: number }> {
  const t0 = Date.now();
  if (!groqReady()) return { ok: false, detail: "No hay GROQ_API_KEY configurada en el servidor.", ms: 0 };
  lastGroqError = "";
  const out = await groqBatch(["Abrimos la puerta digital de tu negocio."], "en").catch(() => null);
  const ms = Date.now() - t0;
  return out?.[0] ? { ok: true, detail: `${out[0]} (modelo ${lastModel})`, ms } : { ok: false, detail: lastGroqError || "Groq no respondió. Revisa que la clave sea correcta y esté vigente.", ms };
}
