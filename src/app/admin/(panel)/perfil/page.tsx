import { prisma } from "@/lib/db";
import { getAccess, requireAdmin } from "@/lib/auth";
import { mailReady } from "@/lib/mail";
import Flash from "@/components/admin/Flash";
import AvatarPicker from "@/components/admin/AvatarPicker";
import { UserAvatar } from "@/components/AldoAvatar";
import TotpSetup from "@/components/admin/TotpSetup";
import PasskeyManager from "@/components/admin/PasskeyManager";
import { PERM_GROUPS } from "@/lib/permissions";
import { changePassword, updateMyProfile } from "../../actions";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await requireAdmin();
  const { ok, error } = await searchParams;
  const [me, access, passkeys] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.uid } }),
    getAccess(session.uid),
    prisma.passkey.findMany({ where: { userId: session.uid }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!me) return null;
  const level = me.totpOn || passkeys.length ? "alta" : mailReady() ? "media" : "baja";

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <UserAvatar avatar={me.avatar} name={me.name} className="h-16 w-16" />
        <div>
          <h1 className="font-display text-3xl text-ink-900">Mi perfil</h1>
          <p className="text-sm text-slate-500">{me.title ? `${me.title} · ` : ""}{me.email} · {access.roleName}</p>
        </div>
      </div>
      <Flash ok={ok} error={error} />

      <form action={updateMyProfile} className={`grid gap-4 p-6 sm:grid-cols-2 ${box}`}>
        <h2 className="font-semibold text-ink-900 sm:col-span-2">Datos</h2>
        <label className="text-sm"><span className="label">Nombre</span><input name="name" defaultValue={me.name} className="input" required /></label>
        <label className="text-sm"><span className="label">Cargo</span><input name="title" defaultValue={me.title} placeholder="Ej: Gerente, Desarrollador, Soporte" className="input" /></label>
        <div className="sm:col-span-2"><span className="label">Foto de perfil</span><AvatarPicker name={me.name} value={me.avatar} /></div>
        <div className="sm:col-span-2"><button className="btn-primary">Guardar mi perfil</button></div>
      </form>

      {/* Seguridad */}
      <section className={`${box} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <div>
            <h2 className="font-semibold text-ink-900">Seguridad de tu cuenta</h2>
            <p className="mt-1 text-sm text-slate-500">Además de la contraseña, puedes pedir un segundo paso al entrar.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${level === "alta" ? "bg-emerald-50 text-emerald-700" : level === "media" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
            Protección {level}
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-ink-900">Código por correo</h3>
            <p className="mt-1 text-sm text-slate-500">
              {mailReady() ? "Activo para todos: si no usas app autenticadora, te enviamos un código al correo al entrar desde un equipo nuevo." : "Se activa solo cuando el envío de correos (Resend) esté configurado."}
            </p>
          </div>
          <div className="p-6">
            <TotpSetup on={me.totpOn} />
          </div>
          <div className="p-6">
            <PasskeyManager keys={passkeys.map((p) => ({ id: p.id, name: p.name, created: p.createdAt.toISOString(), lastUsed: p.lastUsed?.toISOString() ?? null }))} />
          </div>
        </div>
      </section>

      <form action={changePassword} className={`grid gap-4 p-6 sm:grid-cols-2 ${box}`}>
        <h2 className="font-semibold text-ink-900 sm:col-span-2">Cambiar mi contraseña</h2>
        <input name="current" type="password" placeholder="Contraseña actual" className="input" required autoComplete="current-password" />
        <input name="next" type="password" placeholder="Nueva contraseña (mín. 10)" minLength={10} className="input" required autoComplete="new-password" />
        <div className="sm:col-span-2"><button className="btn-primary">Actualizar contraseña</button></div>
      </form>

      <section className={`${box} p-6`}>
        <h2 className="font-semibold text-ink-900">Lo que puedes hacer en el panel</h2>
        <p className="mt-1 text-sm text-slate-500">Tu rol: <b className="text-ink-900">{access.roleName}</b>. Si necesitas algo más, pídeselo a un administrador.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PERM_GROUPS.flatMap((g) => g.perms).map((p) => (
            <li key={p.id} className={`flex items-center gap-2 text-sm ${access.perms.has(p.id) ? "text-ink-900" : "text-slate-400 line-through"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${access.perms.has(p.id) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{access.perms.has(p.id) ? "✓" : "–"}</span>
              {p.label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
