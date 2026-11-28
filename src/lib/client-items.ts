import "server-only";
import { prisma } from "@/lib/db";

/** Lo que el cliente tiene contratado, con una etiqueta legible. La clave es "o12" (pedido), "p3" (Puerta), "q1" (turnos) o "m2" (menú). */
export async function contractedItems(cid: number) {
  const [orders, puertas, queues, menus] = await Promise.all([
    prisma.order.findMany({ where: { clientId: cid, status: { not: "cancelado" } }, select: { id: true, title: true } }),
    prisma.linkPage.findMany({ where: { clientId: cid }, select: { id: true, name: true } }),
    prisma.queue.findMany({ where: { clientId: cid }, select: { id: true, name: true } }),
    prisma.menuBoard.findMany({ where: { clientId: cid }, select: { id: true, name: true } }),
  ]);
  return [
    ...orders.map((o) => ({ key: `o${o.id}`, label: `Proyecto: ${o.title}` })),
    ...puertas.map((p) => ({ key: `p${p.id}`, label: `Puerta: ${p.name}` })),
    ...queues.map((q) => ({ key: `q${q.id}`, label: `Turnos: ${q.name}` })),
    ...menus.map((m) => ({ key: `m${m.id}`, label: `Menú del día: ${m.name}` })),
  ];
}
