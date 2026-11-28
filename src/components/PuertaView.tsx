"use client";
import { useState } from "react";
import PuertaIcon from "./PuertaIcon";
import { isDark, puertaBg, type PuertaButton } from "@/lib/puerta";

export type PuertaData = {
  name: string;
  subtitle: string;
  logoUrl: string;
  coverUrl?: string;
  color: string;
  bgColor?: string;
  theme: string;
  font?: string;
  buttonStyle?: string;
  buttons: (PuertaButton & { link: string })[];
  wifiName: string;
  wifiPass: string;
};

const FONTS: Record<string, string> = {
  moderna: "font-sans",
  elegante: "font-serif",
  redondeada: "font-castorly",
  tecnica: "font-grotesk",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/** Página de un toque. Se usa en /p/[slug] y como vista previa en el sitio y el panel. */
export default function PuertaView({ data, preview = false }: { data: PuertaData; preview?: boolean }) {
  const [wifiOpen, setWifiOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const bg = puertaBg(data);
  const light = !isDark(bg);
  const c = data.color || "#e2471c";
  const onColor = isDark(c) ? "#ffffff" : "#16130f";
  const style = data.buttonStyle || "tarjeta";
  const font = FONTS[data.font || "moderna"] ?? "font-sans";

  const ink = light ? "#16130f" : "#f7f4ee";
  const card =
    style === "solido"
      ? "border-transparent shadow-sm hover:brightness-105"
      : style === "contorno"
        ? `border-2 bg-transparent ${light ? "hover:bg-black/[0.03]" : "hover:bg-white/[0.05]"}`
        : light
          ? "bg-white border-black/[0.07] shadow-[0_1px_2px_rgba(0,0,0,.05)] hover:border-black/20"
          : "bg-white/[0.05] border-white/10 hover:border-white/25";
  const cardStyle: React.CSSProperties =
    style === "solido" ? { background: c, color: onColor } : style === "contorno" ? { borderColor: c } : {};
  const chipStyle: React.CSSProperties =
    style === "solido" ? { background: isDark(c) ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.1)", color: onColor } : { background: c, color: onColor };
  const muted = light ? "text-black/55" : "text-white/55";
  const subMuted = style === "solido" ? "opacity-80" : muted;
  const panel = light ? "bg-white border-black/[0.07]" : "bg-white/[0.05] border-white/10";

  return (
    <div
      className={`keep-light relative flex min-h-full flex-col items-center overflow-hidden px-5 pb-8 ${data.coverUrl ? "pt-0" : "pt-12"} ${font}`}
      style={{ background: bg, color: ink }}
    >
      {!data.coverUrl && <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: c }} />}
      {data.coverUrl && (
        <div className="relative -mx-5 h-40 w-[calc(100%+2.5rem)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.coverUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(to bottom, transparent, ${bg})` }} />
        </div>
      )}
      <div className={`relative w-full max-w-sm ${data.coverUrl ? "-mt-14" : ""}`}>
        <div className="flex flex-col items-center text-center">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt={data.name} className="h-24 w-24 rounded-full object-cover shadow-xl" style={{ boxShadow: `0 0 0 4px ${bg}, 0 12px 30px -10px rgba(0,0,0,.4)` }} />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-full text-3xl font-semibold shadow-xl" style={{ background: c, color: onColor, boxShadow: `0 0 0 4px ${bg}` }}>
              {initials(data.name)}
            </span>
          )}
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">{data.name}</h1>
          {data.subtitle && <p className={`mt-1 text-sm ${muted}`}>{data.subtitle}</p>}
        </div>

        <ul className="mt-8 space-y-3">
          {data.buttons.map((b, i) => {
            const inner = (
              <>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={chipStyle}>
                  <PuertaIcon name={b.icon} />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold">{b.title}</span>
                  {b.subtitle && <span className={`block truncate text-[13px] ${subMuted}`}>{b.subtitle}</span>}
                </span>
                <span className={subMuted} aria-hidden="true">›</span>
              </>
            );
            const cls = `flex w-full items-center gap-3.5 rounded-2xl border p-3 transition active:scale-[0.98] ${card}`;
            if (b.href === "wifi") {
              return (
                <li key={i}>
                  <button type="button" className={cls} style={cardStyle} onClick={() => setWifiOpen((o) => !o)}>{inner}</button>
                  {wifiOpen && (
                    <div className={`mt-2 rounded-2xl border p-4 text-sm ${panel}`}>
                      <p className={muted}>Red</p>
                      <p className="font-mono font-semibold">{data.wifiName || "—"}</p>
                      <p className={`mt-3 ${muted}`}>Clave</p>
                      <div className="flex items-center justify-between gap-3">
                        <p className="break-all font-mono font-semibold">{data.wifiPass || "Sin clave"}</p>
                        {data.wifiPass && (
                          <button
                            type="button"
                            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                            style={{ background: c, color: onColor }}
                            onClick={() => {
                              navigator.clipboard?.writeText(data.wifiPass).then(() => setCopied(true), () => {});
                            }}
                          >
                            {copied ? "¡Copiada!" : "Copiar"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            }
            return (
              <li key={i}>
                <a href={preview ? undefined : b.link} target={b.link.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className={cls} style={cardStyle}>
                  {inner}
                </a>
              </li>
            );
          })}
        </ul>

        <a href="https://aldore.co/puerta" className={`mt-10 flex items-center justify-center gap-1.5 text-[11px] ${muted} hover:opacity-80`}>
          <svg viewBox="0 0 40 40" className="h-3 w-3" aria-hidden="true">
            <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="currentColor" />
            <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" />
          </svg>
          Puerta by Aldore
        </a>
      </div>
    </div>
  );
}
