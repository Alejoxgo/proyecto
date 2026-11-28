import TC from "@/components/TC";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { readingMinutes } from "@/lib/markdown";
import { postDate, tagList } from "@/lib/blog";
import { Emph } from "@/components/Sections";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guías claras sobre páginas web, chatbots, QR, automatización y tecnología para negocios en Colombia.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const [s, all] = await Promise.all([
    getSettings(),
    prisma.post.findMany({ where: { published: true }, orderBy: [{ publishedAt: "desc" }, { id: "desc" }] }),
  ]);
  const tags = [...new Set(all.flatMap((p) => tagList(p.tags)))];
  const posts = tag ? all.filter((p) => tagList(p.tags).includes(tag)) : all;
  const [first, ...rest] = posts;

  return (
    <>
      <section className="border-b border-paper-line">
        <div className="container-x pb-12 pt-14 sm:pt-20">
          <p className="font-mono text-sm uppercase tracking-widest text-brand-500"><TC>{"Blog"}</TC></p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            <Emph text={s["blog.title"]} />
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{s["blog.text"]}</p>
          {tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/blog" className={`rounded-full border px-3.5 py-1.5 text-sm transition ${!tag ? "border-ink-900 bg-ink-900 text-paper" : "border-paper-line bg-white/60 text-ink-700 hover:border-ink-900"}`}><TC>{"Todo"}</TC></Link>
              {tags.map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className={`rounded-full border px-3.5 py-1.5 text-sm transition ${tag === t ? "border-ink-900 bg-ink-900 text-paper" : "border-paper-line bg-white/60 text-ink-700 hover:border-ink-900"}`}>
                  {t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-x">
          {!first && <p className="rounded-2xl border border-dashed border-paper-line p-10 text-center text-ink-500"><TC>{"Pronto publicaremos artículos aquí."}</TC></p>}
          {first && (
            <Reveal>
              <Link href={`/blog/${first.slug}`} className="group grid overflow-hidden rounded-3xl border border-paper-line bg-white transition hover:shadow-[0_24px_50px_-30px_rgba(22,19,15,.45)] lg:grid-cols-2">
                <div className="aspect-[16/9] overflow-hidden bg-paper-2 lg:aspect-auto">
                  {first.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.coverUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
                  )}
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <p className="font-mono text-xs uppercase tracking-wider text-brand-500"><TC>{"Lo más reciente"}</TC></p>
                  <h2 className="mt-3 font-display text-3xl leading-tight text-ink-900 sm:text-4xl">{first.title}</h2>
                  <p className="mt-4 text-lg text-ink-500">{first.excerpt}</p>
                  <p className="mt-6 font-mono text-xs text-ink-400">
                    {postDate(first.publishedAt)} · {readingMinutes(first.content)}<TC>{" min de lectura"}</TC></p>
                </div>
              </Link>
            </Reveal>
          )}
          {rest.length > 0 && (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <Reveal as="li" key={p.id} delay={(i % 3) * 80}>
                  <Link href={`/blog/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-paper-line bg-white transition hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(22,19,15,.45)]">
                    <div className="aspect-[16/9] overflow-hidden bg-paper-2">
                      {p.coverUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">{tagList(p.tags)[0] ?? "Artículo"}</p>
                      <h3 className="mt-2 font-display text-2xl leading-tight text-ink-900">{p.title}</h3>
                      <p className="mt-2 flex-1 text-ink-500">{p.excerpt}</p>
                      <p className="mt-5 font-mono text-xs text-ink-400">{postDate(p.publishedAt)} · {readingMinutes(p.content)}<TC>{" min"}</TC></p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
