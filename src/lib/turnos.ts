import "server-only";
import { prisma } from "./db";

/** Fecha de hoy en Medellín (AAAA-MM-DD). Los turnos se reinician cada día. */
export function todayCO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export const getQueue = (slug: string) => prisma.queue.findFirst({ where: { slug } });

/** Si el último turno es de otro día, empieza desde cero y cierra los que quedaron pendientes. */
export async function resetIfNewDay(queueId: number) {
  const last = await prisma.ticket.findFirst({ where: { queueId }, orderBy: { id: "desc" }, select: { createdAt: true } });
  if (last && todayCO(last.createdAt) !== todayCO()) {
    await prisma.ticket.updateMany({ where: { queueId, status: { in: ["esperando", "llamado"] } }, data: { status: "vencido" } });
    await prisma.queue.update({ where: { id: queueId }, data: { lastNumber: 0, currentNumber: 0 } });
    return true;
  }
  return false;
}

export async function queueSnapshot(slug: string, code?: string | null) {
  const q = await getQueue(slug);
  if (!q) return null;
  const [waiting, next, recent, mine] = await Promise.all([
    prisma.ticket.count({ where: { queueId: q.id, status: "esperando" } }),
    prisma.ticket.findMany({ where: { queueId: q.id, status: "esperando" }, orderBy: { number: "asc" }, take: 4, select: { number: true, name: true } }),
    prisma.ticket.findMany({ where: { queueId: q.id, status: { in: ["llamado", "atendido"] } }, orderBy: { calledAt: "desc" }, take: 4, select: { number: true } }),
    code ? prisma.ticket.findFirst({ where: { queueId: q.id, code } }) : Promise.resolve(null),
  ]);
  const ahead = mine && mine.status === "esperando" ? await prisma.ticket.count({ where: { queueId: q.id, status: "esperando", number: { lt: mine.number } } }) : 0;
  return {
    name: q.name,
    prefix: q.prefix,
    color: q.color,
    open: q.open,
    current: q.currentNumber,
    avgMinutes: q.avgMinutes,
    waiting,
    next: next.map((t) => t.number),
    recent: recent.map((t) => t.number).filter((n) => n !== q.currentNumber).slice(0, 3),
    mine: mine ? { number: mine.number, status: mine.status, name: mine.name, ahead } : null,
  };
}

export type QueueSnapshot = NonNullable<Awaited<ReturnType<typeof queueSnapshot>>>;
