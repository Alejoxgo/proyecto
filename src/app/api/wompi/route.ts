import { NextResponse, type NextRequest } from "next/server";
import { applyTransaction, sha256Hex } from "@/lib/wompi";

type WompiEvent = {
  event?: string;
  data?: { transaction?: { id: string; reference: string; status: string; amount_in_cents: number; payment_method_type?: string } };
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
};

/** Webhook de Wompi: verifica la firma del evento y actualiza el pago. Se configura en el panel de Wompi. */
export async function POST(req: NextRequest) {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return NextResponse.json({ error: "sin-configurar" }, { status: 503 });
  let ev: WompiEvent;
  try {
    ev = await req.json();
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  const props = ev.signature?.properties ?? [];
  const values = props.map((p) => p.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), ev.data));
  const expected = await sha256Hex(`${values.join("")}${ev.timestamp ?? ""}${secret}`);
  if (!ev.signature?.checksum || expected !== ev.signature.checksum.toLowerCase()) return NextResponse.json({ error: "firma" }, { status: 401 });
  if (ev.event === "transaction.updated" && ev.data?.transaction) await applyTransaction(ev.data.transaction);
  return NextResponse.json({ ok: true });
}
