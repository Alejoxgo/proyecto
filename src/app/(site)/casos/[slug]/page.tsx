import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TC from "@/components/TC";
import CountUp from "@/components/CountUp";
import Aldo from "@/components/Aldo";
import { prisma } from "@/lib/db";
import { caseTags, parseResults } from "@/lib/cases";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.caseStudy.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return {};
  return { title: c.title, description: c.summary, alternates: { canonical: `/casos/${c.slug}` }, openGraph: c.coverUrl ? { images: [c.coverUrl] } : undefined };
}

const paras = (t: string) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export default async function CasePage({ params }: Props) {
  const c = await load((await params).slug);
  if (!c) notFound();
  const s = await getSettings();
  const results = parseResults(c.results);
  const more = await prisma.caseStudy.findMany({ where: { published: true, id: { not: c.id } }, orderBy: { order: "asc" }, take: 2, select: { slug: true, title: true, client: true } });
  return (
    <>
      <section className="border-b border-paper-line">
        <div className="container-x pb-14 pt-14 sm:pt-20">
          <Link href="/casos" className="eyebrow hover:text-ink-900"><TC>{"← Casos de éxito"}</TC></Link>
          <p className="mt-8 font-mono text-sm uppercase tracking-widest text-brand-500">{[c.client, c.industry].filter(Boolean).join(" · ")}{c.own ? " · " : ""}{c.own && <TC>{"Proyecto propio"}</TC>}</p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{c.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">{caseTags(c.tags).map((t) => <span key={t} className="rounded-full border border-paper-line bg-white px-3 py-1 text-sm text-ink-700">{t}</span>)}</div>
        </div>
      </section>

      {c.coverUrl && (
        <div className="container-x -mb-6 pt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.coverUrl} alt="" className="aspect-[16/8] w-full rounded-3xl border border-paper-line object-cover" />
        </div>
      )}

      {results.length > 0 && (
        <section className="py-16">
          <div className="container-x grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((r) => (
              <div key={r.value + r.label} className="rounded-3xl bg-ink-900 p-7 text-paper">
                <p className="font-display text-5xl text-brand-400"><CountUp value={r.value} /></p>
                <p className="mt-3 text-paper/70">{r.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pb-20">
        <div className="container-x grid gap-14 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            {c.challenge && (
              <div>
                <p className="eyebrow"><TC>{"El reto"}</TC></p>
                <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-700">{paras(c.challenge).map((p) => <p key={p}>{p}</p>)}</div>
              </div>
            )}
            {c.solution && (
              <div>
                <p className="eyebrow"><TC>{"Lo que hicimos"}</TC></p>
                <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-700">{paras(c.solution).map((p) => <p key={p}>{p}</p>)}</div>
              </div>
            )}
            {c.quote && (
              <figure className="border-l-2 border-brand-500 pl-6">
                <blockquote className="font-display text-2xl leading-snug text-ink-900 sm:text-3xl">“{c.quote}”</blockquote>
                {c.quoteAuthor && <figcaption className="mt-4 text-ink-500">{c.quoteAuthor}</figcaption>}
              </figure>
            )}
          </div>
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-paper-line bg-white p-7">
              <Aldo pose="cheer" className="h-20 w-20" />
              <p className="mt-3 font-display text-2xl text-ink-900">{s["cases.ctaTitle"]}</p>
              <p className="mt-2 text-ink-500">{s["cases.ctaText"]}</p>
              <Link href="/agendar" className="btn-signal mt-5 w-full justify-center"><TC>{"Agendar llamada"}</TC></Link>
              {more.length > 0 && (
                <div className="mt-6 border-t border-paper-line pt-5">
                  <p className="text-xs uppercase tracking-wider text-ink-500"><TC>{"Más casos"}</TC></p>
                  <ul className="mt-2 space-y-2">{more.map((m) => <li key={m.slug}><Link href={`/casos/${m.slug}`} className="text-sm font-medium text-ink-900 hover:text-brand-600">{m.title}</Link></li>)}</ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
