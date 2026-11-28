// Cotizador en línea. Los precios se editan en el panel (Textos del sitio → Cotizador).
import { lines } from "./utils";

export type QuoteType = { id: string; name: string; min: number; max: number; text: string; icon: string; monthly: string };
export type QuoteExtra = { name: string; price: number; for: string[] };
export type QuoteOption = { id: string; name: string; text: string; factor: number };
export type QuoteScope = { question: string; options: QuoteOption[] };
export type QuoteConfig = { types: QuoteType[]; extras: QuoteExtra[]; sizes: QuoteOption[]; scopes: Record<string, QuoteScope>; speeds: QuoteOption[] };
export type QuoteSelection = { type: string; size: string; speed: string; extras: string[] };

const num = (v: string | undefined) => Number.parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10) || 0;

export function parseQuoteConfig(s: Record<string, string>): QuoteConfig {
  const types = lines(s["quote.types"]).map((l) => {
    const [id, name, min, max, text, icon, monthly] = l.split("|").map((x) => x.trim());
    return { id, name, min: num(min), max: Math.max(num(max), num(min)), text: text ?? "", icon: icon || "code", monthly: monthly ?? "" };
  }).filter((t) => t.id && t.name);
  const extras = lines(s["quote.extras"]).map((l) => {
    const [name, price, f] = l.split("|").map((x) => x.trim());
    return { name, price: num(price), for: (f || "*").split(",").map((x) => x.trim()).filter(Boolean) };
  }).filter((e) => e.name);
  // Cada tipo de proyecto tiene su propia pregunta de alcance (páginas, productos, locales, piezas…).
  const scopes: Record<string, QuoteScope> = {};
  for (const l of lines(s["quote.scopes"])) {
    const [typeId, question, opts] = l.split("|").map((x) => x.trim());
    if (!typeId || !opts) continue;
    const options = opts.split(";").map((o, i) => {
      const [name, factor, text] = o.split("=").map((x) => x.trim());
      return { id: `o${i + 1}`, name, text: text ?? "", factor: Number.parseFloat((factor || "1").replace(",", ".")) || 1 };
    }).filter((o) => o.name);
    if (options.length) scopes[typeId] = { question: question || "¿Qué tan grande?", options };
  }
  return {
    types,
    extras,
    scopes,
    sizes: [
      { id: "basico", name: "Básico", text: "Lo esencial para arrancar", factor: 1 },
      { id: "medio", name: "Completo", text: "Más secciones y funciones", factor: 1.35 },
      { id: "grande", name: "A la medida", text: "Proyecto grande o con reglas propias", factor: 1.8 },
    ],
    speeds: [
      { id: "normal", name: "Tiempo normal", text: "Sin afán", factor: 1 },
      { id: "urgente", name: "Lo necesito ya", text: "Priorizamos tu proyecto", factor: 1.2 },
    ],
  };
}

const round = (n: number) => Math.round(n / 50000) * 50000;

export function extrasFor(cfg: QuoteConfig, typeId: string) {
  return cfg.extras.filter((e) => e.for.includes("*") || e.for.includes(typeId));
}

/** La pregunta de alcance de un tipo; si no tiene una propia, la genérica. */
export function scopeFor(cfg: QuoteConfig, typeId: string): QuoteScope {
  return cfg.scopes[typeId] ?? { question: "¿Qué tan completo?", options: cfg.sizes };
}

export function computeQuote(cfg: QuoteConfig, sel: QuoteSelection) {
  const type = cfg.types.find((t) => t.id === sel.type);
  if (!type) return null;
  const scope = scopeFor(cfg, type.id);
  const size = scope.options.find((x) => x.id === sel.size) ?? scope.options[0];
  const speed = cfg.speeds.find((x) => x.id === sel.speed) ?? cfg.speeds[0];
  const extras = extrasFor(cfg, type.id).filter((e) => sel.extras.includes(e.name));
  const extrasTotal = extras.reduce((a, e) => a + e.price, 0);
  const f = size.factor * speed.factor;
  return {
    type,
    scope,
    size,
    speed,
    extras,
    min: round(type.min * f + extrasTotal),
    max: round(type.max * f + extrasTotal),
  };
}
