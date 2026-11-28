import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { bookingConfig, nowCO, prettyDate } from "@/lib/booking";
import { setBookingStatus } from "../../agenda-actions";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";
const BADGE: Record<string, string> = { agendada: "bg-sky-50 text-sky-700", hecha: "bg-emerald-50 text-emerald-700", cancelada: "bg-slate-100 text-slate-500 line-through" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requireAdmin();
  const { ver } = await searchParams;
  const past = ver === "pasadas";
  const today = nowCO().date;
  const [items, cfg, upcoming] = await Promise.all([
    prisma.booking.findMany({
      where: past ? { date: { lt: today } } : { date: { gte: today } },
      orderBy: past ? [{ date: "desc" }, { time: "desc" }] : [{ date: "asc" }, { time: "asc" }],
      take: 100,
    }),
    bookingConfig(),
    prisma.booking.count({ where: { date: { gte: today }, status: "agendada" } }),
  ]);
  const groups = new Map<string, typeof items>();
  for (const b of items) groups.set(b.date, [...(groups.get(b.date) || []), b]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Agenda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Llamadas que agendan desde <a href="/agendar" target="_blank" className="font-medium text-brand-600">aldore.co/agendar ↗</a>. {upcoming} pendiente(s). Cada una también llega a Solicitudes web.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
          <Link href="/admin/agenda" className={`rounded-lg px-3 py-1.5 ${!past ? "bg-ink-900 text-white" : "text-slate-600"}`}>Próximas</Link>
          <Link href="/admin/agenda?ver=pasadas" className={`rounded-lg px-3 py-1.5 ${past ? "bg-ink-900 text-white" : "text-slate-600"}`}>Pasadas</Link>
        </div>
      </div>

      <div className={`${box} p-4 text-sm text-slate-600`}>
        Atiendes {cfg.ranges.map(([a, b]) => `${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}–${String(Math.floor(b / 60)).padStart(2, "0")}:${String(b % 60).padStart(2, "0")}`).join(" y ")} · llamadas de {cfg.slot} min · hasta {cfg.ahead} días adelante.{" "}
        <Link href="/admin/contenido#agenda" className="font-medium text-brand-600">Cambiar horario</Link>
      </div>

      {groups.size === 0 && <p className={`${box} p-8 text-center text-sm text-slate-500`}>{past ? "No hay llamadas pasadas." : "Aún no hay llamadas agendadas. Comparte aldore.co/agendar con tus clientes."}</p>}

      {[...groups.entries()].map(([date, list]) => (
        <section key={date}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{date === today ? "Hoy · " : ""}{prettyDate(date)}</h2>
          <ul className={`divide-y divide-slate-100 ${box}`}>
            {list.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className="w-14 font-display text-xl tabular-nums text-ink-900">{b.time}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900">{b.name}{b.company ? <span className="font-normal text-slate-500"> · {b.company}</span> : null}</p>
                  <p className="truncate text-sm text-slate-500">{[b.topic, b.email, b.phone].filter(Boolean).join(" · ")}</p>
                  {b.notes && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{b.notes}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[b.status] || BADGE.agendada}`}>{b.status}</span>
                <div className="flex gap-1.5">
                  {b.leadId && <Link href={`/admin/leads/${b.leadId}`} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:border-ink-900">Ver solicitud</Link>}
                  {b.status !== "hecha" && <form action={setBookingStatus.bind(null, b.id, "hecha")}><button className="rounded-lg bg-ink-900 px-2.5 py-1 text-xs text-white hover:bg-brand-600">Hecha</button></form>}
                  {b.status === "agendada" && <form action={setBookingStatus.bind(null, b.id, "cancelada")}><button className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-red-300 hover:text-red-600">Cancelar</button></form>}
                  {b.status !== "agendada" && <form action={setBookingStatus.bind(null, b.id, "agendada")}><button className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600">Reabrir</button></form>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
