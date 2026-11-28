import TC from "@/components/TC";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Markdown, readingMinutes } from "@/lib/markdown";
import { postDate, tagList } from "@/lib/blog";
import Aldo from "@/components/Aldo";

type Props = { params: Promise<{ slug: string }> };
const load = (slug: string) => prisma.post.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.title, description: p.excerpt, type: "article", images: p.coverUrl ? [p.coverUrl] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const others = await prisma.post.findMany({ where: { published: true, NOT: { id: p.id } }, orderBy: { publishedAt: "desc" }, take: 3 });

  return (
    <article>
      <header className="border-b border-paper-line">
        <div className="container-x max-w-4xl pb-10 pt-14 sm:pt-20">
          <Link href="/blog" className="eyebrow hover:text-ink-900"><TC>{"← Blog"}</TC></Link>
          <div className="mt-8 flex flex-wrap gap-2">
            {tagList(p.tags).map((t) => (
              <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="rounded-full bg-brand-500/10 px-3 py-1 font-mono text-xs text-brand-700 hover:bg-brand-500/20">{t}</Link>
            ))}
          </div>
          <h1 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">{p.title}</h1>
          {p.excerpt && <p className="mt-5 text-xl leading-relaxed text-ink-700">{p.excerpt}</p>}
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-ink-500">
            {p.author} · {postDate(p.publishedAt)} · {readingMinutes(p.content)}<TC>{" min de lectura"}</TC></p>
        </div>
      </header>
      {p.coverUrl && (
        <div className="container-x max-w-5xl pt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.coverUrl} alt="" className="aspect-[16/8] w-full rounded-2xl border border-paper-line object-cover" />
        </div>
      )}
      <div className="container-x max-w-3xl py-12 text-[18px] leading-[1.75] text-ink-700">
        <Markdown source={p.content} />
      </div>

      <section className="container-x max-w-3xl pb-16">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-ink-900 p-7 text-paper sm:flex-row sm:items-center sm:p-9">
          <Aldo pose="wave" className="h-24 w-24 shrink-0" />
          <div className="flex-1">
            <p className="font-display text-2xl"><TC>{"¿Quieres saber cuánto costaría lo tuyo?"}</TC></p>
            <p className="mt-2 text-paper/70"><TC>{"Usa el cotizador: en dos minutos tienes un rango de precio, sin compromiso."}</TC></p>
          </div>
          <Link href="/cotizar" className="btn-signal shrink-0"><TC>{"Cotizar ahora →"}</TC></Link>
        </div>
      </section>

      {others.length > 0 && (
        <section className="border-t border-paper-line bg-paper-2 py-16">
          <div className="container-x">
            <p className="eyebrow"><TC>{"Sigue leyendo"}</TC></p>
            <ul className="mt-6 grid gap-5 md:grid-cols-3">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/blog/${o.slug}`} className="group block h-full rounded-2xl border border-paper-line bg-white p-6 transition hover:-translate-y-1 hover:border-ink-900">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">{tagList(o.tags)[0] ?? "Artículo"}</p>
                    <h3 className="mt-2 font-display text-xl leading-snug text-ink-900">{o.title}</h3>
                    <p className="mt-2 text-sm text-ink-500">{o.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
