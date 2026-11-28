"use client";
import { useEffect, useRef, useState } from "react";
import Aldo from "./Aldo";
import { useTr } from "./TC";

/**
 * Aldo en la portada: llega volando despacio y se posa sobre la puerta.
 * Si lo tocas, sale volando hacia arriba; al rato vuelve y se posa otra vez.
 */
export default function HeroAldo() {
  const tr = useTr();
  const [phase, setPhase] = useState<"arrive" | "leave">("arrive");
  const [round, setRound] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const shoo = () => {
    if (phase === "leave") return;
    setPhase("leave");
    timer.current = setTimeout(() => {
      setRound((r) => r + 1);
      setPhase("arrive");
    }, 9000);
  };

  const label = tr("Aldo, el búho de Aldore. Tócalo y sale volando");
  return (
    <div className="absolute -top-[86px] left-1/2 z-20 h-[96px] w-[96px] -translate-x-1/2">
      {phase === "arrive" ? (
        <div key={round} className={round ? "hero-again" : ""}>
          <div className="hero-aldo-fly pointer-events-none absolute inset-0" aria-hidden>
            <Aldo pose="fly" follow={false} className="h-full w-full" title="" />
          </div>
          <button type="button" onClick={shoo} aria-label={label} title={label} className="hero-aldo-sit absolute inset-0 cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
            <Aldo pose="base" className="h-full w-full" title="" />
          </button>
        </div>
      ) : (
        <div className="hero-aldo-leave pointer-events-none absolute inset-0" aria-hidden>
          <Aldo pose="fly" follow={false} className="h-full w-full" title="" />
        </div>
      )}
    </div>
  );
}
