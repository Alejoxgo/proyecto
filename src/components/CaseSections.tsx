import Link from "next/link";
import type { CaseStudy } from "@prisma/client";
import TC from "@/components/TC";
import CountUp from "@/components/CountUp";
import { caseTags, parseResults } from "@/lib/cases";

/** Tarjeta de un caso de éxito: portada, cliente, resumen y el primer resultado en grande. */
export function CaseCard({ c, big = false }: { c: CaseStudy; big?: boolean }) {
  const r = parseResults(c.results)[0];
  return (
    <Link href={`/casos/${c.slug}`} data-tilt="tilt" className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-paper-line bg-white transition ${big ? "lg:flex-row" : ""}`}>
      <div className={`relative overflow-hidden bg-ink-900 ${big ? "aspect-[16/10] lg:aspect-auto lg:w-1/2" : "aspect-[16/10]"}`}>
        {c.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.coverUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_70%_80%,rgba(226,71,28,.45),transparent_55%)]">
            <svg viewBox="0 0 40 40" className="h-16 w-16 opacity-80" aria-hidden><path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="none" stroke="#f4f1ea" strokeWidth={2} /><path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" /></svg>
          </div>
        )}
        {c.own && <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-900"><TC>{"Proyecto propio"}</TC></span>}
      </div>
      <div className={`flex flex-1 flex-col p-6 sm:p-8 ${big ? "lg:justify-center" : ""}`}>
        <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">{[c.client, c.industry].filter(Boolean).join(" · ")}</p>
        <h3 className={`mt-2 font-display leading-tight text-ink-900 ${big ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{c.title}</h3>
        <p className="mt-3 flex-1 text-ink-500">{c.summary}</p>
        {r && (
          <p className="mt-6 flex items-baseline gap-3 border-t border-paper-line pt-5">
            <span className="font-display text-4xl text-brand-500"><CountUp value={r.value} /></span>
            <span className="text-sm text-ink-700">{r.label}</span>
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {caseTags(c.tags).slice(0, 4).map((t) => <span key={t} className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink-700">{t}</span>)}
        </div>
      </div>
    </Link>
  );
}

/** Sección de la portada. No aparece hasta que haya al menos un caso publicado. */
export function CasesBlock({ items, title }: { items: CaseStudy[]; title: string }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <section id="casos" className="scroll-mt-16 border-b border-paper-line py-24">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow flex items-center gap-3"><span className="h-px w-8 bg-ink-900/20" /><TC>{"Casos de éxito"}</TC></p>
            <h2 className="section-title mt-5">{title}</h2>
          </div>
          <Link href="/casos" className="btn-outline"><TC>{"Ver todos los casos"}</TC> →</Link>
        </div>
        <div className="mt-12 grid gap-5">
          <CaseCard c={first} big />
          {rest.length > 0 && <div className="grid gap-5 md:grid-cols-2">{rest.slice(0, 2).map((c) => <CaseCard key={c.id} c={c} />)}</div>}
        </div>
      </div>
    </section>
  );
}
