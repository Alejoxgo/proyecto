"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Aldo, { type AldoPose } from "@/components/Aldo";
import { aldoAssist, discardDraft, publishDraft, saveDraft } from "@/app/admin/site-actions";

type Field = { key: string; label: string; type: string; help?: string };
type Group = { id: string; title: string; description?: string; fields: Field[] };

/** En qué página del sitio se ve cada texto (por el inicio de su clave). */
const PAGE_OF: [RegExp, string][] = [
  [/^servicesPage\./, "/servicios"],
  [/^blog\./, "/blog"],
  [/^quote\./, "/cotizar"],
  [/^(about\.|aldo\.(?!bubble|greeting|tips))/, "/nosotros"],
  [/^puerta\./, "/puerta"],
  [/^(contact\.|social\.)/, "/contacto"],
  [/^booking\./, "/agendar"],
  [/^brand\./, "/marca"],
];
const pageOf = (key: string) => PAGE_OF.find(([r]) => r.test(key))?.[1] ?? "/";
const PAGES = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/cotizar", label: "Cotizar" },
  { href: "/puerta", label: "Puerta" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
  { href: "/agendar", label: "Agendar" },
  { href: "/marca", label: "Marca" },
];
const DEVICES = { desk: { w: 1280, label: "Escritorio" }, tablet: { w: 820, label: "Tableta" }, phone: { w: 390, label: "Celular" } } as const;
type Device = keyof typeof DEVICES;

const ACTIONS = [
  { id: "mejorar", label: "Mejorar redacción" },
  { id: "corto", label: "Más corto" },
  { id: "vender", label: "Más persuasivo" },
  { id: "ortografia", label: "Corregir ortografía" },
  { id: "ideas", label: "Otra idea" },
];

export default function VisualEditor({ groups, published, draft, aiReady, userName }: { groups: Group[]; published: Record<string, string>; draft: Record<string, string>; aiReady: boolean; userName: string }) {
  const [values, setValues] = useState<Record<string, string>>({ ...published, ...draft });
  const [base, setBase] = useState(published);
  const [pending, setPending] = useState(Object.keys(draft).length);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [open, setOpen] = useState<string>(groups[1]?.id ?? groups[0].id);
  const [focus, setFocus] = useState<string | null>(null);
  const [page, setPage] = useState("/");
  const [device, setDevice] = useState<Device>("desk");
  const [q, setQ] = useState("");
  const [nonce, setNonce] = useState(0);
  const [busy, start] = useTransition();
  const [flash, setFlash] = useState("");

  // Aldo
  const [aldo, setAldo] = useState<{ state: "idle" | "thinking" | "done" | "error"; text: string; key?: string }>({ state: "idle", text: "" });
  const [ask, setAsk] = useState("");

  // Guardado del borrador con espera (no en cada tecla).
  const queue = useRef<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(async () => {
    const batch = queue.current;
    queue.current = {};
    if (!Object.keys(batch).length) return;
    setSaving("saving");
    const r = await saveDraft(batch);
    setPending(r.pending);
    setSaving("saved");
    setNonce((n) => n + 1);
  }, []);
  const change = (key: string, v: string) => {
    setValues((s) => ({ ...s, [key]: v }));
    queue.current[key] = v;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const changed = (k: string) => values[k] !== base[k];
  const onFocus = (k: string) => {
    setFocus(k);
    const p = pageOf(k);
    if (p !== page) setPage(p);
    if (aldo.key !== k) setAldo({ state: "idle", text: "" });
  };

  // Vista previa: el sitio real con el borrador, escalado para que quepa; se conserva el scroll al recargar.
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(900);
  const [boxH, setBoxH] = useState(700);
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => { setBoxW(e.contentRect.width); setBoxH(e.contentRect.height); });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const scroll = useRef(0);
  const reloadKeepScroll = useCallback(() => {
    try { scroll.current = frame.current?.contentWindow?.scrollY ?? 0; } catch {}
    const w = frame.current?.contentWindow;
    if (w) w.location.reload();
  }, []);
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = false; return; }
    reloadKeepScroll();
  }, [nonce, reloadKeepScroll]);
  const onLoad = () => {
    try {
      const w = frame.current?.contentWindow;
      if (w && scroll.current) w.scrollTo(0, scroll.current);
      const path = w?.location.pathname;
      if (path && path !== page && PAGES.some((p) => p.href === path)) setPage(path);
    } catch {}
  };
  const dev = DEVICES[device];
  const scale = Math.min(1, (boxW - 24) / dev.w);
  const src = `${page}?vista=borrador`;

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return groups;
    return groups
      .map((g) => ({ ...g, fields: g.fields.filter((f) => f.label.toLowerCase().includes(t) || (values[f.key] || "").toLowerCase().includes(t)) }))
      .filter((g) => g.fields.length);
  }, [q, groups, values]);

  const runAldo = (mode: string, prompt?: string) => {
    if (!focus) return;
    const k = focus;
    setAldo({ state: "thinking", text: "", key: k });
    start(async () => {
      const r = await aldoAssist({ key: k, value: values[k] || "", mode, prompt });
      setAldo({ state: r.ok ? "done" : "error", text: r.text, key: k });
    });
  };

  const publish = () =>
    start(async () => {
      if (timer.current) clearTimeout(timer.current);
      await flush();
      const r = await publishDraft();
      setBase({ ...values });
      setPending(0);
      setFlash(r.published ? `Publicado: ${r.published} cambio${r.published === 1 ? "" : "s"} ya están en el sitio y se están traduciendo.` : "No había cambios por publicar.");
      setNonce((n) => n + 1);
    });
  const discard = () => {
    if (!confirmDiscard()) return;
    start(async () => {
      if (timer.current) clearTimeout(timer.current);
      queue.current = {};
      await discardDraft();
      setValues({ ...base });
      setPending(0);
      setFlash("Borrador descartado: volviste a lo publicado.");
      setNonce((n) => n + 1);
    });
  };

  const pose: AldoPose = aldo.state === "thinking" ? "think" : aldo.state === "done" ? "happy" : aldo.state === "error" ? "base" : focus ? "code" : "wave";
  const focusField = focus ? groups.flatMap((g) => g.fields).find((f) => f.key === focus) : null;
  const aldoSays =
    aldo.state === "thinking" ? "Déjame pensarlo…" :
    aldo.state === "error" ? aldo.text :
    aldo.state === "done" ? "Mira esta propuesta. Si te gusta, úsala; si no, pídeme otra." :
    focusField ? `Estás editando «${focusField.label}». ¿Te ayudo a mejorarlo?` :
    `Hola${userName ? `, ${userName}` : ""}. Toca cualquier texto y te muestro dónde aparece en el sitio. Si quieres, lo escribo contigo.`;

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-30 flex flex-col bg-[#f6f5f2] lg:left-64 lg:top-0">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] bg-white px-4 py-3">
        <div className="mr-auto min-w-0">
          <h1 className="font-display text-xl text-ink-900">Editor visual</h1>
          <p className="text-xs text-slate-500">
            {saving === "saving" ? "Guardando borrador…" : pending ? `${pending} cambio${pending === 1 ? "" : "s"} sin publicar · solo tú los ves` : "Todo publicado"}
          </p>
        </div>
        <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs md:flex">
          {(Object.keys(DEVICES) as Device[]).map((d) => (
            <button key={d} onClick={() => setDevice(d)} className={`rounded-md px-2.5 py-1 ${device === d ? "bg-white font-medium text-ink-900 shadow-sm" : "text-slate-500 hover:text-ink-900"}`}>{DEVICES[d].label}</button>
          ))}
        </div>
        <a href={src} target="_blank" className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Abrir vista previa ↗</a>
        <button onClick={discard} disabled={busy || !pending} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-ink-900 disabled:opacity-40">Descartar</button>
        <button onClick={publish} disabled={busy || (!pending && saving !== "saving")} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-40">Publicar cambios</button>
      </header>
      {flash && (
        <button onClick={() => setFlash("")} className="bg-emerald-50 px-4 py-2 text-left text-sm font-medium text-emerald-700">{flash} <span className="text-emerald-600/70">· cerrar</span></button>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Columna de edición */}
        <aside className="flex max-h-[50vh] min-h-0 w-full shrink-0 flex-col border-b border-black/[0.06] bg-white md:max-h-none md:w-[380px] md:border-b-0 md:border-r">
          {/* Aldo */}
          <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50/60 to-white p-4">
            <div className="flex items-start gap-3">
              <Aldo pose={pose} follow={false} className="h-14 w-14 shrink-0" title="Aldo" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-ink-800">{aldoSays}</p>
                {aldo.state === "done" && aldo.key === focus && (
                  <div className="mt-2 rounded-xl border border-brand-200 bg-white p-3 text-sm text-ink-900">
                    <p className="whitespace-pre-line">{aldo.text}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => { change(focus!, aldo.text); setAldo({ state: "idle", text: "" }); }} className="rounded-lg bg-ink-900 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600">Usar este texto</button>
                      <button onClick={() => setAldo({ state: "idle", text: "" })} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-ink-900">Descartar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {focus && focusField?.type !== "url" && (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {ACTIONS.map((a) => (
                    <button key={a.id} disabled={!aiReady || busy} onClick={() => runAldo(a.id)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] text-ink-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-40">{a.label}</button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (ask.trim()) { runAldo("libre", ask); setAsk(""); } }} className="flex gap-1.5">
                  <input value={ask} onChange={(e) => setAsk(e.target.value)} disabled={!aiReady} placeholder={aiReady ? "Pídele algo a Aldo: «más cálido», «menciona Medellín»…" : "Aldo necesita la clave de Groq"} className="input !py-1.5 text-[13px]" />
                  <button disabled={!aiReady || busy || !ask.trim()} className="rounded-lg bg-ink-900 px-3 text-xs font-medium text-white disabled:opacity-40">Pedir</button>
                </form>
              </div>
            )}
          </div>

          <div className="border-b border-slate-100 p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar un texto…" className="input !py-2 text-sm" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            {visible.map((g) => {
              const isOpen = q.trim() ? true : open === g.id;
              const nChanged = g.fields.filter((f) => changed(f.key)).length;
              return (
                <section key={g.id} className="border-b border-slate-100">
                  <button onClick={() => setOpen(isOpen && !q ? "" : g.id)} className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50">
                    <span className="flex-1 text-sm font-semibold text-ink-900">{g.title}</span>
                    {nChanged > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{nChanged} sin publicar</span>}
                    <span className={`text-slate-400 transition ${isOpen ? "rotate-90" : ""}`}>›</span>
                  </button>
                  {isOpen && (
                    <div className="space-y-4 px-4 pb-5">
                      {g.description && <p className="text-xs text-slate-500">{g.description}</p>}
                      {g.fields.map((f) => {
                        const v = values[f.key] ?? "";
                        const long = f.type === "textarea" || v.length > 70 || v.includes("\n");
                        const cls = `input text-[13px] ${focus === f.key ? "!border-brand-500 ring-2 ring-brand-500/15" : ""}`;
                        return (
                          <label key={f.key} className="block">
                            <span className="mb-1 flex items-center gap-2 text-[12px] font-medium text-ink-700">
                              <span className="flex-1">{f.label}</span>
                              {changed(f.key) && (
                                <button type="button" onClick={(e) => { e.preventDefault(); change(f.key, base[f.key] ?? ""); }} className="text-[11px] font-normal text-amber-700 hover:underline" title="Volver al texto publicado">deshacer</button>
                              )}
                            </span>
                            {long ? (
                              <textarea value={v} onFocus={() => onFocus(f.key)} onChange={(e) => change(f.key, e.target.value)} rows={Math.min(10, Math.max(3, Math.ceil(v.length / 48) + v.split("\n").length - 1))} className={cls} />
                            ) : (
                              <input value={v} onFocus={() => onFocus(f.key)} onChange={(e) => change(f.key, e.target.value)} className={cls} />
                            )}
                            {f.help && <span className="mt-1 block text-[11px] text-slate-400">{f.help}</span>}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
            <div className="space-y-2 p-4 text-xs text-slate-500">
              <p>¿Buscas otra cosa?</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/tematicas" className="rounded-full border border-slate-200 px-3 py-1 hover:border-ink-900">Temáticas</Link>
                <Link href="/admin/servicios" className="rounded-full border border-slate-200 px-3 py-1 hover:border-ink-900">Servicios</Link>
                <Link href="/admin/blog" className="rounded-full border border-slate-200 px-3 py-1 hover:border-ink-900">Blog</Link>
                <Link href="/admin/idiomas" className="rounded-full border border-slate-200 px-3 py-1 hover:border-ink-900">Idioma del sitio</Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Vista previa */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-black/[0.06] bg-white/70 px-3 py-2 text-xs">
            {PAGES.map((p) => (
              <button key={p.href} onClick={() => setPage(p.href)} className={`shrink-0 rounded-md px-2.5 py-1 ${page === p.href ? "bg-ink-900 font-medium text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p.label}</button>
            ))}
            <span className="ml-auto shrink-0 pl-3 font-mono text-[11px] text-slate-400">{Math.round(scale * 100)}% · {dev.w}px</span>
          </div>
          <div ref={box} className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_1px_1px,#d6d3d1_1px,transparent_0)] [background-size:16px_16px]">
            <div className="absolute left-1/2 top-3 origin-top overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)] ring-1 ring-black/10" style={{ width: dev.w, height: (boxH - 24) / scale, transform: `translateX(-50%) scale(${scale})` }}>
              <iframe ref={frame} key={page + device} src={src} onLoad={onLoad} title="Vista previa del sitio" className="h-full w-full" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function confirmDiscard() {
  return typeof window === "undefined" ? false : window.confirm("¿Descartar todos los cambios sin publicar?");
}
