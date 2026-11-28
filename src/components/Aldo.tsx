"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export type AldoPose = "base" | "wave" | "think" | "code" | "happy" | "fly" | "cheer" | "sleep" | "love" | "read" | "dance" | "search";

/** Accesorios que Aldo puede llevar (perfiles, versiones quietas y temáticas de temporada). */
export type AldoWear = "santa" | "witch" | "party" | "grad" | "cap" | "crown" | "beanie" | "glasses" | "headset" | "bowtie" | "scarf" | "flag" | "heart";

/** Temática de temporada activa: Aldo se pone el accesorio que toca (lo define el layout del sitio). */
export const AldoSeason = createContext<AldoWear[]>([]);

// Alas abiertas (volando) y alas arriba (celebrando).
// Ala de búho: borde de ataque redondeado y plumas con puntas redondas (no puntas de murciélago).
const FLY_L = "M28 72C18 60 2 54-10 58c-3 1-4 4-1 6-2 2-1 5 2 5-1 3 1 5 4 4 0 3 2 5 5 4 1 3 4 4 7 2C16 79 23 82 29 86z";
const FLY_R = "M92 72c10-12 26-18 38-14 3 1 4 4 1 6 2 2 1 5-2 5 1 3-1 5-4 4 0 3-2 5-5 4-1 3-4 4-7 2-9 0-16 3-22 7z";
// Líneas de plumas dentro del ala.
const FEATHER_L = "M22 73c-9-5-19-7-28-5M21 78c-7-3-14-4-21-2M23 82c-5-1-10-1-15 1";
const FEATHER_R = "M98 73c9-5 19-7 28-5M99 78c7-3 14-4 21-2M97 82c5-1 10-1 15 1";
const UP_L = "M26 76C16 66 12 52 14 40c6 8 11 18 14 30z";
const UP_R = "M94 76c10-10 14-24 12-36-6 8-11 18-14 30z";

const INK = "#16130f";
const V = "#e2471c";
const P = "#f4f1ea";

/**
 * Aldo, el búho de Aldore. SVG animado con CSS:
 * respira, parpadea, sigue el cursor con la mirada y saluda.
 * Todas las animaciones se apagan con prefers-reduced-motion.
 */
export default function Aldo({
  pose = "base",
  className = "h-40 w-40",
  follow = true,
  title = "Aldo, el búho de Aldore",
  onDark = false,
  wear,
  still = false,
}: {
  pose?: AldoPose;
  className?: string;
  follow?: boolean;
  title?: string;
  /** Añade un borde claro para que se vea sobre fondos oscuros. */
  onDark?: boolean;
  /** Accesorios. Si no se indican, se usan los de la temática de temporada activa. */
  wear?: AldoWear[];
  /** Versión quieta: sin animaciones ni seguimiento del cursor. */
  still?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [boop, setBoop] = useState(0);
  const season = useContext(AldoSeason);
  const items = wear ?? season;
  if (still) follow = false;

  useEffect(() => {
    if (!follow || pose === "happy" || pose === "sleep") return;
    const svg = ref.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = svg.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.35;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 300));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 300));
        svg.style.setProperty("--px", `${dx * 3.2}px`);
        svg.style.setProperty("--py", `${dy * 3}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [follow, pose]);

  // Contorno claro alrededor de la silueta para que Aldo no se pierda sobre fondos oscuros.
  // paint-order "stroke" deja el trazo detrás del relleno: solo se ve la mitad de afuera.
  // Se dibuja primero una copia de la silueta con un trazo grueso claro, y encima las piezas normales.
  const edge = { fill: P, stroke: P, strokeWidth: onDark ? 6 : 5, strokeLinejoin: "round" as const };

  const eyesOpen = (
    <g className="aldo-blink">
      <circle cx="46" cy="46" r="12" fill={P} />
      <circle cx="74" cy="46" r="12" fill={P} />
      <g className="aldo-pupils">
        <circle cx="47" cy={pose === "think" ? 43 : pose === "read" ? 51 : 47} r="5.5" fill={INK} />
        <circle cx="73" cy={pose === "think" ? 43 : pose === "read" ? 51 : 47} r="5.5" fill={INK} />
        <circle cx="49" cy={pose === "think" ? 41 : pose === "read" ? 49 : 45} r="1.8" fill={P} />
        <circle cx="75" cy={pose === "think" ? 41 : pose === "read" ? 49 : 45} r="1.8" fill={P} />
      </g>
    </g>
  );
  const eyesHappy = (
    <g>
      <circle cx="46" cy="46" r="12" fill={P} />
      <circle cx="74" cy="46" r="12" fill={P} />
      <path d="M40 49q6-8 12 0M68 49q6-8 12 0" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>
  );

  const eyesSleep = (
    <g>
      <circle cx="46" cy="46" r="12" fill={P} />
      <circle cx="74" cy="46" r="12" fill={P} />
      <path d="M39 47q7 5 14 0M67 47q7 5 14 0" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </g>
  );
  const eyes = pose === "happy" || pose === "cheer" || pose === "love" || pose === "dance" ? eyesHappy : pose === "sleep" ? eyesSleep : eyesOpen;

  return (
    <svg
      ref={ref}
      viewBox="0 -14 124 144"
      className={`aldo aldo-pose-${pose} ${still ? "aldo-still" : ""} ${follow ? "" : "aldo-look"} ${boop ? "aldo-boop" : ""} ${className}`}
      onPointerDown={still ? undefined : () => { setBoop(0); requestAnimationFrame(() => setBoop(Date.now())); }}
      onAnimationEnd={(e) => { if (e.animationName === "aldo-boop") setBoop(0); }}
      role="img"
      aria-label={title}
    >
      <ellipse className="aldo-shadow" cx="60" cy="124" rx="34" ry="4" fill={onDark ? "#000" : INK} opacity={onDark ? 0.35 : 0.14} />

      {pose === "think" && (
        <g className="aldo-bubble">
          <circle cx="100" cy="10" r="2.5" fill={INK} opacity=".45" />
          <circle cx="106" cy="2" r="3.5" fill={INK} opacity=".45" />
          <text x="100" y="-5" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={V}>{"{ }"}</text>
        </g>
      )}

      <g className="aldo-body" aria-hidden>
        <g className="aldo-head"><path d="M24 114V66C24 47 29 37 35 30L31 10 49 23Q60 19 71 23L89 10 85 30C91 37 96 47 96 66v48z" {...edge} /></g>
        {!["code", "fly", "cheer", "dance", "read"].includes(pose) && <path className="aldo-wing-l" d="M25 72c-10 8-12 22-4 34 3-12 6-22 4-34z" {...edge} />}
        {pose === "fly" && <><path className="aldo-flap-l" d={FLY_L} {...edge} /><path className="aldo-flap-r" d={FLY_R} {...edge} /></>}
        {(pose === "cheer" || pose === "dance") && <><path className="aldo-cheer-l" d={UP_L} {...edge} /><path className="aldo-cheer-r" d={UP_R} {...edge} /></>}
        {pose === "think" && <path d="M95 76c8 2 8 10 2 14" stroke={P} strokeWidth={onDark ? 11 : 10} fill="none" strokeLinecap="round" />}
        {["base", "happy", "sleep", "love", "search"].includes(pose) && <path className="aldo-wing-r" d="M95 72c10 8 12 22 4 34-3-12-6-22-4-34z" {...edge} />}
        {pose === "wave" && <g className="aldo-wave"><path d="M95 74c10-6 16-20 14-34-6 8-11 20-14 34z" {...edge} /></g>}
      </g>

      <g className="aldo-body">
        {/* cuerpo con orejas: el arco del logo */}
        <g className="aldo-head">
          <path d="M24 114V66C24 47 29 37 35 30L31 10 49 23Q60 19 71 23L89 10 85 30C91 37 96 47 96 66v48z" fill={INK} />
          <path d="M41 114V90c0-10 8-16 19-20 11 4 19 10 19 20v24z" fill={V} />
          <path
            d="M52 88l4 4 4-4 4 4 4-4M48 98l4 4 4-4 4 4 4-4 4 4 4-4"
            stroke={P}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".7"
          />
          {eyes}
          <AldoWearHead items={items} />
          {pose === "code" && (
            <g>
              <circle cx="46" cy="46" r="13.5" fill="none" stroke={V} strokeWidth="2.5" />
              <circle cx="74" cy="46" r="13.5" fill="none" stroke={V} strokeWidth="2.5" />
              <path d="M59 45h2" stroke={V} strokeWidth="2.5" />
            </g>
          )}
          <path d="M55 57h10l-5 8z" fill={V} />
          <AldoWearBody items={items} />
        </g>

        {/* alas */}
        {!["code", "fly", "cheer", "dance", "read"].includes(pose) && <path className="aldo-wing-l" d="M25 72c-10 8-12 22-4 34 3-12 6-22 4-34z" fill={INK} />}
        {pose === "fly" && (
          <>
            <g className="aldo-flap-l"><path d={FLY_L} fill={INK} /><path d={FEATHER_L} stroke={P} strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" fill="none" /></g>
            <g className="aldo-flap-r"><path d={FLY_R} fill={INK} /><path d={FEATHER_R} stroke={P} strokeOpacity=".35" strokeWidth="1.4" strokeLinecap="round" fill="none" /></g>
          </>
        )}
        {(pose === "cheer" || pose === "dance") && (
          <>
            <path className="aldo-cheer-l" d={UP_L} fill={INK} />
            <path className="aldo-cheer-r" d={UP_R} fill={INK} />
            <path d="M8 34l-4-3M10 26l-2-5M112 34l4-3M110 26l2-5" stroke={V} strokeWidth="2.5" strokeLinecap="round" className="aldo-sparks" />
          </>
        )}
        {["base", "happy", "sleep", "love", "search"].includes(pose) && <path className="aldo-wing-r" d="M95 72c10 8 12 22 4 34-3-12-6-22-4-34z" fill={INK} />}
        {pose === "wave" && (
          <g className="aldo-wave">
            <path d="M95 74c10-6 16-20 14-34-6 8-11 20-14 34z" fill={INK} />
            <path d="M114 32l4-4M118 42l5-1M108 28v-6" stroke={V} strokeWidth="2.5" strokeLinecap="round" className="aldo-sparks" />
          </g>
        )}
        {pose === "think" && <path d="M95 76c8 2 8 10 2 14" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />}
      </g>

      {/* Extras de cada pose */}
      {pose === "sleep" && (
        <g className="aldo-zzz" fontFamily="Space Grotesk, sans-serif" fontWeight="700" fill={V}>
          <text x="92" y="20" fontSize="12">z</text>
          <text x="100" y="8" fontSize="15">z</text>
          <text x="110" y="-6" fontSize="18">Z</text>
        </g>
      )}
      {pose === "love" && (
        <g fill={V}>
          {[[96, 22, 0], [16, 30, 0.7], [104, 52, 1.4]].map(([x, y, d]) => (
            <path key={x} className="aldo-heart" style={{ animationDelay: `${d}s` }} d={`M${x} ${y + 3}c-3-4-8-1-6 3l6 6 6-6c2-4-3-7-6-3z`} />
          ))}
        </g>
      )}
      {pose === "read" && (
        <g className="aldo-book">
          <path d="M24 84c-6 4-6 12 2 16M96 84c6 4 6 12-2 16" stroke={P} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M24 84c-6 4-6 12 2 16M96 84c6 4 6 12-2 16" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M28 80l32 6 32-6v26l-32 6-32-6z" fill={V} stroke={P} strokeWidth="2" strokeLinejoin="round" />
          <path d="M60 86v26" stroke={P} strokeWidth="2" />
          <path d="M36 88l16 3M36 94l16 3M68 91l16-3M68 97l16-3" stroke={P} strokeWidth="1.5" opacity=".7" strokeLinecap="round" />
        </g>
      )}
      {pose === "search" && (
        <g className="aldo-lens">
          <circle cx="74" cy="46" r="15" fill="rgba(255,255,255,.12)" stroke={V} strokeWidth="4" />
          <path d="M85 57l14 14" stroke={V} strokeWidth="6" strokeLinecap="round" />
        </g>
      )}
      {pose === "code" ? (
        <g>
          <path className="aldo-typing" d="M24 86c-8 6-6 14 6 14M96 86c8 6 6 14-6 14" stroke={P} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path className="aldo-typing" d="M24 86c-8 6-6 14 6 14M96 86c8 6 6 14-6 14" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M18 98h84l-8 18H26z" fill="#3a342c" />
          <rect x="24" y="96" width="72" height="4" rx="2" fill="#6b6358" />
          <text x="50" y="111" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={V} className="aldo-cursor">{"</>"}</text>
        </g>
      ) : (
        <path className="aldo-feet" d={pose === "fly" ? "M46 114l-2 4M50 114l-1 4M54 114v4M66 114v4M70 114l1 4M74 114l2 4" : "M44 114v6M48 114v6M52 114v6M68 114v6M72 114v6M76 114v6"} stroke={V} strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ---------- Accesorios ---------- */

function AldoWearHead({ items }: { items: AldoWear[] }) {
  if (!items.length) return null;
  const has = (w: AldoWear) => items.includes(w);
  return (
    <g className="aldo-wear">
      {has("glasses") && (
        <g>
          <circle cx="46" cy="46" r="13.5" fill="none" stroke={INK} strokeWidth="3" />
          <circle cx="74" cy="46" r="13.5" fill="none" stroke={INK} strokeWidth="3" />
          <path d="M59.5 45h1" stroke={INK} strokeWidth="3" />
        </g>
      )}
      {has("headset") && (
        <g>
          <path d="M22 52C22 20 40 12 60 12s38 8 38 40" stroke="#3a342c" strokeWidth="4" fill="none" />
          <rect x="16" y="46" width="10" height="18" rx="4" fill={V} />
          <rect x="94" y="46" width="10" height="18" rx="4" fill={V} />
          <path d="M21 62c0 8 10 12 22 10" stroke="#3a342c" strokeWidth="2.5" fill="none" />
          <circle cx="44" cy="72" r="3" fill="#3a342c" />
        </g>
      )}
      {has("santa") && (
        <g>
          <path d="M36 27c4-18 22-30 44-28 14 1 22 8 26 16l-8 4c-4-6-10-9-18-9-8 0-16 6-20 17z" fill="#d12a2a" />
          <rect x="30" y="22" width="60" height="9" rx="4.5" fill="#fff" />
          <circle className="aldo-pompom" cx="104" cy="17" r="6" fill="#fff" />
        </g>
      )}
      {has("witch") && (
        <g>
          <ellipse cx="60" cy="26" rx="42" ry="6" fill="#3b2366" />
          <path d="M42 26 66-14 78 26z" fill="#3b2366" />
          <path d="M45 21h31v5H45z" fill="#f59e0b" />
        </g>
      )}
      {has("party") && (
        <g>
          <path d="M46 26 60-10l14 36z" fill="#7c3aed" />
          <path d="M51 14l10 5M48 21l14 5M55 2l7 4" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="-11" r="4.5" fill="#fde047" />
        </g>
      )}
      {has("grad") && (
        <g>
          <path d="M44 22v8h32v-8" fill="#1f2937" />
          <path d="M18 16 60 2l42 14-42 14z" fill="#1f2937" />
          <path d="M60 16l30 4v14" stroke="#fbbf24" strokeWidth="2" fill="none" />
          <circle cx="90" cy="36" r="3" fill="#fbbf24" />
        </g>
      )}
      {has("cap") && (
        <g>
          <path d="M34 28c0-14 12-22 26-22s26 8 26 22z" fill="#2160f0" />
          <path d="M60 28h44c2 0 2 5-1 6H60z" fill="#1747b8" />
          <circle cx="60" cy="7" r="2.5" fill="#1747b8" />
        </g>
      )}
      {has("crown") && <path d="M38 28V10l11 9 11-15 11 15 11-9v18z" fill="#f5b400" stroke="#b7791f" strokeWidth="1.5" strokeLinejoin="round" />}
      {has("beanie") && (
        <g>
          <path d="M33 28c0-16 12-25 27-25s27 9 27 25z" fill="#0f766e" />
          <rect x="31" y="22" width="58" height="9" rx="3" fill="#115e59" />
          <circle className="aldo-pompom" cx="60" cy="1" r="6" fill="#f4f1ea" />
        </g>
      )}
    </g>
  );
}

function AldoWearBody({ items }: { items: AldoWear[] }) {
  if (!items.length) return null;
  const has = (w: AldoWear) => items.includes(w);
  return (
    <g className="aldo-wear">
      {has("bowtie") && (
        <g>
          <path d="M60 70 46 63v14zM60 70l14-7v14z" fill="#7c3aed" />
          <circle cx="60" cy="70" r="3.5" fill="#5b21b6" />
        </g>
      )}
      {has("scarf") && (
        <g>
          <path d="M28 64c20 8 44 8 64 0v9c-20 8-44 8-64 0z" fill="#d12a2a" />
          <path className="aldo-scarf-tail" d="M74 70h10v24l-5-3-5 3z" fill="#b91c1c" />
          <path d="M34 68h4M46 71h4M58 72h4M70 71h4" stroke="#fff" strokeWidth="2" opacity=".6" />
        </g>
      )}
      {has("flag") && (
        <g>
          <path d="M28 64c20 8 44 8 64 0v4c-20 8-44 8-64 0z" fill="#fcd116" />
          <path d="M28 68c20 8 44 8 64 0v3c-20 8-44 8-64 0z" fill="#003893" />
          <path d="M28 71c20 8 44 8 64 0v3c-20 8-44 8-64 0z" fill="#ce1126" />
        </g>
      )}
      {has("heart") && <path d="M60 79c-5-7-15-2-11 5l11 10 11-10c4-7-6-12-11-5z" fill="#ff8fb1" stroke="#fff" strokeWidth="1.5" />}
    </g>
  );
}

export const ALDO_WEARS = ["santa", "witch", "party", "grad", "cap", "crown", "beanie", "glasses", "headset", "bowtie", "scarf", "flag", "heart"] as const;

/** Pone a todos los Aldos del sitio el accesorio de la temática de temporada. */
export function SeasonWear({ wear, children }: { wear: AldoWear[]; children: React.ReactNode }) {
  return <AldoSeason.Provider value={wear}>{children}</AldoSeason.Provider>;
}
