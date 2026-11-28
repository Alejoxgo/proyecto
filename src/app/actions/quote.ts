"use server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeQuote, parseQuoteConfig, type QuoteSelection } from "@/lib/quote";
import { money } from "@/lib/format";
import { mailReady } from "@/lib/mail";
import { notifyLead } from "@/lib/notify";

export type QuoteState = { ok: boolean; message: string; errors?: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitQuote(_prev: QuoteState, fd: FormData): Promise<QuoteState> {
  if (String(fd.get("website") ?? "").trim()) return { ok: true, message: "¡Gracias!" };
  const get = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const sel: QuoteSelection = {
    type: get("type", 40),
    size: get("size", 40),
    speed: get("speed", 40),
    extras: fd.getAll("extras").map((x) => String(x).slice(0, 120)),
  };
  const data = { name: get("name"), email: get("email"), phone: get("phone", 40), company: get("company"), note: get("note", 3000) };
  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = "Escribe tu nombre.";
  if (!EMAIL_RE.test(data.email)) errors.email = "Escribe un correo válido.";
  if (Object.keys(errors).length) return { ok: false, message: "Revisa los campos marcados.", errors };

  // El precio se recalcula aquí: nunca confiamos en lo que manda el navegador.
  const q = computeQuote(parseQuoteConfig(await getSettings()), sel);
  if (!q) return { ok: false, message: "Elige un tipo de proyecto." };

  const message = [
    `Cotización en línea: ${q.type.name}`,
    `${q.scope.question} ${q.size.name}`,
    `Tiempo: ${q.speed.name}`,
    q.extras.length ? `Extras: ${q.extras.map((e) => `${e.name} (${money(e.price)})`).join(", ")}` : "Extras: ninguno",
    `Rango estimado: ${money(q.min)} – ${money(q.max)}${q.type.monthly ? ` ${q.type.monthly}` : ""}`,
    data.note ? `\nComentario del cliente:\n${data.note}` : "",
  ].join("\n");
  const lead = { name: data.name, email: data.email, phone: data.phone, company: data.company, service: `Cotización: ${q.type.name}`, message };
  const saved = await prisma.lead.create({ data: lead });
  if (mailReady()) await notifyLead(saved.id, lead, "Nueva cotización desde el sitio").catch((e) => console.error("Aviso de cotización", e));
  return { ok: true, message: `Listo, ${data.name.split(/\s+/)[0]}. Te escribimos en menos de 48 horas con la cotización exacta.` };
}
