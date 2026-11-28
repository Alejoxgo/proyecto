import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import SetupForm from "./SetupForm";
import { prisma } from "@/lib/db";
import Logo from "@/components/Logo";
import Aldo from "@/components/Aldo";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Ingreso al panel", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const { motivo } = await searchParams;
  if (await getSession()) redirect("/admin");
  const [s, users] = await Promise.all([getSettings(), prisma.user.count()]);
  const setup = users === 0;
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-2 flex flex-col items-center gap-4"><Logo name={s["site.name"]} light /><Aldo pose="code" className="h-28 w-28" /></div>
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-ink-900">{setup ? "Configura tu panel" : "Panel de administración"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {setup ? "Aún no hay administradores. Crea el primero para empezar." : "Ingresa con tu cuenta de administrador."}
          </p>
          {setup ? <SetupForm needsCode={Boolean(process.env.SETUP_CODE) || process.env.NODE_ENV === "production"} /> : <LoginForm notice={motivo === "inactividad" ? "Cerramos tu sesión por inactividad. Ingresa de nuevo." : undefined} />}
        </div>
        <Link href="/" className="mt-6 block text-center text-sm text-paper/50 hover:text-paper">← Volver al sitio</Link>
      </div>
    </div>
  );
}
