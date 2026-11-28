"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePerm } from "@/lib/auth";

/** Marca una llamada como hecha, cancelada o de nuevo agendada. */
export async function setBookingStatus(id: number, status: string) {
  await requirePerm("leads");
  if (!["agendada", "hecha", "cancelada"].includes(status)) return;
  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/agenda");
}
