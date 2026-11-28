"use server";
import { prisma } from "@/lib/db";
import { mailReady } from "@/lib/mail";
import { notifyLead } from "@/lib/notify";

export type ContactState = { ok: boolean; message: string; errors?: Record<string, string>; values?: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot anti-spam: los humanos no ven este campo.
  if (String(formData.get("website") ?? "").trim()) return { ok: true, message: "¡Gracias! Te contactaremos pronto." };

  const get = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max);
  const data = {
    name: get("name"),
    email: get("email"),
    phone: get("phone", 40),
    company: get("company"),
    service: get("service"),
    message: get("message", 5000),
  };

  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = "Escribe tu nombre.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Escribe un correo válido.";
  if (data.message.length < 10) errors.message = "Cuéntanos un poco más (mínimo 10 caracteres).";
  if (Object.keys(errors).length) return { ok: false, message: "Revisa los campos marcados.", errors, values: data };

  const lead = await prisma.lead.create({ data });
  if (mailReady()) await notifyLead(lead.id, data).catch((e) => console.error("Aviso de contacto", e));
  return { ok: true, message: "¡Gracias! Recibimos tu mensaje y te contactaremos en menos de 48 horas." };
}

