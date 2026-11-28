"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Aldo from "@/components/Aldo";
import TC from "@/components/TC";
import { celebrate } from "@/lib/celebrate";

/**
 * Árbol de Navidad para decorar: las bolitas se arrastran desde la repisa a los ganchos del árbol
 * (y se pueden cambiar de sitio). Aldo vuela cada tanto, toma una bolita y la cuelga él mismo.
 * Cuando el árbol queda lleno se enciende la estrella y Aldo celebra.
 */
const W = 400;
const H = 480;
const HOOKS: [number, number][] = [
  [186, 118], [222, 132],
  [160, 200], [232, 186], [272, 236], [130, 238], [202, 226],
  [118, 330], [176, 300], [240, 314], [296, 334], [204, 350],
];
const COLORS = ["#e2471c", "#facc15", "#3b82f6", "#d12a2a", "#a855f7", "#f4f1ea", "#f97316", "#38bdf8", "#facc15", "#ec4899", "#e2471c", "#3b82f6"];
const PRE = [1, 4, 8]; // Las que Aldo ya colgó al llegar.
const REST: [number, number] = [352, 150];
const LIGHTS: [number, number][] = [
  [170, 96], [206, 104], [232, 116], [146, 172], [178, 180], [214, 172], [250, 166], [118, 270], [158, 262], [200, 268], [240, 260], [280, 270], [100, 352], [150, 342], [256, 346], [304, 358],
];
const slot = (i: number): [number, number] => [68 + i * 24, 452];

type Ball = { id: number; hook: number | null };
type Drag = { id: number; x: number; y: number; ox: number; oy: number } | null;

export default function XmasTree({ done }: { done: string }) {
  const [balls, setBalls] = useState<Ball[]>(() => COLORS.map((_, id) => ({ id, hook: PRE.includes(id) ? PRE.indexOf(id) * 4 + 1 : null })));
  const [drag, setDrag] = useState<Drag>(null);
  const [aldo, setAldo] = useState<{ x: number; y: number; pose: "wave" | "fly" | "happy" | "cheer" }>({ x: REST[0], y: REST[1], pose: "wave" });
  const [carry, setCarry] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const ballsRef = useRef(balls);
  ballsRef.current = balls;
  const pausedUntil = useRef(0);
  const busy = useRef(false);
  const cheered = useRef(false);

  const full = balls.every((b) => b.hook !== null);
  const posOf = (b: Ball): [number, number] => {
    if (drag?.id === b.id) return [drag.x, drag.y];
    return b.hook !== null ? HOOKS[b.hook] : slot(b.id);
  };

  useEffect(() => {
    if (!box.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  // Aldo cuelga una bolita: vuela a la repisa, la toma y la lleva a un gancho libre.
  const aldoStep = useCallback((fast = false) => {
    const bs = ballsRef.current;
    const free = HOOKS.map((_, i) => i).filter((i) => !bs.some((b) => b.hook === i));
    const tray = bs.filter((b) => b.hook === null);
    if (!free.length || !tray.length || busy.current) return false;
    busy.current = true;
    const b = tray[Math.floor(Math.random() * tray.length)];
    const h = free[Math.floor(Math.random() * free.length)];
    const [bx, by] = slot(b.id);
    const t1 = fast ? 380 : 900;
    setAldo({ x: bx, y: by, pose: "fly" });
    setTimeout(() => {
      const now = ballsRef.current;
      if (now.find((x) => x.id === b.id)?.hook !== null || now.some((x) => x.hook === h)) {
        busy.current = false;
        setAldo({ x: REST[0], y: REST[1], pose: "wave" });
        return;
      }
      setCarry(b.id);
      setBalls((s) => s.map((x) => (x.id === b.id ? { ...x, hook: h } : x)));
      setAldo({ x: HOOKS[h][0], y: HOOKS[h][1], pose: "fly" });
      setTimeout(() => {
        setCarry(null);
        setAldo((a) => ({ ...a, pose: "happy" }));
        setTimeout(() => {
          busy.current = false;
          setAldo((a) => (a.pose === "cheer" ? a : { x: REST[0], y: REST[1], pose: "wave" }));
        }, fast ? 200 : 650);
      }, t1 + 100);
    }, t1);
    return true;
  }, []);

  useEffect(() => {
    if (!visible || full) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current || drag) return;
      aldoStep();
    }, 5200);
    const first = setTimeout(() => { if (Date.now() >= pausedUntil.current) aldoStep(); }, 1800);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [visible, full, drag, aldoStep]);

  useEffect(() => {
    if (!full) { cheered.current = false; return; }
    if (cheered.current) return;
    cheered.current = true;
    const t = setTimeout(() => {
      setAldo({ x: 330, y: 70, pose: "cheer" });
      celebrate();
    }, 700);
    return () => clearTimeout(t);
  }, [full]);

  const toSvg = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM();
    if (!m) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [p.x, p.y];
  };
  const down = (e: React.PointerEvent, b: Ball) => {
    if (carry === b.id) return;
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const [x, y] = toSvg(e);
    const [px, py] = posOf(b);
    pausedUntil.current = Date.now() + 9000;
    setDrag({ id: b.id, x: px, y: py, ox: x - px, oy: y - py });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const [x, y] = toSvg(e);
    setDrag({ ...drag, x: Math.max(12, Math.min(W - 12, x - drag.ox)), y: Math.max(12, Math.min(H - 12, y - drag.oy)) });
  };
  const up = () => {
    if (!drag) return;
    const taken = new Set(balls.filter((b) => b.id !== drag.id && b.hook !== null).map((b) => b.hook));
    let best: number | null = null;
    let dist = 40;
    HOOKS.forEach(([hx, hy], i) => {
      const d = Math.hypot(hx - drag.x, hy - drag.y);
      if (!taken.has(i) && d < dist) { dist = d; best = i; }
    });
    setBalls((s) => s.map((b) => (b.id === drag.id ? { ...b, hook: best } : b)));
    setDrag(null);
    pausedUntil.current = Date.now() + 9000;
  };

  const reset = () => {
    setBalls(COLORS.map((_, id) => ({ id, hook: null })));
    setAldo({ x: REST[0], y: REST[1], pose: "wave" });
    pausedUntil.current = Date.now() + 4000;
  };
  const finish = () => {
    pausedUntil.current = Date.now() + 60000;
    // Sigue colgando mientras queden bolitas en la repisa (espera si Aldo ya va en camino con una).
    const run = () => {
      if (!ballsRef.current.some((b) => b.hook === null)) return;
      aldoStep(true);
      setTimeout(run, 450);
    };
    run();
  };

  return (
    <div ref={box} className="xmas relative mx-auto w-full max-w-[460px] select-none">
      <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full touch-none" onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="img" aria-label="Árbol de Navidad para decorar con Aldo">
          <defs>
            <radialGradient id="xmas-glow"><stop offset="0" stopColor="#facc15" stopOpacity=".9" /><stop offset="1" stopColor="#facc15" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="200" cy="428" rx="150" ry="10" fill="currentColor" opacity=".08" />
          {/* Árbol */}
          <path d="M200 180C228 230 290 300 338 360Q270 378 200 368Q130 378 62 360C110 300 172 230 200 180Z" fill="#166534" />
          <path d="M200 100C222 140 262 200 302 250Q252 264 200 256Q148 264 98 250C138 200 178 140 200 100Z" fill="#15803d" />
          <path d="M200 38C214 70 240 110 272 150Q236 160 200 154Q164 160 128 150C160 110 186 70 200 38Z" fill="#16a34a" />
          <path d="M200 180C186 230 150 290 120 340" stroke="#14532d" strokeWidth="1.5" opacity=".35" fill="none" />
          <path d="M200 100C190 150 166 200 140 236" stroke="#14532d" strokeWidth="1.5" opacity=".35" fill="none" />
          {/* Guirnaldas */}
          <path d="M150 100Q200 128 252 112M118 176Q200 196 262 162M92 274Q200 290 296 264M80 360Q200 362 320 348" stroke="#facc15" strokeWidth="1.6" strokeDasharray="1 6" strokeLinecap="round" fill="none" opacity=".9" />
          {LIGHTS.map(([x, y], i) => (
            <circle key={i} className="xmas-light" cx={x} cy={y} r="3" fill={["#fde047", "#f87171", "#60a5fa", "#fdba74"][i % 4]} style={{ animationDelay: `${(i % 5) * -0.37}s` }} />
          ))}
          {/* Tronco y matera */}
          <rect x="184" y="362" width="32" height="38" fill="#7c4a2d" />
          <path d="M156 396h88l-8 34h-72z" fill="#e2471c" />
          <path d="M156 396h88v8h-88z" fill="#c2410c" />
          {/* Estrella */}
          <g className={full ? "xmas-star-on" : ""}>
            <circle cx="200" cy="34" r="34" fill="url(#xmas-glow)" className="xmas-halo" />
            <path d="M200 10l6.5 14.2 15.5 1.7-11.6 10.4 3.3 15.3L200 43.8l-13.7 7.8 3.3-15.3-11.6-10.4 15.5-1.7z" fill={full ? "#facc15" : "#d6d3d1"} stroke={full ? "#f59e0b" : "#a8a29e"} strokeWidth="1.2" />
          </g>
          {/* Ganchos libres */}
          {HOOKS.map(([x, y], i) =>
            balls.some((b) => b.hook === i) ? null : <circle key={i} cx={x} cy={y} r={drag ? 9 : 4} className="xmas-hook" fill="none" stroke="#fef9c3" strokeWidth="1.4" strokeDasharray="2 3" />,
          )}
          {/* Repisa */}
          <rect x="44" y="438" width="312" height="30" rx="15" fill="currentColor" opacity=".06" />
          {/* Bolitas */}
          {balls.map((b) => {
            const [x, y] = posOf(b);
            const moving = drag?.id === b.id;
            const c = COLORS[b.id];
            return (
              <g
                key={b.id}
                onPointerDown={(e) => down(e, b)}
                className={`xmas-ball ${moving ? "is-drag" : ""}`}
                style={{ transform: `translate(${x}px, ${y}px)`, transition: moving ? "none" : `transform ${carry === b.id ? 1 : 0.45}s cubic-bezier(.45,.05,.3,1)` }}
              >
                <g className={b.hook !== null && !moving && carry !== b.id ? "xmas-swing" : ""} style={{ animationDelay: `${(b.id % 4) * -0.6}s` }}>
                  {b.hook !== null && !moving && <path d="M0 -16v5" stroke="#fef9c3" strokeWidth="1" />}
                  <rect x="-3.5" y="-13" width="7" height="4" rx="1" fill="#a8a29e" />
                  <circle r="10.5" fill={c} stroke="rgba(0,0,0,.12)" />
                  <path d="M-10 0Q0 5 10 0" stroke="rgba(255,255,255,.45)" strokeWidth="1.4" fill="none" />
                  <ellipse cx="-3.5" cy="-4" rx="2.4" ry="3.4" fill="#fff" opacity=".55" />
                  <circle r="18" fill="transparent" />
                </g>
              </g>
            );
          })}
        </svg>
        {/* Aldo, que vuela a colgar bolitas */}
        <div
          className="xmas-aldo pointer-events-none absolute w-[22%]"
          style={{ left: `${(aldo.x / W) * 100}%`, top: `${(aldo.y / H) * 100}%`, transform: "translate(-50%, -96%)" }}
        >
          <Aldo pose={aldo.pose} follow={false} className="h-auto w-full" />
        </div>
      </div>
      <div className="mt-4 flex min-h-[44px] flex-wrap items-center justify-center gap-3 text-center">
        {full ? (
          <>
            <p className="font-display text-lg text-ink-900">{done}</p>
            <button type="button" onClick={reset} className="btn-outline !py-2 text-sm"><TC>{"Volver a decorar"}</TC></button>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-500"><TC>{"Arrastra una bolita a un gancho del árbol."}</TC> {balls.filter((b) => b.hook !== null).length}/{HOOKS.length}</p>
            <button type="button" onClick={finish} className="btn-outline !py-2 text-sm"><TC>{"Que Aldo lo termine"}</TC></button>
          </>
        )}
      </div>
    </div>
  );
}
