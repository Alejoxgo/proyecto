"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { totpBegin, totpConfirm, totpDisable } from "@/app/admin/security-actions";

/** Activar o quitar la app autenticadora (Google Authenticator, Microsoft Authenticator, Authy…). */
export default function TotpSetup({ on }: { on: boolean }) {
  const [stage, setStage] = useState<"idle" | "scan" | "off">("idle");
  const [qr, setQr] = useState<{ svg: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, start] = useTransition();
  const router = useRouter();

  const begin = () => start(async () => { setErr(""); setQr(await totpBegin()); setStage("scan"); });
  const confirm = () => start(async () => {
    const r = await totpConfirm(code);
    if (!r.ok) return setErr(r.error || "Código incorrecto");
    setStage("idle"); setQr(null); setCode(""); router.refresh();
  });
  const disable = () => start(async () => {
    const r = await totpDisable(code);
    if (!r.ok) return setErr(r.error || "Código incorrecto");
    setStage("idle"); setCode(""); router.refresh();
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            App autenticadora {on && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">Activa</span>}
          </h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">Al entrar te pedimos el código de 6 dígitos que cambia cada 30 segundos en tu celular. Funciona sin internet.</p>
        </div>
        {stage === "idle" && (on ? (
          <button onClick={() => { setStage("off"); setErr(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink-700 hover:border-red-300 hover:text-red-600">Desactivar</button>
        ) : (
          <button onClick={begin} disabled={busy} className="btn-primary !py-2 text-sm">{busy ? "Preparando…" : "Activar"}</button>
        ))}
      </div>

      {stage === "scan" && qr && (
        <div className="mt-4 grid gap-5 rounded-xl bg-slate-50 p-4 sm:grid-cols-[180px_1fr]">
          <div className="rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr.svg }} />
          <div className="space-y-3 text-sm">
            <ol className="list-decimal space-y-1 pl-4 text-ink-700">
              <li>Abre tu app autenticadora y toca <b>Agregar</b> o <b>+</b>.</li>
              <li>Escanea este código QR.</li>
              <li>Escribe aquí el código de 6 dígitos que te muestra.</li>
            </ol>
            <p className="text-xs text-slate-500">¿No puedes escanear? Escribe esta clave a mano: <code className="select-all rounded bg-white px-1.5 py-0.5 font-mono text-[12px] text-ink-900">{qr.secret}</code></p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={7} placeholder="000000" className="input !w-36 text-center font-mono tracking-[0.3em]" />
              <button onClick={confirm} disabled={busy || code.replace(/\D/g, "").length !== 6} className="btn-primary !py-2 text-sm">Confirmar</button>
              <button onClick={() => { setStage("idle"); setQr(null); }} className="px-2 text-sm text-slate-500 hover:text-ink-900">Cancelar</button>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>
        </div>
      )}

      {stage === "off" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-red-50/60 p-4 text-sm">
          <span className="text-ink-700">Para desactivarla, escribe un código de la app:</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={7} placeholder="000000" className="input !w-32 text-center font-mono" />
          <button onClick={disable} disabled={busy} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700">Desactivar</button>
          <button onClick={() => setStage("idle")} className="px-2 text-slate-500">Cancelar</button>
          {err && <p className="w-full text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}
