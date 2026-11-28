import { prisma } from "@/lib/db";

const GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) => c.charCodeAt(0));

/** Píxel de apertura: marca la primera vez que alguien abre el correo de una campaña. */
export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  try {
    const s = await prisma.campaignSend.findUnique({ where: { key } });
    if (s && !s.openedAt) {
      await prisma.campaignSend.update({ where: { id: s.id }, data: { openedAt: new Date() } });
      await prisma.campaign.update({ where: { id: s.campaignId }, data: { openCount: { increment: 1 } } });
    }
  } catch {}
  return new Response(GIF, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store, max-age=0" } });
}
