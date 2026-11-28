"use client";
import { celebrate } from "@/lib/celebrate";

import TC, { useTr } from "@/components/TC";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import Aldo from "./Aldo";
import { computeQuote, extrasFor, scopeFor, type QuoteConfig } from "@/lib/quote";
import { money } from "@/lib/format";
import { submitQuote, type QuoteState } from "@/app/actions/quote";

const initial: QuoteState = { ok: false, message: "" };

/** Número que sube o baja suavemente cuando cambia. */
function useTween(target: number, ms = 450) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (target - a) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-paper-line pt-6">
      <legend className="flex items-center gap-3 font-display text-2xl text-ink-900">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-900 font-mono text-sm text-paper">{n}</span>
        <TC>{title}</TC>
      </legend>
      <div className="mt-5">{children}</div>
    </fieldset>
  );
}

export default function Quoter({ cfg }: { cfg: QuoteConfig }) {
  const tr = useTr();
  const [type, setType] = useState("");
  const [size, setSize] = useState("o1");
  const [speed, setSpeed] = useState(cfg.speeds[0]?.id ?? "normal");
  const [extras, setExtras] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [state, action, pending] = useActionState(submitQuote, initial);
  useEffect(() => { if (state.ok) celebrate(); }, [state.ok]);

  const q = useMemo(() => computeQuote(cfg, { type, size, speed, extras }), [cfg, type, size, speed, extras]);
  const available = type ? extrasFor(cfg, type) : [];
  const scope = scopeFor(cfg, type);
  const min = useTween(q?.min ?? 0);
  const max = useTween(q?.max ?? 0);

  const choose = (id: string) => {
    setType(id);
    setSize(scopeFor(cfg, id).options[0]?.id ?? "");
    setExtras((xs) => xs.filter((x) => extrasFor(cfg, id).some((e) => e.name === x)));
  };
  const pill = (on: boolean) =>
    `rounded-2xl border p-4 text-left transition ${on ? "border-ink-900 bg-white shadow-[0_10px_30px_-18px_rgba(22,19,15,.5)] ring-1 ring-ink-900" : "border-paper-line bg-white/60 hover:border-ink-900/40 hover:bg-white"}`;

  if (state.ok) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-paper-line bg-white p-10 text-center">
        <Aldo pose="happy" className="h-28 w-28" />
        <p className="mt-4 font-display text-3xl text-ink-900"><TC>{"¡Cotización enviada!"}</TC></p>
        <p className="mt-3 text-lg text-ink-700">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-12">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="size" value={size} />
      <input type="hidden" name="speed" value={speed} />
      {extras.map((x) => <input key={x} type="hidden" name="extras" value={x} />)}

      <div className="space-y-10 lg:col-span-7">
        <Step n={1} title="¿Qué necesitas?">
          <div className="grid gap-3 sm:grid-cols-2">
            {cfg.types.map((t) => (
              <button key={t.id} type="button" onClick={() => choose(t.id)} className={pill(type === t.id)} aria-pressed={type === t.id}>
                <span className="flex items-start gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${type === t.id ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"}`}>
                    <Icon name={t.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-ink-900">{t.name}</span>
                    <span className="mt-0.5 block text-sm text-ink-500">{t.text}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Step>

        <div className={`space-y-10 transition-opacity duration-500 ${type ? "opacity-100" : "pointer-events-none opacity-40"}`} aria-disabled={!type}>
          <Step n={2} title={scope.question}>
            <div className={`grid gap-3 ${scope.options.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {scope.options.map((x) => (
                <button key={x.id} type="button" onClick={() => setSize(x.id)} className={pill(size === x.id)} aria-pressed={size === x.id}>
                  <span className="block font-medium text-ink-900"><TC>{x.name}</TC></span>
                  <span className="mt-0.5 block text-sm text-ink-500"><TC>{x.text}</TC></span>
                </button>
              ))}
            </div>
          </Step>

          <Step n={3} title="¿Para cuándo?">
            <div className="grid gap-3 sm:grid-cols-2">
              {cfg.speeds.map((x) => (
                <button key={x.id} type="button" onClick={() => setSpeed(x.id)} className={pill(speed === x.id)} aria-pressed={speed === x.id}>
                  <span className="block font-medium text-ink-900"><TC>{x.name}</TC></span>
                  <span className="mt-0.5 block text-sm text-ink-500"><TC>{x.text}</TC></span>
                </button>
              ))}
            </div>
          </Step>

          {available.length > 0 && (
            <Step n={4} title="¿Algo más?">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {available.map((e) => {
                  const on = extras.includes(e.name);
                  return (
                    <label key={e.name} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${on ? "border-ink-900 bg-white" : "border-paper-line bg-white/60 hover:bg-white"}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setExtras((xs) => (on ? xs.filter((x) => x !== e.name) : [...xs, e.name]))}
                        className="h-4 w-4 accent-[#e2471c]"
                      />
                      <span className="flex-1 text-sm text-ink-800">{e.name}</span>
                      <span className="font-mono text-xs text-ink-500">+{money(e.price)}</span>
                    </label>
                  );
                })}
              </div>
            </Step>
          )}
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="rounded-3xl bg-ink-900 p-7 text-paper shadow-2xl shadow-black/20 lg:sticky lg:top-24">
          <p className="font-mono text-[11px] uppercase tracking-wider text-paper/50"><TC>{"Tu estimado"}</TC></p>
          {q ? (
            <>
              <p className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight tabular-nums">
                {money(min)} <span className="text-paper/40">–</span> {money(max)}
              </p>
              {q.type.monthly && <p className="mt-1 text-sm text-brand-400">{q.type.monthly}</p>}
              <ul className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm text-paper/75">
                <li className="flex justify-between gap-4"><span>{q.type.name}</span><span className="text-paper/50">{q.size.name}</span></li>
                <li className="flex justify-between gap-4"><span><TC>{"Tiempo"}</TC></span><span className="text-paper/50"><TC>{q.speed.name}</TC></span></li>
                {q.extras.map((e) => (
                  <li key={e.name} className="flex justify-between gap-4"><span>{e.name}</span><span className="text-paper/50">+{money(e.price)}</span></li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-paper/45"><TC>{"Es un rango aproximado. El precio final es cerrado y te lo confirmamos antes de empezar."}</TC></p>
              {!showForm ? (
                <button type="button" onClick={() => setShowForm(true)} className="btn-signal mt-6 w-full justify-center"><TC>{"Recibir cotización exacta →"}</TC></button>
              ) : (
                <div className="mt-6 space-y-3">
                  <div>
                    <input name="name" placeholder={tr("Tu nombre *")} className="input !border-white/15 !bg-white/5 !text-paper placeholder:!text-paper/40" required />
                    {state.errors?.name && <p className="mt-1 text-xs text-brand-400">{state.errors.name}</p>}
                  </div>
                  <div>
                    <input name="email" type="email" placeholder={tr("Correo *")} className="input !border-white/15 !bg-white/5 !text-paper placeholder:!text-paper/40" required />
                    {state.errors?.email && <p className="mt-1 text-xs text-brand-400">{state.errors.email}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="phone" placeholder="WhatsApp" className="input !border-white/15 !bg-white/5 !text-paper placeholder:!text-paper/40" />
                    <input name="company" placeholder={tr("Empresa")} className="input !border-white/15 !bg-white/5 !text-paper placeholder:!text-paper/40" />
                  </div>
                  <textarea name="note" rows={3} placeholder={tr("¿Algo que debamos saber? (opcional)")} className="input !border-white/15 !bg-white/5 !text-paper placeholder:!text-paper/40" />
                  {state.message && !state.ok && <p className="text-sm text-brand-400">{state.message}</p>}
                  <button className="btn-signal w-full justify-center" disabled={pending}>{pending ? "Enviando…" : "Enviar"}</button>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 flex items-center gap-4">
              <Aldo pose="wave" className="h-20 w-20 shrink-0" />
              <p className="text-paper/70"><TC>{"Elige qué necesitas y aquí verás el precio al instante."}</TC></p>
            </div>
          )}
        </div>
      </aside>
    </form>
  );
}
