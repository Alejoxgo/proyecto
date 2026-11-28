import TC from "@/components/TC";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ContactForm from "@/components/ContactForm";
import { lines, paragraphs } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import CastorlyPage from "@/components/CastorlyPage";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.product.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  return p ? { title: p.name, description: p.tagline } : {};
}

export default async function ProductPage({ params }: Props) {
  const p = await load((await params).slug);
  if (!p) notFound();
  const feats = lines(p.features);
  if (p.slug === "castorly") return <CastorlyPage p={p} s={await getSettings()} />;

  return (
    <>
      <section className="bg-ink-900 text-paper">
        <div className="container-x grid items-end gap-10 pb-16 pt-14 sm:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Link href="/#productos" className="eyebrow !text-paper/50 hover:!text-paper"><TC>{"← Productos"}</TC></Link>
            <h1 className="mt-10 font-display text-6xl font-medium tracking-tight sm:text-8xl">
              {p.name}<span className="text-brand-500">.</span>
            </h1>
            <p className="mt-5 max-w-xl font-mono text-lg text-paper/70">{p.tagline}</p>
          </div>
          <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
            {p.price && (
              <p className="text-right">
                <span className="font-display text-3xl">{p.price}</span>
                {p.priceNote && <span className="block text-sm text-paper/50">{p.priceNote}</span>}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {p.ctaUrl ? (
                <>
                  <a href={p.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn-signal">{p.ctaLabel} ↗</a>
                  <a href="#solicitar" className="btn-ghost text-paper"><TC>{"Hablar con un asesor"}</TC></a>
                </>
              ) : (
                <a href="#solicitar" className="btn-signal">{p.ctaLabel}</a>
              )}
            </div>
          </div>
        </div>
        {p.imageUrl && (
          <div className="container-x pb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.name} className="w-full rounded-xl border border-white/10" />
          </div>
        )}
      </section>
      <section className="py-20">
        <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed text-ink-700 lg:col-span-7">
            {paragraphs(p.description).map((t, i) => <p key={i}>{t}</p>)}
          </div>
          {feats.length > 0 && (
            <aside className="lg:col-span-4 lg:col-start-9">
              <p className="eyebrow"><TC>{"Características"}</TC></p>
              <ul className="mt-4 border-t border-ink-900">
                {feats.map((f) => (
                  <li key={f} className="flex gap-3 border-b border-paper-line py-3 text-[15px]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-500" /> {f}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>
      <section id="solicitar" className="scroll-mt-16 border-t border-paper-line bg-white/50 py-20">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <h2 className="section-title lg:col-span-5"><TC>{"¿Quieres "}</TC>{p.name}<TC>{" en tu empresa?"}</TC></h2>
          <div className="lg:col-span-7">
            <ContactForm services={[p.name]} defaultService={p.name} />
          </div>
        </div>
      </section>
    </>
  );
}
