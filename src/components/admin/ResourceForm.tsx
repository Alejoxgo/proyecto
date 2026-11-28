import Link from "next/link";
import type { ResourceConfig, ResourceField } from "@/lib/resources";
import { saveResource } from "@/app/admin/actions";
import { prisma } from "@/lib/db";
import { currentPeriod } from "@/lib/format";

async function relationOptions(f: ResourceField) {
  if (!f.relation) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await (prisma as any)[f.relation.model].findMany({
    where: f.relation.where,
    orderBy: { [f.relation.labelField]: "asc" },
    select: { id: true, [f.relation.labelField]: true },
  });
  return rows.map((r) => ({ value: String(r.id), label: String(r[f.relation!.labelField]) }));
}

type Props = {
  res: ResourceConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item?: Record<string, any> | null;
  /** Valores iniciales para un registro nuevo (por ejemplo desde la URL). */
  initial?: Record<string, string>;
  /** A dónde volver al guardar o cancelar (por ejemplo, el espacio de un cliente). */
  back?: string;
};

export default async function ResourceForm({ res, item, initial, back }: Props) {
  const backTo = back && /^\/admin\/[\w/?=&-]*$/.test(back) ? back : null;
  const action = saveResource.bind(null, res.key, item?.id ?? null);
  const relations = Object.fromEntries(
    await Promise.all(res.fields.filter((f) => f.type === "relation").map(async (f) => [f.name, await relationOptions(f)] as const)),
  );
  const defaultFor = (f: ResourceField) => {
    if (item) return item[f.name] ?? "";
    if (initial?.[f.name] !== undefined) return initial[f.name];
    if (res.defaults?.[f.name] !== undefined) return res.defaults[f.name];
    if (f.type === "month") return currentPeriod();
    if (f.type === "number" || f.type === "money") return 0;
    if (f.type === "select") return f.options?.[0]?.value ?? "";
    return "";
  };

  return (
    <form action={action} className="grid gap-5 rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)] p-6 sm:grid-cols-2">
      {backTo && <input type="hidden" name="_back" value={backTo} />}
      {res.fields.map((f) => {
        const value = defaultFor(f);
        const id = `f-${f.name}`;
        const span = f.half ? "" : "sm:col-span-2";
        if (f.type === "checkbox") {
          const checked = item ? Boolean(item[f.name]) : f.name === "published" || f.name === "active";
          return (
            <label key={f.name} className={`flex items-center gap-3 text-sm font-medium text-slate-700 ${span}`}>
              <input type="checkbox" name={f.name} defaultChecked={checked} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              {f.label}
            </label>
          );
        }
        let input: React.ReactNode;
        if (f.type === "textarea") {
          input = <textarea id={id} name={f.name} rows={f.rows ?? 4} defaultValue={value} className="input font-[inherit]" required={f.required} />;
        } else if (f.type === "select") {
          input = (
            <select id={id} name={f.name} defaultValue={value} className="input">
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          );
        } else if (f.type === "relation") {
          const options = relations[f.name] ?? [];
          input = (
            <select id={id} name={f.name} defaultValue={value === null ? "" : String(value)} className="input" required={f.required}>
              <option value="">{f.required ? "Elige…" : "— Sin asignar —"}</option>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          );
        } else {
          const type =
            f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "month" ? "month" : f.type === "email" ? "email" : "text";
          input = (
            <div className={f.type === "money" ? "relative" : undefined}>
              {f.type === "money" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>}
              <input
                id={id}
                name={f.name}
                type={type}
                inputMode={f.type === "money" ? "numeric" : undefined}
                defaultValue={value}
                className={`input ${f.type === "money" ? "pl-7 tabular-nums" : ""}`}
                required={f.required}
                placeholder={f.type === "url" ? "https://…" : undefined}
              />
            </div>
          );
        }
        return (
          <div key={f.name} className={`min-w-0 ${span}`}>
            <label htmlFor={id} className="label">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {input}
            {f.type === "relation" && (relations[f.name]?.length ?? 0) === 0 && (
              <p className="mt-1 text-xs text-amber-700">
                Aún no hay registros.{" "}
                <Link href={`/admin/${f.relation?.model === "client" ? "clientes" : "empleados"}/nuevo`} className="underline">Crear uno</Link>
              </p>
            )}
            {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
          </div>
        );
      })}
      <div className="flex gap-3 border-t border-slate-100 pt-5 sm:col-span-2">
        <button className="btn-primary">Guardar</button>
        <Link href={backTo || `/admin/${res.key}`} className="btn-outline">Cancelar</Link>
      </div>
    </form>
  );
}
