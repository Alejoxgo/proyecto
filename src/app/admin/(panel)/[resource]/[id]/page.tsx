import PuertaStatsCard from "@/components/PuertaStatsCard";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResource } from "@/lib/resources";
import ResourceForm from "@/components/admin/ResourceForm";
import Flash from "@/components/admin/Flash";
import RelatedRecords from "@/components/admin/RelatedRecords";
import PuertaShare from "@/components/admin/PuertaShare";
import ShareLinks from "@/components/admin/ShareLinks";

type Props = { params: Promise<{ resource: string; id: string }>; searchParams: Promise<{ error?: string; ok?: string; back?: string }> };

export default async function EditResource({ params, searchParams }: Props) {
  await requireAdmin();
  const { resource, id } = await params;
  const res = getResource(resource);
  const numId = Number(id);
  if (!res || !Number.isInteger(numId)) notFound();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = await (prisma as any)[res.model].findUnique({ where: { id: numId } });
  if (!item) notFound();
  const { error, ok, back } = await searchParams;
  const backTo = back && back.startsWith("/admin/") ? back : undefined;
  const publicUrl = res.model === "service" ? `/servicios/${item.slug}` : res.model === "product" ? `/productos/${item.slug}` : res.model === "linkPage" ? `/p/${item.slug}` : res.model === "post" ? `/blog/${item.slug}` : res.model === "queue" ? `/t/${item.slug}` : res.model === "menuBoard" ? `/menu/${item.slug}` : null;
  return (
    <div className="max-w-3xl">
      <Link href={backTo || `/admin/${res.key}`} className="text-sm text-slate-500 hover:text-brand-700">← {backTo ? "Volver al cliente" : res.label}</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink-900">Editar: {item[res.titleField]}</h1>
        {publicUrl && <Link href={publicUrl} target="_blank" className="text-sm font-medium text-brand-600">Ver en el sitio ↗</Link>}
      </div>
      <Flash ok={ok} error={error} />
      {res.model === "linkPage" && <PuertaShare slug={item.slug} views={item.views} clicks={item.clicks} />}
      {res.model === "linkPage" && <div className="mb-6"><PuertaStatsCard pageId={item.id} name={item.name} tone="admin" /></div>}
      {res.model === "client" && item.portalToken && (
        <ShareLinks
          title="Portal del cliente"
          links={[{ label: "Envíale este enlace: ve sus proyectos, pagos y servicios. No necesita contraseña.", path: `/portal/${item.portalToken}`, private: true }]}
        />
      )}
      {res.model === "queue" && (
        <ShareLinks
          title={`Turnos · turno actual ${item.prefix}${item.currentNumber} · ${item.lastNumber} dados hoy`}
          qrFor={`/t/${item.slug}`}
          qrName={`turnos-${item.slug}`}
          links={[
            { label: "Para los clientes (el QR lleva aquí)", path: `/t/${item.slug}`, help: "Imprime el QR en la entrada o en el mostrador." },
            { label: "Para quien atiende: botón «Llamar siguiente»", path: `/t/${item.slug}/atender?k=${item.staffKey}`, private: true, help: "Ábrelo en el celular o computador de recepción." },
            { label: "Pantalla para TV o tablet", path: `/t/${item.slug}/pantalla` },
          ]}
        />
      )}
      {res.model === "menuBoard" && (
        <ShareLinks
          title="Menú del día"
          qrFor={`/menu/${item.slug}`}
          qrName={`menu-${item.slug}`}
          links={[
            { label: "Página pública del menú (el QR lleva aquí)", path: `/menu/${item.slug}` },
            { label: "Para el restaurante: cambiar el menú desde el celular", path: `/menu/${item.slug}/editar?k=${item.staffKey}`, private: true, help: "Envíaselo al dueño o al administrador del restaurante." },
          ]}
        />
      )}
      {res.model === "order" && <OrderPayments orderId={item.id} />}
      <ResourceForm res={res} item={item} back={backTo} />
      <RelatedRecords model={res.model} id={numId} />
    </div>
  );
}

const PAY_BADGE: Record<string, string> = { aprobado: "bg-emerald-50 text-emerald-700", pendiente: "bg-amber-50 text-amber-700", rechazado: "bg-red-50 text-red-700", anulado: "bg-slate-100 text-slate-500", error: "bg-red-50 text-red-700" };

/** Pagos en línea (Wompi) del pedido. Los aprobados ya están sumados en «Pagado». */
async function OrderPayments({ orderId }: { orderId: number }) {
  const pays = await prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: "desc" }, take: 20 });
  if (!pays.length) return null;
  return (
    <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
      <p className="text-xs uppercase tracking-wider text-slate-500">Pagos en línea</p>
      <ul className="mt-3 divide-y divide-slate-100 text-sm">
        {pays.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
            <span className="font-mono text-xs text-slate-500">{p.reference}</span>
            <span className="text-slate-500">{p.method || "—"} · {p.createdAt.toISOString().slice(0, 10)}</span>
            <span className="font-medium tabular-nums text-ink-900">${p.amount.toLocaleString("es-CO")}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAY_BADGE[p.status] || PAY_BADGE.pendiente}`}>{p.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
