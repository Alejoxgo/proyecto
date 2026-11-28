import TC from "@/components/TC";
import { LogoMark } from "./Logo";
import { lines } from "@/lib/utils";
import type { Settings } from "@/lib/settings";

export function StackMarquee({ s }: { s: Settings }) {
  const items = lines(s["tech.stack"]);
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <section className="border-y border-white/10 bg-ink-900 py-5 text-paper/60" aria-label={s["tech.title"]}>
      <div className="container-x flex items-center gap-8">
        <p className="hidden shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40 md:block">{s["tech.title"]}</p>
        <div className="marquee relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <ul className="marquee-track flex w-max gap-10 font-mono text-sm">
            {row.map((t, i) => (
              <li key={i} className="flex items-center gap-10 whitespace-nowrap" aria-hidden={i >= items.length}>
                {t}
                <span className="h-1 w-1 bg-brand-500" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function IntegrationsDiagram({ s }: { s: Settings }) {
  const nodes = lines(s["integrations.nodes"]).slice(0, 8);
  const W = 640, H = 420, cx = W / 2, cy = H / 2;
  const pts = nodes.map((label, i) => {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / nodes.length;
    const x = cx + Math.cos(a) * 245;
    const y = cy + Math.sin(a) * 155;
    const w = Math.max(84, label.length * 7.8 + 44);
    return { label, x, y, w };
  });
  return (
    <section className="relative overflow-hidden bg-ink-900 py-24 text-paper">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="container-x relative grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="eyebrow !text-paper/50"><span className="text-brand-500">→</span><TC>{" Integraciones"}</TC></p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] sm:text-5xl">{s["integrations.title"]}</h2>
          <p className="mt-5 text-lg leading-relaxed text-paper/65">{s["integrations.text"]}</p>
          <ul className="mt-8 space-y-2 font-mono text-sm text-paper/60">
            <li><span className="text-brand-400"><TC>{"POST"}</TC></span><TC>{" /webhooks/pedido-creado"}</TC></li>
            <li><span className="text-emerald-400">200</span><TC>{" factura emitida · 0.4 s"}</TC></li>
            <li><span className="text-brand-400"><TC>{"SYNC"}</TC></span><TC>{" inventario cada 5 min"}</TC></li>
          </ul>
        </div>
        <div className="lg:col-span-8">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Diagrama: tus sistemas conectados en un solo lugar">
            {pts.map((p, i) => (
              <g key={`l${i}`}>
                <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(244,241,234,.14)" strokeWidth="1" />
                <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2471c" strokeWidth="1.5" strokeDasharray="4 14" className="flow" style={{ animationDelay: `${i * -0.35}s` }} />
              </g>
            ))}
            <circle cx={cx} cy={cy} r="64" fill="none" stroke="rgba(226,71,28,.25)" className="pulse-ring" />
            <circle cx={cx} cy={cy} r="46" fill="#16130f" stroke="rgba(244,241,234,.2)" />
            <foreignObject x={cx - 20} y={cy - 22} width="40" height="40">
              <LogoMark light className="h-10 w-10" />
            </foreignObject>
            {pts.map((p, i) => (
              <g key={`n${i}`}>
                <rect x={p.x - p.w / 2} y={p.y - 17} width={p.w} height="34" rx="6" fill="#1d1915" stroke="rgba(244,241,234,.18)" />
                <circle cx={p.x - p.w / 2 + 13} cy={p.y} r="3" fill="#34d399" />
                <text x={p.x + 7} y={p.y + 4.5} textAnchor="middle" fill="#f4f1ea" fontSize="13" fontFamily="JetBrains Mono, monospace">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
