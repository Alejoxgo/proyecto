"use client";
import { useEffect } from "react";

/** Mueve la luz y la inclinación de las tarjetas con data-tilt según la posición del mouse. */
export default function TiltCards() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last: HTMLElement | null = null;
    const reset = (el: HTMLElement) => { el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (last && last !== el) reset(last);
      last = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      if (el.dataset.tilt === "tilt") {
        el.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
        el.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
      }
    };
    const onLeave = () => { if (last) reset(last); last = null; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); };
  }, []);
  return null;
}
