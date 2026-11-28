import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Baja con un clic (cabecera List-Unsubscribe de Gmail y Outlook): POST da de baja; GET lleva a la página. */
export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await prisma.contact.updateMany({ where: { token }, data: { subscribed: false } }).catch(() => {});
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return NextResponse.redirect(new URL(`/baja/${encodeURIComponent(token)}`, req.url));
}
