import CountUp from "@/components/CountUp";
import TC from "@/components/TC";
import AldoFlyBy from "./AldoFlyBy";
import Link from "next/link";
import { Fragment } from "react";
import { lines } from "@/lib/utils";
import HeroDoor from "./HeroDoor";
import Carousel from "./Carousel";
import Icon from "./Icon";
import Aldo from "./Aldo";
import type { Settings } from "@/lib/settings";
import type { Faq, Plan, Product, Service, Testimonial } from "@prisma/client";

/** Convierte *palabra* en énfasis (cursiva en color de acento). */
export function Emph({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <em key={i} className="not-italic text-brand-500">{p}</em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function Label({ n, children, light = false }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${light ? "!text-paper/50" : ""}`}>
      <span className="text-brand-500">{n}</span>
      <span className={`h-px w-8 ${light ? "bg-paper/20" : "bg-ink-900/20"}`} />
      {children}
    </p>
  );
}

export const Arrow = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function Hero({ s }: { s: Settings }) {
  const promises = [1, 2, 3].map((i) => [s[`hero.stat${i}Value`], s[`hero.stat${i}Label`]]).filter(([v]) => v);
  return (
    <section className="relative overflow-hidden border-b border-paper-line">
      <div className="pointer-events-none absolute -left-48 top-24 h-[30rem] w-[30rem] rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
      <div className="container-x relative grid grid-cols-1 items-center gap-20 pb-16 pt-28 sm:pt-32 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-24">
        <div className="min-w-0 lg:col-span-7">
          {s["hero.kicker"] && (
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-ink-500">
              <span className="h-px w-8 bg-brand-500" /> {s["hero.kicker"]}
            </p>
          )}
          <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1] tracking-[-0.035em] text-ink-900 sm:text-6xl lg:text-[4.4rem]">
            <Emph text={s["hero.title"]} />
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-700">{s["hero.subtitle"]}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/contacto" className="btn-signal">
              {s["hero.ctaPrimary"]} <Arrow className="h-4 w-4" />
            </Link>
            <Link href="/#servicios" className="btn-outline">{s["hero.ctaSecondary"]}</Link>
          </div>
          {promises.length > 0 && (
            <dl className="mt-14 grid grid-cols-3 gap-4 border-t border-ink-900/15 pt-8 sm:gap-6">
              {promises.map(([v, l]) => (
                <div key={l} className="min-w-0">
                  <dt className="font-display text-lg font-semibold leading-tight text-ink-900 sm:text-2xl"><CountUp value={v} /></dt>
                  <dd className="mt-1 text-xs leading-snug text-ink-500 sm:text-sm">{l}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="min-w-0 lg:col-span-5">
          <HeroDoor caption={s["hero.caption"]} />
        </div>
      </div>
    </section>
  );
}

export function ServicesList({ services, s }: { services: Service[]; s: Settings }) {
  const featured = services.slice(0, 6);
  const rest = services.slice(6);
  return (
    <section id="servicios" className="scroll-mt-16 py-24">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Label n="01"><TC>{"Servicios"}</TC></Label>
            <h2 className="section-title mt-5"><Emph text={s["services.title"]} /></h2>
          </div>
          <div className="self-end lg:col-span-5 lg:col-start-8">
            <p className="text-lg text-ink-700">{s["services.subtitle"]}</p>
          </div>
        </div>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-paper-line bg-paper-line sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((sv) => (
            <li key={sv.id} className="min-w-0">
              <Link href={`/servicios/${sv.slug}`} data-tilt="glow" className="group flex h-full flex-col bg-paper p-7 transition-colors duration-300 hover:bg-white">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:rotate-[-6deg] group-hover:bg-brand-500 group-hover:text-white">
                  <Icon name={sv.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl leading-tight text-ink-900">{sv.title}</h3>
                <p className="mt-2 flex-1 text-ink-500">{sv.shortDescription}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink-900"><TC>{"Ver más "}</TC><Arrow className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-brand-500" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-5 rounded-2xl bg-ink-900 p-6 text-paper sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="font-display text-2xl">
              {rest.length > 0 ? <>Y {rest.length}<TC>{" servicios más para tu negocio"}</TC></> : <><TC>{"Conoce cada servicio en detalle"}</TC></>}
            </p>
            {rest.length > 0 && (
              <p className="mt-2 text-sm text-paper/60">{rest.slice(0, 6).map((r) => r.title).join(" · ")}{rest.length > 6 ? " · …" : ""}</p>
            )}
          </div>
          <Link href="/servicios" className="btn-signal shrink-0 self-start lg:self-auto"><TC>{"Ver todos los servicios "}</TC><Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function CastorlyBlock({ s, product }: { s: Settings; product: Product | null }) {
  const feats = lines(product?.features).slice(0, 6);
  const image = s["castorly.imageUrl"] || product?.imageUrl;
  const mascot = s["castorly.mascotUrl"];
  return (
    <section id="castorly" className="scroll-mt-16 bg-ink-900 py-24 text-paper">
      <div className="container-x grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Label n="02" light>{s["castorly.badge"]}</Label>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl">
            <Emph text={s["castorly.title"]} />
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-paper/70">{s["castorly.text"]}</p>
          {feats.length > 0 && (
            <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {feats.map((f) => (
                <li key={f} className="flex gap-3 py-3 text-[15px] text-paper/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-500" /> {f}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/castorly" className="btn-signal">{s["castorly.cta"]} <Arrow className="h-4 w-4" /></Link>
            {s["castorly.url"] && (
              <a href={s["castorly.url"]} target="_blank" rel="noopener noreferrer" className="btn-ghost text-paper">
                {s["castorly.urlLabel"] || "Abrir la app"} ↗
              </a>
            )}
          </div>
        </div>
        <div className="relative lg:col-span-7">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="Castorly por dentro" className="w-full rounded-xl border border-white/10 shadow-2xl shadow-black/40" />
          ) : (
            <DeskMock />
          )}
          {mascot && (
            <figure className="pointer-events-none absolute -bottom-10 -left-4 w-28 sm:-left-10 sm:w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mascot} alt={s["castorly.mascotName"] || "Mascota de Castorly"} className="w-full drop-shadow-2xl" />
            </figure>
          )}
        </div>
      </div>
      <CastorlyGallery value={s["castorly.gallery"]} />
    </section>
  );
}

/** Lee la galería del panel: una imagen por línea, con descripción opcional tras "|". */
export function parseGallery(value?: string) {
  return lines(value).map((l) => {
    const [src, ...rest] = l.split("|");
    return { src: src.trim(), caption: rest.join("|").trim() };
  }).filter((g) => g.src);
}

export function CastorlyGallery({ value, tone = "dark" }: { value?: string; tone?: "dark" | "light" | "castorly" }) {
  const items = parseGallery(value);
  if (!items.length) return null;
  return (
    <div className="container-x mt-20">
      <div className="mx-auto max-w-5xl">
        <Carousel slides={items} tone={tone} label="Capturas de Castorly" />
      </div>
    </div>
  );
}

/** Maqueta sencilla de la pantalla de tickets (se reemplaza subiendo una captura en el panel). */
function DeskMock() {
  const rows = [
    ["#4821", "No puedo conectarme a la VPN", "En curso", true],
    ["#4820", "Restablecer contraseña de correo", "Resuelto", false],
    ["#4818", "Impresora del piso 3 sin conexión", "Nuevo", false],
    ["#4815", "Acceso a carpeta compartida", "Resuelto", false],
  ] as const;
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1d1915] text-sm shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-semibold text-paper"><TC>{"Castorly"}</TC></span>
        <span className="font-mono text-xs text-paper/40"><TC>{"Service Desk · Turno mañana"}</TC></span>
      </div>
      <div className="grid sm:grid-cols-[1fr_14rem]">
        <ul className="divide-y divide-white/5">
          {rows.map(([id, t, st, active]) => (
            <li key={id} className={`flex items-center gap-3 px-4 py-3.5 ${active ? "bg-white/[0.04]" : ""}`}>
              <span className="font-mono text-xs text-paper/40">{id}</span>
              <span className="flex-1 truncate text-paper/85">{t}</span>
              <span className={`rounded px-2 py-0.5 text-[11px] ${st === "En curso" ? "bg-brand-500/20 text-brand-300" : st === "Nuevo" ? "bg-white/10 text-paper/70" : "text-paper/40"}`}>{st}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 p-4 sm:border-l sm:border-t-0">
          <p className="font-mono text-[11px] uppercase tracking-wider text-brand-400"><TC>{"Cástor"}</TC></p>
          <p className="mt-2 leading-relaxed text-paper/80"><TC>{"Encontré el artículo «Reinstalar el cliente VPN». ¿Quieres que guíe la llamada paso a paso?"}</TC></p>
          <div className="mt-4 flex gap-2">
            <span className="rounded bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white"><TC>{"Sí, guíame"}</TC></span>
            <span className="rounded border border-white/15 px-2.5 py-1 text-xs text-paper/70"><TC>{"Ver artículo"}</TC></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductsList({ products, s }: { products: Product[]; s: Settings }) {
  const others = products.filter((p) => p.slug !== "castorly");
  if (!others.length) return null;
  return (
    <section id="productos" className="scroll-mt-16 border-b border-paper-line py-24">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Label n="03"><TC>{"Productos"}</TC></Label>
          <h2 className="section-title mt-5"><Emph text={s["products.title"]} /></h2>
          <p className="mt-5 text-ink-700">{s["products.subtitle"]}</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-xl border border-paper-line bg-paper-line sm:grid-cols-2 lg:col-span-8">
          {others.map((p) => (
            <Link key={p.id} href={`/productos/${p.slug}`} data-tilt="glow" className="group flex flex-col bg-paper p-7 transition-colors hover:bg-white">
              <h3 className="font-display text-2xl text-ink-900">{p.name}</h3>
              <p className="mt-2 flex-1 text-ink-500">{p.tagline}</p>
              {p.price && <p className="mt-6 text-sm font-semibold text-ink-900">{p.price}</p>}
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-ink-700 group-hover:text-brand-600"><TC>{"Ver detalles "}</TC><Arrow className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Process({ s }: { s: Settings }) {
  const steps = lines(s["process.steps"]).map((l) => {
    const [t, ...d] = l.split("|");
    return { title: t.trim(), text: d.join("|").trim() };
  });
  if (!steps.length) return null;
  return (
    <section className="py-24">
      <div className="container-x">
        <Label n="04"><TC>{"Cómo trabajamos"}</TC></Label>
        <h2 className="section-title mt-5 max-w-2xl"><Emph text={s["process.title"]} /></h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((st, i) => (
            <li key={i} className="border-t border-ink-900 pt-5">
              <span className="font-mono text-xs text-brand-500"><TC>{"Paso "}</TC>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 font-display text-2xl text-ink-900">{st.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-500">{st.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Plans({ plans, s }: { plans: Plan[]; s: Settings }) {
  if (!plans.length) return null;
  return (
    <section id="planes" className="scroll-mt-16 bg-paper-2 py-24">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Label n="05"><TC>{"Planes"}</TC></Label>
            <h2 className="section-title mt-5"><Emph text={s["plans.title"]} /></h2>
          </div>
          <p className="self-end text-ink-700 lg:col-span-5 lg:col-start-8">{s["plans.subtitle"]}</p>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.map((p) => {
            const hl = p.highlighted;
            return (
              <div key={p.id} data-tilt="tilt" className={`flex flex-col rounded-xl p-8 ${hl ? "bg-ink-900 text-paper" : "border border-paper-line bg-paper"}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-2xl">{p.name}</h3>
                  {hl && <span className="font-mono text-[11px] uppercase tracking-wider text-brand-400"><TC>{"El más elegido"}</TC></span>}
                </div>
                <p className={`mt-1 text-sm ${hl ? "text-paper/60" : "text-ink-500"}`}>{p.description}</p>
                <p className="mt-8 font-display text-5xl tracking-tight">{p.price}</p>
                {p.period && <p className={`mt-1 text-sm ${hl ? "text-paper/50" : "text-ink-400"}`}>{p.period}</p>}
                <ul className={`mt-8 flex-1 divide-y border-t text-[15px] ${hl ? "divide-white/10 border-white/10" : "divide-paper-line border-paper-line"}`}>
                  {lines(p.features).map((f) => (
                    <li key={f} className="py-2.5">{f}</li>
                  ))}
                </ul>
                <Link
                  href={`/contacto?servicio=${encodeURIComponent("Plan " + p.name)}`}
                  className={`mt-8 ${hl ? "btn-signal" : "btn-outline"}`}
                ><TC>{"Elegir "}</TC>{p.name}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Testimonials({ items, s }: { items: Testimonial[]; s: Settings }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  const who = (t: Testimonial) => [t.role, t.company].filter(Boolean).join(", ");
  return (
    <section className="py-24">
      <div className="container-x">
        <Label n="06">{s["testimonials.title"]}</Label>
        <figure className="mt-10 max-w-4xl">
          <blockquote className="font-display text-3xl leading-snug text-ink-900 sm:text-4xl">“{first.quote}”</blockquote>
          <figcaption className="mt-6 text-ink-500">
            <span className="font-semibold text-ink-900">{first.name}</span> · {who(first)}
          </figcaption>
        </figure>
        {rest.length > 0 && (
          <div className="mt-16 grid gap-10 border-t border-paper-line pt-10 md:grid-cols-2">
            {rest.map((t) => (
              <figure key={t.id}>
                <blockquote className="text-lg leading-relaxed text-ink-700">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-sm text-ink-500">
                  <span className="font-semibold text-ink-900">{t.name}</span> · {who(t)}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function FaqList({ items, s }: { items: Faq[]; s: Settings }) {
  if (!items.length) return null;
  return (
    <section id="faq" className="scroll-mt-16 border-t border-paper-line py-24">
      <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Label n="07"><TC>{"Preguntas"}</TC></Label>
          <h2 className="section-title mt-5"><Emph text={s["faq.title"]} /></h2>
        </div>
        <div className="border-t border-ink-900 lg:col-span-8">
          {items.map((f) => (
            <details key={f.id} className="group border-b border-paper-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-medium text-ink-900">
                {f.question}
                <span className="font-mono text-xl text-ink-400 transition group-open:rotate-45 group-open:text-brand-500">+</span>
              </summary>
              <p className="-mt-2 max-w-2xl whitespace-pre-line pb-6 leading-relaxed text-ink-500">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Franja de la portada que presenta a Aldo y lleva a /nosotros. */
export function AldoBand({ s }: { s: Settings }) {
  return (
    <section className="relative overflow-hidden bg-ink-900 py-20 text-paper">
      <AldoFlyBy top="14%" size={48} every={19} delay={3} onDark />
      <div className="container-x relative grid items-center gap-10 lg:grid-cols-12">
        <div className="flex justify-center gap-2 lg:col-span-5 lg:justify-start">
          {(["wave", "think", "cheer"] as const).map((pose, i) => (
            <div key={pose} className={`aldo-hover ${i === 1 ? "-translate-y-4" : ""}`}>
              <Aldo pose={pose} onDark className="h-24 w-24 sm:h-32 sm:w-32" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-7">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-400"><TC>{"Nuestra mascota"}</TC></p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl"><Emph text={s["aldo.title"]} /></h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-paper/70">{s["aldo.text"]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/nosotros#aldo" className="btn-signal"><TC>{"Conoce a Aldo "}</TC><Arrow className="h-4 w-4" /></Link>
            <Link href="/nosotros" className="btn-ghost text-paper"><TC>{"Quiénes somos"}</TC></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
