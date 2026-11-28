"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import TC, { useTr } from "@/components/TC";
import Aldo from "@/components/Aldo";
import { celebrate } from "@/lib/celebrate";
import { bookCall, type BookState } from "@/app/agendar-actions";
import type { BookingDay } from "@/lib/booking";

const initial: BookState = { ok: false, message: "" };
const LOCALE: Record<string, string> = { es: "es-CO", en: "en-US", pt: "pt-BR" };

function label(date: string, lang: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(date + "T12:00:00Z").toLocaleDateString(LOCALE[lang] || "es-CO", { ...opts, timeZone: "UTC" });
}
function ampm(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
}

/** Agenda en tres pasos: día, hora y datos. */
export default function BookingPicker({ days, slot, topics, lang = "es", meet }: { days: BookingDay[]; slot: number; topics: string[]; lang?: string; meet: boolean }) {
  const tr = useTr();
  const [state, action, pending] = useActionState(bookCall, initial);
  const [date, setDate] = useState(days[0]?.date || "");
  const [time, setTime] = useState("");
  const day = useMemo(() => days.find((d) => d.date === date), [days, date]);
  useEffect(() => { if (state.ok) celebrate(); }, [state.ok]);

  if (state.ok && state.date) {
    return (
      <div className="rounded-3xl border border-paper-line bg-white p-8 text-center sm:p-12">
        <Aldo pose="cheer" className="mx-auto h-28 w-28" />
        <h2 className="mt-4 font-display text-3xl text-ink-900"><TC>{"¡Tu llamada quedó agendada!"}</TC></h2>
        <p className="mt-3 text-lg text-ink-700">
          {label(state.date, lang, { weekday: "long", day: "numeric", month: "long" })} · {ampm(state.time!)} <span className="text-ink-500">(<TC>{"hora de Colombia"}</TC>)</span>
        </p>
        <p className="mt-2 text-ink-500"><TC>{"Te enviamos la confirmación a tu correo."}</TC></p>
        {state.calendar && <a href={state.calendar} target="_blank" rel="noopener noreferrer" className="btn-signal mt-6"><TC>{"Agregar a mi calendario"}</TC></a>}
      </div>
    );
  }

  if (!days.length) {
    return <p className="rounded-3xl border border-dashed border-paper-line p-10 text-center text-ink-500"><TC>{"Por ahora no hay horas libres. Escríbenos por WhatsApp y buscamos un espacio."}</TC></p>;
  }

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <p className="eyebrow"><span className="text-brand-500">1</span> · <TC>{"Escoge el día"}</TC></p>
        <div className="-mx-2 mt-4 flex snap-x gap-2 overflow-x-auto px-2 pb-2">
          {days.map((d) => {
            const on = d.date === date;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => { setDate(d.date); setTime(""); }}
                aria-pressed={on}
                className={`flex w-[4.5rem] shrink-0 snap-start flex-col items-center rounded-2xl border px-2 py-3 transition ${on ? "border-ink-900 bg-ink-900 text-paper" : "border-paper-line hover:border-ink-900"}`}
              >
                <span className={`text-[11px] uppercase tracking-wider ${on ? "text-paper/60" : "text-ink-500"}`}>{label(d.date, lang, { weekday: "short" })}</span>
                <span className="font-display text-2xl">{label(d.date, lang, { day: "numeric" })}</span>
                <span className={`text-[11px] ${on ? "text-paper/60" : "text-ink-500"}`}>{label(d.date, lang, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
        <p className="eyebrow mt-8"><span className="text-brand-500">2</span> · <TC>{"Escoge la hora"}</TC> <span className="normal-case tracking-normal text-ink-400">(<TC>{"hora de Colombia"}</TC> · {slot} min)</span></p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {day?.slots.map((s) => (
            <button
              key={s.time}
              type="button"
              disabled={!s.free}
              onClick={() => setTime(s.time)}
              aria-pressed={time === s.time}
              className={`rounded-xl border px-2 py-2.5 text-sm tabular-nums transition ${!s.free ? "cursor-not-allowed border-transparent bg-paper text-ink-400 line-through" : time === s.time ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/25" : "border-paper-line hover:border-brand-500 hover:text-brand-600"}`}
            >
              {ampm(s.time)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <p className="eyebrow"><span className="text-brand-500">3</span> · <TC>{"Tus datos"}</TC></p>
        <div className="mt-4 grid gap-3">
          <input name="name" required placeholder={tr("Tu nombre")} className="input" autoComplete="name" />
          <input name="email" type="email" required placeholder={tr("Correo")} className="input" autoComplete="email" />
          <input name="phone" placeholder={meet ? tr("Celular (opcional)") : tr("Celular para llamarte")} required={!meet} className="input" autoComplete="tel" />
          <input name="company" placeholder={tr("Empresa (opcional)")} className="input" autoComplete="organization" />
          <select name="topic" className="input" defaultValue="">
            <option value="">{tr("¿De qué quieres hablar?")}</option>
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea name="notes" rows={3} placeholder={tr("Cuéntanos un poco (opcional)")} className="input" />
        </div>
        <div className="mt-5 rounded-2xl bg-paper p-4 text-sm text-ink-700">
          {date && time ? (
            <><TC>{"Tu llamada:"}</TC> <b className="text-ink-900">{label(date, lang, { weekday: "long", day: "numeric", month: "long" })} · {ampm(time)}</b></>
          ) : (
            <TC>{"Escoge un día y una hora para continuar."}</TC>
          )}
        </div>
        {state.message && !state.ok && <p className="mt-3 text-sm text-red-600">{tr(state.message)}</p>}
        <button disabled={!time || pending} className="btn-signal mt-5 w-full justify-center disabled:opacity-50">
          {pending ? <TC>{"Agendando…"}</TC> : <TC>{"Confirmar llamada"}</TC>}
        </button>
      </div>
    </form>
  );
}
