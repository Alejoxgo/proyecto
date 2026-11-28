"use client";
import { useState } from "react";
import TC from "@/components/TC";

/** Muestra de color de la página de marca: un toque copia el código HEX. */
export default function BrandSwatch({ name, hex, rgb, role, dark = false, big = false }: { name: string; hex: string; rgb: string; role: string; dark?: boolean; big?: boolean }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setOk(true);
      setTimeout(() => setOk(false), 1400);
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`group flex w-full flex-col justify-between rounded-3xl p-6 text-left ring-1 ring-black/10 transition hover:-translate-y-1 ${big ? "min-h-[15rem]" : "min-h-[11rem]"}`}
      style={{ background: hex, color: dark ? "#f4f1ea" : "#16130f" }}
      aria-label={`Copiar ${hex}`}
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] opacity-70"><TC>{role}</TC></span>
      <span>
        <span className="block font-display text-2xl"><TC>{name}</TC></span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 font-mono text-xs opacity-80">
          <span>{hex}</span>
          <span>RGB {rgb}</span>
          <span className="rounded-full border border-current px-2 py-0.5 text-[10px] opacity-0 transition group-hover:opacity-100">{ok ? <TC>{"¡Copiado!"}</TC> : <TC>{"Copiar"}</TC>}</span>
        </span>
      </span>
    </button>
  );
}
