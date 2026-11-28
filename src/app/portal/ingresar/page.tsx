import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import Aldo from "@/components/Aldo";
import { getClientId } from "@/lib/client-session";
import ClientLoginForm from "./ClientLoginForm";

export const metadata: Metadata = { title: "Portal de clientes", robots: { index: false } };

export default async function ClientLogin() {
  if (await getClientId()) redirect("/portal");
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-2 flex flex-col items-center gap-3"><Link href="/" aria-label="Aldore"><Logo name="aldore" /></Link><Aldo pose="wave" className="h-24 w-24" /></div>
        <div className="rounded-3xl border border-paper-line bg-white p-8 shadow-xl shadow-black/5">
          <h1 className="font-display text-2xl text-ink-900">Portal de clientes</h1>
          <p className="mt-1 text-sm text-ink-500">Entra para ver tus proyectos y manejar tu Puerta, tu menú y tus turnos.</p>
          <ClientLoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">¿No tienes acceso? Escríbenos y te lo activamos.</p>
      </div>
    </div>
  );
}
