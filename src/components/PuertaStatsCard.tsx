import { puertaStats } from "@/lib/puerta-stats";

const WD = ["D", "L", "M", "M", "J", "V", "S"];

/** Tarjeta con las visitas y toques de una Puerta en los últimos 14 días y los botones más tocados. */
export default async function PuertaStatsCard({ pageId, name, tone = "site" }: { pageId: number; name: string; tone?: "site" | "admin" }) {
  const { series, top, views, clicks } = await puertaStats(pageId);
  const max = Math.max(1, ...series.map((d) => d.views));
  const topMax = Math.max(1, ...top.map((t) => t.count));
  const rate = views ? Math.round((clicks / views) * 100) : 0;
  const box = tone === "admin" ? "rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]" : "rounded-3xl border border-paper-line bg-white p-6 sm:p-8";
  return (
    <div className={box}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-brand-500">Últimos 14 días</p>
          <p className="mt-1 font-display text-2xl text-ink-900">{name}</p>
        </div>
        <dl className="flex gap-6 text-right">
          <div><dt className="text-xs text-ink-500">Visitas</dt><dd className="font-display text-2xl tabular-nums text-ink-900">{views}</dd></div>
          <div><dt className="text-xs text-ink-500">Toques</dt><dd className="font-display text-2xl tabular-nums text-ink-900">{clicks}</dd></div>
          <div><dt className="text-xs text-ink-500">Tocan un botón</dt><dd className="font-display text-2xl tabular-nums text-ink-900">{rate}%</dd></div>
        </dl>
      </div>

      <div className="mt-6 flex h-36 items-end gap-1.5" role="img" aria-label={`Visitas por día: ${series.map((d) => `${d.day} ${d.views}`).join(", ")}`}>
        {series.map((d) => {
          const wd = WD[new Date(d.day + "T12:00:00").getDay()];
          return (
            <div key={d.day} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${d.day}: ${d.views} visitas, ${d.clicks} toques`}>
              <div className="relative w-full rounded-t-md bg-brand-500/20 transition group-hover:bg-brand-500/35" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views ? 4 : 2 }}>
                <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-brand-500" style={{ height: d.views ? `${Math.min(100, (d.clicks / d.views) * 100)}%` : 0 }} />
              </div>
              <span className="mt-1.5 text-center font-mono text-[10px] text-ink-400">{wd}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 flex gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500/25" /> Visitas</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Toques en botones</span>
      </p>

      <div className="mt-6 border-t border-paper-line pt-5">
        <p className="text-sm font-medium text-ink-900">Botones más tocados</p>
        {top.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">Todavía nadie ha tocado un botón en estos días.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {top.map((t) => (
              <li key={t.label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate text-ink-700">{t.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-paper-2"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${(t.count / topMax) * 100}%` }} /></span>
                <span className="tabular-nums text-ink-900">{t.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
