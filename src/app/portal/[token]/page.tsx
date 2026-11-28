import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import PortalView from "@/components/portal/PortalView";

export const metadata: Metadata = { title: "Portal del cliente", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }> };

export default async function Portal({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 12) notFound();
  const client = await prisma.client.findFirst({ where: { portalToken: token } });
  if (!client) notFound();
  return <PortalView client={client} />;
}
