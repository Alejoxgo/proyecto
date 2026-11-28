import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { menuDate, parseMenu } from "@/lib/menu";
import { todayCO } from "@/lib/turnos";
import BizShell from "@/components/turnos/Shell";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
const load = (slug: string) => prisma.menuBoard.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await load((await params).slug);
  return m ? { title: { absolute: `Menú del día · ${m.name}` }, description: `${m.name}: el menú de hoy${m.price ? `, ${m.price}` : ""}.` } : {};
}

export default async function MenuPage({ params }: Props) {
  const m = await load((await params).slug);
  if (!m) notFound();
  const items = parseMenu(m.items);
  const isToday = m.date === todayCO() || m.slug === "demo";
  const wa = m.whatsapp.replace(/\D/g, "");
  const waLink = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${m.name}, quiero pedir el menú del día${isToday ? " de hoy" : ""}. 🍽️`)}`
    : null;
  return (
    <BizShell name={m.name} subtitle={m.subtitle} logoUrl={m.logoUrl} color={m.color}>
      <div className="overflow-hidden rounded-[2rem] border border-paper-line bg-white shadow-[0_20px_50px_-30px_rgba(22,19,15,.45)]">
        <div className="px-6 pb-5 pt-6 text-white" style={{ background: m.color }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-85">{isToday ? "Menú de hoy" : "Último menú publicado"}</p>
          <p className="mt-1 font-display text-2xl first-letter:uppercase">{menuDate(m.slug === "demo" ? todayCO() : m.date)}</p>
          {m.price && <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{m.price}</p>}
        </div>
        <ul className="divide-y divide-paper-line px-6">
          {items.length === 0 && <li className="py-6 text-center text-ink-500">Pronto publicamos el menú.</li>}
          {items.map((it, i) => (
            <li key={i} className={`flex items-baseline gap-4 py-4 ${it.soldOut ? "opacity-50" : ""}`}>
              {it.section && <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-400">{it.section}</span>}
              <span className="min-w-0 flex-1">
                <span className={`block font-medium text-ink-900 ${it.soldOut ? "line-through" : ""}`}>{it.dish}</span>
                {it.detail && <span className="block text-sm text-ink-500">{it.detail}</span>}
              </span>
              {it.soldOut && <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Agotado</span>}
            </li>
          ))}
        </ul>
        {(m.notes || m.hours) && (
          <div className="space-y-1 border-t border-paper-line bg-paper/60 px-6 py-4 text-sm text-ink-600">
            {m.hours && <p>🕐 {m.hours}</p>}
            {m.notes && <p className="whitespace-pre-line">{m.notes}</p>}
          </div>
        )}
      </div>
      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-lg font-semibold text-white shadow-lg transition active:scale-[0.98]">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z" /></svg>
          Pedir por WhatsApp
        </a>
      )}
    </BizShell>
  );
}
