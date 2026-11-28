import QRCode from "qrcode";
import CopyButton from "./CopyButton";

type LinkItem = { label: string; path: string; help?: string; private?: boolean };

/** Enlaces para compartir (con botón copiar) y, opcionalmente, el QR del primero para imprimir. */
export default async function ShareLinks({ title, links, qrFor, qrName }: { title: string; links: LinkItem[]; qrFor?: string; qrName?: string }) {
  const base = (process.env.SITE_URL || "https://aldore.co").replace(/\/$/, "");
  let qr: string | null = null;
  if (qrFor) {
    const svg = await QRCode.toString(base + qrFor, { type: "svg", margin: 1, color: { dark: "#16130f", light: "#ffffff" } });
    qr = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
  return (
    <section className={`mb-6 grid gap-5 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)] ${qr ? "sm:grid-cols-[150px_1fr]" : ""}`}>
      {qr && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Código QR" className="h-[150px] w-[150px] rounded-lg border border-slate-200" />
          <a href={qr} download={`${qrName || "qr"}.svg`} className="mt-2 block text-center text-xs font-medium text-brand-600">Descargar QR</a>
        </div>
      )}
      <div className="min-w-0 space-y-4">
        <p className="font-medium text-ink-900">{title}</p>
        {links.map((l) => (
          <div key={l.path}>
            <p className="flex items-center gap-2 text-xs text-slate-500">
              {l.label}
              {l.private && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">Privado</span>}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <a href={l.path} target="_blank" className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-ink-800 hover:bg-slate-100">{base + l.path}</a>
              <CopyButton text={base + l.path} />
            </div>
            {l.help && <p className="mt-1 text-xs text-slate-500">{l.help}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
