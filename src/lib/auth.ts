import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "./session";
import { ALL_PERMS, DEFAULT_ROLES, parsePerms, permForPath, type Perm } from "./permissions";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export type Access = { admin: boolean; perms: Set<Perm>; roleName: string };

/** Permisos del usuario, leídos de la base en cada petición (un cambio de rol aplica de inmediato). */
export const getAccess = cache(async (uid: number): Promise<Access> => {
  const { prisma } = await import("./db");
  const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true, roleId: true } });
  if (!u) return { admin: false, perms: new Set(), roleName: "" };
  if (u.role === "admin") return { admin: true, perms: new Set(ALL_PERMS), roleName: "Administrador" };
  if (u.roleId) {
    const r = await prisma.role.findUnique({ where: { id: u.roleId } });
    if (r) return { admin: false, perms: new Set(parsePerms(r.perms)), roleName: r.name };
  }
  // Editores creados antes de los roles: permisos del editor de contenido.
  return { admin: false, perms: new Set(DEFAULT_ROLES[0].perms), roleName: "Editor" };
});

export async function can(uid: number, perm: Perm) {
  return (await getAccess(uid)).perms.has(perm);
}

/**
 * Úsalo al inicio de cada server action / página del panel. Además de exigir sesión, revisa que el
 * usuario tenga permiso para la sección en la que está (la ruta la pasa el middleware).
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  let path: string | null = null;
  try {
    path = (await headers()).get("x-pathname");
  } catch {}
  const need = permForPath(path);
  if (need && !(await can(session.uid, need))) redirect(`/admin?error=${encodeURIComponent("No tienes permiso para entrar a esa sección. Pídeselo a un administrador.")}`);
  return session;
}

/** Exige un permiso concreto (para acciones que se pueden llamar desde cualquier pantalla). */
export async function requirePerm(perm: Perm) {
  const session = await requireAdmin();
  if (!(await can(session.uid, perm))) redirect(`/admin?error=${encodeURIComponent("No tienes permiso para hacer eso.")}`);
  return session;
}

export const ROLES = { admin: "Administrador", editor: "Con rol" } as const;
export type Role = keyof typeof ROLES;

export async function currentRole(uid: number): Promise<Role> {
  return (await getAccess(uid)).admin ? "admin" : "editor";
}

/** Gestionar usuarios y roles: exige el permiso "usuarios". */
export async function requireOwner() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!(await can(session.uid, "usuarios"))) {
    redirect(`/admin/perfil?error=${encodeURIComponent("Solo quien tiene el permiso «Usuarios y roles» puede crear, editar o eliminar usuarios.")}`);
  }
  return session;
}
