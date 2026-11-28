import TC from "@/components/TC";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ContactForm from "@/components/ContactForm";
import { lines, paragraphs } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.service.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sv = await load((await params).slug);
  return sv ? { title: sv.title, description: sv.shortDescription } : {};
}

export default async function ServicePage({ params }: Props) {
  const sv = await load((await params).slug);
  if (!sv) notFound();
  const all = await prisma.service.findMany({ where: { published: true }, orderBy: { order: "asc" } });
  const idx = all.findIndex((x) => x.id === sv.id);
  const others = all.filter((x) => x.id !== sv.id).slice(0, 3);
  const feats = lines(sv.features);
  const demos: Record<string, [string, string][]> = {
    "turnos-qr": [["Tomar un turno de prueba", "/t/demo"], ["Ver la pantalla", "/t/demo/pantalla"], ["Probar «Llamar siguiente»", "/t/demo/atender?k=demo-atender"]],
    "menu-del-dia": [["Ver menú de ejemplo", "/menu/demo"]],
    "tarjetas-nfc": [["Ver una Puerta de ejemplo", "/p/demo"]],
    "carta-digital": [["Ver una Puerta de ejemplo", "/p/demo"]],
  };
  const demo = demos[sv.slug];

  return (
    <>
      <section className="border-b border-paper-line">
        <div className="container-x pb-14 pt-14 sm:pt-20">
          <Link href="/servicios" className="eyebrow hover:text-ink-900"><TC>{"← Todos los servicios"}</TC></Link>
          <p className="mt-10 font-mono text-sm text-brand-500">{String(idx + 1).padStart(2, "0")}</p>
          <h1 className="mt-2 max-w-4xl font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">{sv.title}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{sv.shortDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cotizar" className="btn-signal"><TC>{"Cotizar en línea →"}</TC></Link>
            {demo?.map(([l, h]) => (
              <a key={h} href={h} target="_blank" className="btn-outline"><TC>{l}</TC> ↗</a>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="space-y-6 text-lg leading-relaxed text-ink-700 lg:col-span-7">
            {paragraphs(sv.description).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {feats.length > 0 && (
            <aside className="lg:col-span-4 lg:col-start-9">
              <p className="eyebrow"><TC>{"Qué incluye"}</TC></p>
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
      <section className="border-y border-paper-line bg-white/50 py-20">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <h2 className="section-title lg:col-span-5"><TC>{"Cotiza tu proyecto de "}</TC>{sv.title.toLowerCase()}</h2>
          <div className="lg:col-span-7">
            <ContactForm services={[sv.title]} defaultService={sv.title} />
          </div>
        </div>
      </section>
      {others.length > 0 && (
        <section className="py-20">
          <div className="container-x">
            <p className="eyebrow"><TC>{"Otros servicios"}</TC></p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-paper-line bg-paper-line md:grid-cols-3">
              {others.map((o) => (
                <Link key={o.id} href={`/servicios/${o.slug}`} className="bg-paper p-6 transition-colors hover:bg-white">
                  <h3 className="font-display text-2xl">{o.title}</h3>
                  <p className="mt-2 text-sm text-ink-500">{o.shortDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
