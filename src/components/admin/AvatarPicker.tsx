"use client";
import { useRef, useState } from "react";
import { ALDO_AVATARS, AldoAvatar, UserAvatar } from "@/components/AldoAvatar";

/** Elige foto de perfil: uno de los 10 Aldos o una foto propia (se recorta y reduce a 256×256 en el navegador). */
export default function AvatarPicker({ name, value }: { name: string; value: string }) {
  const [v, setV] = useState(value || "aldo-1");
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const onFile = (f?: File) => {
    setErr("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Elige una imagen.");
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      setV(c.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setErr("No pudimos leer esa imagen.");
    img.src = URL.createObjectURL(f);
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name="avatar" value={v} />
      <div className="flex items-center gap-4">
        <UserAvatar avatar={v} name={name} className="h-16 w-16 text-lg" />
        <div className="text-sm">
          <button type="button" onClick={() => file.current?.click()} className="rounded-lg border border-paper-line px-3 py-1.5 font-medium text-ink-900 hover:border-ink-900">
            Subir mi foto
          </button>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <p className="mt-1 text-xs text-slate-500">O elige uno de los Aldos:</p>
          {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {ALDO_AVATARS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setV(a.id)}
            title={a.name}
            aria-label={`Aldo ${a.name}`}
            aria-pressed={v === a.id}
            className={`rounded-full p-0.5 transition ${v === a.id ? "ring-2 ring-brand-500 ring-offset-2" : "hover:scale-105"}`}
          >
            <AldoAvatar id={a.id} className="h-11 w-11" />
          </button>
        ))}
      </div>
    </div>
  );
}
