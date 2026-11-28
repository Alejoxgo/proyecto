import TC from "@/components/TC";
import Link from "next/link";
import { Fragment } from "react";
import type { Product } from "@prisma/client";
import type { Settings } from "@/lib/settings";
import { lines, paragraphs } from "@/lib/utils";
import ContactForm from "./ContactForm";
import Carousel from "./Carousel";
import { parseGallery } from "./Sections";

/*
 * Página de Castorly con su propio ambiente: azul noche, degradado violeta → azul → cian
 * de su logo, tipografía redondeada y Cástor como anfitrión. Aldore queda de fondo
 * (menú, pie y la firma "un producto de aldore").
 */

const C = {
  night: "#0A1240",
  navy: "#0D1A4A",
  blue: "#2160F0",
  violet: "#9B3DFF",
  cyan: "#6FE3FF",
  mist: "#F2F4FF",
};

const gradientText = "bg-gradient-to-r from-[#9DB4FF] via-[#7C9BFF] to-[#6FE3FF] bg-clip-text text-transparent";
const chipDots = ["#6FE3FF", "#9B7BFF", "#7C9BFF", "#FFC94D", "#4ADE80", "#FF8FB1"];

function GradientEmph({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className={`block ${gradientText}`}>{p}</span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

export function CastorlyMark({ className = "h-10 w-10" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/castorly/castorly-mark.svg" alt="" aria-hidden className={className} />;
}

export default function CastorlyPage({ p, s }: { p: Product; s: Settings }) {
  const feats = lines(p.features);
  const chips = lines(s["castorly.pageChips"]);
  const image = p.imageUrl || s["castorly.imageUrl"];
  const mascot = s["castorly.mascotUrl"];
  const mascotName = s["castorly.mascotName"] || "Cástor";
  const slides = parseGallery(s["castorly.gallery"]);

  return (
    <div className="castorly-scope keep-light font-castorly">
      {/* Portada */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: `radial-gradient(1200px 600px at 10% -10%, #2338B8 0%, transparent 60%),
            radial-gradient(900px 500px at 100% 0%, #3B1E8F 0%, transparent 55%),
            linear-gradient(180deg, ${C.night} 0%, #0B1650 60%, ${C.night} 100%)`,
        }}
      >
        <div className="container-x relative grid items-center gap-14 pb-24 pt-14 sm:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Link href="/#productos" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#c9d3ff] hover:bg-white/10"><TC>{"← Un producto de "}</TC><span className="font-semibold text-white"><TC>{"aldore"}</TC></span>
            </Link>
            <div className="mt-10 flex items-center gap-4">
              <CastorlyMark className="h-14 w-14 sm:h-16 sm:w-16" />
              <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">{p.name}</span>
            </div>
            <h1 className="mt-8 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              <GradientEmph text={s["castorly.pageTitle"] || p.tagline} />
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#c9d3ff]">{s["castorly.text"] || p.tagline}</p>
            {chips.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2.5">
                {chips.map((c, i) => (
                  <li key={c} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-2 text-[15px] font-medium">
                    <span className="h-2 w-2 rounded-full" style={{ background: chipDots[i % chipDots.length] }} /> {c}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              {p.ctaUrl ? (
                <a href={p.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-lg shadow-[#2160F0]/40 transition hover:brightness-110" style={{ background: `linear-gradient(90deg, ${C.violet}, ${C.blue})` }}>
                  {p.ctaLabel} ↗
                </a>
              ) : null}
              <a href="#solicitar" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10"><TC>{"Hablar con un asesor"}</TC></a>
            </div>
            {p.price && (
              <p className="mt-6 text-sm text-[#c9d3ff]">
                <span className="text-xl font-bold text-white">{p.price}</span> {p.priceNote}
              </p>
            )}
          </div>

          <div className="relative lg:col-span-6">
            <div className="absolute -inset-6 rounded-[2rem] opacity-60 blur-3xl" style={{ background: `linear-gradient(135deg, ${C.violet}55, ${C.blue}55, ${C.cyan}44)` }} aria-hidden />
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={`${p.name} por dentro`} className="relative w-full rounded-2xl border border-white/15 shadow-2xl shadow-black/50" />
            )}
            {mascot && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mascot} alt={mascotName} className="pointer-events-none absolute -bottom-12 -left-4 w-28 drop-shadow-2xl sm:-left-10 sm:w-40" />
            )}
          </div>
        </div>

        {/* Carrusel */}
        {slides.length > 0 && (
          <div className="container-x relative pb-24">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              {s["castorly.galleryTitle"] || "Así se ve por dentro"}
            </h2>
            <div className="mx-auto mt-10 max-w-5xl">
              <Carousel slides={slides} tone="castorly" label={`Capturas de ${p.name}`} />
            </div>
          </div>
        )}
      </section>

      {/* Qué hace */}
      <section style={{ background: C.mist, color: C.navy }} className="py-20 sm:py-24">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: C.blue }}><TC>{"Qué hace "}</TC>{p.name}</p>
            <div className="mt-4 space-y-5 text-lg leading-relaxed text-[#3a4673]">
              {paragraphs(p.description).map((t, i) => <p key={i}>{t}</p>)}
            </div>
            {mascot && (
              <div className="mt-10 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#2160F0]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mascot} alt="" className="h-16 w-16 shrink-0 object-contain" />
                <p className="text-[15px] text-[#3a4673]">
                  <span className="font-bold" style={{ color: C.navy }}><TC>{"Hola, soy "}</TC>{mascotName}.</span><TC>{" Te acompaño en cada caso: busco en tu base de conocimiento, te propongo el ticket y te aviso si algo falta."}</TC></p>
              </div>
            )}
          </div>
          {feats.length > 0 && (
            <ul className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:col-span-7">
              {feats.map((f, i) => (
                <li key={f} className="flex items-start gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#2160F0]/10">
                  <span
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.blue} 55%, ${C.cyan})` }}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold leading-snug">{f}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Solicitar */}
      <section id="solicitar" className="scroll-mt-16 py-20 sm:py-24" style={{ background: `linear-gradient(180deg, ${C.mist}, #E6EBFF)` }}>
        <div className="container-x">
          <div className="grid grid-cols-1 gap-10 rounded-3xl bg-white p-6 shadow-xl shadow-[#2160F0]/10 ring-1 ring-[#2160F0]/10 sm:p-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <CastorlyMark className="h-12 w-12" />
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: C.navy }}><TC>{"¿Quieres "}</TC>{p.name}<TC>{" en tu mesa de ayuda?"}</TC></h2>
              <p className="mt-4 text-lg text-[#3a4673]"><TC>{"Cuéntanos de tu equipo y te mostramos "}</TC>{p.name}<TC>{" funcionando con tus propios casos."}</TC></p>
              {p.ctaUrl && (
                <a href={p.ctaUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex font-semibold hover:underline" style={{ color: C.blue }}>
                  {s["castorly.urlLabel"] || "Ir a castorly.co"} ↗
                </a>
              )}
            </div>
            <div className="lg:col-span-7">
              <ContactForm services={[p.name]} defaultService={p.name} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
