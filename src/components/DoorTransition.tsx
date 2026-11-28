"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Transición suave al navegar desde el menú (enlaces con data-door): una barrita naranja corre
 * bajo el menú con una puertita en la punta y, al llegar, la página nueva entra abriéndose
 * con la forma del arco de Aldore. No tapa la pantalla. Respeta prefers-reduced-motion.
 */
export default function DoorTransition() {
  const pathname = usePathname();
  const [bar, setBar] = useState<"idle" | "run" | "done">("idle");
  const from = useRef<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[data-door]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      from.current = location.pathname;
      setBar("run");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (from.current === null || pathname === from.current) return;
    from.current = null;
    setBar("done");
    const main = document.querySelector("main");
    if (main) {
      main.classList.remove("door-reveal");
      void main.offsetWidth;
      main.classList.add("door-reveal");
    }
    const t = setTimeout(() => setBar("idle"), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  // Si la navegación no llega, la barra se quita sola.
  useEffect(() => {
    if (bar !== "run") return;
    const t = setTimeout(() => setBar("idle"), 6000);
    return () => clearTimeout(t);
  }, [bar]);

  if (bar === "idle") return null;
  return (
    <div className={`door-bar door-bar-${bar}`} aria-hidden>
      <span className="door-bar-fill">
        <svg viewBox="0 0 40 40" className="door-bar-tip"><path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="#e2471c" /></svg>
      </span>
    </div>
  );
}
