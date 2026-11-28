import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getResource, optionLabel, STATUS_COLORS, type ResourceConfig } from "@/lib/resources";
import { currentPeriod, money, shortDate } from "@/lib/format";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import StatusSelect from "@/components/admin/StatusSelect";
import { deleteResource, generatePayroll, markPayrollPaid, setStatus, toggleResource } from "../../actions";

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ ok?: string; error?: string; estado?: string; q?: string; periodo?: string }>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

async function relationLabels(res: ResourceConfig) {
  const out: Record<string, Map<number, string>> = {};
  for (const f of res.fields) {
    if (f.type !== "relation" || !f.relation) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: Row[] = await (prisma as any)[f.relation.model].findMany({ select: { id: true, [f.relation.labelField]: true } });
    out[f.name] = new Map(rows.map((r) => [r.id, String(r[f.relation!.labelField])]));
  }
  return out;
}

export default async function ResourceList({ params, searchParams }: Props) {
  await requireAdmin();
  const res = getResource((await params).resource);
  if (!res) notFound();
  const { ok, error, estado, q, periodo } = await searchParams;

  const where: Row = {};
  if (res.statusField && estado) where[res.statusField] = estado;
  if (q) where[res.titleField] = { contains: q };
  if (res.model === "payroll" && periodo) where.period = periodo;

  const [items, labels] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any)[res.model].findMany({ where, orderBy: res.sort ?? [{ order: "asc" }, { id: "asc" }] }) as Promise<Row[]>,
    relationLabels(res),
  ]);
  const statusOptions = res.statusField ? res.fields.find((f) => f.name === res.statusField)?.options ?? [] : [];
  const isBusiness = Boolean(res.sort);
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ estado, q, periodo, ...extra })) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/${res.key}${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">{res.label}</h1>
          <p className="mt-1 text-sm text-slate-500">{res.description}</p>
        </div>
        <Link href={`/admin/${res.key}/nuevo`} className="btn-primary">+ Nuevo {res.singular}</Link>
      </div>
      <Flash ok={ok} error={error} />

      {res.model === "payroll" && (
        <form action={generatePayroll} className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <div>
            <label htmlFor="period" className="label">Generar nómina del mes</label>
            <input id="period" name="period" type="month" defaultValue={periodo || currentPeriod()} className="input" />
          </div>
          <button className="btn-primary">Generar para empleados activos</button>
          <p className="basis-full text-xs text-slate-500">Crea un registro por cada empleado activo con su salario. Luego ajusta bonos y deducciones si aplica.</p>
        </form>
      )}

      {isBusiness && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <form className="flex gap-2" action={`/admin/${res.key}`}>
            {estado && <input type="hidden" name="estado" value={estado} />}
            {res.model === "payroll" ? (
              <input name="periodo" type="month" defaultValue={periodo} className="input !py-1.5 text-sm" aria-label="Filtrar por periodo" />
            ) : (
              <input name="q" defaultValue={q} placeholder="Buscar…" className="input !py-1.5 text-sm" />
            )}
            <button className="btn-outline !py-1.5 text-sm">Filtrar</button>
          </form>
          {statusOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Link href={qs({ estado: undefined })} className={`rounded-full px-3 py-1 text-xs font-semibold ${!estado ? "bg-ink-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Todos</Link>
              {statusOptions.map((o) => (
                <Link key={o.value} href={qs({ estado: o.value })} className={`rounded-full px-3 py-1 text-xs font-semibold ${estado === o.value ? "bg-ink-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
                  {o.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {res.columns.map((c) => (
                <th key={c.name} className={`whitespace-nowrap px-4 py-3 font-semibold ${c.format === "money" ? "text-right" : ""}`}>{c.label}</th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr><td colSpan={res.columns.length + 1} className="px-4 py-8 text-center text-slate-500">No hay registros {estado || q || periodo ? "con ese filtro" : "todavía"}.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                {res.columns.map((c, i) => {
                  const v = it[c.name];
                  if (c.name === "published") {
                    return (
                      <td key={c.name} className="px-4 py-3">
                        <form action={toggleResource.bind(null, res.key, it.id, !v)}>
                          <button className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`} title="Cambiar visibilidad">
                            {v ? "Visible" : "Oculto"}
                          </button>
                        </form>
                      </td>
                    );
                  }
                  if (c.format === "status") {
                    return (
                      <td key={c.name} className="px-4 py-3">
                        <StatusSelect key={`${it.id}-${v}`} action={setStatus.bind(null, res.key, it.id)} value={v} options={statusOptions} className={STATUS_COLORS[v] ?? "bg-slate-100"} />
                      </td>
                    );
                  }
                  let text: React.ReactNode = v ?? "";
                  if (c.format === "money") text = money(v);
                  else if (c.format === "date") text = shortDate(v) || "—";
                  else if (c.format === "relation") text = labels[c.name]?.get(v) ?? "—";
                  else if (c.format === "bool" || typeof v === "boolean") text = v ? "Sí" : "—";
                  else if (c.name === "period") text = <span className="whitespace-nowrap capitalize">{shortDate(v)}</span>;
                  else if (res.fields.find((f) => f.name === c.name)?.options) text = optionLabel(res, c.name, v);
                  return (
                    <td key={c.name} className={`px-4 py-3 ${c.format === "money" ? "whitespace-nowrap text-right tabular-nums" : ""} ${i === 0 ? "font-medium text-ink-900" : "text-slate-600"}`}>
                      {i === 0 ? <Link href={`/admin/${res.key}/${it.id}`} className="hover:text-brand-700">{text}</Link> : text}
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {res.model === "payroll" && it.status !== "pagado" && (
                      <form action={markPayrollPaid.bind(null, it.id)}>
                        <button className="whitespace-nowrap rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Marcar pagado</button>
                      </form>
                    )}
                    <Link href={`/admin/${res.key}/${it.id}`} className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-white">Editar</Link>
                    <form action={deleteResource.bind(null, res.key, it.id)}>
                      <ConfirmButton message="¿Eliminar este registro? Esta acción no se puede deshacer." className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                        Eliminar
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {res.totals && items.length > 0 && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-ink-900">
              <tr>
                {res.columns.map((c, i) => (
                  <td key={c.name} className={`px-4 py-3 ${c.format === "money" ? "whitespace-nowrap text-right tabular-nums" : ""}`}>
                    {i === 0 ? `Total (${items.length})` : res.totals!.includes(c.name) ? money(items.reduce((a, it) => a + (it[c.name] ?? 0), 0)) : ""}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
