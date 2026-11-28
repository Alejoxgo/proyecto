import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Logo from "@/components/Logo";
import Aldo from "@/components/Aldo";
import { resubscribe, unsubscribe } from "./actions";

export const metadata: Metadata = { title: "Preferencias de correo", robots: { index: false } };

export default async function Unsubscribe({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ listo?: string }> }) {
  const { token } = await params;
  const { listo } = await searchParams;
  const c = token.length >= 12 ? await prisma.contact.findUnique({ where: { token } }) : null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-block"><Logo name="aldore" /></Link>
        <div className="mt-6 rounded-3xl border border-paper-line bg-white p-8">
          <Aldo pose={c?.subscribed === false ? "sleep" : "wave"} className="mx-auto h-24 w-24" />
          {!c ? (
            <p className="mt-4 text-ink-700">Este enlace no es válido o ya no existe.</p>
          ) : c.subscribed ? (
            <>
              <h1 className="mt-4 font-display text-2xl text-ink-900">¿Dejar de recibir nuestros correos?</h1>
              <p className="mt-2 text-sm text-ink-500">{c.email}</p>
              <form action={unsubscribe.bind(null, token)} className="mt-6"><button className="btn-primary w-full justify-center">Sí, darme de baja</button></form>
            </>
          ) : (
            <>
              <h1 className="mt-4 font-display text-2xl text-ink-900">{listo ? "Listo, ya no te escribiremos." : "Ya estás dado de baja."}</h1>
              <p className="mt-2 text-sm text-ink-500">Si fue un error, puedes volver cuando quieras.</p>
              <form action={resubscribe.bind(null, token)} className="mt-6"><button className="btn-outline w-full justify-center">Volver a suscribirme</button></form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
