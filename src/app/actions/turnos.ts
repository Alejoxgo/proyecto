"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { randomKey } from "@/lib/utils";
import { getQueue, resetIfNewDay } from "@/lib/turnos";

export async function takeTicket(slug: string, fd: FormData) {
  const q = await getQueue(slug);
  if (!q || !q.open) redirect(`/t/${slug}`);
  await resetIfNewDay(q.id);
  const updated = await prisma.queue.update({ where: { id: q.id }, data: { lastNumber: { increment: 1 } } });
  const code = randomKey(12);
  const name = String(fd.get("name") ?? "").trim().slice(0, 40);
  await prisma.ticket.create({ data: { queueId: q.id, number: updated.lastNumber, name, code } });
  redirect(`/t/${slug}/${code}`);
}

export async function cancelTicket(slug: string, code: string) {
  const q = await getQueue(slug);
  if (q) await prisma.ticket.updateMany({ where: { queueId: q.id, code, status: "esperando" }, data: { status: "cancelado" } });
  redirect(`/t/${slug}`);
}

async function staffQueue(slug: string, key: string) {
  const q = await getQueue(slug);
  if (!q || !q.staffKey || key !== q.staffKey) throw new Error("Enlace no válido");
  return q;
}

function back(slug: string, key: string, msg?: string) {
  revalidatePath(`/t/${slug}/atender`);
  redirect(`/t/${slug}/atender?k=${encodeURIComponent(key)}${msg ? `&m=${encodeURIComponent(msg)}` : ""}`);
}

export async function callNext(slug: string, key: string) {
  const q = await staffQueue(slug, key);
  await resetIfNewDay(q.id);
  const next = await prisma.ticket.findFirst({ where: { queueId: q.id, status: "esperando" }, orderBy: { number: "asc" } });
  await prisma.ticket.updateMany({ where: { queueId: q.id, status: "llamado" }, data: { status: "atendido" } });
  if (!next) {
    back(slug, key, "No hay nadie esperando.");
    return;
  }
  await prisma.ticket.update({ where: { id: next.id }, data: { status: "llamado", calledAt: new Date() } });
  await prisma.queue.update({ where: { id: q.id }, data: { currentNumber: next.number } });
  back(slug, key);
}

export async function skipCurrent(slug: string, key: string) {
  const q = await staffQueue(slug, key);
  await prisma.ticket.updateMany({ where: { queueId: q.id, status: "llamado" }, data: { status: "ausente" } });
  back(slug, key, "Turno marcado como ausente.");
}

export async function toggleOpen(slug: string, key: string) {
  const q = await staffQueue(slug, key);
  await prisma.queue.update({ where: { id: q.id }, data: { open: !q.open } });
  back(slug, key, q.open ? "Ya no se reciben turnos nuevos." : "Se reciben turnos de nuevo.");
}

export async function resetQueue(slug: string, key: string) {
  const q = await staffQueue(slug, key);
  await prisma.ticket.updateMany({ where: { queueId: q.id, status: { in: ["esperando", "llamado"] } }, data: { status: "vencido" } });
  await prisma.queue.update({ where: { id: q.id }, data: { lastNumber: 0, currentNumber: 0 } });
  back(slug, key, "Turnos reiniciados. El próximo será el 1.");
}
