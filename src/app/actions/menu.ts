"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function saveMenu(slug: string, key: string, fd: FormData) {
  const m = await prisma.menuBoard.findFirst({ where: { slug } });
  if (!m || !m.staffKey || key !== m.staffKey) throw new Error("Enlace no válido");
  const get = (k: string, max = 4000) => String(fd.get(k) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
  const date = get("date", 10);
  await prisma.menuBoard.update({
    where: { id: m.id },
    data: {
      date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : m.date,
      price: get("price", 120),
      items: get("items"),
      notes: get("notes", 500),
      published: fd.get("published") === "on",
    },
  });
  revalidatePath(`/menu/${slug}`);
  redirect(`/menu/${slug}/editar?k=${encodeURIComponent(key)}&ok=1`);
}
