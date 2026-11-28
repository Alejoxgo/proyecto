import "server-only";
import { prisma } from "@/lib/db";

/** Pagos con Wompi (tarjeta, PSE, Nequi, Bancolombia). Se activa con WOMPI_PUBLIC_KEY y WOMPI_INTEGRITY_SECRET. */
export function wompiReady() {
  return Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_INTEGRITY_SECRET);
}

function apiBase() {
  const k = process.env.WOMPI_PUBLIC_KEY || "";
  return process.env.WOMPI_API_URL || (k.startsWith("pub_test_") ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1");
}

export async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** URL del checkout de Wompi con la firma de integridad. */
export async function checkoutUrl(opts: { reference: string; amount: number; redirectUrl: string; email?: string; name?: string }) {
  const cents = opts.amount * 100;
  const signature = await sha256Hex(`${opts.reference}${cents}COP${process.env.WOMPI_INTEGRITY_SECRET}`);
  const q = new URLSearchParams({
    "public-key": process.env.WOMPI_PUBLIC_KEY || "",
    currency: "COP",
    "amount-in-cents": String(cents),
    reference: opts.reference,
    "signature:integrity": signature,
    "redirect-url": opts.redirectUrl,
  });
  if (opts.email) q.set("customer-data:email", opts.email);
  if (opts.name) q.set("customer-data:full-name", opts.name);
  return `https://checkout.wompi.co/p/?${q.toString()}`;
}

const STATUS: Record<string, string> = { APPROVED: "aprobado", DECLINED: "rechazado", VOIDED: "anulado", ERROR: "error", PENDING: "pendiente" };

/**
 * Aplica el estado de una transacción de Wompi a su pago. Si queda aprobada por primera vez,
 * suma el valor a lo pagado del pedido. Es seguro llamarla varias veces (webhook y retorno).
 */
export async function applyTransaction(tx: { id: string; reference: string; status: string; amount_in_cents: number; payment_method_type?: string }) {
  const pay = await prisma.payment.findUnique({ where: { reference: tx.reference } });
  if (!pay) return null;
  const status = STATUS[tx.status] || "pendiente";
  if (status === "aprobado" && tx.amount_in_cents !== pay.amount * 100) {
    console.error("Wompi: el monto no coincide", tx.reference, tx.amount_in_cents, pay.amount);
    return pay;
  }
  if (status === "aprobado") {
    const changed = await prisma.payment.updateMany({ where: { id: pay.id, status: { not: "aprobado" } }, data: { status, wompiId: tx.id, method: tx.payment_method_type || "" } });
    if (changed.count === 1) await prisma.order.update({ where: { id: pay.orderId }, data: { paid: { increment: pay.amount } } });
  } else if (pay.status !== "aprobado") {
    await prisma.payment.update({ where: { id: pay.id }, data: { status, wompiId: tx.id, method: tx.payment_method_type || "" } });
  }
  return prisma.payment.findUnique({ where: { id: pay.id } });
}

/** Consulta una transacción por su id (endpoint público de Wompi). */
export async function fetchTransaction(id: string) {
  const r = await fetch(`${apiBase()}/transactions/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) return null;
  const j = (await r.json()) as { data?: { id: string; reference: string; status: string; amount_in_cents: number; payment_method_type?: string } };
  return j.data ?? null;
}
