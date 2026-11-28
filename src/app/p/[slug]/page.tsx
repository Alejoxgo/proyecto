import { bumpPuerta } from "@/lib/puerta-stats";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseButtons, puertaBg } from "@/lib/puerta";
import PuertaView from "@/components/PuertaView";

type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) => prisma.linkPage.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return {};
  return {
    title: { absolute: p.name },
    description: p.subtitle || `${p.name}: todo a un toque.`,
    robots: { index: false },
    icons: p.logoUrl ? [{ url: p.logoUrl }] : undefined,
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const p = await load((await params).slug);
  return { themeColor: p ? puertaBg(p) : "#16130f" };
}

export default async function PuertaPage({ params }: Props) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  await Promise.all([
    prisma.linkPage.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => {}),
    bumpPuerta(p.id, "view"),
  ]);
  const buttons = parseButtons(p.buttons).map((b, i) => ({
    ...b,
    link: b.href === "wifi" ? "wifi" : `/p/${p.slug}/ir?b=${i}`,
  }));
  return (
    <main className="min-h-dvh" style={{ background: puertaBg(p) }}>
      <PuertaView
        data={{
          name: p.name,
          subtitle: p.subtitle,
          logoUrl: p.logoUrl,
          coverUrl: p.coverUrl,
          color: p.color,
          bgColor: p.bgColor,
          theme: p.theme,
          font: p.font,
          buttonStyle: p.buttonStyle,
          buttons,
          wifiName: p.wifiName,
          wifiPass: p.wifiPass,
        }}
      />
    </main>
  );
}

