import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getClientId } from "@/lib/client-session";
import PortalView from "@/components/portal/PortalView";
import { contractedItems } from "@/lib/client-items";
import { shortDate } from "@/lib/format";
import { changeMyPortalPassword, clientLogout, requestChange } from "./actions";

const STATUS: Record<string, [string, string]> = {
  nuevo: ["Recibida", "bg-sky-50 text-sky-700"],
  contactado: ["En revisión", "bg-amber-50 text-amber-700"],
  "en negociación": ["En revisión", "bg-amber-50 text-amber-700"],
  ganado: ["Lista", "bg-emerald-50 text-emerald-700"],
  perdido: ["Cerrada", "bg-paper-2 text-ink-500"],
};

export const metadata: Metadata = { title: "Mi portal", robots: { index: false, follow: false } };

export default async function MyPortal({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; pedir?: string }> }) {
  const cid = await getClientId();
  if (!cid) redirect("/portal/ingresar");
  const client = await prisma.client.findUnique({ where: { id: cid } });
  if (!client || !client.portalHash) redirect("/portal/ingresar");
  const { ok, error, pedir = "" } = await searchParams;
  const [items, requests] = await Promise.all([
    contractedItems(cid),
    client.email ? prisma.lead.findMany({ where: { email: client.email, service: { startsWith: "Portal · " } }, orderBy: { createdAt: "desc" }, take: 20 }) : Promise.resolve([]),
  ]);
  return (
    <PortalView
      client={client}
      account
      headerAction={
        <form action={clientLogout}>
          <button className="rounded-full border border-white/15 px-3 py-1 text-xs text-paper/80 hover:border-white/40 hover:text-white">Salir</button>
        </form>
      }
    >
      {(ok || error) && <p className={`rounded-2xl px-4 py-3 text-sm font-medium ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || ok}</p>}

      <section id="solicitar" className="scroll-mt-6 rounded-3xl border border-paper-line bg-white p-6 sm:p-8">
        <h2 className="font-display text-3xl text-ink-900">Solicitar un cambio</h2>
        <p className="mt-1 text-ink-500">Cuéntanos qué quieres cambiar en tu Puerta, tus turnos, tu menú o tu proyecto. Nuestro equipo lo hace por ti y te avisa.</p>
        <form action={requestChange} className="mt-6 grid gap-4">
          <label className="text-sm">
            <span className="label">¿Sobre qué es?</span>
            <select name="item" defaultValue={pedir} className="input">
              {items.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
              <option value="">Otro tema</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="label">¿Qué necesitas?</span>
            <textarea name="message" rows={5} required minLength={5} maxLength={3000} className="input" placeholder="Ej.: cambiar el número de WhatsApp del botón, agregar el horario de diciembre, poner el link de la nueva carta…" />
          </label>
          <div><button className="btn-signal">Enviar solicitud</button></div>
        </form>
      </section>

      {requests.length > 0 && (
        <section id="solicitudes" className="scroll-mt-6">
          <h2 className="font-display text-3xl text-ink-900">Tus solicitudes</h2>
          <ul className="mt-6 space-y-3">
            {requests.map((r) => {
              const [l, cls] = STATUS[r.status] ?? STATUS.nuevo;
              return (
                <li key={r.id} className="rounded-2xl border border-paper-line bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">{r.service.replace(/^Portal · /, "")}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{l}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[15px] text-ink-800">{r.message}</p>
                  <p className="mt-2 text-xs text-ink-400">{shortDate(r.createdAt.toISOString().slice(0, 10))}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <details className="rounded-3xl border border-paper-line bg-white p-6">
          <summary className="cursor-pointer font-medium text-ink-900">Cambiar mi contraseña</summary>
          <form action={changeMyPortalPassword} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input name="current" type="password" placeholder="Contraseña actual" className="input" required autoComplete="current-password" />
            <input name="next" type="password" placeholder="Nueva (mín. 8)" minLength={8} className="input" required autoComplete="new-password" />
            <button className="btn-primary">Actualizar</button>
          </form>
        </details>
      </section>
    </PortalView>
  );
}
