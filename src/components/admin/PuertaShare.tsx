import QRCode from "qrcode";

/** Enlace público, QR para imprimir y métricas de una Puerta. */
export default async function PuertaShare({ slug, views, clicks }: { slug: string; views: number; clicks: number }) {
  const url = `${(process.env.SITE_URL || "https://aldore.co").replace(/\/$/, "")}/p/${slug}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#16130f", light: "#ffffff" } });
  const href = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return (
    <section className="mb-6 grid gap-5 rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)] p-5 sm:grid-cols-[160px_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={href} alt={`QR de ${url}`} className="h-40 w-40 rounded-lg border border-slate-200" />
      <div className="min-w-0">
        <p className="text-sm text-slate-500">Dirección pública</p>
        <a href={`/p/${slug}`} target="_blank" className="block break-all font-mono text-sm font-semibold text-brand-700 hover:underline">{url} ↗</a>
        <p className="mt-2 text-xs text-slate-500">Graba esta misma dirección en los stickers NFC. El QR sirve para imprimir en mesas, mostradores o volantes.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={href} download={`puerta-${slug}.svg`} className="btn-primary !py-2 text-sm">Descargar QR</a>
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm"><b className="tabular-nums">{views}</b> visitas</span>
          <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm"><b className="tabular-nums">{clicks}</b> toques en botones</span>
        </div>
      </div>
    </section>
  );
}
