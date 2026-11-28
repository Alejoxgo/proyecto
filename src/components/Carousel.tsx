"use client";

import TC from "@/components/TC";
import { useCallback, useEffect, useRef, useState } from "react";

export type Slide = { src: string; caption?: string };

/**
 * Carrusel de capturas: desliza con el dedo, flechas, puntos y avance automático
 * (se pausa al pasar el mouse, al tocar o si el visitante prefiere menos movimiento).
 */
export default function Carousel({
  slides,
  tone = "dark",
  interval = 5000,
  label = "Capturas",
}: {
  slides: Slide[];
  tone?: "dark" | "light" | "castorly";
  interval?: number;
  label?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const n = slides.length;

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el || !n) return;
      const next = ((i % n) + n) % n;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    },
    [n],
  );

  // Sincroniza el punto activo con el desplazamiento real (también al deslizar con el dedo).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (paused || zoom !== null || n < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), interval);
    return () => clearTimeout(t);
  }, [index, paused, zoom, n, interval, go]);

  useEffect(() => {
    if (zoom === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(null);
      if (e.key === "ArrowRight") setZoom((z) => (z === null ? z : (z + 1) % n));
      if (e.key === "ArrowLeft") setZoom((z) => (z === null ? z : (z - 1 + n) % n));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom, n]);

  if (!n) return null;

  const styles = {
    dark: { frame: "border-white/10 bg-white/5", cap: "text-paper/60", btn: "bg-ink-900/75 text-paper ring-1 ring-white/20 hover:bg-ink-900", dot: "bg-paper", dotOff: "bg-paper/25" },
    light: { frame: "border-paper-line bg-white", cap: "text-ink-500", btn: "bg-white/90 text-ink-900 shadow ring-1 ring-ink-900/10 hover:bg-white", dot: "bg-ink-900", dotOff: "bg-ink-900/20" },
    castorly: { frame: "border-white/15 bg-white/5 shadow-2xl shadow-[#050a2e]/60", cap: "text-[#c9d3ff]", btn: "bg-[#0D1A4A]/75 text-white ring-1 ring-white/25 hover:bg-[#0D1A4A]", dot: "bg-[#6FE3FF]", dotOff: "bg-white/25" },
  }[tone];

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((g, i) => (
          <figure
            key={g.src + i}
            className="w-full shrink-0 snap-center px-0.5"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${n}`}
          >
            <button
              type="button"
              onClick={() => setZoom(i)}
              aria-label={`Ampliar: ${g.caption || label}`}
              className="group relative block w-full cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={g.src}
                alt={g.caption || label}
                loading={i === 0 ? "eager" : "lazy"}
                className={`aspect-[16/9] w-full rounded-2xl border object-cover object-top transition group-hover:brightness-105 ${styles.frame}`}
              />
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5M11 8v6M8 11h6" /></svg><TC>{"Ampliar"}</TC></span>
            </button>
            {g.caption && <figcaption className={`mt-4 text-center text-sm sm:text-base ${styles.cap}`}>{g.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Anterior"
            className={`absolute left-3 top-[calc(50%-1.5rem)] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full backdrop-blur transition sm:grid ${styles.btn}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Siguiente"
            className={`absolute right-3 top-[calc(50%-1.5rem)] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full backdrop-blur transition sm:grid ${styles.btn}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className="mt-5 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir a la captura ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? `w-7 ${styles.dot}` : `w-2 ${styles.dotOff}`}`}
              />
            ))}
          </div>
        </>
      )}
      {zoom !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={slides[zoom].caption || label}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-8"
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Cerrar"
            autoFocus
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[zoom].src}
            alt={slides[zoom].caption || label}
            className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-4 flex items-center gap-4 text-white" onClick={(e) => e.stopPropagation()}>
            {n > 1 && (
              <button type="button" aria-label="Anterior" onClick={() => setZoom((zoom - 1 + n) % n)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/20">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
            )}
            <p className="max-w-[60vw] text-center text-sm text-white/80">
              {slides[zoom].caption} <span className="ml-2 text-white/50">{zoom + 1} / {n}</span>
            </p>
            {n > 1 && (
              <button type="button" aria-label="Siguiente" onClick={() => setZoom((zoom + 1) % n)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/20">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
