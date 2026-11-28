import TC from "@/components/TC";
import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { lines, paragraphs } from "@/lib/utils";
import Aldo, { type AldoPose } from "@/components/Aldo";
import AldoFlyBy from "@/components/AldoFlyBy";
import Reveal from "@/components/Reveal";
import { Arrow, Emph } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Quiénes somos, nuestra misión, visión y valores. Conoce a Aldore, estudio de software en Medellín, y a Aldo, nuestro búho.",
  alternates: { canonical: "/nosotros" },
};

const split = (v: string) => lines(v).map((l) => l.split("|").map((x) => x.trim()));

const POSES: { pose: AldoPose; label: string }[] = [
  { pose: "wave", label: "Saluda" },
  { pose: "fly", label: "Vuela" },
  { pose: "think", label: "Piensa" },
  { pose: "code", label: "Programa" },
  { pose: "cheer", label: "Celebra" },
  { pose: "happy", label: "Sonríe" },
];

export default async function AboutPage() {
  const s = await getSettings();
  const stats = split(s["about.stats"]).filter(([v]) => v);
  const values = split(s["about.values"]).filter(([t]) => t);
  const team = split(s["about.team"]).filter(([n]) => n);
  const facts = split(s["aldo.facts"]).filter(([t]) => t);
  const story = paragraphs(s["about.story"]);

  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden border-b border-paper-line">
        <div className="pointer-events-none absolute -left-40 top-10 h-[28rem] w-[28rem] rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
        <AldoFlyBy top="18%" size={56} every={22} delay={6} />
        <div className="container-x relative grid items-center gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-12 lg:pb-24">
          <div className="lg:col-span-7">
            {s["about.kicker"] && (
              <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-brand-600">
                <span className="h-px w-8 bg-brand-500" /> {s["about.kicker"]}
              </p>
            )}
            <h1 className="mt-6 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              <Emph text={s["about.title"]} />
            </h1>
            <p className="mt-7 max-w-2xl text-xl leading-relaxed text-ink-700">{s["about.text"]}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#mision" className="btn-primary"><TC>{"Misión y visión"}</TC></a>
              <a href="#aldo" className="btn-outline"><TC>{"Conoce a Aldo"}</TC></a>
            </div>
          </div>
          <div className="relative hidden justify-center lg:col-span-5 lg:flex">
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-brand-500/25 via-amber-200/30 to-transparent blur-2xl" aria-hidden />
            <div className="relative grid h-80 w-80 place-items-center rounded-full border border-paper-line bg-white/50 backdrop-blur">
              <Aldo pose="cheer" className="h-56 w-56" />
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="container-x relative pb-14">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-paper-line bg-paper-line md:grid-cols-4">
              {stats.map(([v, l], i) => (
                <Reveal key={v + i} delay={i * 80} className="bg-paper/95 p-5 sm:p-6">
                  <dt className="font-display text-3xl text-ink-900 sm:text-4xl">{v}</dt>
                  <dd className="mt-1 text-sm leading-snug text-ink-500">{l}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        )}
      </section>

      {/* Historia */}
      {story.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-x grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="font-mono text-sm text-brand-500">01</p>
              <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">{s["about.storyTitle"]}</h2>
            </Reveal>
            <Reveal delay={100} className="space-y-6 text-lg leading-relaxed text-ink-700 lg:col-span-8">
              {story.map((p, i) => (
                <p key={i} className={i === 0 ? "text-2xl leading-snug text-ink-900" : ""}>{p}</p>
              ))}
              {s["about.imageUrl"] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s["about.imageUrl"]} alt="Equipo de Aldore" className="mt-6 aspect-[16/9] w-full rounded-2xl border border-paper-line object-cover" />
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* Misión y visión */}
      {(s["about.mission"] || s["about.vision"]) && (
        <section id="mision" className="scroll-mt-20 bg-paper-2 py-20 sm:py-24">
          <div className="container-x">
            <Reveal>
              <p className="font-mono text-sm text-brand-500">02</p>
              <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl"><TC>{"Hacia dónde vamos"}</TC></h2>
            </Reveal>
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {s["about.mission"] && (
                <Reveal className="group relative overflow-hidden rounded-3xl bg-ink-900 p-8 text-paper sm:p-10">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl transition duration-700 group-hover:scale-125" aria-hidden />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-400"><TC>{"Misión"}</TC></p>
                      <svg viewBox="0 0 24 24" className="h-7 w-7 text-brand-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>
                    </div>
                    <p className="mt-8 font-display text-2xl leading-snug sm:text-3xl">{s["about.mission"]}</p>
                  </div>
                </Reveal>
              )}
              {s["about.vision"] && (
                <Reveal delay={120} className="group relative overflow-hidden rounded-3xl bg-brand-500 p-8 text-white sm:p-10">
                  <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-300/40 blur-3xl transition duration-700 group-hover:scale-125" aria-hidden />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/80"><TC>{"Visión"}</TC></p>
                      <svg viewBox="0 0 24 24" className="h-7 w-7 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                    <p className="mt-8 font-display text-2xl leading-snug sm:text-3xl">{s["about.vision"]}</p>
                  </div>
                </Reveal>
              )}
            </div>

            {values.length > 0 && (
              <>
                <h3 className="mt-16 font-mono text-xs uppercase tracking-[0.2em] text-ink-500"><TC>{"Lo que nos guía"}</TC></h3>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {values.map(([t, d], i) => (
                    <Reveal as="li" key={t} delay={i * 80} className="rounded-2xl border border-paper-line bg-white p-6 transition hover:-translate-y-1 hover:border-ink-900">
                      <span className="font-mono text-xs text-brand-500">{String(i + 1).padStart(2, "0")}</span>
                      <p className="mt-3 font-display text-xl text-ink-900">{t}</p>
                      {d && <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{d}</p>}
                    </Reveal>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {/* Equipo */}
      {team.length > 0 && (
        <section className="py-20 sm:py-24">
          <div className="container-x">
            <p className="font-mono text-sm text-brand-500">03</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl"><TC>{"El equipo"}</TC></h2>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.map(([name, role, photo], i) => (
                <Reveal as="li" key={name} delay={i * 80} className="rounded-2xl border border-paper-line bg-white p-5">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={name} className="aspect-square w-full rounded-xl object-cover" />
                  ) : (
                    <div className="grid aspect-square w-full place-items-center rounded-xl bg-paper-2 font-display text-5xl text-ink-400">
                      {name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                  )}
                  <p className="mt-4 font-display text-xl text-ink-900">{name}</p>
                  {role && <p className="text-sm text-ink-500">{role}</p>}
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Aldo */}
      <section id="aldo" className="relative scroll-mt-16 overflow-hidden bg-ink-900 py-20 text-paper sm:py-28">
        <AldoFlyBy top="8%" size={64} every={16} delay={1} onDark />
        <AldoFlyBy top="70%" size={44} every={20} delay={9} reverse onDark />
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-400"><TC>{"Nuestra mascota"}</TC></p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] sm:text-6xl">
              <Emph text={s["aldo.title"]} />
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">{s["aldo.text"]}</p>
            {facts.length > 0 && (
              <dl className="mt-10 grid gap-4 sm:grid-cols-2">
                {facts.map(([t, d]) => (
                  <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <dt className="font-mono text-xs uppercase tracking-wider text-brand-400">{t}</dt>
                    <dd className="mt-2 text-[15px] leading-relaxed text-paper/80">{d}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Reveal>
          <Reveal delay={120} className="lg:col-span-6">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {POSES.map(({ pose, label }) => (
                <li key={pose} className="aldo-hover group flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 pb-4 pt-5 transition hover:-translate-y-1 hover:border-brand-500/60 hover:bg-white/[0.07]">
                  <Aldo pose={pose} onDark className="h-24 w-24 sm:h-28 sm:w-28" title={`Aldo ${label.toLowerCase()}`} />
                  <span className="mt-2 font-mono text-xs uppercase tracking-wider text-paper/60 group-hover:text-paper"><TC>{label}</TC></span>
                </li>
              ))}
            </ul>
            {s["aldo.quote"] && (
              <blockquote className="mt-6 rounded-2xl bg-brand-500 p-6 font-display text-xl leading-snug text-white sm:text-2xl">
                “{s["aldo.quote"]}”
                <span className="mt-2 block font-mono text-xs uppercase tracking-wider text-white/70"><TC>{"— Aldo"}</TC></span>
              </blockquote>
            )}
          </Reveal>
        </div>
      </section>

      {/* Cierre */}
      <section className="py-20 sm:py-24">
        <Reveal className="container-x">
          <div className="relative overflow-hidden rounded-[2rem] border border-paper-line bg-white p-8 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
            <div className="relative grid items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl"><Emph text={s["about.ctaTitle"]} /></h2>
                <p className="mt-4 max-w-2xl text-lg text-ink-700">{s["about.ctaText"]}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/contacto" className="btn-signal"><TC>{"Hablemos "}</TC><Arrow className="h-4 w-4" /></Link>
                  <Link href="/cotizar" className="btn-outline"><TC>{"Cotizar en línea"}</TC></Link>
                </div>
              </div>
              <div className="hidden justify-end lg:col-span-4 lg:flex">
                <Aldo pose="wave" className="h-44 w-44" />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
