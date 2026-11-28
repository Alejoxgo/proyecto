"use client";
import { useState, useTransition } from "react";
import { setTheme } from "@/app/admin/site-actions";

type S = { id: string; name: string; colors: string[] };

const DESC: Record<string, string> = {
  navidad: "Luces de colores que titilan bajo el menú, nieve suave y Aldo con gorro y bufanda.",
  anionuevo: "Banderines dorados y morados, confeti y Aldo de fiesta.",
  halloween: "Banderines naranja y morado, arañas que cuelgan, murciélagos y Aldo de brujo.",
  amor: "Corazones colgando, corazones que caen y Aldo enamorado.",
  patria: "Banderines amarillo, azul y rojo, confeti y Aldo con la bandera.",
  madres: "Guirnalda de flores, pétalos que caen y Aldo con corbatín.",
};
const DATES: Record<string, string> = {
  navidad: "1 al 30 de diciembre",
  anionuevo: "31 de diciembre al 6 de enero",
  halloween: "20 al 31 de octubre",
  amor: "Todo septiembre",
  patria: "15 de julio al 8 de agosto",
  madres: "1 al 12 de mayo",
};
const PAGES = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/servicios", label: "Servicios" },
  { href: "/contacto", label: "Contacto" },
];

export default function ThemeStudio({ mode, effects: eff0, live, auto, seasons }: { mode: string; effects: boolean; live: string | null; auto: string | null; seasons: S[] }) {
  const [cur, setCur] = useState(mode);
  const [effects, setEffects] = useState(eff0);
  const [pick, setPick] = useState<string>(live || seasons[0].id);
  const [page, setPage] = useState("/");
  const [device, setDevice] = useState<"desk" | "phone">("desk");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const autoName = auto ? seasons.find((s) => s.id === auto)?.name : null;

  const apply = (m: string, e = effects) =>
    start(async () => {
      const r = await setTheme(m, e);
      if (r.ok) {
        setCur(m);
        setEffects(e);
        setMsg(m === "auto" ? "Listo: la temática cambia sola según la fecha." : m === "ninguna" ? "Listo: el sitio queda sin temática." : `Listo: «${seasons.find((s) => s.id === m)?.name}» ya está activa en el sitio.`);
      }
    });

  const src = `${page}${page.includes("?") ? "&" : "?"}tema=${pick}`;
  const badge = (id: string) => (cur === id ? "Activa" : cur === "auto" && auto === id ? "Activa (automática)" : null);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        {/* Modo */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <p className="text-xs uppercase tracking-wider text-slate-500">Cómo se elige</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button disabled={pending} onClick={() => apply("auto")} className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${cur === "auto" ? "border-brand-500 bg-brand-50/50" : "border-slate-200 hover:border-ink-900"}`}>
              <b className="block text-ink-900">Automático</b>
              <span className="text-xs text-slate-500">{autoName ? `Hoy: ${autoName}` : "Hoy: ninguna"}</span>
            </button>
            <button disabled={pending} onClick={() => apply("ninguna")} className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${cur === "ninguna" ? "border-brand-500 bg-brand-50/50" : "border-slate-200 hover:border-ink-900"}`}>
              <b className="block text-ink-900">Ninguna</b>
              <span className="text-xs text-slate-500">Sitio normal</span>
            </button>
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
            <span>
              <b className="block text-ink-900">Detalles que caen</b>
              <span className="text-xs text-slate-500">Nieve, confeti, corazones…</span>
            </span>
            <input type="checkbox" checked={effects} disabled={pending} onChange={(e) => apply(cur, e.target.checked)} className="h-5 w-5 accent-brand-600" />
          </label>
        </div>

        {/* Temáticas */}
        <ul className="space-y-2">
          {seasons.map((s) => {
            const on = pick === s.id;
            const b = badge(s.id);
            return (
              <li key={s.id}>
                <div className={`rounded-2xl border bg-white p-4 transition ${on ? "border-ink-900 shadow-md" : "border-black/[0.06] hover:border-slate-300"}`}>
                  <button onClick={() => setPick(s.id)} className="flex w-full items-start gap-3 text-left">
                    <span className="mt-0.5 flex shrink-0 -space-x-1.5">
                      {s.colors.slice(0, 3).map((c) => <span key={c} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: c }} />)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <b className="text-ink-900">{s.name}</b>
                        {b && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{b}</span>}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{DESC[s.id]}</span>
                      <span className="mt-1 block font-mono text-[10.5px] uppercase tracking-wider text-slate-400">Automática: {DATES[s.id]}</span>
                    </span>
                  </button>
                  {on && (
                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                      <button disabled={pending || cur === s.id} onClick={() => apply(s.id)} className="btn-primary !py-2 text-sm disabled:opacity-50">
                        {cur === s.id ? "Ya está activa" : "Activar ahora"}
                      </button>
                      <span className="self-center text-xs text-slate-500">Estás viendo la vista previa →</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {msg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{msg}</p>}
      </div>

      {/* Vista previa */}
      <div className="xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,.25)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="flex gap-1.5" aria-hidden><i className="h-3 w-3 rounded-full bg-red-300" /><i className="h-3 w-3 rounded-full bg-amber-300" /><i className="h-3 w-3 rounded-full bg-emerald-300" /></span>
            <div className="ml-2 flex gap-1 text-xs">
              {PAGES.map((p) => (
                <button key={p.href} onClick={() => setPage(p.href)} className={`rounded-md px-2 py-1 ${page === p.href ? "bg-white font-medium text-ink-900 shadow-sm" : "text-slate-500 hover:text-ink-900"}`}>{p.label}</button>
              ))}
            </div>
            <div className="ml-auto flex gap-1 text-xs">
              <button onClick={() => setDevice("desk")} className={`rounded-md px-2 py-1 ${device === "desk" ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>Escritorio</button>
              <button onClick={() => setDevice("phone")} className={`rounded-md px-2 py-1 ${device === "phone" ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>Celular</button>
              <a href={src} target="_blank" className="rounded-md px-2 py-1 text-slate-500 hover:text-ink-900">Abrir ↗</a>
            </div>
          </div>
          <div className="flex justify-center bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_10px,#f1f5f9_10px,#f1f5f9_20px)]">
            <iframe key={src + device} src={src} title="Vista previa de la temática" className="h-[72vh] bg-white transition-all" style={{ width: device === "phone" ? 390 : "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
