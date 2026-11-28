"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Cuenta desde 0 hasta el número del texto cuando aparece en pantalla ("48 horas", "14", "+120").
 * Si el texto no empieza con un número, lo muestra tal cual. Respeta prefers-reduced-motion.
 */
export default function CountUp({ value, ms = 1400 }: { value: string | number; ms?: number }) {
  const text = String(value);
  const m = text.match(/^(\D{0,2})(\d[\d.,]*)(.*)$/s);
  const target = m ? Number(m[2].replace(/[.,]/g, "")) : NaN;
  const [n, setN] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!m || !Number.isFinite(target) || target === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    setN(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!m || n === null) return <span ref={ref}>{text}</span>;
  const shown = n === target ? m[2] : n.toLocaleString("es-CO");
  return (
    <span ref={ref} className="tabular-nums">
      {m[1]}{shown}{m[3]}
    </span>
  );
}
