import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { PERM_GROUPS, parsePerms } from "@/lib/permissions";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteRole, saveRole } from "../../../actions";
import { ensureRoles } from "@/lib/roles";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

function PermChecks({ value }: { value: string[] }) {
  const on = new Set(value);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {PERM_GROUPS.map((g) => (
        <fieldset key={g.title} className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">{g.title}</legend>
          <div className="space-y-2.5">
            {g.perms.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" name="perms" value={p.id} defaultChecked={on.has(p.id)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                <span>
                  <b className="block font-medium text-ink-900">{p.label}</b>
                  <span className="text-xs text-slate-500">{p.help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireOwner();
  await ensureRoles();
  const { ok, error } = await searchParams;
  const [roles, counts] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.user.groupBy({ by: ["roleId"], _count: { _all: true }, where: { role: { not: "admin" } } }),
  ]);
  const used = new Map(counts.map((c) => [c.roleId, c._count._all]));

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <Link href="/admin/usuarios" className="text-sm text-slate-500 hover:text-ink-900">← Usuarios</Link>
        <h1 className="mt-1 font-display text-3xl text-ink-900">Roles y permisos</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Arma cada rol marcando lo que puede ver y hacer. El <b>Administrador</b> siempre tiene todo. Quien no tenga un permiso no ve esa sección en el menú ni puede entrar por el enlace.
        </p>
      </div>
      <Flash ok={ok} error={error} />

      <div className={`${box} flex items-center gap-4 p-5`}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 font-display text-lg text-brand-700">★</span>
        <div className="flex-1">
          <p className="font-semibold text-ink-900">Administrador</p>
          <p className="text-sm text-slate-500">Todos los permisos, incluido crear administradores. No se puede editar.</p>
        </div>
      </div>

      {roles.map((r) => {
        const perms = parsePerms(r.perms);
        const n = used.get(r.id) ?? 0;
        return (
          <details key={r.id} className={`${box} group`}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 font-display text-lg text-sky-700">{r.name.charAt(0)}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">{r.name}</p>
                <p className="text-sm text-slate-500">{r.description || "Sin descripción"}</p>
              </div>
              <span className="text-xs text-slate-500">{perms.length} permisos · {n} usuario{n === 1 ? "" : "s"}</span>
              <span className="text-xs font-medium text-ink-700 group-open:hidden">Editar</span>
              <span className="hidden text-xs font-medium text-ink-700 group-open:inline">Cerrar</span>
            </summary>
            <div className="border-t border-slate-100 p-5">
              <form action={saveRole.bind(null, r.id)} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                  <label className="text-sm"><span className="label">Nombre</span><input name="name" defaultValue={r.name} className="input" required /></label>
                  <label className="text-sm"><span className="label">Descripción</span><input name="description" defaultValue={r.description} className="input" /></label>
                </div>
                <PermChecks value={perms} />
                <button className="btn-primary">Guardar rol</button>
              </form>
              <form action={deleteRole.bind(null, r.id)} className="mt-3">
                <ConfirmButton message={`¿Eliminar el rol «${r.name}»?`} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Eliminar rol</ConfirmButton>
              </form>
            </div>
          </details>
        );
      })}

      <form action={saveRole.bind(null, null)} className={`${box} space-y-4 p-6`}>
        <h2 className="font-semibold text-ink-900">Crear un rol</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <input name="name" placeholder="Nombre (ej. Contador)" className="input" required />
          <input name="description" placeholder="¿Para quién es este rol?" className="input" />
        </div>
        <PermChecks value={[]} />
        <button className="btn-primary">Crear rol</button>
      </form>
    </div>
  );
}
