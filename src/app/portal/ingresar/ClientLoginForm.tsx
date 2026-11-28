"use client";
import { useActionState } from "react";
import { clientLogin, type PortalLogin } from "../actions";

export default function ClientLoginForm() {
  const [state, action, pending] = useActionState<PortalLogin, FormData>(clientLogin, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm"><span className="label">Correo</span><input name="email" type="email" defaultValue={state.email} className="input" autoComplete="username" required /></label>
      <label className="block text-sm"><span className="label">Contraseña</span><input name="password" type="password" className="input" autoComplete="current-password" required /></label>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button className="btn-signal w-full justify-center" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
