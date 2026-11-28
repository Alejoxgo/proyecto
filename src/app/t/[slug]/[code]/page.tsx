import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQueue, queueSnapshot } from "@/lib/turnos";
import { cancelTicket } from "@/app/actions/turnos";
import BizShell from "@/components/turnos/Shell";
import { MyTicket } from "@/components/turnos/TurnosLive";

type Props = { params: Promise<{ slug: string; code: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Tu turno" }, robots: { index: false } };

export default async function TicketPage({ params }: Props) {
  const { slug, code } = await params;
  const q = await getQueue(slug);
  const s = await queueSnapshot(slug, code);
  if (!q || !s || !s.mine) notFound();
  return (
    <BizShell name={q.name} subtitle={q.subtitle} logoUrl={q.logoUrl} color={q.color}>
      <MyTicket
        slug={slug}
        code={code}
        initial={s}
        cancel={
          <form action={cancelTicket.bind(null, slug, code)}>
            <button className="text-sm text-ink-500 underline underline-offset-4 hover:text-ink-900">Ya no lo necesito, cancelar turno</button>
          </form>
        }
      />
    </BizShell>
  );
}
