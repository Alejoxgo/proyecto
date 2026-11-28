import TC from "@/components/TC";
import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { lines } from "@/lib/utils";
import { Emph } from "@/components/Sections";
import ContactForm from "@/components/ContactForm";
import { PuertaPhone, PuertaShowcase, parsePlans } from "@/components/PuertaSections";

export const metadata: Metadata = {
  title: "Puerta: tu negocio a un toque (QR y NFC)",
  description: "Páginas de un toque para restaurantes, tiendas y consultorios: carta, reseñas, WhatsApp, WiFi y pagos con un QR o un sticker NFC.",
};

export default async function PuertaLanding() {
  const s = await getSettings();
  const steps = lines(s["puerta.steps"]).map((l) => {
    const [t, ...r] = l.split("|");
    return { t: t.trim(), d: r.join("|").trim() };
  });
  const plans = parsePlans(s["puerta.plans"]);
  const uses = lines(s["puerta.uses"]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-900 text-paper">
        <div className="tech-grid pointer-events-none absolute inset-0" />
        <div className="container-x relative grid grid-cols-1 items-center gap-14 py-16 sm:py-24 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-brand-400">{s["puerta.badge"]}</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] sm:text-6xl"><Emph text={s["puerta.title"]} /></h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper/70">{s["puerta.text"]}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#pedir" className="btn-signal">{s["puerta.cta"]} →</a>
              {s["puerta.demo"] && <a href={s["puerta.demo"]} target="_blank" className="btn-ghost text-paper"><TC>{"Ver demo en vivo ↗"}</TC></a>}
            </div>
          </div>
          <div className="lg:col-span-6">
            <PuertaPhone />
          </div>
        </div>
      </section>

      <PuertaShowcase />

      {steps.length > 0 && (
        <section className="border-b border-paper-line py-20">
          <div className="container-x">
            <p className="eyebrow"><TC>{"Cómo funciona"}</TC></p>
            <ol className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-paper-line bg-paper-line md:grid-cols-3">
              {steps.map((st, i) => (
                <li key={st.t} className="bg-paper p-7">
                  <span className="font-mono text-sm text-brand-600">0{i + 1}</span>
                  <h3 className="mt-3 font-display text-2xl text-ink-900">{st.t}</h3>
                  <p className="mt-2 text-ink-700">{st.d}</p>
                </li>
              ))}
            </ol>
            {uses.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2">
                <span className="eyebrow mr-2"><TC>{"Ideal para"}</TC></span>
                {uses.map((u) => <span key={u} className="rounded-full border border-paper-line bg-white px-3 py-1 text-sm text-ink-700">{u}</span>)}
              </div>
            )}
          </div>
        </section>
      )}

      {plans.length > 0 && (
        <section id="planes" className="scroll-mt-16 border-b border-paper-line py-20">
          <div className="container-x">
            <p className="eyebrow"><TC>{"Planes"}</TC></p>
            <h2 className="section-title mt-4"><TC>{"Elige cómo abrir tu "}</TC><span className="text-brand-500"><TC>{"Puerta"}</TC></span></h2>
            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {plans.map((p, i) => (
                <div key={p.name} className={`flex min-w-0 flex-col rounded-2xl border p-7 ${i === 1 ? "border-ink-900 bg-ink-900 text-paper" : "border-paper-line bg-white"}`}>
                  <h3 className="font-display text-2xl">{p.name}</h3>
                  <p className="mt-4 font-display text-3xl">{p.price}</p>
                  {p.note && <p className={`text-sm ${i === 1 ? "text-paper/60" : "text-ink-500"}`}>{p.note}</p>}
                  <ul className="mt-6 flex-1 space-y-2 text-[15px]">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-500" />{f}</li>
                    ))}
                  </ul>
                  <a href="#pedir" className={`mt-8 ${i === 1 ? "btn-signal" : "btn-outline"}`}>{s["puerta.cta"]}</a>
                </div>
              ))}
            </div>
            {s["puerta.plansNote"] && <p className="mt-6 text-center font-mono text-sm text-ink-500">{s["puerta.plansNote"]}</p>}
          </div>
        </section>
      )}

      <section id="pedir" className="scroll-mt-16 bg-white/50 py-20">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow"><TC>{"Pídela"}</TC></p>
            <h2 className="section-title mt-4"><TC>{"Cuéntanos de tu negocio"}</TC></h2>
            <p className="mt-5 text-lg text-ink-700"><TC>{"Te enviamos una propuesta de tu Puerta en menos de 48 horas. ¿Dudas? "}</TC><Link href="/contacto" className="link-u"><TC>{"Escríbenos"}</TC></Link>.</p>
          </div>
          <div className="lg:col-span-7">
            <ContactForm services={["Puerta (QR / NFC)", ...plans.map((p) => `Puerta – plan ${p.name}`)]} defaultService="Puerta (QR / NFC)" />
          </div>
        </div>
      </section>
    </>
  );
}
