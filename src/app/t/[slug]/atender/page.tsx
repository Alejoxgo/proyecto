import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getQueue } from "@/lib/turnos";
import { callNext, resetQueue, skipCurrent, toggleOpen } from "@/app/actions/turnos";
import { AutoRefresh } from "@/components/turnos/TurnosLive";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ k?: string; m?: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Atender turnos" }, robots: { index: false } };

export default async function Attend({ params, searchParams }: Props) {
  const { slug } = await params;
  const { k = "", m } = await searchParams;
  const q = await getQueue(slug);
  if (!q || !q.staffKey || k !== q.staffKey) notFound();
  const waiting = await prisma.ticket.findMany({ where: { queueId: q.id, status: "esperando" }, orderBy: { number: "asc" }, take: 30 });
  const fmt = (n: number) => (n ? `${q.prefix}${String(n).padStart(2, "0")}` : "—");
  const btn = "rounded-2xl border border-paper-line bg-white px-4 py-3 text-sm font-medium text-ink-800 transition hover:border-ink-900";
  return (
    <div className="min-h-dvh bg-paper">
      <AutoRefresh />
      <div className="mx-auto max-w-xl px-5 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">Atender turnos</p>
            <h1 className="font-display text-3xl text-ink-900">{q.name}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${q.open ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
            {q.open ? "Recibiendo turnos" : "Cerrado"}
          </span>
        </div>
        {m && <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-ink-700">{m}</p>}

        <div className="mt-6 rounded-[2rem] p-8 text-center text-white shadow-xl" style={{ background: q.color }}>
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-80">Atendiendo</p>
          <p className="font-display text-8xl leading-none tabular-nums">{fmt(q.currentNumber)}</p>
          <p className="mt-2 text-sm opacity-90">{waiting.length} en espera · {q.lastNumber} turnos dados hoy</p>
        </div>

        <form action={callNext.bind(null, slug, k)} className="mt-5">
          <button className="w-full rounded-2xl bg-ink-900 py-5 text-xl font-semibold text-white shadow-lg transition hover:bg-brand-600 active:scale-[0.98]">
            Llamar siguiente {waiting[0] ? `(${fmt(waiting[0].number)})` : ""}
          </button>
        </form>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <form action={skipCurrent.bind(null, slug, k)}><button className={`${btn} w-full`}>No se presentó</button></form>
          <form action={toggleOpen.bind(null, slug, k)}><button className={`${btn} w-full`}>{q.open ? "Dejar de dar turnos" : "Volver a dar turnos"}</button></form>
        </div>

        <h2 className="mt-8 font-mono text-xs uppercase tracking-wider text-ink-500">En espera</h2>
        <ul className="mt-3 divide-y divide-paper-line rounded-2xl border border-paper-line bg-white">
          {waiting.length === 0 && <li className="p-4 text-sm text-ink-500">Nadie en espera.</li>}
          {waiting.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-display text-2xl tabular-nums">{fmt(t.number)}</span>
              <span className="text-sm text-ink-600">{t.name || "Sin nombre"}</span>
              <span className="font-mono text-xs text-ink-400">{new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }).format(t.createdAt)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          <a href={`/t/${slug}/pantalla`} target="_blank" className="font-medium text-brand-600">Abrir pantalla para TV ↗</a>
          <form action={resetQueue.bind(null, slug, k)}><button className="text-ink-500 underline underline-offset-4 hover:text-red-600">Reiniciar turnos</button></form>
        </div>
      </div>
    </div>
  );
}
