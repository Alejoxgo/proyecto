"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { passkeyDelete, passkeyRegisterOptions, passkeyRegisterVerify } from "@/app/admin/security-actions";

type Key = { id: number; name: string; created: string; lastUsed: string | null };
const day = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });

function guessName() {
  if (typeof navigator === "undefined") return "Llave de acceso";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Celular Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows Hello";
  return "Llave de acceso";
}

/** Llaves de acceso: huella, cara o PIN del equipo para entrar sin contraseña. */
export default function PasskeyManager({ keys }: { keys: Key[] }) {
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  const add = () =>
    start(async () => {
      setMsg(null);
      if (!browserSupportsWebAuthn()) return setMsg({ ok: false, text: "Este navegador no permite llaves de acceso." });
      try {
        const options = await passkeyRegisterOptions();
        const resp = await startRegistration({ optionsJSON: options });
        const name = window.prompt("¿Cómo quieres llamar esta llave?", guessName()) || guessName();
        const r = await passkeyRegisterVerify(resp, name);
        setMsg(r.ok ? { ok: true, text: "Llave guardada. La próxima vez puedes entrar con ella." } : { ok: false, text: r.error || "No se pudo guardar." });
        router.refresh();
      } catch (e) {
        const n = (e as Error)?.name;
        setMsg({ ok: false, text: n === "InvalidStateError" ? "Este equipo ya tiene una llave guardada." : "Se canceló o el equipo no respondió." });
      }
    });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            Llaves de acceso (passkeys) {keys.length > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{keys.length}</span>}
          </h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">Entra con la huella, la cara o el PIN de tu celular o computador, sin escribir contraseña. Es la forma más segura: no se puede robar con un correo falso.</p>
        </div>
        <button onClick={add} disabled={busy} className="btn-primary !py-2 text-sm">{busy ? "Esperando al equipo…" : "Agregar llave"}</button>
      </div>
      {keys.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M15 7a2 2 0 0 1 2 2M21 9a6 6 0 0 1-7.7 5.7L11 17H9v2H7v2H3v-3.6l6.3-6.3A6 6 0 1 1 21 9Z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">{k.name}</p>
                <p className="text-xs text-slate-500">Creada el {day(k.created)}{k.lastUsed ? ` · último uso ${day(k.lastUsed)}` : " · aún sin usar"}</p>
              </div>
              <button onClick={() => start(async () => { if (confirm(`¿Quitar la llave «${k.name}»?`)) { await passkeyDelete(k.id); router.refresh(); } })} className="text-xs text-red-600 hover:underline">Quitar</button>
            </li>
          ))}
        </ul>
      )}
      {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
