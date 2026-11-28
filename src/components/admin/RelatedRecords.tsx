import Link from "next/link";
import { prisma } from "@/lib/db";
import { STATUS_COLORS } from "@/lib/resources";
import { money, shortDate } from "@/lib/format";

function Box({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ href, left, right, status }: { href: string; left: React.ReactNode; right?: React.ReactNode; status?: string }) {
  return (
    <li>
      <Link href={href} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm hover:bg-slate-50">
        <span className="font-medium text-ink-900">{left}</span>
        <span className="ml-auto flex items-center gap-3 text-slate-600">
          {right}
          {status && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status] ?? "bg-slate-100"}`}>{status.replace("_", " ")}</span>}
        </span>
      </Link>
    </li>
  );
}

const Empty = ({ text }: { text: string }) => <p className="px-5 py-4 text-sm text-slate-500">{text}</p>;

/** Muestra los registros vinculados en la ficha de un cliente o empleado. */
export default async function RelatedRecords({ model, id }: { model: string; id: number }) {
  if (model === "client") {
    const orders = await prisma.order.findMany({ where: { clientId: id }, orderBy: { createdAt: "desc" } });
    const total = orders.filter((o) => o.status !== "cancelado").reduce((a, o) => a + o.amount, 0);
    const due = orders.filter((o) => o.status !== "cancelado").reduce((a, o) => a + (o.amount - o.paid), 0);
    return (
      <Box title={`Pedidos (${orders.length})`} action={<Link href={`/admin/pedidos/nuevo?clientId=${id}`} className="text-sm font-medium text-brand-600">+ Nuevo pedido</Link>}>
        {orders.length ? (
          <>
            <ul className="divide-y divide-slate-100">
              {orders.map((o) => <Row key={o.id} href={`/admin/pedidos/${o.id}`} left={o.title} right={money(o.amount)} status={o.status} />)}
            </ul>
            <p className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
              Total vendido <b className="text-ink-900">{money(total)}</b> · Por cobrar <b className="text-ink-900">{money(due)}</b>
            </p>
          </>
        ) : <Empty text="Este cliente todavía no tiene pedidos." />}
      </Box>
    );
  }
  if (model === "employee") {
    const [payrolls, requests] = await Promise.all([
      prisma.payroll.findMany({ where: { employeeId: id }, orderBy: { period: "desc" }, take: 12 }),
      prisma.staffRequest.findMany({ where: { employeeId: id }, orderBy: { createdAt: "desc" }, take: 12 }),
    ]);
    return (
      <>
        <Box title="Nómina" action={<Link href={`/admin/nomina/nuevo?employeeId=${id}`} className="text-sm font-medium text-brand-600">+ Registrar pago</Link>}>
          {payrolls.length ? (
            <ul className="divide-y divide-slate-100">
              {payrolls.map((p) => <Row key={p.id} href={`/admin/nomina/${p.id}`} left={shortDate(p.period)} right={money(p.net)} status={p.status} />)}
            </ul>
          ) : <Empty text="Sin pagos registrados." />}
        </Box>
        <Box title="Solicitudes" action={<Link href={`/admin/solicitudes/nuevo?employeeId=${id}`} className="text-sm font-medium text-brand-600">+ Nueva solicitud</Link>}>
          {requests.length ? (
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => (
                <Row key={r.id} href={`/admin/solicitudes/${r.id}`} left={r.title} right={[shortDate(r.startDate), shortDate(r.endDate)].filter(Boolean).join(" → ")} status={r.status} />
              ))}
            </ul>
          ) : <Empty text="Sin solicitudes." />}
        </Box>
      </>
    );
  }
  return null;
}
