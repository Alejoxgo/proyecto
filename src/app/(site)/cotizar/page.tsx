import TC from "@/components/TC";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { parseQuoteConfig } from "@/lib/quote";
import { Emph } from "@/components/Sections";
import Quoter from "@/components/Quoter";

export const metadata: Metadata = {
  title: "Cotizador en línea",
  description: "Calcula en dos minutos cuánto cuesta tu página web, tienda online, app, chatbot o integración. Rango de precio al instante.",
  alternates: { canonical: "/cotizar" },
};

export default async function QuotePage() {
  const s = await getSettings();
  const cfg = parseQuoteConfig(s);
  return (
    <>
      <section className="relative overflow-hidden border-b border-paper-line">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
        <div className="container-x relative pb-12 pt-14 sm:pt-20">
          <p className="font-mono text-sm uppercase tracking-widest text-brand-500"><TC>{"Cotizador en línea"}</TC></p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            <Emph text={s["quote.title"]} />
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{s["quote.text"]}</p>
        </div>
      </section>
      <section className="py-14 sm:py-20">
        <div className="container-x">
          <Quoter cfg={cfg} />
        </div>
      </section>
    </>
  );
}
