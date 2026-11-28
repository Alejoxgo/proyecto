import TC from "@/components/TC";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { StackMarquee } from "@/components/TechSections";
import Aldo from "@/components/Aldo";
import { CasesBlock } from "@/components/CaseSections";
import XmasTree from "@/components/XmasTree";
import { currentSeason } from "@/lib/season";
import ContactForm from "@/components/ContactForm";
import { PuertaBlock } from "@/components/PuertaSections";
import { AldoBand, CastorlyBlock, Emph, FaqList, Hero, Plans, Process, ProductsList, ServicesList, Testimonials } from "@/components/Sections";

export default async function HomePage() {
  const pub = { where: { published: true }, orderBy: { order: "asc" as const } };
  const [s, services, products, plans, testimonials, faqs, cases, season] = await Promise.all([
    getSettings(),
    prisma.service.findMany(pub),
    prisma.product.findMany(pub),
    prisma.plan.findMany(pub),
    prisma.testimonial.findMany(pub),
    prisma.faq.findMany(pub),
    prisma.caseStudy.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { id: "desc" }], take: 3 }),
    currentSeason(),
  ]);
  const castorly = products.find((p) => p.slug === "castorly") ?? null;

  return (
    <>
      <Hero s={s} />
      <StackMarquee s={s} />
      {season === "navidad" && (
        <section id="navidad" className="relative overflow-hidden border-b border-paper-line py-20 sm:py-24">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-green-600/10 blur-3xl" aria-hidden />
          <div className="container-x relative grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="section-title"><Emph text={s["xmas.title"]} /></h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-700">{s["xmas.text"]}</p>
            </div>
            <div className="lg:col-span-7">
              <XmasTree done={s["xmas.done"]} />
            </div>
          </div>
        </section>
      )}
      <ServicesList services={services} s={s} />
      <CastorlyBlock s={s} product={castorly} />
      <PuertaBlock s={s} />
      <ProductsList products={products} s={s} />
      <CasesBlock items={cases} title={s["cases.title"]} />
      <Process s={s} />
      <Plans plans={plans} s={s} />
      <Testimonials items={testimonials} s={s} />
      <AldoBand s={s} />
      <FaqList items={faqs} s={s} />
      <section id="contacto" className="scroll-mt-16 border-t border-paper-line bg-white/50 py-24">
        <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-end justify-between gap-4">
              <p className="eyebrow"><TC>{"Contacto"}</TC></p>
              <Aldo pose="wave" className="-mb-2 h-24 w-24 shrink-0" />
            </div>
            <h2 className="section-title mt-2"><Emph text={s["cta.title"]} /></h2>
            <p className="mt-5 text-lg text-ink-700">{s["cta.text"]}</p>
            {s["booking.link"] && <Link href="/agendar" className="mt-5 inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700">{s["booking.link"]} →</Link>}
            <dl className="mt-10 space-y-5 border-t border-paper-line pt-6 text-[15px]">
              <div><dt className="eyebrow"><TC>{"Correo"}</TC></dt><dd className="mt-1"><a className="link-u" href={`mailto:${s["contact.email"]}`}>{s["contact.email"]}</a></dd></div>
              <div><dt className="eyebrow"><TC>{"Teléfono"}</TC></dt><dd className="mt-1">{s["contact.phone"]}</dd></div>
              <div><dt className="eyebrow"><TC>{"Dónde"}</TC></dt><dd className="mt-1">{s["contact.address"]}</dd></div>
            </dl>
          </div>
          <div className="lg:col-span-7">
            <ContactForm services={[...services.map((x) => x.title), ...products.map((p) => p.name), "Puerta (QR / NFC)"]} />
          </div>
        </div>
      </section>
    </>
  );
}
