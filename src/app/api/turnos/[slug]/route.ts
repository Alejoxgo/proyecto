import { NextResponse } from "next/server";
import { queueSnapshot } from "@/lib/turnos";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = new URL(req.url).searchParams.get("code");
  const snap = await queueSnapshot(slug, code);
  if (!snap) return NextResponse.json({ error: "No existe" }, { status: 404 });
  return NextResponse.json(snap, { headers: { "Cache-Control": "no-store" } });
}
