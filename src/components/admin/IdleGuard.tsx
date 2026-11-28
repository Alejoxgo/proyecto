"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "aldore:admin-activity";
const WARN_MS = 60 * 1000;
const PING_EVERY_MS = 60 * 1000;

/**
 * Cierra la sesión del panel tras unos minutos sin actividad.
 * Un minuto antes muestra un aviso con cuenta regresiva. Mientras haya actividad
 * (aunque no se guarde nada, como al escribir un artículo largo) avisa al servidor
 * para que la sesión no venza. Las pestañas abiertas comparten la misma actividad.
 */
export default function IdleGuard({ minutes }: { minutes: number }) {
  const idleMs = minutes * 60 * 1000;
  const last = useRef(Date.now());
  const lastPing = useRef(Date.now());
  const warning = useRef(false);
  const [left, setLeft] = useState<number | null>(null);

  const leave = useCallback(() => {
    window.location.href = "/admin/salir?motivo=inactividad";
  }, []);

  const ping = useCallback(async () => {
    lastPing.current = Date.now();
    try {
      const r = await fetch("/api/admin/ping", { method: "POST", cache: "no-store" });
      if (r.status === 401) leave();
    } catch {}
  }, [leave]);

  const mark = useCallback(
    (force = false) => {
      if (warning.current && !force) return;
      const now = Date.now();
      if (now - last.current < 2000 && !force) return;
      last.current = now;
      try {
        localStorage.setItem(KEY, String(now));
      } catch {}
    },
    [],
  );

  const stay = useCallback(() => {
    warning.current = false;
    setLeft(null);
    mark(true);
    void ping();
  }, [mark, ping]);

  useEffect(() => {
    const onAct = () => mark();
    const evs = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove", "wheel"] as const;
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }));
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        const v = Number(e.newValue);
        if (v > last.current) {
          last.current = v;
          if (warning.current) {
            warning.current = false;
            setLeft(null);
          }
        }
      }
    };
    window.addEventListener("storage", onStorage);

    const tick = setInterval(() => {
      const now = Date.now();
      try {
        const shared = Number(localStorage.getItem(KEY) || 0);
        if (shared > last.current) last.current = shared;
      } catch {}
      const idle = now - last.current;
      if (idle >= idleMs) {
        clearInterval(tick);
        leave();
        return;
      }
      if (idle >= idleMs - WARN_MS) {
        warning.current = true;
        setLeft(Math.ceil((idleMs - idle) / 1000));
      } else if (warning.current) {
        warning.current = false;
        setLeft(null);
      }
      // Hubo actividad desde el último aviso al servidor: renovamos la sesión.
      if (last.current > lastPing.current && now - lastPing.current >= PING_EVERY_MS) void ping();
    }, 1000);

    return () => {
      evs.forEach((e) => window.removeEventListener(e, onAct));
      window.removeEventListener("storage", onStorage);
      clearInterval(tick);
    };
  }, [idleMs, leave, mark, ping]);

  if (left === null) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="idle-title" className="fixed inset-0 z-[200] grid place-items-center bg-ink-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-600">Inactividad</p>
        <h2 id="idle-title" className="mt-2 text-xl font-semibold text-ink-900">¿Sigues ahí?</h2>
        <p className="mt-2 text-sm text-ink-500">
          Por seguridad cerraremos tu sesión en <span className="font-mono font-semibold text-ink-900 tabular-nums">{left}s</span>.
        </p>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={leave} className="flex-1 rounded-xl border border-paper-line py-2.5 text-sm text-ink-700 hover:border-ink-900">Salir</button>
          <button type="button" autoFocus onClick={stay} className="flex-1 rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-white hover:bg-brand-600">Seguir aquí</button>
        </div>
      </div>
    </div>
  );
}
