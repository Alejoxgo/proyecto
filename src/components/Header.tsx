"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import type { Lang } from "@/lib/langs";

type NavLink = { label: string; href: string };

/** Botón de ingreso: la puerta de la marca, que se "abre" al pasar el mouse. */
function LoginButton({ label, user, className = "", onClick }: { label: string; user?: string | null; className?: string; onClick?: () => void }) {
  if (user) {
    const first = user.trim().split(/\s+/)[0] || user;
    return (
      <Link
        href="/admin"
        onClick={onClick}
        title="Ir a mi panel"
        className={`group inline-flex items-center gap-2 rounded-full border border-brand-500/50 bg-brand-500/10 py-1.5 pl-1.5 pr-4 text-[14px] font-medium text-paper transition hover:border-brand-500 hover:bg-brand-500/20 ${className}`}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-500 font-display text-[13px] font-semibold uppercase text-white">
          {first.charAt(0)}
        </span>
        <span className="max-w-[9rem] truncate">{first}</span>
        <span className="text-paper/50 transition group-hover:translate-x-0.5 group-hover:text-paper">→</span>
      </Link>
    );
  }
  return (
    <Link
      href="/admin/login"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] py-1.5 pl-2 pr-4 font-mono text-[13px] tracking-wide text-paper/80 transition hover:border-brand-500/70 hover:bg-brand-500/10 hover:text-paper ${className}`}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white/[0.06] transition group-hover:bg-brand-500/20">
        <svg viewBox="0 0 40 40" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="none" stroke="currentColor" strokeWidth={3.5} />
          <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" className="origin-bottom transition-transform duration-300 group-hover:scale-y-110" />
        </svg>
      </span>
      {label}
    </Link>
  );
}

export default function Header({ name, links, cta, ctaUrl, login, user = null, lang = "es", langs = ["es", "en"], decor = null }: { name: string; links: NavLink[]; cta: string; ctaUrl: string; login: string; user?: string | null; lang?: Lang; langs?: Lang[]; decor?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = (usePathname() || "/").replace(/^\/(en|pt)(?=\/|$)/, "") || "/";
  const here = (href: string) => (href !== "/" && (path === href || path.startsWith(href + "/")) ? "page" : undefined);
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/90 text-paper backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" data-door={name} aria-label={`${name}, inicio`}>
          <Logo name={name} light />
        </Link>
        <nav className="hidden items-center gap-6 md:flex xl:gap-8">
          {links.map((n) => (
            <Link key={n.href + n.label} href={n.href} data-door={n.label} aria-current={here(n.href)} className="nav-door text-[15px] text-paper/70 hover:text-paper aria-[current=page]:text-paper">
              {n.label}
            </Link>
          ))}
          <div className="flex items-center gap-3">
            {(login || user) && <LoginButton label={login} user={user} />}
            {cta && (
              <Link href={ctaUrl || "/contacto"} className="btn-signal !py-2">
                {cta}
              </Link>
            )}
          </div>
        </nav>
        <button
          className="rounded-lg p-2 text-paper md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 9h16M4 15h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/10 bg-ink-900 md:hidden">
          <div className="container-x flex flex-col py-3">
            {links.map((n) => (
              <Link key={n.href + n.label} href={n.href} data-door={n.label} onClick={() => setOpen(false)} className="border-b border-white/10 py-3 font-display text-2xl">
                {n.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {cta && (
                <Link href={ctaUrl || "/contacto"} onClick={() => setOpen(false)} className="btn-signal">
                  {cta}
                </Link>
              )}
              {(login || user) && <LoginButton label={login} user={user} onClick={() => setOpen(false)} className="!py-2.5" />}
            </div>
          </div>
        </nav>
      )}
      {decor}
    </header>
  );
}
