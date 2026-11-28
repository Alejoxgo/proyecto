import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { getQueue, queueSnapshot } from "@/lib/turnos";
import { QueueScreen } from "@/components/turnos/TurnosLive";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Pantalla de turnos" }, robots: { index: false } };

export default async function Screen({ params }: Props) {
  const { slug } = await params;
  const q = await getQueue(slug);
  const s = await queueSnapshot(slug);
  if (!q || !s) notFound();
  const url = `${(process.env.SITE_URL || "https://aldore.co").replace(/\/$/, "")}/t/${slug}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1 });
  return <QueueScreen slug={slug} initial={s} logo={q.logoUrl} qr={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} />;
}
