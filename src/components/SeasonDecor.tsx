import type { SeasonId } from "@/lib/season";

/**
 * Adornos que cuelgan bajo el menú según la temporada: luces de Navidad, banderines, corazones, flores…
 * Es una tira de segmentos iguales (un cable en curva con un adorno colgando). Decorativa y sin clics.
 */
const PALETTE: Record<SeasonId, string[]> = {
  navidad: ["#ef4444", "#22c55e", "#facc15", "#3b82f6", "#f97316"],
  anionuevo: ["#facc15", "#a855f7", "#f5f5f4", "#f59e0b"],
  halloween: ["#f97316", "#7c3aed", "#1c1917", "#f97316"],
  amor: ["#e11d48", "#fb7185", "#f59e0b"],
  patria: ["#fcd116", "#003893", "#ce1126"],
  madres: ["#ec4899", "#f472b6", "#c084fc", "#fb7185"],
};

const SEG = 64;

function Hanging({ kind, c, i }: { kind: SeasonId; c: string; i: number }) {
  switch (kind) {
    case "navidad":
      return (
        <g className={`decor-bulb ${i % 2 ? "decor-b2" : ""}`} style={{ color: c }}>
          <rect x="29" y="13" width="6" height="5" rx="1" fill="#57534e" />
          <path d="M32 17c-4.5 0-6 4.5-6 8.5 0 3.8 2.6 6.5 6 6.5s6-2.7 6-6.5c0-4-1.5-8.5-6-8.5z" fill="currentColor" />
          <ellipse cx="30" cy="23" rx="1.4" ry="2.6" fill="#fff" opacity=".6" />
        </g>
      );
    case "anionuevo":
    case "patria":
      return <path className="decor-swing" d="M22 13h20l-10 17z" fill={c} />;
    case "halloween":
      return i % 3 === 1 ? (
        <g className="decor-spider">
          <path d="M32 13v12" stroke="#a8a29e" strokeWidth=".8" />
          <circle cx="32" cy="29" r="4" fill="#1c1917" />
          <path d="M27 26l-4-3M27 29h-5M27 32l-4 3M37 26l4-3M37 29h5M37 32l4 3" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="30.5" cy="28" r=".9" fill="#f97316" /><circle cx="33.5" cy="28" r=".9" fill="#f97316" />
        </g>
      ) : (
        <path className="decor-swing" d="M22 13h20l-10 17z" fill={c} />
      );
    case "amor":
      return <path className="decor-swing" d="M32 31c-6-4.6-9-7.6-7.6-11 1.3-3 5-2.6 7.6.4 2.6-3 6.3-3.4 7.6-.4 1.4 3.4-1.6 6.4-7.6 11z" fill={c} />;
    case "madres":
      return (
        <g className="decor-swing" fill={c}>
          {[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="32" cy="19.5" rx="3" ry="4.5" transform={`rotate(${r} 32 23)`} />)}
          <circle cx="32" cy="23" r="2.4" fill="#fde047" />
        </g>
      );
  }
}

export default function SeasonDecor({ kind }: { kind: SeasonId }) {
  const colors = PALETTE[kind];
  const wire = kind === "navidad" ? "#3f3f46" : kind === "halloween" ? "#57534e" : "rgba(244,241,234,.55)";
  return (
    <div aria-hidden className={`season-decor decor-${kind}`}>
      {Array.from({ length: 48 }, (_, i) => (
        <svg key={i} width={SEG} height="38" viewBox={`0 0 ${SEG} 38`} style={{ animationDelay: `${(i % 7) * -0.35}s` }}>
          <path d={`M0 2Q${SEG / 2} 18 ${SEG} 2`} stroke={wire} strokeWidth="1.4" fill="none" />
          <Hanging kind={kind} c={colors[i % colors.length]} i={i} />
        </svg>
      ))}
    </div>
  );
}
