import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATUS_STYLES } from "@/lib/leads";
import { STATUS_COLORS } from "@/lib/resources";
import { currentPeriod, money, shortDate } from "@/lib/format";
import { getAccess, requireAdmin } from "@/lib/auth";
import { permForPath } from "@/lib/permissions";
import Flash from "@/components/admin/Flash";
import AdminIcon from "@/components/admin/AdminIcon";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(new Date()));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const session = await requireAdmin();
  const { error, ok } = await searchParams;
  const access = await getAccess(session.uid);
  const may = (href: string) => { const p = permForPath(href); return !p || access.perms.has(p); };
  const period = currentPeriod();
  const today = new Date().toISOString().slice(0, 10);
  const [newLeads, openOrders, employees, payroll, pendingReqs, latestLeads, upcoming, reqs] = await Promise.all([
    prisma.lead.count({ where: { status: "nuevo" } }),
    prisma.order.findMany({ where: { status: { notIn: ["cancelado"] } }, select: { amount: true, paid: true, status: true } }),
    prisma.employee.count({ where: { active: true } }),
    prisma.payroll.findMany({ where: { period }, select: { net: true, status: true } }),
    prisma.staffRequest.count({ where: { status: "pendiente" } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.findMany({
      where: { status: { in: ["aprobado", "en_progreso"] } },
      orderBy: [{ dueDate: "asc" }],
      take: 6,
      include: { client: { select: { name: true } } },
    }),
    prisma.staffRequest.findMany({ where: { status: "pendiente" }, orderBy: { createdAt: "desc" }, take: 5, include: { employee: { select: { name: true } } } }),
  ]);

  const active = openOrders.filter((o) => ["aprobado", "en_progreso"].includes(o.status)).length;
  const receivable = openOrders.filter((o) => o.status !== "cotizacion").reduce((a, o) => a + Math.max(0, o.amount - o.paid), 0);
  const payrollTotal = payroll.reduce((a, p) => a + p.net, 0);
  const payrollPending = payroll.filter((p) => p.status !== "pagado").reduce((a, p) => a + p.net, 0);

  const cards = [
    { label: "Solicitudes web nuevas", value: String(newLeads), icon: "inbox", tone: "bg-brand-50 text-brand-600", href: "/admin/leads?estado=nuevo", sub: newLeads ? "Por responder" : "Todo al día" },
    { label: "Pedidos en curso", value: String(active), icon: "orders", tone: "bg-sky-50 text-sky-600", href: "/admin/pedidos?estado=en_progreso", sub: "Aprobados o en progreso" },
    { label: "Por cobrar", value: money(receivable), icon: "money", tone: "bg-emerald-50 text-emerald-600", href: "/admin/pedidos", sub: "Saldo de pedidos" },
    { label: "Empleados activos", value: String(employees), icon: "team", tone: "bg-violet-50 text-violet-600", href: "/admin/empleados", sub: "En el equipo" },
    {
      label: `Nómina ${shortDate(period)}`,
      value: money(payrollTotal),
      icon: "wallet",
      tone: "bg-amber-50 text-amber-600",
      sub: payroll.length === 0 ? "Sin generar" : payrollPending > 0 ? `${money(payrollPending)} por pagar` : "Todo pagado",
      href: `/admin/nomina?periodo=${period}`,
    },
    { label: "Solicitudes internas", value: String(pendingReqs), icon: "check", tone: "bg-rose-50 text-rose-600", sub: "Pendientes de revisar", href: "/admin/solicitudes?estado=pendiente" },
  ];
  const first = (session.name || "").trim().split(/\s+/)[0];
  const todayLabel = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }).format(new Date());
  const quick = [
    ["Nuevo pedido", "/admin/pedidos/nuevo", "orders"],
    ["Nuevo cliente", "/admin/clientes/nuevo", "clients"],
    ["Nueva puerta", "/admin/puertas/nuevo", "door"],
    ["Nuevo empleado", "/admin/empleados/nuevo", "team"],
    ["Generar nómina", "/admin/nomina", "wallet"],
    ["Textos del sitio", "/admin/contenido", "text"],
  ];

  return (
    <div>
      <Flash ok={ok} error={error} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-500 first-letter:uppercase">{todayLabel}</p>
          <h1 className="mt-1 font-display text-3xl text-ink-900 sm:text-4xl">
            {greeting()}{first ? `, ${first}` : ""}<span className="text-brand-500">.</span>
          </h1>
          <p className="mt-1 text-ink-500">
            {(may("/admin/leads") ? newLeads : 0) + (may("/admin/solicitudes") ? pendingReqs : 0) > 0
              ? "Tienes cosas esperando tu respuesta."
              : "Todo está al día. Buen momento para mover un pedido."}
          </p>
        </div>
        {may("/admin/pedidos") && <Link href="/admin/pedidos/nuevo" className="inline-flex items-center gap-2 self-start rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 sm:self-auto">
          <AdminIcon name="plus" className="h-4 w-4" /> Nuevo pedido
        </Link>}
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {cards.filter((c) => may(c.href)).map((c) => (
          <Link key={c.label} href={c.href} className="group min-w-0 rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(0,0,0,.25)]">
            <div className="flex items-start justify-between">
              <p className="text-xs text-ink-500 sm:text-sm">{c.label}</p>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl sm:h-9 sm:w-9 ${c.tone}`}>
                <AdminIcon name={c.icon} className="h-[18px] w-[18px]" />
              </span>
            </div>
            <p className="mt-2 truncate font-display text-2xl tabular-nums text-ink-900 sm:text-3xl">{c.value}</p>
            <p className="mt-1 flex items-center justify-between truncate text-[11px] text-ink-500 sm:text-xs">
              {c.sub}
              <AdminIcon name="arrow" className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-500">Accesos rápidos</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quick.filter(([, h]) => may(h)).map(([l, h, ic]) => (
            <Link key={h} href={h} className="group flex flex-col items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-sm font-medium text-ink-800 transition hover:border-brand-500/40 hover:text-brand-700">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f6f5f2] text-ink-700 transition group-hover:bg-brand-500 group-hover:text-white">
                <AdminIcon name={ic} className="h-[18px] w-[18px]" />
              </span>
              {l}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {may("/admin/leads") && <Panel title="Solicitudes web recientes" icon="inbox" href="/admin/leads" empty="Aún no hay contactos. Llegarán aquí desde el formulario del sitio.">
          {latestLeads.map((l) => (
            <Item key={l.id} href={`/admin/leads/${l.id}`}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f6f5f2] text-xs font-semibold text-ink-700">{l.name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-900">{l.name}</span>
                {l.service && <span className="block truncate text-xs text-ink-500">{l.service}</span>}
              </span>
              <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[l.status] ?? ""}`}>{l.status}</span>
            </Item>
          ))}
        </Panel>}
        {may("/admin/pedidos") && <Panel title="Entregas próximas" icon="calendar" href="/admin/pedidos" empty="No hay pedidos aprobados o en curso.">
          {upcoming.map((o) => (
            <Item key={o.id} href={`/admin/pedidos/${o.id}`}>
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-900">{o.title}</span>
                {o.client && <span className="block truncate text-xs text-ink-500">{o.client.name}</span>}
              </span>
              <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs ${o.dueDate && o.dueDate < today ? "bg-red-50 font-semibold text-red-600" : "bg-[#f6f5f2] text-ink-600"}`}>
                {o.dueDate ? shortDate(o.dueDate) : "Sin fecha"}
              </span>
            </Item>
          ))}
        </Panel>}
        {may("/admin/solicitudes") && <Panel title="Solicitudes del equipo por revisar" icon="check" href="/admin/solicitudes?estado=pendiente" empty="No hay solicitudes pendientes.">
          {reqs.map((r) => (
            <Item key={r.id} href={`/admin/solicitudes/${r.id}`}>
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink-900">{r.title}</span>
                {r.employee && <span className="block truncate text-xs text-ink-500">{r.employee.name}</span>}
              </span>
              <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
            </Item>
          ))}
        </Panel>}
        {may("/admin/contenido") && <section className="flex flex-col justify-between overflow-hidden rounded-2xl bg-ink-900 p-6 text-paper">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/50">Tu sitio web</p>
            <p className="mt-2 font-display text-2xl">Cambia textos, servicios y precios sin tocar código.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              ["Textos", "/admin/contenido"],
              ["Servicios", "/admin/servicios"],
              ["Castorly", "/admin/productos"],
              ["Planes", "/admin/planes"],
              ["Preguntas", "/admin/preguntas"],
            ].map(([l, h]) => (
              <Link key={h} href={h} className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-paper/80 transition hover:border-brand-500 hover:text-white">
                {l}
              </Link>
            ))}
          </div>
        </section>}
      </div>
    </div>
  );
}

function Panel({ title, icon, href, empty, children }: { title: string; icon: string; href: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="flex items-center gap-2 font-medium text-ink-900">
          <AdminIcon name={icon} className="h-[18px] w-[18px] text-ink-400" /> {title}
        </h2>
        <Link href={href} className="text-sm font-medium text-brand-600 hover:text-brand-700">Ver todo →</Link>
      </div>
      {children.length === 0 ? (
        <p className="mx-5 mb-5 rounded-xl border border-dashed border-black/10 p-5 text-center text-sm text-ink-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-black/[0.05] border-t border-black/[0.05]">{children}</ul>
      )}
    </section>
  );
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-[#faf9f7]">{children}</Link>
    </li>
  );
}
