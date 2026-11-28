import TC from "@/components/TC";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import Aldo from "@/components/Aldo";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { Emph } from "@/components/Sections";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ servicio?: string }> }) {
  const { servicio = "" } = await searchParams;
  const [s, services, products] = await Promise.all([
    getSettings(),
    prisma.service.findMany({ where: { published: true }, orderBy: { order: "asc" }, select: { title: true } }),
    prisma.product.findMany({ where: { published: true }, orderBy: { order: "asc" }, select: { name: true } }),
  ]);
  const options = [...services.map((x) => x.title), ...products.map((p) => p.name), "Puerta (QR / NFC)"];
  if (servicio && !options.includes(servicio)) options.push(servicio);
  const wa = whatsappLink(s["contact.whatsapp"], "Hola, quiero cotizar un proyecto.");

  return (
    <section className="py-16 sm:py-24">
      <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Aldo pose="wave" className="-ml-3 h-28 w-28" />
          <p className="eyebrow mt-2"><TC>{"Contacto"}</TC></p>
          <h1 className="mt-5 font-display text-5xl font-medium leading-[1.03] tracking-tight sm:text-6xl"><Emph text={s["cta.title"]} /></h1>
          <p className="mt-6 text-lg text-ink-700">{s["cta.text"]}</p>
          {s["booking.link"] && <Link href="/agendar" className="mt-4 inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700">{s["booking.link"]} →</Link>}
          <dl className="mt-10 space-y-5 border-t border-paper-line pt-6 text-[15px]">
            <div><dt className="eyebrow"><TC>{"Correo"}</TC></dt><dd className="mt-1"><a className="link-u" href={`mailto:${s["contact.email"]}`}>{s["contact.email"]}</a></dd></div>
            <div><dt className="eyebrow"><TC>{"Teléfono"}</TC></dt><dd className="mt-1">{s["contact.phone"]}</dd></div>
            <div><dt className="eyebrow"><TC>{"Dónde"}</TC></dt><dd className="mt-1">{s["contact.address"]}<br /><span className="text-ink-500">{s["contact.hours"]}</span></dd></div>
          </dl>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline mt-8"><TC>{"Escríbenos por WhatsApp"}</TC></a>}
        </div>
        <div className="lg:col-span-7">
          <ContactForm services={options} defaultService={servicio} />
        </div>
      </div>
    </section>
  );
}
