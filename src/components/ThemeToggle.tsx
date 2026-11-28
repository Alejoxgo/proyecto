"use client";
import { useEffect, useState } from "react";
import TC from "@/components/TC";

/** Interruptor de modo claro / oscuro en el pie de página. Se recuerda un año en una cookie. */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.classList.toggle("dark", next);
    document.cookie = `nb_theme=${next ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
    setDark(next);
    setTimeout(() => root.classList.remove("theme-switching"), 500);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      className="group inline-flex items-center gap-2.5 rounded-full border border-paper/10 py-1 pl-1 pr-3 text-xs text-paper/60 transition hover:border-paper/30 hover:text-paper"
    >
      <span className={`relative flex h-5 w-9 items-center rounded-full transition-colors ${dark ? "bg-brand-500" : "bg-paper/15"}`}>
        <span className={`absolute grid h-4 w-4 place-items-center rounded-full bg-paper text-[10px] shadow transition-transform duration-300 ${dark ? "translate-x-[18px]" : "translate-x-0.5"}`}>
          {dark ? "☾" : "☀"}
        </span>
      </span>
      <TC>{dark ? "Modo oscuro" : "Modo claro"}</TC>
    </button>
  );
}
