"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function unsubscribe(token: string) {
  await prisma.contact.updateMany({ where: { token }, data: { subscribed: false } });
  redirect(`/baja/${token}?listo=1`);
}

export async function resubscribe(token: string) {
  await prisma.contact.updateMany({ where: { token }, data: { subscribed: true } });
  redirect(`/baja/${token}`);
}
