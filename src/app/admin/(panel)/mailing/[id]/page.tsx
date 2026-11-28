import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { mailReady } from "@/lib/mail";
import { audienceWhere } from "@/lib/mailing";
import { groqReady } from "@/lib/i18n";
import Flash from "@/components/admin/Flash";
import CampaignEditor from "@/components/admin/CampaignEditor";

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const session = await requirePerm("mailing");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) notFound();
  const { ok, error } = await searchParams;
  const tagRows = await prisma.contact.findMany({ where: { subscribed: true, tags: { not: "" } }, select: { tags: true } });
  const tags = [...new Set(tagRows.flatMap((r) => r.tags.split(",").map((t) => t.trim()).filter(Boolean)))].sort();
  const counts = Object.fromEntries(
    await Promise.all(["todos", "clientes", "solicitudes", ...tags.map((t) => `tag:${t}`)].map(async (a) => [a, await prisma.contact.count({ where: audienceWhere(a) })] as const)),
  );
  return (
    <div className="space-y-5">
      <Link href="/admin/mailing" className="text-sm text-slate-500 hover:text-ink-900">← Email marketing</Link>
      <Flash ok={ok} error={error} />
      <CampaignEditor
        c={{ id: c.id, subject: c.subject, preheader: c.preheader, body: c.body, ctaLabel: c.ctaLabel, ctaUrl: c.ctaUrl, audience: c.audience, status: c.status, sentCount: c.sentCount, openCount: c.openCount, clickCount: c.clickCount }}
        counts={counts}
        tags={tags}
        me={session.name}
        mail={mailReady()}
        ai={groqReady()}
      />
    </div>
  );
}
