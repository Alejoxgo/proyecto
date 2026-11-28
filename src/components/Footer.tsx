import TC from "@/components/TC";
import LangFooter from "@/components/LangFooter";
import ThemeToggle from "@/components/ThemeToggle";
import type { Lang } from "@/lib/langs";
import Link from "next/link";
import Logo from "./Logo";
import type { Settings } from "@/lib/settings";
import { isExternal, linkList } from "@/lib/utils";
import { SERVICE_GROUPS } from "@/lib/service-groups";

export default function Footer({ s, services, lang = "es", langs = [] }: { s: Settings; services: { slug: string; title: string }[]; lang?: Lang; langs?: Lang[] }) {
  const socials = [
    ["Instagram", s["social.instagram"]],
    ["LinkedIn", s["social.linkedin"]],
    ["Facebook", s["social.facebook"]],
    ["X", s["social.x"]],
  ].filter(([, url]) => url);
  return (
    <footer className="bg-ink-900 text-paper/70">
      <div className="container-x py-16">
        <p className="max-w-3xl font-display text-3xl leading-tight text-paper sm:text-4xl">
          {s["footer.cta"]}{" "}
          {s["footer.ctaLink"] && (
            <>
              <Link href={s["footer.ctaUrl"] || "/contacto"} className="text-brand-400 underline decoration-1 underline-offset-[6px] hover:text-brand-300">
                {s["footer.ctaLink"]}
              </Link>
              .
            </>
          )}
        </p>
        <div className="mt-14 grid gap-10 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo name={s["site.name"]} light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">{s["footer.text"]}</p>
            {socials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                {socials.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-paper">
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {/* Los servicios van por áreas (hay muchos); cada área lleva a su parte de /servicios. */}
          <div className="lg:col-span-3">
            <h3 className="eyebrow !text-paper/50">{s["footer.servicesTitle"]}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {SERVICE_GROUPS.map((g) => {
                const n = g.slugs.filter((slug) => services.some((sv) => sv.slug === slug)).length;
                if (!n) return null;
                return (
                  <li key={g.id}>
                    <Link href={`/servicios#${g.id}`} className="group flex items-baseline justify-between gap-3 hover:text-paper">
                      <span><TC>{g.title.replace(/\*/g, "")}</TC></span>
                      <span className="font-mono text-[11px] text-paper/35 group-hover:text-brand-400">{n}</span>
                    </Link>
                  </li>
                );
              })}
              <li className="pt-1">
                <Link href="/servicios" className="text-brand-400 hover:text-brand-300"><TC>{"Ver todos los servicios →"}</TC></Link>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h3 className="eyebrow !text-paper/50"><TC>{"Aldore"}</TC></h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ["Nosotros", "/nosotros"],
                ["Castorly", "/castorly"],
                ["Puerta", "/puerta"],
                ["Blog", "/blog"],
                ["Cotizar en línea", "/cotizar"],
                ["Marca", "/marca"],
              ].map(([label, href]) => (
                <li key={href}><Link href={href} className="hover:text-paper"><TC>{label}</TC></Link></li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-3">
            <h3 className="eyebrow !text-paper/50">{s["footer.contactTitle"]}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {s["contact.email"] && <li><a href={`mailto:${s["contact.email"]}`} className="hover:text-paper">{s["contact.email"]}</a></li>}
              {s["contact.phone"] && <li>{s["contact.phone"]}</li>}
              {s["contact.address"] && <li>{s["contact.address"]}</li>}
              {s["contact.hours"] && <li>{s["contact.hours"]}</li>}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-paper/10 pt-6">
          <LangFooter lang={lang} langs={langs} />
          <ThemeToggle />
        </div>
        <div className={`mt-6 flex flex-col justify-between gap-2 text-xs text-paper/40 sm:flex-row`}>
          <p>© {new Date().getFullYear()} {s["site.name"]}{s["footer.copyright"] ? ` · ${s["footer.copyright"]}` : ""}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {linkList(s["footer.links"]).map((l) =>
              isExternal(l.href) ? (
                <a key={l.href + l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-paper">{l.label}</a>
              ) : (
                <Link key={l.href + l.label} href={l.href} className="hover:text-paper">{l.label}</Link>
              ),
            )}
            <span>{s["site.tagline"]}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
