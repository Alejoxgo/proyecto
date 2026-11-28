"use client";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/langs";

const NAMES: Record<Lang, string> = { es: "Español", en: "English", pt: "Português" };
const FLAGS: Record<Lang, string> = { es: "🇨🇴", en: "🇺🇸", pt: "🇧🇷" };

/** Selector de idioma dentro del pie de página. Abre la misma página en el idioma elegido. */
export default function LangFooter({ lang, langs }: { lang: Lang; langs: Lang[] }) {
  const path = (usePathname() || "/").replace(/^\/(en|es|pt)(?=\/|$)/, "") || "/";
  if (langs.length < 2) return null;
  return (
    <nav aria-label="Idioma / Language" className="flex flex-wrap items-center gap-1.5">
      <svg viewBox="0 0 24 24" className="mr-1 h-4 w-4 text-paper/40" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z" />
      </svg>
      {langs.map((l) => (
        <a
          key={l}
          href={`/${l}${path === "/" ? "" : path}`}
          hrefLang={l}
          aria-current={l === lang ? "true" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${l === lang ? "border-paper/40 bg-paper/10 text-paper" : "border-paper/10 text-paper/60 hover:border-paper/30 hover:text-paper"}`}
        >
          <span>{FLAGS[l]}</span> {NAMES[l]}
        </a>
      ))}
    </nav>
  );
}
