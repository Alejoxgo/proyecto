/** Idiomas del sitio público. El español es el original; los demás se traducen con Groq. */
export type Lang = "es" | "en" | "pt";
export const LANGS: Lang[] = ["es", "en", "pt"];
export const FOREIGN: Exclude<Lang, "es">[] = ["en", "pt"];
export const LANG_NAMES: Record<Lang, string> = { es: "Español", en: "Inglés", pt: "Portugués" };
export const LANG_ENGLISH: Record<Lang, string> = { es: "Spanish", en: "English (US)", pt: "Brazilian Portuguese" };
export const HTML_LANG: Record<Lang, string> = { es: "es-CO", en: "en", pt: "pt-BR" };
export const isLang = (v: unknown): v is Lang => v === "es" || v === "en" || v === "pt";

/** Lee el ajuste "site.langs" (p. ej. "en, pt") y devuelve los idiomas activos, siempre con el español primero. */
export function enabledLangs(setting: string | undefined): Lang[] {
  const list = (setting ?? "en, pt").toLowerCase().split(/[\s,;|]+/).filter(isLang).filter((l) => l !== "es");
  return ["es", ...FOREIGN.filter((l) => list.includes(l))];
}
