import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAccess, requireOwner } from "@/lib/auth";
import { parsePerms } from "@/lib/permissions";
import { ensureRoles } from "@/lib/roles";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { createUser, deleteUser, updateUser } from "../../actions";
import AvatarPicker from "@/components/admin/AvatarPicker";
import { UserAvatar } from "@/components/AldoAvatar";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

type RoleOpt = { id: number; name: string };
function RoleSelect({ value, roles, canAdmin, disabled }: { value: string; roles: RoleOpt[]; canAdmin: boolean; disabled?: boolean }) {
  return (
    <select name="role" defaultValue={value} className="input" disabled={disabled}>
      {canAdmin && <option value="admin">Administrador (todo)</option>}
      {roles.map((r) => <option key={r.id} value={`role:${r.id}`}>{r.name}</option>)}
    </select>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await requireOwner();
  await ensureRoles();
  const { ok, error } = await searchParams;
  const [me, users, roles, keys] = await Promise.all([
    getAccess(session.uid),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.passkey.groupBy({ by: ["userId"], _count: { _all: true } }),
  ]);
  const roleName = (u: (typeof users)[number]) => (u.role === "admin" ? "Administrador" : roles.find((r) => r.id === u.roleId)?.name ?? "Editor");
  const keyCount = new Map(keys.map((k) => [k.userId, k._count._all]));

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Usuarios del panel</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Quién entra al panel y qué puede hacer. Cada persona tiene un rol; los roles se arman con casillas de permisos.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/usuarios/roles" className="btn-outline !py-2 text-sm">Roles y permisos</Link>
          <a href="#nuevo" className="btn-primary !py-2 text-sm">Agregar usuario</a>
        </div>
      </div>
      <Flash ok={ok} error={error} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`${box} p-4`}><p className="text-xs uppercase tracking-wider text-slate-500">Usuarios</p><p className="mt-1 font-display text-2xl text-ink-900">{users.length}</p></div>
        <div className={`${box} p-4`}><p className="text-xs uppercase tracking-wider text-slate-500">Administradores</p><p className="mt-1 font-display text-2xl text-ink-900">{users.filter((u) => u.role === "admin").length}</p></div>
        <div className={`${box} p-4`}><p className="text-xs uppercase tracking-wider text-slate-500">Con segundo factor</p><p className="mt-1 font-display text-2xl text-ink-900">{users.filter((u) => u.totpOn || keyCount.get(u.id)).length} / {users.length}</p></div>
      </div>

      <div className={`divide-y divide-slate-100 ${box}`}>
        {users.map((u) => {
          const self = u.id === session.uid;
          const locked = u.role === "admin" && !me.admin;
          const mfa = [u.totpOn && "App", keyCount.get(u.id) && `${keyCount.get(u.id)} llave(s)`].filter(Boolean).join(" · ");
          const roleValue = u.role === "admin" ? "admin" : `role:${u.roleId ?? roles[0]?.id ?? ""}`;
          return (
            <details key={u.id} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar avatar={u.avatar} name={u.name} className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{u.name} {self && <span className="text-xs text-slate-400">(tú)</span>}</p>
                    <p className="truncate text-sm text-slate-500">{u.title ? `${u.title} · ` : ""}{u.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`hidden rounded-full px-2 py-0.5 text-[11px] sm:inline ${mfa ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{mfa || "Sin 2.º factor"}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "admin" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"}`}>{roleName(u)}</span>
                  <span className="text-xs font-medium text-ink-700 group-open:hidden">Editar</span>
                  <span className="hidden text-xs font-medium text-ink-700 group-open:inline">Cerrar</span>
                </div>
              </summary>
              {locked ? (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Solo otro administrador puede editar a un administrador.</p>
              ) : (
                <>
                  <form action={updateUser.bind(null, u.id)} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm"><span className="label">Nombre</span><input name="name" defaultValue={u.name} className="input" required /></label>
                    <label className="text-sm"><span className="label">Correo</span><input name="email" type="email" defaultValue={u.email} className="input" required /></label>
                    <label className="text-sm">
                      <span className="label">Rol</span>
                      <RoleSelect value={roleValue} roles={roles} canAdmin={me.admin} disabled={self} />
                      {self && <input type="hidden" name="role" value={roleValue} />}
                    </label>
                    <label className="text-sm"><span className="label">Cargo</span><input name="title" defaultValue={u.title} className="input" /></label>
                    <label className="text-sm"><span className="label">Nueva contraseña (opcional)</span><input name="password" type="password" minLength={10} placeholder="Déjala vacía para no cambiarla" className="input" autoComplete="new-password" /></label>
                    {!self && (u.totpOn || keyCount.get(u.id)) ? (
                      <label className="flex items-center gap-2 self-end pb-3 text-sm text-ink-700">
                        <input type="checkbox" name="resetMfa" className="h-4 w-4" /> Quitar su app autenticadora y llaves (perdió el celular)
                      </label>
                    ) : <span />}
                    <div className="sm:col-span-2"><span className="label">Foto de perfil</span><AvatarPicker name={u.name} value={u.avatar} /></div>
                    <div className="sm:col-span-2"><button className="btn-primary">Guardar cambios</button></div>
                  </form>
                  {!self && (
                    <form action={deleteUser.bind(null, u.id)} className="mt-3">
                      <ConfirmButton message={`¿Eliminar a ${u.name}? Ya no podrá entrar al panel.`} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Eliminar usuario</ConfirmButton>
                    </form>
                  )}
                </>
              )}
            </details>
          );
        })}
      </div>

      <form id="nuevo" action={createUser} className={`grid scroll-mt-6 gap-4 p-6 sm:grid-cols-2 ${box}`}>
        <h2 className="font-semibold text-ink-900 sm:col-span-2">Agregar usuario</h2>
        <input name="name" placeholder="Nombre" className="input" required />
        <input name="email" type="email" placeholder="Correo" className="input" required />
        <input name="title" placeholder="Cargo (ej. Diseñadora)" className="input" />
        <input name="password" type="password" placeholder="Contraseña temporal (mín. 10)" minLength={10} className="input" required autoComplete="new-password" />
        <label className="text-sm sm:col-span-2">
          <span className="label">Rol</span>
          <RoleSelect value={roles[0] ? `role:${roles[0].id}` : "admin"} roles={roles} canAdmin={me.admin} />
          <span className="mt-1 block text-xs text-slate-500">
            Lo que puede hacer cada rol lo defines en <Link href="/admin/usuarios/roles" className="underline">Roles y permisos</Link>.
            {roles.map((r) => ` ${r.name}: ${parsePerms(r.perms).length} permisos.`).join("")}
          </span>
        </label>
        <div className="sm:col-span-2"><button className="btn-primary">Crear usuario</button></div>
      </form>
    </div>
  );
}
