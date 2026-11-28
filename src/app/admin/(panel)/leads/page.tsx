import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { LEAD_STATUSES, STATUS_STYLES } from "@/lib/leads";
import Flash from "@/components/admin/Flash";

type Props = { searchParams: Promise<{ estado?: string; q?: string; ok?: string }> };

export default async function LeadsPage({ searchParams }: Props) {
  await requireAdmin();
  const { estado = "", q = "", ok } = await searchParams;
  const where = {
    ...(estado ? { status: estado } : {}),
    ...(q
      ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { company: { contains: q } }, { message: { contains: q } }] }
      : {}),
  };
  const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 });
  const fmt = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Solicitudes web</h1>
          <p className="mt-1 text-sm text-slate-500">Mensajes recibidos desde los formularios del sitio.</p>
        </div>
        <a href="/api/admin/leads/export" className="btn-outline">Exportar CSV</a>
      </div>
      <Flash ok={ok} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, correo, empresa…" className="input max-w-xs" />
        <select name="estado" defaultValue={estado} className="input max-w-[200px]">
          <option value="">Todos los estados</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-outline">Filtrar</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Interés</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay solicitudes con estos filtros.</td></tr>}
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmt.format(l.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="font-medium text-ink-900 hover:text-brand-700">{l.name}</Link>
                  {l.company && <div className="text-xs text-slate-500">{l.company}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{l.email}</div>
                  {l.phone && <div className="text-xs">{l.phone}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">{l.service || "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[l.status] ?? ""}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
