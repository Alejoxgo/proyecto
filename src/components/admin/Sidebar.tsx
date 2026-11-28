"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import AdminIcon from "./AdminIcon";
import { UserAvatar } from "@/components/AldoAvatar";
import { permForPath } from "@/lib/permissions";

export const ADMIN_NAV = [
  {
    title: "",
    items: [
      { href: "/admin", label: "Resumen", icon: "home" },
      { href: "/admin/correo", label: "Correo interno", icon: "mail" },
    ],
  },
  {
    title: "Negocio",
    items: [
      { href: "/admin/leads", label: "Solicitudes web", icon: "inbox" },
      { href: "/admin/agenda", label: "Agenda", icon: "calendar" },
      { href: "/admin/pedidos", label: "Pedidos", icon: "orders" },
      { href: "/admin/clientes", label: "Clientes", icon: "clients" },
      { href: "/admin/mailing", label: "Email marketing", icon: "send" },
    ],
  },
  {
    title: "Productos para clientes",
    items: [
      { href: "/admin/puertas", label: "Puertas (QR / NFC)", icon: "door" },
      { href: "/admin/turnos", label: "Turnos con QR", icon: "ticket" },
      { href: "/admin/menus", label: "Menú del día", icon: "menu2" },
    ],
  },
  {
    title: "Equipo",
    items: [
      { href: "/admin/empleados", label: "Empleados", icon: "team" },
      { href: "/admin/nomina", label: "Nómina", icon: "wallet" },
      { href: "/admin/solicitudes", label: "Solicitudes internas", icon: "check" },
    ],
  },
  {
    title: "Sitio web",
    items: [
      { href: "/admin/editor", label: "Editor visual", icon: "spark" },
      { href: "/admin/contenido", label: "Textos del sitio", icon: "text" },
      { href: "/admin/tematicas", label: "Temáticas", icon: "star" },
      { href: "/admin/blog", label: "Blog", icon: "pen" },
      { href: "/admin/servicios", label: "Servicios", icon: "grid" },
      { href: "/admin/productos", label: "Productos", icon: "box" },
      { href: "/admin/planes", label: "Planes y precios", icon: "tag" },
      { href: "/admin/casos", label: "Casos de éxito", icon: "star" },
      { href: "/admin/testimonios", label: "Testimonios", icon: "quote" },
      { href: "/admin/preguntas", label: "Preguntas frecuentes", icon: "help" },
    ],
  },
  {
    title: "Ajustes",
    items: [
      { href: "/admin/usuarios", label: "Usuarios y roles", icon: "key" },
      { href: "/admin/idiomas", label: "Idioma del sitio", icon: "globe" },
    ],
  },
];

function NavList({ path, newLeads, pendingRequests, unreadMail = 0, onNavigate, perms }: { path: string; newLeads: number; pendingRequests: number; unreadMail?: number; onNavigate?: () => void; perms: string[] }) {
  const allowed = new Set(perms);
  const visible = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((it) => { const p = permForPath(it.href); return !p || allowed.has(p); }) })).filter((g) => g.items.length);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/") || path.startsWith(href + "?"));
  return (
    <nav className="space-y-6">
      {visible.map((g) => (
        <div key={g.title || "inicio"}>
          {g.title && <p className="px-3 pb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/35">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const badge = it.href === "/admin/leads" ? newLeads : it.href === "/admin/solicitudes" ? pendingRequests : it.href === "/admin/correo" ? unreadMail : 0;
              const on = active(it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={on ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition ${
                      on ? "bg-white/[0.08] font-medium text-white" : "text-paper/60 hover:bg-white/[0.04] hover:text-paper"
                    }`}
                  >
                    {on && <span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-brand-500" aria-hidden />}
                    <AdminIcon name={it.icon} className={`h-[18px] w-[18px] shrink-0 ${on ? "text-brand-400" : "text-paper/40 group-hover:text-paper/70"}`} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {badge > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Sidebar({
  newLeads,
  pendingRequests = 0,
  unreadMail = 0,
  user,
  brand,
  logout,
  perms,
}: {
  newLeads: number;
  pendingRequests?: number;
  unreadMail?: number;
  user: { name: string; email: string; avatar?: string; title?: string };
  brand: React.ReactNode;
  logout: React.ReactNode;
  perms: string[];
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const initial = (user.name || user.email).trim().charAt(0).toUpperCase();

  const userCard = (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/perfil" title="Mi perfil" className="shrink-0">
          {user.avatar ? <UserAvatar avatar={user.avatar} name={user.name} className="h-10 w-10" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 font-semibold text-white">{initial}</span>}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href="/admin/perfil" className="block truncate text-sm font-medium text-white hover:underline">{user.name}</Link>
          <p className="truncate text-xs text-paper/45">{user.title || user.email}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/" target="_blank" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-xs text-paper/70 transition hover:border-white/25 hover:text-white">
          <AdminIcon name="external" className="h-3.5 w-3.5" /> Ver sitio
        </Link>
        {logout}
      </div>
    </div>
  );

  return (
    <>
      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink-900 lg:flex">
        <div className="flex h-16 items-center px-6">{brand}</div>
        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-2 [scrollbar-width:thin]">
          <NavList path={path} newLeads={newLeads} pendingRequests={pendingRequests} unreadMail={unreadMail} perms={perms} />
        </div>
        {userCard}
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink-900 px-4 lg:hidden">
        {brand}
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="relative rounded-lg p-2 text-paper">
          <AdminIcon name="menu" className="h-6 w-6" />
          {newLeads + pendingRequests + unreadMail > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-ink-900" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/50" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-ink-900 shadow-2xl">
            <div className="flex h-14 items-center justify-between px-4">
              {brand}
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-lg p-2 text-paper/70">
                <AdminIcon name="close" className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-6 pt-2">
              <NavList path={path} newLeads={newLeads} pendingRequests={pendingRequests} unreadMail={unreadMail} onNavigate={() => setOpen(false)} perms={perms} />
            </div>
            {userCard}
          </div>
        </div>
      )}
    </>
  );
}
