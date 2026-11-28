"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { mailReady, sendBatch, sendMail } from "@/lib/mail";
import { audienceWhere, renderCampaign } from "@/lib/mailing";
import { randomKey } from "@/lib/utils";
import { groqChat } from "@/lib/groq";

const site = () => (process.env.SITE_URL || "https://aldore.co").replace(/\/$/, "");
const back = (path: string, kind: "ok" | "error", msg: string) => redirect(`${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(msg)}`);
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
/** Por cada clic en «Enviar» se mandan hasta este número (así no se pasa del límite del Worker). Si hay más, se continúa. */
const PER_RUN = 400;

/* ---------------- Contactos ---------------- */

async function upsertContact(email: string, data: { name?: string; tags?: string; source?: string; clientId?: number | null }) {
  const e = email.trim().toLowerCase();
  if (!isEmail(e)) return false;
  const found = await prisma.contact.findUnique({ where: { email: e } });
  if (found) {
    const tags = [...new Set([...found.tags.split(","), ...(data.tags || "").split(",")].map((t) => t.trim()).filter(Boolean))].join(",");
    await prisma.contact.update({ where: { id: found.id }, data: { name: found.name || data.name || "", tags, clientId: found.clientId ?? data.clientId ?? null } });
    return false;
  }
  await prisma.contact.create({ data: { email: e, name: data.name || "", tags: data.tags || "", source: data.source || "manual", clientId: data.clientId ?? null, token: randomKey(24) } });
  return true;
}

/** Trae a la lista los correos de los clientes y de quienes escribieron por el sitio. */
export async function syncContacts() {
  await requirePerm("mailing");
  const [clients, leads] = await Promise.all([
    prisma.client.findMany({ where: { email: { not: "" } }, select: { id: true, email: true, name: true } }),
    prisma.lead.findMany({ where: { email: { not: "" } }, select: { email: true, name: true } }),
  ]);
  let added = 0;
  for (const c of clients) if (await upsertContact(c.email, { name: c.name, source: "clientes", tags: "cliente", clientId: c.id })) added++;
  for (const l of leads) if (await upsertContact(l.email, { name: l.name, source: "solicitudes", tags: "sitio" })) added++;
  back("/admin/mailing?tab=contactos", "ok", added ? `Listo: ${added} contacto(s) nuevo(s).` : "La lista ya estaba al día.");
}

/** Pega una lista: una persona por línea, «correo, nombre, etiquetas». */
export async function importContacts(formData: FormData) {
  await requirePerm("mailing");
  const raw = String(formData.get("list") ?? "").slice(0, 200_000);
  const tag = String(formData.get("tag") ?? "").trim().toLowerCase().replace(/[^a-z0-9áéíóúñ-]/g, "");
  let added = 0;
  let bad = 0;
  for (const line of raw.split(/\r?\n/)) {
    const [email, name = "", tags = ""] = line.split(/[,;\t]/).map((x) => x.trim());
    if (!email) continue;
    if (!isEmail(email)) { bad++; continue; }
    if (await upsertContact(email, { name, tags: [tag, ...tags.split(/\s+/)].filter(Boolean).join(","), source: "manual" })) added++;
  }
  back("/admin/mailing?tab=contactos", "ok", `Importados ${added} contacto(s) nuevo(s)${bad ? `. ${bad} línea(s) sin correo válido.` : "."}`);
}

export async function toggleContact(id: number) {
  await requirePerm("mailing");
  const c = await prisma.contact.findUnique({ where: { id } });
  if (c) await prisma.contact.update({ where: { id }, data: { subscribed: !c.subscribed } });
  revalidatePath("/admin/mailing");
}

export async function deleteContact(id: number) {
  await requirePerm("mailing");
  await prisma.contact.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/mailing");
}

/* ---------------- Campañas ---------------- */

export async function newCampaign() {
  await requirePerm("mailing");
  const c = await prisma.campaign.create({ data: { subject: "Nueva campaña", body: "Escribe aquí tu mensaje.\n\nPuedes usar **negrita**, listas con guiones y {nombre} para saludar a cada persona por su nombre." } });
  redirect(`/admin/mailing/${c.id}`);
}

export async function saveCampaign(id: number, formData: FormData) {
  await requirePerm("mailing");
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) redirect("/admin/mailing");
  if (c!.status === "enviada") back(`/admin/mailing/${id}`, "error", "Esta campaña ya se envió. Duplícala para hacer otra.");
  const s = (k: string, max: number) => String(formData.get(k) ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
  const ctaUrl = s("ctaUrl", 500);
  if (ctaUrl && !/^https?:\/\//.test(ctaUrl)) back(`/admin/mailing/${id}`, "error", "El enlace del botón debe empezar por https://");
  const tag = s("tag", 40).toLowerCase();
  const audience = s("audience", 60) === "tag" && tag ? `tag:${tag}` : s("audience", 60) || "todos";
  await prisma.campaign.update({ where: { id }, data: { subject: s("subject", 160) || "Sin asunto", preheader: s("preheader", 200), body: s("body", 30000), ctaLabel: s("ctaLabel", 60), ctaUrl, audience } });
  const next = String(formData.get("next") ?? "");
  if (next === "test") return sendTest(id);
  back(`/admin/mailing/${id}`, "ok", "Campaña guardada");
}

export async function duplicateCampaign(id: number) {
  await requirePerm("mailing");
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) redirect("/admin/mailing");
  const n = await prisma.campaign.create({ data: { subject: `${c!.subject} (copia)`, preheader: c!.preheader, body: c!.body, ctaLabel: c!.ctaLabel, ctaUrl: c!.ctaUrl, audience: c!.audience } });
  redirect(`/admin/mailing/${n.id}`);
}

export async function deleteCampaign(id: number) {
  await requirePerm("mailing");
  await prisma.campaignSend.deleteMany({ where: { campaignId: id } });
  await prisma.campaign.delete({ where: { id } }).catch(() => {});
  back("/admin/mailing", "ok", "Campaña eliminada");
}

/** Te envía la campaña a ti para revisarla en tu bandeja. */
async function sendTest(id: number) {
  const session = await requirePerm("mailing");
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) redirect("/admin/mailing");
  if (!mailReady()) back(`/admin/mailing/${id}`, "error", "Falta configurar RESEND_API_KEY en Cloudflare para enviar correos.");
  const html = renderCampaign(c!, { site: site(), name: session.name, unsubscribe: `${site()}/baja/prueba` });
  const r = await sendMail({ to: session.email, subject: `[Prueba] ${c!.subject}`, html, from: process.env.MAIL_MARKETING_FROM });
  back(`/admin/mailing/${id}`, r.ok ? "ok" : "error", r.ok ? `Prueba enviada a ${session.email}` : "No se pudo enviar la prueba. Revisa Resend.");
}

/** Envía la campaña a su audiencia, por tandas. Si quedan personas, el botón dice «Continuar envío». */
export async function sendCampaign(id: number) {
  await requirePerm("mailing");
  const c = await prisma.campaign.findUnique({ where: { id } });
  if (!c) redirect("/admin/mailing");
  if (c!.status === "enviada") back(`/admin/mailing/${id}`, "error", "Esta campaña ya se envió.");
  if (!mailReady()) back(`/admin/mailing/${id}`, "error", "Falta configurar RESEND_API_KEY en Cloudflare para enviar correos.");
  const done = new Set((await prisma.campaignSend.findMany({ where: { campaignId: id }, select: { contactId: true } })).map((s) => s.contactId));
  const all = await prisma.contact.findMany({ where: audienceWhere(c!.audience), orderBy: { id: "asc" } });
  const todo = all.filter((x) => !done.has(x.id)).slice(0, PER_RUN);
  if (!todo.length && !done.size) back(`/admin/mailing/${id}`, "error", "No hay contactos suscritos en esa audiencia.");
  await prisma.campaign.update({ where: { id }, data: { status: "enviando" } });

  let sent = 0;
  for (let i = 0; i < todo.length; i += 100) {
    const chunk = todo.slice(i, i + 100).map((ct) => ({ ct, key: randomKey(26) }));
    const items = chunk.map(({ ct, key }) => {
      const unsubscribe = `${site()}/baja/${ct.token}`;
      return {
        to: ct.email,
        subject: c!.subject,
        html: renderCampaign(c!, { site: site(), name: ct.name, unsubscribe, pixel: `${site()}/api/m/o/${key}`, click: c!.ctaUrl ? `${site()}/api/m/c/${key}` : undefined }),
        headers: { "List-Unsubscribe": `<${site()}/api/m/baja/${ct.token}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
    });
    const r = await sendBatch(items);
    if (!r.ok) break;
    for (const { ct, key } of chunk) await prisma.campaignSend.create({ data: { campaignId: id, contactId: ct.id, key } }).catch(() => {});
    sent += chunk.length;
  }
  const total = await prisma.campaignSend.count({ where: { campaignId: id } });
  const remaining = all.length - total;
  await prisma.campaign.update({ where: { id }, data: { sentCount: total, status: remaining > 0 ? "enviando" : "enviada", sentAt: remaining > 0 ? c!.sentAt : new Date() } });
  revalidatePath("/admin/mailing");
  if (!sent && todo.length) back(`/admin/mailing/${id}`, "error", "Resend no aceptó el envío. Revisa la clave y que el dominio esté verificado.");
  back(`/admin/mailing/${id}`, "ok", remaining > 0 ? `Enviados ${sent}. Faltan ${remaining}: pulsa «Continuar envío».` : `¡Campaña enviada a ${total} persona(s)!`);
}

/** Aldo escribe un borrador de la campaña a partir de una idea. */
export async function aldoWriteCampaign(idea: string) {
  await requirePerm("mailing");
  const r = await groqChat({
    temperature: 0.7,
    maxTokens: 900,
    json: true,
    messages: [
      {
        role: "system",
        content: `Eres Aldo, el búho de Aldore (estudio de software en Medellín). Escribes correos de email marketing en español de Colombia, cercanos, claros y profesionales, sin exagerar.
Devuelve SOLO JSON: {"subject": "...", "preheader": "...", "body": "...", "ctaLabel": "...", "ctaUrl": ""}.
- subject: máximo 60 caracteres, sin MAYÚSCULAS sostenidas ni emojis excesivos (uno como mucho).
- preheader: una frase que complemente el asunto.
- body: 3 a 6 párrafos cortos separados por una línea en blanco. Puedes usar **negrita** y listas con "- ". No pongas saludo (el correo ya dice "Hola, nombre"). No firmes.
- ctaLabel: texto corto del botón. ctaUrl: deja vacío si no te dan uno.
- No inventes precios, cifras ni clientes.`,
      },
      { role: "user", content: idea.slice(0, 1500) },
    ],
  });
  if (!r.ok) return { ok: false as const, error: "Aldo no pudo escribir ahora. Revisa la conexión con Groq." };
  try {
    const m = r.content.match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : r.content);
    return { ok: true as const, subject: String(j.subject || ""), preheader: String(j.preheader || ""), body: String(j.body || ""), ctaLabel: String(j.ctaLabel || ""), ctaUrl: String(j.ctaUrl || "") };
  } catch {
    return { ok: false as const, error: "Aldo respondió en un formato raro. Intenta otra vez." };
  }
}
