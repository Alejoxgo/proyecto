import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getClientId } from "@/lib/client-session";
import { getRawSettings } from "@/lib/settings";
import { money, shortDate } from "@/lib/format";
import Logo from "@/components/Logo";
import PrintButton from "@/components/portal/PrintButton";

export const metadata: Metadata = { title: "Cuenta de cobro", robots: { index: false, follow: false } };

/** Cuenta de cobro de un proyecto, lista para imprimir o guardar como PDF. */
export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  const cid = await getClientId();
  if (!cid) redirect("/portal/ingresar");
  const id = Number((await params).id);
  const [o, c, s] = await Promise.all([
    prisma.order.findFirst({ where: { id, clientId: cid } }),
    prisma.client.findUnique({ where: { id: cid } }),
    getRawSettings(),
  ]);
  if (!o || !c || o.status === "cotizacion") notFound();
  const payments = await prisma.payment.findMany({ where: { orderId: o.id, status: "aprobado" }, orderBy: { createdAt: "asc" } });
  const due = Math.max(0, o.amount - o.paid);
  const number = `CC-${String(o.id).padStart(4, "0")}`;
  const today = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
  return (
    <div className="min-h-screen bg-paper-2 py-10 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-between px-5 print:hidden">
        <a href="/portal" className="text-sm text-ink-700 hover:text-ink-900">← Volver a mi portal</a>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:shadow-none sm:p-14">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-paper-line pb-8">
          <div>
            <Logo name={s["site.name"] || "aldore"} />
            <p className="mt-4 text-sm leading-relaxed text-ink-700">
              <b className="text-ink-900">{s["billing.legalName"] || s["site.name"]}</b>
              {s["billing.nit"] && <><br />NIT / CC {s["billing.nit"]}</>}
              {s["billing.address"] && <><br />{s["billing.address"]}</>}
              <br />{s["contact.email"]} · {s["contact.phone"]}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">Cuenta de cobro</p>
            <p className="font-display text-3xl text-ink-900">{number}</p>
            <p className="mt-1 text-sm text-ink-500">Fecha: {shortDate(today)}</p>
          </div>
        </header>
        <section className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">Debe a nombre de</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              <b className="text-ink-900">{c.company || c.name}</b>
              {c.taxId && <><br />NIT / CC {c.taxId}</>}
              {c.company && <><br />{c.name}</>}
              {c.city && <><br />{c.city}</>}
              {c.email && <><br />{c.email}</>}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">Saldo a pagar</p>
            <p className="mt-2 font-display text-4xl text-ink-900">{money(due)}</p>
            {due === 0 && <p className="mt-1 text-sm font-medium text-emerald-700">Pagada en su totalidad ✓</p>}
          </div>
        </section>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-paper-line text-left font-mono text-xs uppercase tracking-wider text-ink-500">
              <th className="py-3 font-normal">Concepto</th>
              <th className="py-3 text-right font-normal">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-paper-line">
              <td className="py-4 pr-4 text-ink-900">{o.title}{o.service && <span className="block text-xs text-ink-500">{o.service}</span>}</td>
              <td className="py-4 text-right tabular-nums text-ink-900">{money(o.amount)}</td>
            </tr>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-paper-line text-ink-600">
                <td className="py-3">Pago en línea · {shortDate(p.createdAt.toISOString().slice(0, 10))} <span className="font-mono text-xs">({p.reference})</span></td>
                <td className="py-3 text-right tabular-nums">−{money(p.amount)}</td>
              </tr>
            ))}
            {o.paid - payments.reduce((a, p) => a + p.amount, 0) > 0 && (
              <tr className="border-b border-paper-line text-ink-600">
                <td className="py-3">Abonos recibidos</td>
                <td className="py-3 text-right tabular-nums">−{money(o.paid - payments.reduce((a, p) => a + p.amount, 0))}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-5 text-right font-medium text-ink-900">Total a pagar</td>
              <td className="pt-5 text-right font-display text-2xl tabular-nums text-ink-900">{money(due)}</td>
            </tr>
          </tfoot>
        </table>
        {s["billing.bank"] && (
          <section className="mt-10 rounded-2xl bg-paper p-5 text-sm">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-500">Para pagar por transferencia</p>
            <p className="mt-2 whitespace-pre-line text-ink-800">{s["billing.bank"]}</p>
          </section>
        )}
        {s["billing.note"] && <p className="mt-8 text-center text-sm text-ink-500">{s["billing.note"]}</p>}
      </article>
    </div>
  );
}
