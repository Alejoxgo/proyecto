"use client";
import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }, () => {})}
      className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-ink-700 transition hover:border-ink-900"
    >
      {ok ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
