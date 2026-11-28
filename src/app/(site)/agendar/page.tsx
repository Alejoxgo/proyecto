import type { Metadata } from "next";
import TC from "@/components/TC";
import Aldo from "@/components/Aldo";
import BookingPicker from "@/components/BookingPicker";
import { availability, bookingConfig } from "@/lib/booking";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Agendar llamada",
  description: "Escoge día y hora para una llamada de 30 minutos con el equipo de Aldore. Sin costo y sin compromiso.",
  alternates: { canonical: "/agendar" },
};

export default async function BookingPage() {
  const [{ days, slot }, cfg, services, s, lang] = await Promise.all([
    availability(),
    bookingConfig(),
    prisma.service.findMany({ where: { published: true }, orderBy: { order: "asc" }, select: { title: true } }),
    getSettings(),
    getLang(),
  ]);
  return (
    <section className="py-14 sm:py-20">
      <div className="container-x">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="font-mono text-sm uppercase tracking-widest text-brand-500"><TC>{"Agendar llamada"}</TC></p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-6xl">{s["booking.title"]}<span className="text-brand-500">.</span></h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-700">{s["booking.text"]}</p>
          </div>
          <Aldo pose="wave" className="hidden h-32 w-32 shrink-0 sm:block" />
        </div>
        <div className="mt-10">
          <BookingPicker days={days} slot={slot} topics={[...services.map((x) => x.title), "Puerta (QR / NFC)", "Otro tema"]} lang={lang} meet={Boolean(cfg.meet)} />
        </div>
      </div>
    </section>
  );
}
