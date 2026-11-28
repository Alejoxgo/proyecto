import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LEAD_STATUSES } from "@/lib/leads";
import { whatsappLink } from "@/lib/utils";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteLead, leadToOrder, updateLead } from "../../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> };

export default async function LeadDetail({ params, searchParams }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();
  const { ok } = await searchParams;
  const order = await prisma.order.findFirst({ where: { leadId: id }, select: { id: true } });
  const wa = lead.phone ? whatsappLink(lead.phone, `Hola ${lead.name}, te escribimos por tu solicitud.`) : "";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/leads" className="text-sm text-slate-500 hover:text-brand-700">← Solicitudes web</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink-900">{lead.name}</h1>
        {order ? (
          <Link href={`/admin/pedidos/${order.id}`} className="btn-outline">Ver pedido →</Link>
        ) : (
          <form action={leadToOrder.bind(null, lead.id)}>
            <button className="btn-primary">Convertir en pedido</button>
          </form>
        )}
      </div>
      <Flash ok={ok} />
      <div className="grid gap-6">
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)] p-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Correo</dt><dd className="font-medium"><a href={`mailto:${lead.email}`} className="text-brand-700">{lead.email}</a></dd></div>
            <div><dt className="text-slate-500">Teléfono</dt><dd className="font-medium">{lead.phone || "—"} {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="ml-2 text-emerald-600">WhatsApp ↗</a>}</dd></div>
            <div><dt className="text-slate-500">Empresa</dt><dd className="font-medium">{lead.company || "—"}</dd></div>
            <div><dt className="text-slate-500">Interés</dt><dd className="font-medium">{lead.service || "—"}</dd></div>
            <div><dt className="text-slate-500">Recibido</dt><dd className="font-medium">{lead.createdAt.toLocaleString("es-CO")}</dd></div>
          </dl>
          <div className="mt-6">
            <p className="text-sm text-slate-500">Mensaje</p>
            <p className="mt-1 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-slate-800">{lead.message}</p>
          </div>
        </div>
        <form action={updateLead.bind(null, lead.id)} className="space-y-4 rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)] p-6">
          <h2 className="font-semibold text-ink-900">Seguimiento</h2>
          <div>
            <label className="label" htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={lead.status} className="input max-w-xs">
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="notes">Notas internas</label>
            <textarea id="notes" name="notes" rows={4} defaultValue={lead.notes} className="input" />
          </div>
          <button className="btn-primary">Guardar</button>
        </form>
        <form action={deleteLead.bind(null, lead.id)}>
          <ConfirmButton message="¿Eliminar este lead?" className="text-sm font-medium text-red-600 hover:underline">Eliminar lead</ConfirmButton>
        </form>
      </div>
    </div>
  );
}
