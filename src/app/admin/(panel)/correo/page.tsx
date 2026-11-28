import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { UserAvatar } from "@/components/AldoAvatar";
import { deleteInternal, sendInternal } from "../../actions";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";
const when = (d: Date) => {
  const now = new Date();
  const same = d.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat("es-CO", same ? { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" } : { day: "numeric", month: "short", timeZone: "America/Bogota" }).format(d);
};

type SP = { f?: string; m?: string; nuevo?: string; para?: string; re?: string; ok?: string; error?: string };

export default async function MailPage({ searchParams }: { searchParams: Promise<SP> }) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const folder = sp.f === "enviados" ? "enviados" : "entrada";
  const users = await prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, avatar: true, title: true } });
  const byId = new Map(users.map((u) => [u.id, u]));

  const list = await prisma.internalMessage.findMany({
    where: folder === "entrada" ? { toId: session.uid, toDeleted: false } : { fromId: session.uid, fromDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = await prisma.internalMessage.count({ where: { toId: session.uid, readAt: null, toDeleted: false } });

  const openId = Number.parseInt(sp.m ?? "", 10);
  let open = openId ? await prisma.internalMessage.findUnique({ where: { id: openId } }) : null;
  if (open && open.toId !== session.uid && open.fromId !== session.uid) open = null;
  if (open && open.toId === session.uid && !open.readAt) {
    open = await prisma.internalMessage.update({ where: { id: open.id }, data: { readAt: new Date() } });
  }
  const replyOf = sp.re ? await prisma.internalMessage.findUnique({ where: { id: Number(sp.re) } }) : null;
  const composing = sp.nuevo === "1" || Boolean(sp.re);
  const preTo = sp.para ? Number(sp.para) : replyOf ? replyOf.fromId : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Correo interno</h1>
          <p className="mt-1 text-sm text-slate-500">Mensajes entre las personas del panel. Si el correo está configurado, también les llega un aviso a su email.</p>
        </div>
        <Link href="/admin/correo?nuevo=1" className="btn-primary">Escribir mensaje</Link>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <nav className={`${box} p-2 text-sm`}>
            {[
              ["entrada", "Bandeja de entrada", unread],
              ["enviados", "Enviados", 0],
            ].map(([id, label, n]) => (
              <Link key={id as string} href={`/admin/correo?f=${id}`} className={`flex items-center justify-between rounded-xl px-3 py-2 ${folder === id ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-slate-50"}`}>
                {label}
                {Number(n) > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">{n}</span>}
              </Link>
            ))}
          </nav>
          <div className={`${box} p-4`}>
            <p className="text-xs uppercase tracking-wider text-slate-400">Equipo</p>
            <ul className="mt-3 space-y-2.5">
              {users.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/correo?nuevo=1&para=${u.id}`} className="flex items-center gap-2.5 rounded-lg p-1 hover:bg-slate-50">
                    <UserAvatar avatar={u.avatar} name={u.name} className="h-8 w-8" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink-900">{u.name}{u.id === session.uid ? " (tú)" : ""}</span>
                      <span className="block truncate text-xs text-slate-500">{u.title || u.email}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          {composing && (
            <form action={sendInternal} className={`${box} space-y-4 p-5`}>
              <h2 className="font-semibold text-ink-900">{replyOf ? "Responder" : "Nuevo mensaje"}</h2>
              {replyOf && <input type="hidden" name="replyTo" value={replyOf.id} />}
              <fieldset>
                <legend className="label">Para</legend>
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => (
                    <label key={u.id} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-paper-line py-1 pl-1 pr-3 text-sm has-[:checked]:border-ink-900 has-[:checked]:bg-ink-900 has-[:checked]:text-white">
                      <input type="checkbox" name="to" value={u.id} defaultChecked={u.id === preTo} className="sr-only" />
                      <UserAvatar avatar={u.avatar} name={u.name} className="h-6 w-6 text-[10px]" />
                      {u.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <input name="subject" defaultValue={replyOf ? (replyOf.subject.startsWith("Re:") ? replyOf.subject : `Re: ${replyOf.subject}`) : ""} placeholder="Asunto" className="input" />
              <textarea name="body" rows={8} placeholder="Escribe tu mensaje…" className="input" required />
              <div className="flex gap-2">
                <button className="btn-primary">Enviar</button>
                <Link href="/admin/correo" className="btn-outline">Cancelar</Link>
              </div>
            </form>
          )}

          {open && !composing && (
            <article className={`${box} p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UserAvatar avatar={byId.get(open.fromId)?.avatar} name={byId.get(open.fromId)?.name ?? "?"} className="h-11 w-11" />
                  <div>
                    <p className="font-medium text-ink-900">{byId.get(open.fromId)?.name ?? "Usuario eliminado"}</p>
                    <p className="text-xs text-slate-500">para {byId.get(open.toId)?.name ?? "?"} · {when(open.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {open.toId === session.uid && byId.has(open.fromId) && <Link href={`/admin/correo?re=${open.id}`} className="btn-primary !py-2">Responder</Link>}
                  <form action={deleteInternal.bind(null, open.id)}>
                    <ConfirmButton message="¿Eliminar este mensaje?" className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</ConfirmButton>
                  </form>
                </div>
              </div>
              <h2 className="mt-6 font-display text-2xl text-ink-900">{open.subject}</h2>
              <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-700">{open.body}</div>
            </article>
          )}

          <div className={`divide-y divide-slate-100 ${box}`}>
            {list.length === 0 && <p className="p-6 text-sm text-slate-500">{folder === "entrada" ? "No tienes mensajes. 🦉 Aldo vigila la bandeja por ti." : "Aún no has enviado mensajes."}</p>}
            {list.map((m) => {
              const other = byId.get(folder === "entrada" ? m.fromId : m.toId);
              const isNew = folder === "entrada" && !m.readAt;
              return (
                <Link key={m.id} href={`/admin/correo?f=${folder}&m=${m.id}`} className={`flex items-center gap-3 p-4 transition hover:bg-slate-50 ${open?.id === m.id ? "bg-slate-50" : ""}`}>
                  <UserAvatar avatar={other?.avatar} name={other?.name ?? "?"} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${isNew ? "font-semibold text-ink-900" : "text-ink-700"}`}>
                      {folder === "enviados" && <span className="text-slate-400">Para: </span>}
                      {other?.name ?? "Usuario eliminado"}
                    </p>
                    <p className={`truncate text-sm ${isNew ? "text-ink-900" : "text-slate-500"}`}>{m.subject} <span className="text-slate-400">— {m.body.slice(0, 80)}</span></p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-slate-400">{when(m.createdAt)}</span>
                    {isNew && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
