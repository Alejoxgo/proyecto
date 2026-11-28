import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { mailReady } from "@/lib/mail";
import { audienceLabel } from "@/lib/mailing";
import Flash from "@/components/admin/Flash";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteContact, importContacts, newCampaign, syncContacts, toggleContact } from "../../mailing-actions";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";
const STATUS: Record<string, string> = { borrador: "bg-slate-100 text-slate-600", enviando: "bg-amber-50 text-amber-700", enviada: "bg-emerald-50 text-emerald-700" };
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");

export default async function MailingPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; ok?: string; error?: string }> }) {
  await requirePerm("mailing");
  const { tab = "campanas", q = "", ok, error } = await searchParams;
  const [campaigns, subs, total, contacts] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.contact.count({ where: { subscribed: true } }),
    prisma.contact.count(),
    tab === "contactos"
      ? prisma.contact.findMany({ where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }, { tags: { contains: q } }] } : {}, orderBy: { createdAt: "desc" }, take: 200 })
      : Promise.resolve([]),
  ]);
  const sent = campaigns.filter((c) => c.status === "enviada");
  const opens = sent.reduce((a, c) => a + c.openCount, 0);
  const delivered = sent.reduce((a, c) => a + c.sentCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-900">Email marketing</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Escribe campañas (Aldo te ayuda), elige a quién van y mira quién las abre. Cada correo lleva su enlace para darse de baja.</p>
        </div>
        <form action={newCampaign}><button className="btn-primary !py-2 text-sm">+ Nueva campaña</button></form>
      </div>
      <Flash ok={ok} error={error} />
      {!mailReady() && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Para enviar necesitas <b>RESEND_API_KEY</b> en Cloudflare y tu dominio verificado en Resend. Mientras tanto puedes preparar campañas y contactos.</p>}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Suscritos", String(subs)],
          ["Contactos en total", String(total)],
          ["Campañas enviadas", String(sent.length)],
          ["Apertura promedio", pct(opens, delivered)],
        ].map(([l, v]) => (
          <div key={l} className={`${box} p-4`}><p className="text-xs uppercase tracking-wider text-slate-500">{l}</p><p className="mt-1 font-display text-2xl text-ink-900">{v}</p></div>
        ))}
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
        {[["campanas", "Campañas"], ["contactos", "Contactos"]].map(([id, l]) => (
          <Link key={id} href={`/admin/mailing?tab=${id}`} className={`rounded-lg px-4 py-1.5 ${tab === id ? "bg-ink-900 text-white" : "text-slate-600 hover:text-ink-900"}`}>{l}</Link>
        ))}
      </div>

      {tab === "campanas" && (
        <div className={`${box} divide-y divide-slate-100`}>
          {campaigns.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Aún no hay campañas. Crea la primera y deja que Aldo te ayude a escribirla.</p>}
          {campaigns.map((c) => (
            <Link key={c.id} href={`/admin/mailing/${c.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50/70">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{c.subject}</p>
                <p className="truncate text-xs text-slate-500">{audienceLabel(c.audience)}{c.sentAt ? ` · enviada el ${c.sentAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
              </div>
              {c.sentCount > 0 && (
                <div className="flex gap-5 text-xs text-slate-500">
                  <span><b className="text-ink-900">{c.sentCount}</b> enviados</span>
                  <span><b className="text-ink-900">{pct(c.openCount, c.sentCount)}</b> abiertos</span>
                  <span><b className="text-ink-900">{pct(c.clickCount, c.sentCount)}</b> clics</span>
                </div>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS[c.status] ?? ""}`}>{c.status}</span>
            </Link>
          ))}
        </div>
      )}

      {tab === "contactos" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <form className="flex gap-2">
              <input type="hidden" name="tab" value="contactos" />
              <input name="q" defaultValue={q} placeholder="Buscar por correo, nombre o etiqueta…" className="input" />
              <button className="btn-outline shrink-0">Buscar</button>
            </form>
            <div className={`${box} divide-y divide-slate-100`}>
              {contacts.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No hay contactos todavía. Tráelos de tus clientes y solicitudes, o pega una lista.</p>}
              {contacts.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900">{c.name || c.email}</p>
                    <p className="truncate text-xs text-slate-500">{c.name ? `${c.email} · ` : ""}{c.source}{c.tags ? ` · ${c.tags.split(",").filter(Boolean).map((t) => `#${t}`).join(" ")}` : ""}</p>
                  </div>
                  <form action={toggleContact.bind(null, c.id)}>
                    <button className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.subscribed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`} title="Cambiar">{c.subscribed ? "Suscrito" : "De baja"}</button>
                  </form>
                  <form action={deleteContact.bind(null, c.id)}>
                    <ConfirmButton message={`¿Borrar a ${c.email} de la lista?`} className="text-xs text-red-600 hover:underline">Borrar</ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <form action={syncContacts} className={`${box} space-y-3 p-5`}>
              <h2 className="font-semibold text-ink-900">Traer de tu negocio</h2>
              <p className="text-sm text-slate-500">Agrega los correos de tus clientes y de quienes te escribieron por el sitio o el cotizador. No duplica a nadie.</p>
              <button className="btn-primary w-full">Traer contactos</button>
            </form>
            <form action={importContacts} className={`${box} space-y-3 p-5`}>
              <h2 className="font-semibold text-ink-900">Pegar una lista</h2>
              <textarea name="list" rows={6} placeholder={"correo, nombre, etiquetas\nana@empresa.co, Ana Ruiz, restaurante\njuan@mail.com, Juan"} className="input font-mono text-xs" />
              <input name="tag" placeholder="Etiqueta para todos (opcional)" className="input text-sm" />
              <p className="text-xs text-slate-500">Importa solo a personas que aceptaron recibir tus correos.</p>
              <button className="btn-outline w-full">Importar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
