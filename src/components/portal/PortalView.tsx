import PuertaStatsCard from "@/components/PuertaStatsCard";
import { wompiReady } from "@/lib/wompi";
import { payOrder } from "@/app/portal/actions";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ORDER_STATUSES } from "@/lib/resources";
import { money, shortDate } from "@/lib/format";
import Logo from "@/components/Logo";
import Aldo from "@/components/Aldo";


const FLOW = ["cotizacion", "aprobado", "en_progreso", "entregado", "pagado"];
const label = (v: string) => ORDER_STATUSES.find((o) => o.value === v)?.label ?? v;

type ClientRow = { id: number; name: string; company: string };

/** El portal del cliente: proyectos, pagos y servicios. Lo usan el enlace privado y la cuenta con contraseña. */
export default async function PortalView({ client, account = false, headerAction, children }: { client: ClientRow; account?: boolean; headerAction?: React.ReactNode; children?: React.ReactNode }) {
  /** En la cuenta con contraseña cada servicio tiene su botón para pedir un cambio. */
  const canPay = account && wompiReady();
  const ask = (item: string) =>
    account ? (
      <a href={`/portal?pedir=${encodeURIComponent(item)}#solicitar`} className="text-ink-700 hover:text-brand-600">
        Solicitar un cambio
      </a>
    ) : null;
  const [s, orders, puertas, queues, menus] = await Promise.all([
    getSettings(),
    prisma.order.findMany({ where: { clientId: client.id, status: { not: "cancelado" } }, orderBy: { createdAt: "desc" } }),
    prisma.linkPage.findMany({ where: { clientId: client.id } }),
    prisma.queue.findMany({ where: { clientId: client.id } }),
    prisma.menuBoard.findMany({ where: { clientId: client.id } }),
  ]);
  const billed = orders.filter((o) => o.status !== "cotizacion");
  const total = billed.reduce((a, o) => a + o.amount, 0);
  const paid = billed.reduce((a, o) => a + o.paid, 0);
  const active = orders.filter((o) => ["aprobado", "en_progreso"].includes(o.status)).length;
  const first = client.name.trim().split(/\s+/)[0];
  const wa = (s["contact.whatsapp"] || "").replace(/\D/g, "");
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, soy ${client.name}${client.company ? ` de ${client.company}` : ""}. Te escribo desde mi portal de Aldore.`)}` : null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-ink-900 text-paper">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" aria-label="Aldore"><Logo name={s["site.name"] || "aldore"} light /></Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-paper/60 sm:inline">Portal del cliente</span>
            {headerAction}
          </div>
        </div>
      </header>

      <section className="border-b border-paper-line">
        <div className="container-x flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">{client.company || "Tu cuenta"}</p>
            <h1 className="mt-2 font-display text-4xl text-ink-900 sm:text-5xl">Hola, {first}<span className="text-brand-500">.</span></h1>
            <p className="mt-2 max-w-xl text-lg text-ink-700">Aquí ves lo que tienes contratado con Aldore, en qué va cada proyecto y tus pagos. Si necesitas un cambio, pídelo aquí y nosotros lo hacemos.</p>
          </div>
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-signal self-start sm:self-auto">Escribirnos por WhatsApp</a>
          )}
        </div>
      </section>

      <main className="container-x space-y-12 py-12">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            ["Proyectos en curso", String(active)],
            ["Valor total", money(total)],
            ["Pagado", money(paid)],
            ["Saldo pendiente", money(Math.max(0, total - paid))],
          ].map(([l, v], i) => (
            <div key={l} className={`rounded-2xl border p-5 ${i === 3 && total - paid > 0 ? "border-brand-500/30 bg-brand-50" : "border-paper-line bg-white"}`}>
              <p className="text-xs text-ink-500 sm:text-sm">{l}</p>
              <p className="mt-2 truncate font-display text-2xl tabular-nums text-ink-900 sm:text-3xl">{v}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="font-display text-3xl text-ink-900">Tus proyectos</h2>
          {orders.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-paper-line p-8 text-center text-ink-500">Aún no tienes proyectos registrados.</p>
          ) : (
            <ul className="mt-6 space-y-5">
              {orders.map((o) => {
                const step = Math.max(0, FLOW.indexOf(o.status));
                const pct = o.amount > 0 ? Math.min(100, Math.round((o.paid / o.amount) * 100)) : 0;
                return (
                  <li key={o.id} className="rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">{o.service || "Proyecto"}</p>
                        <h3 className="mt-1 font-display text-2xl text-ink-900">{o.title}</h3>
                        <p className="mt-1 text-sm text-ink-500">
                          {o.startDate ? `Inicio ${shortDate(o.startDate)}` : ""}
                          {o.startDate && o.dueDate ? " · " : ""}
                          {o.dueDate ? `Entrega ${shortDate(o.dueDate)}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-medium text-paper">{label(o.status)}</span>
                    </div>

                    <ol className="mt-6 grid grid-cols-5 gap-1.5" aria-label="Avance">
                      {FLOW.map((f, i) => (
                        <li key={f} className="min-w-0">
                          <span className={`block h-1.5 rounded-full ${i <= step ? "bg-brand-500" : "bg-paper-2"}`} />
                          <span className={`mt-2 block truncate text-[11px] sm:text-xs ${i <= step ? "text-ink-800" : "text-ink-400"}`}>{label(f)}</span>
                        </li>
                      ))}
                    </ol>

                    {o.clientUpdate && (
                      <div className="mt-6 flex gap-3 rounded-2xl bg-paper p-4">
                        <Aldo pose="base" className="h-10 w-10 shrink-0" />
                        <p className="whitespace-pre-line text-[15px] text-ink-800">{o.clientUpdate}</p>
                      </div>
                    )}

                    {o.amount > 0 && o.status !== "cotizacion" && (
                      <div className="mt-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-ink-500">Pagado {money(o.paid)} de {money(o.amount)}</span>
                          <span className="font-medium text-ink-900">{pct}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    {o.status === "cotizacion" && o.amount > 0 && <p className="mt-6 text-sm text-ink-600">Valor cotizado: <strong className="text-ink-900">{money(o.amount)}</strong></p>}
                    {account && (
                      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium">
                        {o.status !== "cotizacion" && o.amount - o.paid > 0 && canPay && (
                          <form action={payOrder.bind(null, o.id)}>
                            <button className="btn-signal !py-2 text-sm">Pagar {money(o.amount - o.paid)}</button>
                          </form>
                        )}
                        {o.status !== "cotizacion" && o.amount > 0 && <a href={`/portal/cuenta/${o.id}`} className="text-ink-900 hover:text-brand-600">Cuenta de cobro ↗</a>}
                        {ask(`o${o.id}`)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {(puertas.length > 0 || queues.length > 0 || menus.length > 0) && (
          <section>
            <h2 className="font-display text-3xl text-ink-900">Lo que tienes contratado</h2>
            <p className="mt-1 text-ink-500">Tus servicios activos con Aldore.</p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {puertas.map((p) => (
                <li key={`p${p.id}`} className="rounded-2xl border border-paper-line bg-white p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">Puerta (QR / NFC)</p>
                  <p className="mt-1 font-display text-xl text-ink-900">{p.name}</p>
                  <p className="mt-2 text-sm text-ink-500">{p.views} visitas · {p.clicks} toques</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                    <a href={`/p/${p.slug}`} target="_blank" className="text-brand-600">Ver página ↗</a>
                    {ask(`p${p.id}`)}
                  </div>
                </li>
              ))}
              {queues.map((q) => (
                <li key={`q${q.id}`} className="rounded-2xl border border-paper-line bg-white p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">Turnos con QR</p>
                  <p className="mt-1 font-display text-xl text-ink-900">{q.name}</p>
                  <p className="mt-2 text-sm text-ink-500">Turno actual: {q.prefix}{q.currentNumber} · Turnos dados hoy: {q.lastNumber}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                    <a href={`/t/${q.slug}/atender?k=${q.staffKey}`} target="_blank" className="text-brand-600">Atender turnos ↗</a>
                    <a href={`/t/${q.slug}/pantalla`} target="_blank" className="text-ink-700">Pantalla ↗</a>
                    {ask(`q${q.id}`)}
                  </div>
                </li>
              ))}
              {menus.map((m) => (
                <li key={`m${m.id}`} className="rounded-2xl border border-paper-line bg-white p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">Menú del día</p>
                  <p className="mt-1 font-display text-xl text-ink-900">{m.name}</p>
                  <p className="mt-2 text-sm text-ink-500">Actualizado: {m.date ? shortDate(m.date) : "—"}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                    <a href={`/menu/${m.slug}`} target="_blank" className="text-brand-600">Ver menú ↗</a>
                    {ask(`m${m.id}`)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {puertas.length > 0 && (
          <section>
            <h2 className="font-display text-3xl text-ink-900">Cómo le va a tu Puerta</h2>
            <p className="mt-1 text-ink-500">Cuántas personas la abren cada día y qué botones tocan más.</p>
            <div className="mt-6 space-y-5">
              {puertas.map((p) => <PuertaStatsCard key={p.id} pageId={p.id} name={p.name} />)}
            </div>
          </section>
        )}

        {children}

        <p className="text-center text-xs text-ink-400">{account ? "Tu cuenta es personal: no compartas tu contraseña." : "Este enlace es privado. No lo compartas fuera de tu empresa."} · {s["contact.email"]}</p>
      </main>
    </div>
  );
}
