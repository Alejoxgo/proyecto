"use client";
import TC from "@/components/TC";
import { useEffect, useState } from "react";

type Line = { kind: "cmd" | "ok" | "info"; text: string };

/** Terminal decorativa que "escribe" comandos en bucle. Respeta prefers-reduced-motion. */
export default function Terminal({ script }: { script: Line[] }) {
  const [shown, setShown] = useState(0); // líneas completas
  const [chars, setChars] = useState(0); // caracteres de la línea en curso
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStill(true);
  }, []);

  useEffect(() => {
    if (still) return;
    if (shown >= script.length) {
      const t = setTimeout(() => { setShown(0); setChars(0); }, 4000);
      return () => clearTimeout(t);
    }
    const line = script[shown];
    if (line.kind !== "cmd") {
      const t = setTimeout(() => { setShown((s) => s + 1); setChars(0); }, 380);
      return () => clearTimeout(t);
    }
    if (chars < line.text.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 28 + Math.random() * 40);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setShown((s) => s + 1); setChars(0); }, 500);
    return () => clearTimeout(t);
  }, [shown, chars, script, still]);

  const visible = still ? script : script.slice(0, shown);
  const typing = !still && shown < script.length && script[shown].kind === "cmd" ? script[shown].text.slice(0, chars) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e0c0a]/90 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
        <span className="ml-3 font-mono text-xs text-paper/40"><TC>{"~/proyectos/tu-empresa"}</TC></span>
      </div>
      <pre className="min-h-[300px] overflow-x-auto p-5 font-mono text-[13px] leading-7 text-paper/80" aria-label="Ejemplo de flujo de trabajo">
        {visible.map((l, i) => <LineView key={i} l={l} />)}
        {typing !== null && (
          <div>
            <span className="text-brand-400">❯ </span>
            {typing}
            <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-paper/70" />
          </div>
        )}
        {typing === null && !still && <span className="inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-paper/70" />}
      </pre>
    </div>
  );
}

function LineView({ l }: { l: Line }) {
  if (l.kind === "cmd") return <div><span className="text-brand-400">❯ </span>{l.text}</div>;
  if (l.kind === "ok") return <div className="text-emerald-400/90">✓ <span className="text-paper/60">{l.text}</span></div>;
  return <div className="text-paper/45">{l.text}</div>;
}
