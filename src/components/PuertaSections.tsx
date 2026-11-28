import TC from "@/components/TC";
import Link from "next/link";
import PuertaView, { type PuertaData } from "./PuertaView";
import { PUERTA_DEMOS, type PuertaDemo } from "@/lib/puerta-demos";
import { Emph } from "./Sections";
import { parseButtons } from "@/lib/puerta";
import { lines } from "@/lib/utils";
import type { Settings } from "@/lib/settings";

function demoData(d: PuertaDemo): PuertaData {
  return { ...d, buttons: parseButtons(d.buttons).map((b) => ({ ...b, link: "#" })) };
}

/** Celular con una Puerta de ejemplo, con el sticker NFC al lado. */
export function PuertaPhone({ className = "", demo = PUERTA_DEMOS[0], sticker = true }: { className?: string; demo?: PuertaDemo; sticker?: boolean }) {
  return (
    <div className={`relative mx-auto w-[290px] ${className}`}>
      <div className="relative overflow-hidden rounded-[2.6rem] border-[10px] border-[#2a2520] bg-[#16130f] shadow-2xl shadow-black/50">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#2a2520]" />
        <div className="h-[560px] overflow-hidden">
          <PuertaView data={demoData(demo)} preview />
        </div>
      </div>
      {sticker && <div className="absolute -left-14 bottom-16 hidden rotate-[-8deg] sm:block" aria-hidden="true">
        <div className="grid h-24 w-24 place-items-center rounded-full border border-white/15 bg-paper text-ink-900 shadow-xl">
          <div className="text-center">
            <svg viewBox="0 0 40 40" className="mx-auto h-7 w-7">
              <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="#16130f" />
              <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" />
            </svg>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider"><TC>{"Acerca tu celular"}</TC></p>
          </div>
        </div>
        <span className="absolute -right-3 top-1/2 h-px w-6 animate-pulse bg-brand-500" />
      </div>}
    </div>
  );
}

export function parsePlans(value?: string) {
  return lines(value).map((l) => {
    const [name, price, note, incl] = l.split("|").map((x) => x.trim());
    return { name, price, note, features: (incl ?? "").split(";").map((x) => x.trim()).filter(Boolean) };
  });
}

/** Bloque de la portada. */
export function PuertaBlock({ s }: { s: Settings }) {
  const uses = lines(s["puerta.uses"]);
  return (
    <section id="puerta" className="scroll-mt-16 overflow-hidden border-b border-paper-line py-24">
      <div className="container-x grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 font-mono text-xs text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {s["puerta.badge"]}
          </p>
          <h2 className="section-title mt-5"><Emph text={s["puerta.title"]} /></h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-700">{s["puerta.text"]}</p>
          {uses.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {uses.map((u) => (
                <li key={u} className="rounded-full border border-paper-line bg-white px-3 py-1 text-sm text-ink-700">{u}</li>
              ))}
            </ul>
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/puerta" className="btn-signal">{s["puerta.cta"]} →</Link>
            <Link href="/puerta#planes" className="btn-outline"><TC>{"Ver planes"}</TC></Link>
          </div>
        </div>
        <div className="relative lg:col-span-6">
          <div className="pointer-events-none absolute inset-0 -z-10 m-auto h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />
          <PuertaPhone />
        </div>
      </div>
    </section>
  );
}

/** Tres negocios inventados, cada uno con su identidad: así se ve que ninguna Puerta es igual a otra. */
export function PuertaShowcase() {
  const kinds = ["Cafetería", "Peluquería", "Restaurante"];
  return (
    <section className="overflow-hidden border-b border-paper-line bg-paper-2 py-20">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="eyebrow"><TC>{"Cada negocio, su propia Puerta"}</TC></p>
            <h2 className="section-title mt-4"><TC>{"Tu logo, tus colores, "}</TC><em className="not-italic text-brand-500"><TC>{"tu estilo"}</TC></em>.
            </h2>
          </div>
          <p className="self-end text-lg text-ink-700 lg:col-span-5 lg:col-start-8"><TC>{"No es una plantilla igual para todos. Diseñamos cada Puerta con la identidad del negocio: portada, logo, tipografía, colores y botones. Estos tres son inventados, tócalos y míralos en vivo."}</TC></p>
        </div>
        <ul className="-mx-4 mt-12 flex snap-x snap-mandatory gap-8 overflow-x-auto px-4 pb-4 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
          {PUERTA_DEMOS.map((d, i) => (
            <li key={d.slug} className="w-[290px] shrink-0 snap-center lg:w-auto">
              <PuertaPhone demo={d} sticker={false} className="transition duration-500 hover:-translate-y-2" />
              <div className="mx-auto mt-6 flex w-[290px] items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500">{kinds[i] ?? "Negocio"}</p>
                  <p className="font-display text-xl text-ink-900">{d.name}</p>
                </div>
                <a href={`/p/${d.slug}`} target="_blank" rel="noopener noreferrer" className="btn-outline !px-4 !py-2 text-sm"><TC>{"Ver en vivo ↗"}</TC></a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
