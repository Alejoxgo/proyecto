"use client";
import { celebrate } from "@/lib/celebrate";
import TC from "@/components/TC";
import { useActionState, useEffect } from "react";
import Aldo from "./Aldo";
import { submitContact, type ContactState } from "@/app/actions/contact";

const initial: ContactState = { ok: false, message: "" };

export default function ContactForm({ services, defaultService = "" }: { services: string[]; defaultService?: string }) {
  const [state, action, pending] = useActionState(submitContact, initial);
  useEffect(() => { if (state.ok) celebrate(); }, [state.ok]);

  if (state.ok) {
    return (
      <div className="flex items-center gap-6 border-t border-ink-900 pt-8">
        <Aldo pose="happy" className="h-28 w-28 shrink-0" />
        <div>
        <p className="font-display text-3xl text-ink-900"><TC>{"Mensaje recibido"}</TC></p>
        <p className="mt-3 text-lg text-ink-700">{state.message}</p>
        </div>
      </div>
    );
  }

  const v = state.values ?? {};
  const err = (k: string) => state.errors?.[k] && <p className="mt-1 text-xs text-red-600">{state.errors[k]}</p>;

  return (
    <form key={JSON.stringify(v)} action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div>
        <label className="label" htmlFor="cf-name"><TC>{"Nombre *"}</TC></label>
        <input id="cf-name" name="name" defaultValue={v.name} className="input" autoComplete="name" required />
        {err("name")}
      </div>
      <div>
        <label className="label" htmlFor="cf-email"><TC>{"Correo *"}</TC></label>
        <input id="cf-email" name="email" defaultValue={v.email} type="email" className="input" autoComplete="email" required />
        {err("email")}
      </div>
      <div>
        <label className="label" htmlFor="cf-phone"><TC>{"Teléfono / WhatsApp"}</TC></label>
        <input id="cf-phone" name="phone" defaultValue={v.phone} className="input" autoComplete="tel" />
      </div>
      <div>
        <label className="label" htmlFor="cf-company"><TC>{"Empresa"}</TC></label>
        <input id="cf-company" name="company" defaultValue={v.company} className="input" autoComplete="organization" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="cf-service"><TC>{"¿Qué necesitas?"}</TC></label>
        <select id="cf-service" name="service" className="input" defaultValue={v.service ?? defaultService}>
          <option value="">Selecciona una opción</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="cf-message"><TC>{"Cuéntanos tu proyecto *"}</TC></label>
        <textarea id="cf-message" name="message" defaultValue={v.message} rows={5} className="input" required />
        {err("message")}
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <button type="submit" className="btn-signal" disabled={pending}>
          {pending ? "Enviando…" : "Enviar mensaje"}
        </button>
        {state.message && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      </div>
    </form>
  );
}
