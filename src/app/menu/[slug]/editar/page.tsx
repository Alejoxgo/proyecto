import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { saveMenu } from "@/app/actions/menu";
import { todayCO } from "@/lib/turnos";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ k?: string; ok?: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { absolute: "Cambiar el menú" }, robots: { index: false } };

export default async function EditMenu({ params, searchParams }: Props) {
  const { slug } = await params;
  const { k = "", ok } = await searchParams;
  const m = await prisma.menuBoard.findFirst({ where: { slug } });
  if (!m || !m.staffKey || k !== m.staffKey) notFound();
  const today = todayCO();
  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto max-w-lg px-5 py-8">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-500">Cambiar el menú del día</p>
        <h1 className="font-display text-3xl text-ink-900">{m.name}</h1>
        {ok && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ¡Listo! El menú ya está publicado. <a href={`/menu/${slug}`} target="_blank" className="font-semibold underline">Verlo ↗</a>
          </p>
        )}
        {m.date !== today && !ok && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Este menú es de otro día. Cámbialo y guarda para publicar el de hoy.</p>}
        <form action={saveMenu.bind(null, slug, k)} className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="date">Fecha</label>
              <input id="date" name="date" type="date" defaultValue={today} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="price">Precio</label>
              <input id="price" name="price" defaultValue={m.price} placeholder="$18.000" className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="items">Menú</label>
            <textarea id="items" name="items" rows={10} defaultValue={m.items} className="input font-mono text-[13px] leading-relaxed" />
            <p className="mt-1.5 text-xs text-ink-500">
              Una línea por plato: <b>Sección | Plato | detalle</b>. Ej: <code>Sopa | Sancocho</code>. Pon <b>!</b> al inicio de una línea para marcarla como agotada.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="notes">Nota</label>
            <textarea id="notes" name="notes" rows={2} defaultValue={m.notes} placeholder="Ej: Domicilios gratis en Laureles" className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="published" defaultChecked={m.published} className="h-4 w-4 accent-[#e2471c]" /> Publicado
          </label>
          <button className="w-full rounded-2xl bg-ink-900 py-4 text-lg font-semibold text-white transition hover:bg-brand-600">Publicar menú</button>
        </form>
      </div>
    </div>
  );
}
