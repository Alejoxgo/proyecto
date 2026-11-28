import type { Metadata } from "next";
import TC from "@/components/TC";
import Aldo, { type AldoPose } from "@/components/Aldo";
import Reveal from "@/components/Reveal";
import BrandSwatch from "@/components/BrandSwatch";
import { LogoMark } from "@/components/Logo";
import { Emph } from "@/components/Sections";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Identidad de marca",
  description: "Logo, colores, tipografía, a Aldo y la forma de hablar de Aldore. Todo lo necesario para usar la marca bien.",
  alternates: { canonical: "/marca" },
};

const SCALE: [string, string][] = [
  ["50", "#fdf1ec"], ["100", "#fbe0d5"], ["200", "#f6bfa9"], ["300", "#ef9673"], ["400", "#e86a42"],
  ["500", "#e2471c"], ["600", "#c63b14"], ["700", "#a32f11"], ["800", "#842914"], ["900", "#6c2414"],
];
const INKS: [string, string, string][] = [
  ["Tinta 800", "#221e19", "Fondos oscuros secundarios"],
  ["Tinta 700", "#3a342c", "Textos largos"],
  ["Tinta 500", "#6b6358", "Textos de apoyo"],
  ["Papel 2", "#ebe6db", "Tarjetas y bloques"],
  ["Línea", "#d9d2c3", "Bordes y divisores"],
];
const TYPES = [
  { name: "Fraunces", role: "Logotipo", cls: "font-serif font-semibold lowercase", sample: "aldore.", note: "Serif con carácter, en minúscula y seminegrita. Solo para el nombre de la marca." },
  { name: "Space Grotesk", role: "Títulos", cls: "font-display", sample: "Abrimos la puerta digital.", note: "Seminegrita y apretada (−3 %). Para titulares, cifras y botones grandes." },
  { name: "Geist", role: "Textos", cls: "font-sans", sample: "Te decimos qué se puede hacer, cuánto cuesta y cuándo está listo.", note: "Para párrafos, formularios y la interfaz. Regular o media, nunca en mayúsculas sostenidas." },
  { name: "JetBrains Mono", role: "Etiquetas", cls: "font-mono uppercase tracking-[0.14em] !text-xl sm:!text-2xl", sample: "01 · Nuestra app", note: "En mayúsculas espaciadas, pequeña. Para rótulos, números de sección y datos." },
];
const POSES: { pose: AldoPose; label: string; use: string }[] = [
  { pose: "wave", label: "Saluda", use: "Bienvenidas y contacto" },
  { pose: "think", label: "Piensa", use: "Preguntas y cotizaciones" },
  { pose: "code", label: "Programa", use: "Servicios y tecnología" },
  { pose: "fly", label: "Vuela", use: "Transiciones y avisos" },
  { pose: "cheer", label: "Celebra", use: "Envíos y logros" },
  { pose: "sleep", label: "Duerme", use: "Esperas y páginas vacías" },
];
const VOICE = [
  { t: "Claros", d: "Decimos qué hacemos, cuánto cuesta y cuándo está listo. Sin tecnicismos.", yes: "Tu página queda lista en 3 semanas y cuesta $1.200.000.", no: "Implementamos soluciones digitales escalables de alto impacto." },
  { t: "Cercanos", d: "Hablamos de tú, como un colega que sabe del tema y quiere ayudar.", yes: "Cuéntanos qué te quita tiempo y lo miramos juntos.", no: "Estimado cliente, favor diligenciar el formulario adjunto." },
  { t: "Honestos", d: "Si algo no te sirve, lo decimos. Prometemos solo lo que cumplimos.", yes: "Para lo que necesitas, con una Puerta te basta.", no: "¡La mejor solución del mercado, garantizada al 100 %!" },
];
const DONTS = [
  { label: "No lo estires", style: { transform: "scaleX(1.5)" } },
  { label: "No cambies sus colores", style: { filter: "hue-rotate(150deg)" } },
  { label: "No lo gires", style: { transform: "rotate(-18deg)" } },
  { label: "No le agregues efectos", style: { filter: "drop-shadow(4px 6px 0 #6d28d9) blur(.6px)" } },
];
const FILES = [
  { name: "Logo principal", file: "aldore-logo.svg", bg: "#f4f1ea" },
  { name: "Logo para fondo oscuro", file: "aldore-logo-claro.svg", bg: "#16130f" },
  { name: "Logo sobre bermellón", file: "aldore-logo-bermellon.svg", bg: "#e2471c" },
  { name: "Símbolo", file: "aldore-simbolo.svg", bg: "#f4f1ea" },
  { name: "Símbolo claro", file: "aldore-simbolo-claro.svg", bg: "#16130f" },
  { name: "Ícono de app", file: "aldore-icono.svg", bg: "#ebe6db" },
  { name: "Aldo", file: "aldo.svg", bg: "#f4f1ea" },
];

function Wordmark({ light = false, door, className = "" }: { light?: boolean; door?: string; className?: string }) {
  const ink = light ? "#f4f1ea" : "#16130f";
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className}`}>
      <svg viewBox="0 0 40 40" className="h-[1.25em] w-[1.25em]" aria-hidden>
        <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill={ink} />
        <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill={door ?? "#e2471c"} />
      </svg>
      <span className="font-serif font-semibold lowercase leading-none tracking-tight" style={{ color: ink }}>
        aldore<span style={{ color: door ?? "#e2471c" }}>.</span>
      </span>
    </span>
  );
}

function Head({ n, kicker, title, text }: { n: string; kicker: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow flex items-center gap-3"><span className="text-brand-500">{n}</span><span className="h-px w-8 bg-ink-900/20" /><TC>{kicker}</TC></p>
      <h2 className="section-title mt-5"><TC>{title}</TC></h2>
      {text && <p className="mt-5 text-lg leading-relaxed text-ink-700"><TC>{text}</TC></p>}
    </div>
  );
}

export default async function BrandPage() {
  const s = await getSettings();
  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden border-b border-paper-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
        <div className="container-x relative grid items-center gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-sm uppercase tracking-widest text-brand-500"><TC>{"Identidad de marca"}</TC></p>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl"><Emph text={s["brand.title"]} /></h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-ink-700">{s["brand.text"]}</p>
            <nav aria-label="Secciones de la marca" className="mt-8 flex flex-wrap gap-2 text-sm">
              {[["#logo", "Logo"], ["#color", "Color"], ["#tipografia", "Tipografía"], ["#aldo", "Aldo"], ["#voz", "Voz"], ["#usos", "Aplicaciones"], ["#descargas", "Descargas"]].map(([h, l]) => (
                <a key={h} href={h} className="rounded-full border border-paper-line bg-white px-4 py-1.5 text-ink-700 transition hover:border-brand-500 hover:text-brand-600"><TC>{l}</TC></a>
              ))}
            </nav>
          </div>
          <div className="lg:col-span-5">
            <div className="keep-light relative flex aspect-square items-center justify-center overflow-hidden rounded-[2.5rem] bg-ink-900">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#f4f1ea 1px, transparent 1px), linear-gradient(90deg, #f4f1ea 1px, transparent 1px)", backgroundSize: "32px 32px" }} aria-hidden />
              <LogoMark light className="relative aspect-square h-auto w-1/2 drop-shadow-[0_30px_60px_rgba(226,71,28,.35)]" />
              <span className="absolute bottom-6 left-7 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50"><TC>{"La A que es una puerta"}</TC></span>
            </div>
          </div>
        </div>
      </section>

      {/* Concepto */}
      <section className="border-b border-paper-line py-20 sm:py-24">
        <Reveal className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow"><TC>{"El concepto"}</TC></p>
            <p className="mt-5 font-display text-3xl leading-tight sm:text-4xl">{s["brand.concept"]}</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
            {[
              ["Puerta", "El arco es la entrada: abrimos la puerta digital de cada negocio."],
              ["Letra A", "La silueta forma la A de Aldore, firme y sencilla."],
              ["Luz", "El bermellón es la luz que sale de adentro cuando la puerta se abre."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-3xl border border-paper-line bg-white p-6">
                <p className="font-display text-xl text-ink-900"><TC>{t}</TC></p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500"><TC>{d}</TC></p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Logo */}
      <section id="logo" className="scroll-mt-16 border-b border-paper-line py-20 sm:py-24">
        <div className="container-x">
          <Head n="01" kicker="Logo" title="Un símbolo, tres versiones" text="El logo une el símbolo del arco con el nombre en minúscula y un punto bermellón. Usa la versión que mejor contraste con el fondo." />
          <div className="keep-light mt-12 grid gap-4 md:grid-cols-3">
            {[
              { bg: "#f4f1ea", light: false, door: undefined, label: "Principal · sobre papel" },
              { bg: "#16130f", light: true, door: undefined, label: "Sobre fondo oscuro" },
              { bg: "#e2471c", light: true, door: "#16130f", label: "Sobre bermellón" },
            ].map((v) => (
              <figure key={v.label} className="overflow-hidden rounded-3xl ring-1 ring-black/10">
                <div className="flex aspect-[4/3] items-center justify-center" style={{ background: v.bg }}>
                  <Wordmark light={v.light} door={v.door} className="text-5xl" />
                </div>
                <figcaption className="bg-white px-5 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-500"><TC>{v.label}</TC></figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Construcción */}
            <div className="keep-light rounded-3xl border border-paper-line bg-white p-7">
              <p className="eyebrow"><TC>{"Construcción"}</TC></p>
              <div className="mt-5 flex items-center justify-center rounded-2xl bg-paper py-8">
                <svg viewBox="-4 -4 48 48" className="h-56 w-56" aria-hidden>
                  {Array.from({ length: 11 }, (_, i) => (
                    <g key={i} stroke="#e2471c" strokeOpacity=".18" strokeWidth=".15">
                      <path d={`M${i * 4} 0V40`} /><path d={`M0 ${i * 4}H40`} />
                    </g>
                  ))}
                  <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="#16130f" fillOpacity=".9" />
                  <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" />
                  <circle cx="20" cy="21" r="15" fill="none" stroke="#e2471c" strokeWidth=".3" strokeDasharray="1 1" />
                  <path d="M20 0v40" stroke="#e2471c" strokeWidth=".25" strokeDasharray="1 1" />
                </svg>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-500"><TC>{"Sobre una cuadrícula de 40 × 40: el arco ojival ocupa 30 de ancho, y la puerta interior es un tercio del arco, centrada en el mismo eje."}</TC></p>
            </div>
            {/* Espacio y tamaño */}
            <div className="keep-light rounded-3xl border border-paper-line bg-white p-7">
              <p className="eyebrow"><TC>{"Espacio de respeto y tamaño mínimo"}</TC></p>
              <div className="mt-5 flex items-center justify-center rounded-2xl bg-paper py-10">
                <div className="relative p-8 outline-dashed outline-1 outline-brand-500/60">
                  <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[10px] text-brand-600">A</span>
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 font-mono text-[10px] text-brand-600">A</span>
                  <Wordmark className="text-4xl" />
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-500"><TC>{"Deja alrededor del logo, como mínimo, el ancho de la puerta del símbolo (A). En pantalla, el logo completo no baja de 96 px de ancho y el símbolo solo, de 20 px."}</TC></p>
              <div className="mt-4 flex items-end gap-6">
                <Wordmark className="text-[15px]" /><LogoMark className="h-5 w-5" />
                <span className="font-mono text-[11px] text-ink-400">96 px · 20 px</span>
              </div>
            </div>
          </div>

          {/* Lo que no se hace */}
          <p className="eyebrow mt-14"><TC>{"Lo que no se hace"}</TC></p>
          <div className="keep-light mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {DONTS.map((d) => (
              <figure key={d.label} className="rounded-3xl border border-paper-line bg-white p-5">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-paper">
                  <div style={d.style}><Wordmark className="text-2xl" /></div>
                  <svg viewBox="0 0 100 75" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden><path d="M8 8l84 59" stroke="#dc2626" strokeWidth="1.5" /></svg>
                </div>
                <figcaption className="mt-3 text-sm font-medium text-ink-700"><TC>{d.label}</TC></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Color */}
      <section id="color" className="scroll-mt-16 border-b border-paper-line py-20 sm:py-24">
        <div className="container-x">
          <Head n="02" kicker="Color" title="Papel, tinta y un solo acento" text="Una paleta cálida y sobria: fondos de papel, textos en tinta casi negra y el bermellón para lo importante. Toca un color para copiar su código." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <BrandSwatch name="Papel" hex="#F4F1EA" rgb="244 241 234" role="Fondo principal" big />
            <BrandSwatch name="Tinta" hex="#16130F" rgb="22 19 15" role="Texto y fondos oscuros" dark big />
            <BrandSwatch name="Bermellón" hex="#E2471C" rgb="226 71 28" role="Acento y acciones" dark big />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {INKS.map(([n, h, r]) => (
              <BrandSwatch key={n} name={n} hex={h.toUpperCase()} rgb={[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(" ")} role={r} dark={n.startsWith("Tinta")} />
            ))}
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow"><TC>{"Escala del bermellón"}</TC></p>
              <div className="mt-4 flex overflow-hidden rounded-2xl ring-1 ring-black/10">
                {SCALE.map(([k, h]) => (
                  <div key={k} className="flex h-20 flex-1 items-end p-2 font-mono text-[10px]" style={{ background: h, color: Number(k) >= 400 ? "#fff" : "#16130f" }}>{k}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="eyebrow"><TC>{"Proporción"}</TC></p>
              <div className="mt-4 flex h-20 overflow-hidden rounded-2xl ring-1 ring-black/10 font-mono text-[11px]">
                <div className="flex items-end bg-[#f4f1ea] p-3 text-[#16130f]" style={{ width: "62%" }}><TC>{"Papel 60 %"}</TC></div>
                <div className="flex items-end bg-[#16130f] p-3 text-[#f4f1ea]" style={{ width: "28%" }}><TC>{"Tinta 30 %"}</TC></div>
                <div className="flex items-end bg-[#e2471c] p-3 text-white" style={{ width: "10%" }}>10 %</div>
              </div>
              <p className="mt-3 text-[15px] text-ink-500"><TC>{"El bermellón es escaso a propósito: si todo resalta, nada resalta."}</TC></p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipografía */}
      <section id="tipografia" className="scroll-mt-16 border-b border-paper-line py-20 sm:py-24">
        <div className="container-x">
          <Head n="03" kicker="Tipografía" title="Cuatro letras, cada una con su trabajo" />
          <div className="mt-12 divide-y divide-paper-line border-y border-paper-line">
            {TYPES.map((t) => (
              <div key={t.name} className="grid gap-4 py-8 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-500"><TC>{t.role}</TC></p>
                  <p className="mt-1 font-display text-2xl text-ink-900">{t.name}</p>
                </div>
                <p className={`text-4xl leading-tight text-ink-900 sm:text-5xl lg:col-span-6 ${t.cls}`}>{t.role === "Logotipo" || t.role === "Etiquetas" ? t.sample : <TC>{t.sample}</TC>}</p>
                <p className="text-[15px] leading-relaxed text-ink-500 lg:col-span-3"><TC>{t.note}</TC></p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[["Titular", "font-display text-5xl", "56 / 1.05"], ["Subtítulo", "font-display text-2xl", "24 / 1.25"], ["Párrafo", "text-lg", "18 / 1.6"]].map(([l, c, m]) => (
              <div key={l} className="rounded-3xl border border-paper-line bg-white p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-400">{m}</p>
                <p className={`mt-3 text-ink-900 ${c}`}><TC>{l}</TC></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aldo */}
      <section id="aldo" className="scroll-mt-16 border-b border-paper-line bg-ink-900 py-20 text-paper sm:py-24">
        <div className="container-x">
          <div className="max-w-3xl">
            <p className="eyebrow flex items-center gap-3 !text-paper/50"><span className="text-brand-400">04</span><span className="h-px w-8 bg-paper/20" /><TC>{"Mascota"}</TC></p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl"><TC>{"Aldo, el búho que ve en la oscuridad"}</TC></h2>
            <p className="mt-5 text-lg leading-relaxed text-paper/70"><TC>{"Aldo está hecho con la misma silueta del logo: el arco son sus orejas y la puerta, su pecho. Acompaña, explica y celebra; nunca reemplaza al logo."}</TC></p>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {POSES.map((p) => (
              <li key={p.pose} className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] px-3 pb-5 pt-6 text-center">
                <Aldo pose={p.pose} onDark follow={false} className="h-24 w-24" title={`Aldo ${p.label.toLowerCase()}`} />
                <p className="mt-3 font-display text-lg"><TC>{p.label}</TC></p>
                <p className="mt-1 text-xs text-paper/55"><TC>{p.use}</TC></p>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.06] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-300"><TC>{"Sí"}</TC></p>
              <ul className="mt-3 space-y-2 text-[15px] text-paper/80">
                {["Úsalo para guiar, explicar o celebrar.", "Déjalo junto a un texto corto que hable como él.", "Ponle el accesorio de la temporada (gorro, bufanda…)."].map((x) => <li key={x}>· <TC>{x}</TC></li>)}
              </ul>
            </div>
            <div className="rounded-3xl border border-red-400/30 bg-red-400/[0.06] p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-red-300"><TC>{"No"}</TC></p>
              <ul className="mt-3 space-y-2 text-[15px] text-paper/80">
                {["No lo uses en lugar del logo.", "No le cambies los colores ni la forma.", "No lo pongas en mensajes serios: errores de pago o avisos legales."].map((x) => <li key={x}>· <TC>{x}</TC></li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Voz */}
      <section id="voz" className="scroll-mt-16 border-b border-paper-line py-20 sm:py-24">
        <div className="container-x">
          <Head n="05" kicker="Voz" title="Hablamos claro, como un colega" text="Escribimos para dueños de negocio, no para programadores. Frases cortas, cifras concretas y cero promesas infladas." />
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {VOICE.map((v) => (
              <div key={v.t} className="flex flex-col rounded-3xl border border-paper-line bg-white p-7">
                <p className="font-display text-2xl text-ink-900"><TC>{v.t}</TC></p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-500"><TC>{v.d}</TC></p>
                <div className="mt-6 space-y-3 text-[15px]">
                  <p className="rounded-2xl bg-emerald-500/10 p-4 text-ink-800"><span className="mr-2 font-mono text-[11px] uppercase text-emerald-700">✓</span><TC>{v.yes}</TC></p>
                  <p className="rounded-2xl bg-red-500/10 p-4 text-ink-500 line-through decoration-red-400/60"><span className="mr-2 font-mono text-[11px] uppercase text-red-600 no-underline">✕</span><TC>{v.no}</TC></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aplicaciones */}
      <section id="usos" className="scroll-mt-16 border-b border-paper-line py-20 sm:py-24">
        <div className="container-x">
          <Head n="06" kicker="Aplicaciones" title="La marca en el día a día" />
          <div className="keep-light mt-12 grid gap-4 lg:grid-cols-12">
            {/* Tarjeta de presentación */}
            <div className="flex flex-col gap-4 rounded-3xl border border-paper-line bg-paper-2 p-6 lg:col-span-7">
              <p className="eyebrow"><TC>{"Tarjeta de presentación"}</TC></p>
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="relative flex aspect-[1.75] items-center justify-center rounded-xl bg-ink-900 shadow-[0_20px_40px_-20px_rgba(0,0,0,.5)]">
                  <Wordmark light className="text-3xl" />
                </div>
                <div className="relative flex aspect-[1.75] flex-col justify-between rounded-xl bg-paper p-5 shadow-[0_20px_40px_-20px_rgba(0,0,0,.35)]">
                  <LogoMark className="h-7 w-7" />
                  <div>
                    <p className="font-display text-lg text-ink-900"><TC>{"Tu nombre"}</TC></p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-600"><TC>{"Directora de proyectos"}</TC></p>
                    <p className="mt-2 text-[11px] text-ink-500">{s["contact.email"]} · aldore.co</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Ícono de app */}
            <div className="flex flex-col rounded-3xl border border-paper-line bg-white p-6 lg:col-span-5">
              <p className="eyebrow"><TC>{"Ícono y avatar"}</TC></p>
              <div className="flex flex-1 items-center justify-center gap-6 py-6">
                <img src="/brand/aldore-icono.svg" alt="" className="h-24 w-24 rounded-[22px] shadow-lg" />
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500"><LogoMark light className="h-10 w-10" /></span>
                <img src="/brand/aldore-icono.svg" alt="" className="h-10 w-10 rounded-lg" />
              </div>
            </div>
            {/* Publicación en redes */}
            <div className="rounded-3xl border border-paper-line bg-white p-6 lg:col-span-5">
              <p className="eyebrow"><TC>{"Publicación en redes"}</TC></p>
              <div className="relative mx-auto mt-5 flex aspect-square max-w-xs flex-col justify-between overflow-hidden rounded-2xl bg-brand-500 p-6 text-white">
                <div className="absolute -bottom-10 -right-6 opacity-95"><Aldo pose="wave" follow={false} className="h-40 w-40" /></div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80"><TC>{"Consejo del martes"}</TC></p>
                <p className="relative max-w-[13rem] font-display text-2xl leading-tight"><TC>{"Si tu cliente no te encuentra en 3 segundos, se va."}</TC></p>
                <Wordmark light door="#16130f" className="relative text-base" />
              </div>
            </div>
            {/* Firma de correo */}
            <div className="rounded-3xl border border-paper-line bg-white p-6 lg:col-span-7">
              <p className="eyebrow"><TC>{"Firma de correo"}</TC></p>
              <div className="mt-5 rounded-2xl border border-paper-line bg-paper p-6">
                <p className="text-[15px] text-ink-700"><TC>{"Quedo atenta a tus comentarios. ¡Un abrazo!"}</TC></p>
                <div className="mt-5 flex items-center gap-4 border-t border-paper-line pt-5">
                  <span className="h-12 w-1 rounded-full bg-brand-500" />
                  <div>
                    <p className="font-display text-lg text-ink-900"><TC>{"Tu nombre"}</TC></p>
                    <p className="text-sm text-ink-500"><TC>{"Directora de proyectos"}</TC> · Aldore</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-400">{s["contact.phone"]} · aldore.co</p>
                  </div>
                  <Wordmark className="ml-auto hidden text-xl sm:inline-flex" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Descargas */}
      <section id="descargas" className="scroll-mt-16 py-20 sm:py-24">
        <div className="container-x">
          <Head n="07" kicker="Descargas" title="Archivos listos para usar" text="Todos en SVG: se ven nítidos en cualquier tamaño y se abren en Figma, Illustrator, Canva o el navegador." />
          <ul className="keep-light mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {FILES.map((f) => (
              <li key={f.file}>
                <a href={`/brand/${f.file}`} download className="group block overflow-hidden rounded-3xl border border-paper-line bg-white transition hover:-translate-y-1 hover:border-brand-500">
                  <div className="flex aspect-[4/3] items-center justify-center p-6" style={{ background: f.bg }}>
                    <img src={`/brand/${f.file}`} alt="" className="max-h-16 max-w-[80%]" />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-ink-900"><TC>{f.name}</TC></span>
                    <span className="font-mono text-[11px] text-brand-600 group-hover:text-brand-700">SVG ↓</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
