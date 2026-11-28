import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { money } from "@/lib/format";
import Flash from "@/components/admin/Flash";
import AdminIcon from "@/components/admin/AdminIcon";

const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; error?: string }> }) {
  await requirePerm("clientes");
  const { q = "", ok, error } = await searchParams;
  const where = q ? { OR: [{ name: { contains: q } }, { company: { contains: q } }, { email: { contains: q } }] } : {};
  const clients = await prisma.client.findMany({ where, orderBy: [{ company: "asc" }, { name: "asc" }], include: { orders: { select: { amount: true, paid: true, status: true } } } });
  const ids = clients.map((c) => c.id);
  const [puertas, turnos, menus] = await Promise.all([
    prisma.linkPage.groupBy({ by: ["clientId"], where: { clientId: { in: ids } }, _count: { _all: true } }),
    prisma.queue.groupBy({ by: ["clientId"], where: { clientId: { in: ids } }, _count: { _all: true } }),
    prisma.menuBoard.groupBy({ by: ["clientId"], where: { clientId: { in: ids } }, _count: { _all: true } }),
  ]);
  const n = (rows: { clientId: number | null; _count: { _all: number } }[], id: number) => rows.find((r) => r.clientId === id)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Clientes</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Cada empresa tiene su propio espacio: entra y ves solo lo suyo (pedidos, Puertas, turnos, menús y su acceso al portal).</p>
        </div>
        <Link href="/admin/clientes/nuevo" className="btn-primary !py-2 text-sm">+ Nuevo cliente</Link>
      </div>
      <Flash ok={ok} error={error} />
      <form className="flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar empresa, contacto o correo…" className="input" />
        <button className="btn-outline shrink-0">Buscar</button>
      </form>

      {clients.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-white p-10 text-center text-sm text-slate-500">{q ? "Ningún cliente coincide." : "Aún no tienes clientes. Crea el primero o conviértelo desde una solicitud web."}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const billed = c.orders.filter((o) => !["cotizacion", "cancelado"].includes(o.status));
            const due = billed.reduce((a, o) => a + Math.max(0, o.amount - o.paid), 0);
            const active = c.orders.filter((o) => ["aprobado", "en_progreso"].includes(o.status)).length;
            const chips = [
              ["door", n(puertas, c.id), "Puerta"],
              ["ticket", n(turnos, c.id), "Turnos"],
              ["menu2", n(menus, c.id), "Menú"],
            ] as const;
            return (
              <Link key={c.id} href={`/admin/clientes/${c.id}`} className="group flex flex-col rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,.3)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-base font-semibold text-white" style={{ background: c.color || "#e2471c" }}>{initials(c.company || c.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900">{c.company || c.name}</p>
                    <p className="truncate text-sm text-slate-500">{c.company ? c.name : c.email || "Sin empresa"}</p>
                  </div>
                  {c.portalHash && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">Portal</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {chips.filter(([, k]) => k > 0).map(([ic, k, l]) => (
                    <span key={l} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"><AdminIcon name={ic} className="h-3.5 w-3.5" />{k} {l}</span>
                  ))}
                  {active > 0 && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{active} en curso</span>}
                  {chips.every(([, k]) => k === 0) && active === 0 && <span className="text-xs text-slate-400">Sin productos activos</span>}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500" style={{ marginTop: "1rem" }}>
                  <span>{due > 0 ? <>Por cobrar <b className="text-ink-900">{money(due)}</b></> : "Al día"}</span>
                  <span className="font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">Entrar →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
