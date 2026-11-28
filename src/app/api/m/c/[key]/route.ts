import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Clic en el botón de la campaña: se cuenta y se lleva a la persona al enlace de esa campaña (nunca a otro). */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const home = new URL("/", req.url);
  try {
    const s = await prisma.campaignSend.findUnique({ where: { key } });
    if (!s) return NextResponse.redirect(home);
    const c = await prisma.campaign.findUnique({ where: { id: s.campaignId }, select: { ctaUrl: true } });
    if (!s.clickedAt) {
      await prisma.campaignSend.update({ where: { id: s.id }, data: { clickedAt: new Date(), openedAt: s.openedAt ?? new Date() } });
      await prisma.campaign.update({ where: { id: s.campaignId }, data: { clickCount: { increment: 1 }, ...(s.openedAt ? {} : { openCount: { increment: 1 } }) } });
    }
    return NextResponse.redirect(c?.ctaUrl && /^https?:\/\//.test(c.ctaUrl) ? c.ctaUrl : home);
  } catch {
    return NextResponse.redirect(home);
  }
}
