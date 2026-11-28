import type { Particle } from "@/lib/season";

const N = 18;

/** Lluvia suave de la temporada (nieve, murciélagos, corazones, confeti o flores). Decorativa y sin clics. */
export default function SeasonLayer({ particle, colors }: { particle: Particle; colors: string[] }) {
  const items = Array.from({ length: N }, (_, i) => {
    const left = (i * 53) % 100;
    const delay = (i * 1.7) % 12;
    const dur = 9 + ((i * 7) % 8);
    const size = particle === "snow" ? 12 + ((i * 5) % 13) : 12 + ((i * 5) % 10);
    const color = colors[i % colors.length];
    return { left, delay, dur, size, color, i };
  });
  const shape = (c: string, i: number) => {
    switch (particle) {
      case "snow":
        return (
          // Copo de nieve de seis puntas con ramitas; el borde azul suave lo hace visible sobre fondos claros.
          <g stroke="#fff" strokeWidth="1.25" strokeLinecap="round" fill="none" style={{ filter: "drop-shadow(0 0 1px rgba(96,130,170,.75))" }}>
            {[0, 60, 120, 180, 240, 300].map((r) => (
              <g key={r} transform={`rotate(${r} 12 12)`}>
                <path d="M12 12V1.8" />
                <path d="M12 5.2 9.6 2.9M12 5.2l2.4-2.3M12 8.4l-1.9-1.8M12 8.4l1.9-1.8" />
              </g>
            ))}
            <circle cx="12" cy="12" r="1.4" fill="#fff" stroke="none" />
          </g>
        );
      case "hearts":
        return <path d="M12 21C5 15 1 11 3 6.5 5 2.5 10 3 12 7c2-4 7-4.5 9-.5 2 4.5-2 8.5-9 14.5z" fill={c} />;
      case "bats":
        return <path d="M12 9c-1-2-3-2-3-2s-1 2-4 1c-1 2-3 2-5 2 2 1 3 3 3 5 2-1 4-1 5 1 1-1 2-2 4-2s3 1 4 2c1-2 3-2 5-1 0-2 1-4 3-5-2 0-4 0-5-2-3 1-4-1-4-1s-2 0-3 2z" fill="#2e1065" />;
      case "flowers":
        return (
          <g fill={c}>
            {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="12" cy="6" rx="3.5" ry="5.5" transform={`rotate(${r} 12 12)`} />)}
            <circle cx="12" cy="12" r="3" fill="#fde047" />
          </g>
        );
      default:
        return <rect x="7" y="3" width="10" height="18" rx="2" fill={c} transform={`rotate(${(i * 37) % 90} 12 12)`} />;
    }
  };
  return (
    <div aria-hidden className={`season-layer season-${particle}`}>
      {items.map((p) => (
        <span key={p.i} style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDelay: `-${p.delay}s`, animationDuration: `${p.dur}s` }}>
          <svg viewBox="0 0 24 24" width="100%" height="100%">{shape(p.color, p.i)}</svg>
        </span>
      ))}
    </div>
  );
}
