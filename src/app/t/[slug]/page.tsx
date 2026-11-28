import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQueue, queueSnapshot } from "@/lib/turnos";
import { takeTicket } from "@/app/actions/turnos";
import BizShell from "@/components/turnos/Shell";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const q = await getQueue((await params).slug);
  return q ? { title: { absolute: `Turnos · ${q.name}` }, robots: { index: false } } : {};
}

export default async function TakeTurn({ params }: Props) {
  const { slug } = await params;
  const q = await getQueue(slug);
  const s = await queueSnapshot(slug);
  if (!q || !s) notFound();
  const fmt = (n: number) => (n ? `${q.prefix}${String(n).padStart(2, "0")}` : "—");
  return (
    <BizShell name={q.name} subtitle={q.subtitle} logoUrl={q.logoUrl} color={q.color}>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl border border-paper-line bg-white p-4">
          <p className="text-xs text-ink-500">Atendiendo ahora</p>
          <p className="mt-1 font-display text-4xl tabular-nums">{fmt(s.current)}</p>
        </div>
        <div className="rounded-2xl border border-paper-line bg-white p-4">
          <p className="text-xs text-ink-500">En espera</p>
          <p className="mt-1 font-display text-4xl tabular-nums">{s.waiting}</p>
        </div>
      </div>
      {q.open ? (
        <form action={takeTicket.bind(null, slug)} className="mt-6 space-y-3">
          <input name="name" maxLength={40} placeholder="Tu nombre (opcional)" className="input !rounded-2xl !py-3.5 text-base" />
          <button className="w-full rounded-2xl py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98]" style={{ background: q.color }}>
            Tomar turno
          </button>
          <p className="text-center text-sm text-ink-500">
            Espera aproximada: {Math.max(0, s.waiting * q.avgMinutes)} min. Te avisamos en esta misma página cuando sea tu turno.
          </p>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl border border-paper-line bg-white p-5 text-center text-ink-700">En este momento no estamos dando turnos. Vuelve a intentarlo más tarde.</p>
      )}
    </BizShell>
  );
}
