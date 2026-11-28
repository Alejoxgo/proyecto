import CountUp from "@/components/CountUp";
import TC from "@/components/TC";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { lines } from "@/lib/utils";
import { groupServices } from "@/lib/service-groups";
import { getT } from "@/lib/i18n";
import Icon from "@/components/Icon";
import Aldo from "@/components/Aldo";
import Reveal from "@/components/Reveal";
import { IntegrationsDiagram } from "@/components/TechSections";
import { Arrow, Emph, Process } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Páginas web, aplicaciones, chatbots, integraciones, herramientas para tu negocio, impresión 3D, nube y soporte. Todos los servicios de Aldore explicados.",
  alternates: { canonical: "/servicios" },
};

export default async function ServicesPage() {
  const [s, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({ where: { published: true }, orderBy: { order: "asc" } }),
  ]);
  const { t } = await getT();
  const groups = groupServices(services).map((g) => ({ ...g, title: t(g.title), text: t(g.text) }));
  let n = 0;

  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden border-b border-paper-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
        <div className="container-x relative pb-14 pt-14 sm:pt-20">
          <Link href="/" className="eyebrow hover:text-ink-900"><TC>{"← Inicio"}</TC></Link>
          <div className="mt-10 grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="font-mono text-sm uppercase tracking-widest text-brand-500"><TC>{"Servicios"}</TC></p>
              <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
                <Emph text={s["servicesPage.title"]} />
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{s["servicesPage.text"]}</p>
            </div>
            <dl className="grid grid-cols-3 gap-4 border-t border-ink-900 pt-5 lg:col-span-4">
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-500"><TC>{"Servicios"}</TC></dt>
                <dd className="mt-1 font-display text-4xl"><CountUp value={services.length} /></dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-500"><TC>{"Áreas"}</TC></dt>
                <dd className="mt-1 font-display text-4xl"><CountUp value={groups.length} ms={900} /></dd>
              </div>
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-500"><TC>{"Precio"}</TC></dt>
                <dd className="mt-1 font-display text-4xl"><TC>{"Fijo"}</TC></dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Índice pegajoso */}
      <nav aria-label="Áreas de servicio" className="sticky top-16 z-30 border-b border-paper-line bg-paper/90 backdrop-blur">
        <div className="container-x flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((g, i) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="shrink-0 rounded-full border border-paper-line bg-white/60 px-4 py-1.5 text-sm text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
            >
              <span className="mr-1.5 font-mono text-xs text-brand-500">{String(i + 1).padStart(2, "0")}</span>
              {g.title.replace(/\*/g, "")}
            </a>
          ))}
        </div>
      </nav>

      {/* Áreas */}
      {groups.map((g, gi) => (
        <section key={g.id} id={g.id} className={`scroll-mt-32 py-20 sm:py-24 ${gi % 2 ? "bg-paper-2" : ""}`}>
          <div className="container-x grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <div className="lg:sticky lg:top-36">
                <p className="font-mono text-sm text-brand-500">{String(gi + 1).padStart(2, "0")} / {String(groups.length).padStart(2, "0")}</p>
                <h2 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-4xl xl:text-[2.6rem]">
                  <Emph text={g.title} />
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-ink-700">{g.text}</p>
                <p className="mt-6 font-mono text-xs uppercase tracking-wider text-ink-500">
                  {g.items.length} {g.items.length === 1 ? "servicio" : "servicios"}
                </p>
              </div>
            </Reveal>
            <ul className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
              {g.items.map((sv, i) => {
                n += 1;
                const feats = lines(sv.features).slice(0, 4);
                return (
                  <Reveal as="li" key={sv.id} delay={(i % 2) * 90} className="min-w-0">
                    <Link
                      href={`/servicios/${sv.slug}`}
                      data-tilt="tilt"
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-paper-line bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-ink-900 hover:shadow-[0_18px_40px_-20px_rgba(22,19,15,.35)]"
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-brand-500 transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
                      <div className="flex items-start justify-between gap-4">
                        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:rotate-[-6deg] group-hover:bg-brand-500 group-hover:text-white">
                          <Icon name={sv.icon} className="h-6 w-6" />
                        </span>
                        <span className="font-mono text-xs text-ink-400">{String(n).padStart(2, "0")}</span>
                      </div>
                      <h3 className="mt-5 font-display text-2xl leading-tight text-ink-900">{sv.title}</h3>
                      <p className="mt-2 leading-relaxed text-ink-500">{sv.shortDescription}</p>
                      {feats.length > 0 && (
                        <ul className="mt-5 space-y-2 border-t border-paper-line pt-4 text-[14px] text-ink-700">
                          {feats.map((f) => (
                            <li key={f} className="flex gap-2.5">
                              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-ink-900"><TC>{"Ver el detalle"}</TC><Arrow className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-brand-500" />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <IntegrationsDiagram s={s} />
      <Process s={s} />

      {/* Cierre */}
      <section className="bg-ink-900 py-20 text-paper sm:py-24">
        <Reveal className="container-x grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="font-display text-4xl leading-[1.05] sm:text-6xl">
              <Emph text={s["servicesPage.ctaTitle"]} />
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-paper/70">{s["servicesPage.ctaText"]}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={s["nav.ctaUrl"] || "/contacto"} className="btn-signal">
                {s["nav.cta"] || "Hablemos"} <Arrow className="h-4 w-4" />
              </Link>
              <Link href="/#planes" className="btn-ghost text-paper"><TC>{"Ver planes y precios"}</TC></Link>
            </div>
          </div>
          <div className="hidden justify-end lg:col-span-4 lg:flex">
            <Aldo pose="wave" className="h-48 w-48" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
