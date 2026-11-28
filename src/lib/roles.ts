import "server-only";
import { prisma } from "./db";
import { DEFAULT_ROLES } from "./permissions";

/** La primera vez crea los roles de ejemplo, para no empezar de cero. */
export async function ensureRoles() {
  if ((await prisma.role.count()) > 0) return;
  for (const r of DEFAULT_ROLES) await prisma.role.create({ data: { name: r.name, description: r.description, perms: r.perms.join(",") } }).catch(() => {});
  // Los editores de antes quedan con el rol "Editor de contenido".
  const editor = await prisma.role.findFirst({ where: { name: DEFAULT_ROLES[0].name } });
  if (editor) await prisma.user.updateMany({ where: { role: "editor", roleId: null }, data: { roleId: editor.id } });
}

