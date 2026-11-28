import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getClientId } from "@/lib/client-session";
import { applyTransaction, fetchTransaction } from "@/lib/wompi";
import { money } from "@/lib/format";
import Aldo from "@/components/Aldo";

export const metadata: Metadata = { title: "Resultado del pago", robots: { index: false, follow: false } };

const TEXT: Record<string, [string, string]> = {
  aprobado: ["¡Pago recibido!", "Ya quedó sumado a tu proyecto. Gracias."],
  pendiente: ["Tu pago está en proceso", "Algunos medios (como PSE) tardan unos minutos en confirmar. Te avisamos cuando quede listo."],
  rechazado: ["El pago no se aprobó", "Tu banco no autorizó el pago. Puedes intentarlo de nuevo o usar otro medio."],
  anulado: ["El pago se anuló", "No se hizo ningún cobro. Puedes intentarlo de nuevo."],
  error: ["Hubo un error con el pago", "No se hizo ningún cobro. Intenta de nuevo en unos minutos."],
};

/** Wompi devuelve aquí al cliente con ?id=<transacción>. Se consulta el estado y se aplica al pago. */
export default async function PaymentResult({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const cid = await getClientId();
  if (!cid) redirect("/portal/ingresar");
  const { id } = await searchParams;
  const tx = id ? await fetchTransaction(id).catch(() => null) : null;
  const pay = tx ? await applyTransaction(tx) : null;
  const order = pay ? await prisma.order.findFirst({ where: { id: pay.orderId, clientId: cid } }) : null;
  const status = order && pay ? pay.status : "error";
  const [title, text] = TEXT[status] || TEXT.error;
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5">
      <div className="w-full max-w-md rounded-3xl border border-paper-line bg-white p-8 text-center">
        <Aldo pose={status === "aprobado" ? "cheer" : status === "pendiente" ? "think" : "base"} className="mx-auto h-28 w-28" />
        <h1 className="mt-4 font-display text-3xl text-ink-900">{title}</h1>
        <p className="mt-2 text-ink-600">{text}</p>
        {order && pay && (
          <p className="mt-5 rounded-2xl bg-paper p-4 text-sm text-ink-700">
            {order.title} · <b className="text-ink-900">{money(pay.amount)}</b>
            <br />
            <span className="font-mono text-xs text-ink-500">Ref. {pay.reference}</span>
          </p>
        )}
        <Link href="/portal" className="btn-primary mt-6">Volver a mi portal</Link>
      </div>
    </div>
  );
}
