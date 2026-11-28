import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { can, requirePerm } from "@/lib/auth";
import { getResource, ORDER_STATUSES } from "@/lib/resources";
import { money, shortDate } from "@/lib/format";
import ResourceForm from "@/components/admin/ResourceForm";
import Flash from "@/components/admin/Flash";
import AdminIcon from "@/components/admin/AdminIcon";
import ShareLinks from "@/components/admin/ShareLinks";
import NewResource from "../../[resource]/nuevo/page";
import { setClientPortal } from "../../../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

const initials = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
const statusLabel = (v: string) => ORDER_STATUSES.find((o) => o.value === v)?.label ?? v;
const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";

export default async function ClientSpace({ params, searchParams }: Props) {
  const { id } = await params;
  // /admin/clientes/nuevo sigue usando el formulario general.
  if (id === "nuevo") return <NewResource params={Promise.resolve({ resource: "clientes" })} searchParams={searchParams} />;
  const session = await requirePerm("clientes");
  const cid = Number(id);
  if (!Number.isInteger(cid)) notFound();
  const sp = await searchParams;
  const tab = sp.tab || "resumen";
  const client = await prisma.client.findUnique({ where: { id: cid } });
  if (!client) notFound();
  const [orders, puertas, turnos, menus, contact] = await Promise.all([
    prisma.order.findMany({ where: { clientId: cid }, orderBy: { createdAt: "desc" } }),
    prisma.linkPage.findMany({ where: { clientId: cid }, orderBy: { createdAt: "desc" } }),
    prisma.queue.findMany({ where: { clientId: cid }, orderBy: { createdAt: "desc" } }),
    prisma.menuBoard.findMany({ where: { clientId: cid }, orderBy: { updatedAt: "desc" } }),
    client.email ? prisma.contact.findUnique({ where: { email: client.email.toLowerCase() } }).catch(() => null) : null,
  ]);
  const perms = {
    pedidos: await can(session.uid, "pedidos"),
    puertas: await can(session.uid, "puertas"),
    turnos: await can(session.uid, "turnos"),
    menus: await can(session.uid, "menus"),
  };
  const here = `/admin/clientes/${cid}`;
  const back = (t: string) => encodeURIComponent(`${here}?tab=${t}`);
  const billed = orders.filter((o) => !["cotizacion", "cancelado"].includes(o.status));
  const total = billed.reduce((a, o) => a + o.amount, 0);
  const paid = billed.reduce((a, o) => a + o.paid, 0);
  const wa = client.phone.replace(/\D/g, "");

  const TABS = [
    { id: "resumen", label: "Resumen", icon: "home", n: null },
    { id: "pedidos", label: "Pedidos", icon: "orders", n: orders.length, show: perms.pedidos },
    { id: "puertas", label: "Puertas", icon: "door", n: puertas.length, show: perms.puertas },
    { id: "turnos", label: "Turnos", icon: "ticket", n: turnos.length, show: perms.turnos },
    { id: "menus", label: "Menú del día", icon: "menu2", n: menus.length, show: perms.menus },
    { id: "portal", label: "Portal y acceso", icon: "key", n: null },
    { id: "datos", label: "Datos de la empresa", icon: "clients", n: null },
  ].filter((t) => t.show !== false);

  return (
    <div className="space-y-6">
      <Link href="/admin/clientes" className="text-sm text-slate-500 hover:text-ink-900">← Todos los clientes</Link>

      {/* Encabezado de la empresa */}
      <div className={`${box} overflow-hidden`}>
        <div className="h-2" style={{ background: client.color || "#e2471c" }} />
        <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-semibold text-white" style={{ background: client.color || "#e2471c" }}>{initials(client.company || client.name)}</span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl text-ink-900 sm:text-3xl">{client.company || client.name}</h1>
            <p className="truncate text-sm text-slate-500">{[client.company ? client.name : "", client.email, client.phone, client.city].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-700 hover:border-[#25D366] hover:text-[#128C7E]">WhatsApp</a>}
            {client.email && <a href={`mailto:${client.email}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-700 hover:border-ink-900">Correo</a>}
            {client.portalToken && <a href={`/portal/${client.portalToken}`} target="_blank" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-700 hover:border-ink-900">Ver su portal ↗</a>}
          </div>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Menú interno del cliente */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <Link key={t.id} href={`${here}?tab=${t.id}`} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${tab === t.id ? "bg-ink-900 font-medium text-white" : "text-ink-700 hover:bg-white"}`}>
              <AdminIcon name={t.icon} className="h-[18px] w-[18px]" />
              <span className="flex-1">{t.label}</span>
              {t.n !== null && <span className={`rounded-full px-1.5 text-[11px] ${tab === t.id ? "bg-white/15" : "bg-slate-200/70 text-slate-600"}`}>{t.n}</span>}
            </Link>
          ))}
        </nav>

        <section className="min-w-0 space-y-4">
          {tab === "resumen" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Facturado", money(total)],
                  ["Pagado", money(paid)],
                  ["Por cobrar", money(Math.max(0, total - paid))],
                ].map(([l, v]) => (
                  <div key={l} className={`${box} p-4`}><p className="text-xs uppercase tracking-wider text-slate-500">{l}</p><p className="mt-1 font-display text-2xl tabular-nums text-ink-900">{v}</p></div>
                ))}
              </div>
              <div className={`${box} p-5`}>
                <h2 className="font-semibold text-ink-900">Lo que tiene con Aldore</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    ["orders", `${orders.filter((o) => ["aprobado", "en_progreso"].includes(o.status)).length} proyecto(s) en curso`, "pedidos"],
                    ["door", `${puertas.length} Puerta(s) QR / NFC`, "puertas"],
                    ["ticket", `${turnos.length} fila(s) de turnos`, "turnos"],
                    ["menu2", `${menus.length} menú(s) del día`, "menus"],
                  ].map(([ic, l, t]) => (
                    <li key={t}><Link href={`${here}?tab=${t}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-ink-700 hover:bg-slate-100"><AdminIcon name={ic} className="h-4 w-4 text-slate-400" />{l}</Link></li>
                  ))}
                </ul>
                {client.notes && <p className="mt-4 whitespace-pre-line rounded-xl bg-amber-50/60 p-3 text-sm text-ink-700"><b>Notas: </b>{client.notes}</p>}
                <p className="mt-4 text-xs text-slate-500">
                  {client.portalHash ? "Tiene acceso a su portal con correo y contraseña." : "Aún no tiene contraseña para su portal."}{" "}
                  {contact ? (contact.subscribed ? "Recibe tus campañas de correo." : "Se dio de baja de las campañas.") : ""}
                </p>
              </div>
            </>
          )}

          {tab === "pedidos" && (
            <List title="Pedidos" add={`/admin/pedidos/nuevo?clientId=${cid}&back=${back("pedidos")}`} addLabel="Nuevo pedido" empty="Este cliente aún no tiene pedidos.">
              {orders.map((o) => (
                <Row key={o.id} href={`/admin/pedidos/${o.id}?back=${back("pedidos")}`} title={o.title} sub={`${statusLabel(o.status)}${o.dueDate ? ` · entrega ${shortDate(o.dueDate)}` : ""}`} right={<span className="tabular-nums">{money(o.amount)}</span>} />
              ))}
            </List>
          )}

          {tab === "puertas" && (
            <List title="Puertas (QR / NFC)" add={`/admin/puertas/nuevo?clientId=${cid}&name=${encodeURIComponent(client.company || client.name)}&back=${back("puertas")}`} addLabel="Nueva Puerta" empty="Este cliente no tiene Puertas.">
              {puertas.map((p) => (
                <Row key={p.id} href={`/admin/puertas/${p.id}?back=${back("puertas")}`} title={p.name} sub={`aldore.co/p/${p.slug} · ${p.views} visitas · ${p.clicks} toques${p.published ? "" : " · oculta"}`} right={<a href={`/p/${p.slug}`} target="_blank" className="text-xs text-brand-600">Abrir ↗</a>} />
              ))}
            </List>
          )}

          {tab === "turnos" && (
            <List title="Turnos con QR" add={`/admin/turnos/nuevo?clientId=${cid}&name=${encodeURIComponent(client.company || client.name)}&back=${back("turnos")}`} addLabel="Nueva fila de turnos" empty="Este cliente no usa turnos.">
              {turnos.map((q) => (
                <Row key={q.id} href={`/admin/turnos/${q.id}?back=${back("turnos")}`} title={q.name} sub={`Turno actual ${q.prefix}${q.currentNumber} · ${q.lastNumber} dados · ${q.open ? "abierta" : "cerrada"}`} right={<a href={`/t/${q.slug}/pantalla`} target="_blank" className="text-xs text-brand-600">Pantalla ↗</a>} />
              ))}
            </List>
          )}

          {tab === "menus" && (
            <List title="Menú del día" add={`/admin/menus/nuevo?clientId=${cid}&name=${encodeURIComponent(client.company || client.name)}&back=${back("menus")}`} addLabel="Nuevo menú" empty="Este cliente no tiene menú del día.">
              {menus.map((m) => (
                <Row key={m.id} href={`/admin/menus/${m.id}?back=${back("menus")}`} title={m.name} sub={`${m.date ? `Menú del ${shortDate(m.date)}` : "Sin fecha"}${m.price ? ` · ${m.price}` : ""}${m.published ? "" : " · oculto"}`} right={<a href={`/menu/${m.slug}`} target="_blank" className="text-xs text-brand-600">Abrir ↗</a>} />
              ))}
            </List>
          )}

          {tab === "portal" && (
            <div className="space-y-4">
              {client.portalToken && (
                <ShareLinks title="Enlace directo (solo lectura)" links={[{ label: "Ve sus proyectos, pagos y servicios sin contraseña.", path: `/portal/${client.portalToken}`, private: true }]} />
              )}
              <form action={setClientPortal.bind(null, cid)} className={`${box} space-y-4 p-5`}>
                <div>
                  <h2 className="font-semibold text-ink-900">Cuenta del cliente</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Con correo y contraseña entra a <b>aldore.co/portal</b> y ve lo que tiene contratado, sus proyectos y pagos. No puede editar nada: si necesita un cambio lo solicita desde ahí y te llega a Solicitudes web.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm"><span className="label">Correo para entrar</span><input name="email" type="email" defaultValue={client.email} className="input" required /></label>
                  <label className="text-sm"><span className="label">{client.portalHash ? "Nueva contraseña (opcional)" : "Contraseña"}</span><input name="password" type="text" minLength={8} placeholder="Mínimo 8 caracteres" className="input" autoComplete="off" /></label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-primary">{client.portalHash ? "Guardar cambios" : "Darle acceso"}</button>
                  {client.portalHash && <button name="off" value="1" className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">Quitar acceso</button>}
                  <span className={`text-xs ${client.portalHash ? "text-emerald-700" : "text-slate-500"}`}>{client.portalHash ? "● Acceso activo" : "Sin acceso todavía"}</span>
                </div>
              </form>
            </div>
          )}

          {tab === "datos" && (
            <ResourceForm res={getResource("clientes")!} item={client} back={`${here}?tab=datos`} />
          )}
        </section>
      </div>
    </div>
  );
}

function List({ title, add, addLabel, empty, children }: { title: string; add: string; addLabel: string; empty: string; children: React.ReactNode[] }) {
  return (
    <div className={box}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        <Link href={add} className="rounded-lg bg-ink-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">+ {addLabel}</Link>
      </div>
      {children.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">{empty}</p> : <ul className="divide-y divide-slate-100">{children}</ul>}
    </div>
  );
}

function Row({ href, title, sub, right }: { href: string; title: string; sub: string; right?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70">
      <Link href={href} className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{sub}</span>
      </Link>
      {right}
    </li>
  );
}
