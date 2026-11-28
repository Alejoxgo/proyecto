"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { QueueSnapshot } from "@/lib/turnos";

export function usePoll(slug: string, code: string | null, initial: QueueSnapshot, ms = 5000) {
  const [snap, setSnap] = useState(initial);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/turnos/${slug}${code ? `?code=${code}` : ""}`, { cache: "no-store" });
        if (r.ok && alive) setSnap(await r.json());
      } catch {}
    };
    const id = setInterval(tick, ms);
    const onVis = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [slug, code, ms]);
  return snap;
}

const fmt = (prefix: string, n: number) => (n ? `${prefix}${String(n).padStart(2, "0")}` : "—");

/** Lo que ve quien tomó el turno: su número, cuántos faltan y aviso cuando le toca. */
export function MyTicket({ slug, code, initial, cancel }: { slug: string; code: string; initial: QueueSnapshot; cancel: React.ReactNode }) {
  const s = usePoll(slug, code, initial, 4000);
  const mine = s.mine;
  const called = mine?.status === "llamado";
  const prev = useRef(mine?.status);
  useEffect(() => {
    if (called && prev.current !== "llamado") {
      try {
        navigator.vibrate?.([300, 150, 300, 150, 600]);
      } catch {}
      document.title = "¡Es tu turno!";
    }
    prev.current = mine?.status;
  }, [called, mine?.status]);

  if (!mine) return <p className="text-center text-ink-500">No encontramos tu turno.</p>;
  const done = ["atendido", "cancelado", "vencido", "ausente"].includes(mine.status);
  return (
    <div className="text-center">
      <div
        className={`mx-auto max-w-sm rounded-[2rem] p-8 text-white shadow-2xl transition ${called ? "animate-[pulse_1.4s_ease-in-out_infinite]" : ""}`}
        style={{ background: s.color }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-80">{called ? "¡Es tu turno!" : done ? "Turno cerrado" : "Tu turno"}</p>
        <p className="mt-2 font-display text-[6.5rem] leading-none tabular-nums">{fmt(s.prefix, mine.number)}</p>
        {mine.name && <p className="mt-2 text-lg opacity-90">{mine.name}</p>}
      </div>
      {!done && !called && (
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-3">
          <div className="rounded-2xl border border-paper-line bg-white p-4">
            <p className="text-xs text-ink-500">Atendiendo ahora</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{fmt(s.prefix, s.current)}</p>
          </div>
          <div className="rounded-2xl border border-paper-line bg-white p-4">
            <p className="text-xs text-ink-500">Antes de ti</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{mine.ahead}</p>
          </div>
          <p className="col-span-2 text-sm text-ink-500">
            {mine.ahead === 0 ? "Eres el siguiente. Quédate cerca." : `Espera aproximada: ${Math.max(1, mine.ahead * s.avgMinutes)} min.`} Esta página se actualiza sola.
          </p>
        </div>
      )}
      {called && <p className="mt-8 text-xl font-medium text-ink-900">Acércate, te estamos esperando.</p>}
      {mine.status === "atendido" && <p className="mt-8 text-lg text-ink-700">¡Gracias por tu visita!</p>}
      {!done && !called && <div className="mt-8">{cancel}</div>}
    </div>
  );
}

/** Pantalla grande para TV o tablet. */
export function QueueScreen({ slug, initial, qr, logo }: { slug: string; initial: QueueSnapshot; qr: string; logo: string }) {
  const s = usePoll(slug, null, initial, 3000);
  const [flash, setFlash] = useState(false);
  const last = useRef(s.current);
  useEffect(() => {
    if (s.current !== last.current) {
      last.current = s.current;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2500);
      return () => clearTimeout(t);
    }
  }, [s.current]);
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-ink-900 text-paper">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-14 w-14 rounded-full object-cover" />
          )}
          <p className="font-display text-3xl">{s.name}</p>
        </div>
        <p className="font-mono text-sm uppercase tracking-widest text-paper/50">{s.waiting} en espera</p>
      </header>
      <main className="grid gap-8 px-8 pb-8 lg:grid-cols-[1.6fr_1fr]">
        <section
          className={`flex flex-col items-center justify-center rounded-[2.5rem] py-10 transition-transform duration-500 ${flash ? "scale-[1.02]" : ""}`}
          style={{ background: s.color }}
        >
          <p className="font-mono text-xl uppercase tracking-[0.3em] text-white/80">Turno</p>
          <p className="font-display text-[clamp(8rem,22vw,20rem)] leading-none tabular-nums text-white">{fmt(s.prefix, s.current)}</p>
          {s.recent.length > 0 && <p className="mt-4 font-mono text-lg text-white/70">Anteriores: {s.recent.map((n) => fmt(s.prefix, n)).join(" · ")}</p>}
        </section>
        <aside className="flex flex-col gap-6">
          <div className="flex-1 rounded-[2rem] bg-white/5 p-8">
            <p className="font-mono text-sm uppercase tracking-widest text-paper/50">Siguientes</p>
            <ul className="mt-4 space-y-3">
              {s.next.length === 0 && <li className="text-2xl text-paper/50">Nadie en espera</li>}
              {s.next.map((n) => (
                <li key={n} className="font-display text-5xl tabular-nums">{fmt(s.prefix, n)}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-5 rounded-[2rem] bg-paper p-5 text-ink-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR para tomar turno" className="h-28 w-28" />
            <p className="text-xl font-medium leading-snug">{s.open ? "Escanea y toma tu turno desde el celular" : "Por ahora no estamos dando turnos"}</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

/** Refresca la página de quien atiende para ver los turnos nuevos. */
export function AutoRefresh({ ms = 6000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [router, ms]);
  return null;
}
