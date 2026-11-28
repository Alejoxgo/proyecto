import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { groqChat } from "@/lib/groq";
import { notifyLead } from "@/lib/notify";

const hits = new Map<string, { n: number; until: number }>();

/** Aldo deja la solicitud lista: guarda los datos de la persona y un resumen de lo que habló en el chat. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const h = hits.get(ip);
  if (h && h.until > now && h.n >= 4) return NextResponse.json({ error: "limite" }, { status: 429 });
  hits.set(ip, h && h.until > now ? { n: h.n + 1, until: h.until } : { n: 1, until: now + 3600_000 });

  let body: { name?: string; contact?: string; interest?: string; messages?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  const name = String(body.name || "").trim().slice(0, 100);
  const contact = String(body.contact || "").trim().slice(0, 160);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = /^\+?[\d\s().-]{7,20}$/.test(contact);
  if (!name || (!isEmail && !isPhone)) return NextResponse.json({ error: "datos" }, { status: 400 });

  const chat = (body.messages || [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => `${m.role === "user" ? "Cliente" : "Aldo"}: ${m.content.slice(0, 500)}`)
    .join("\n");
  const interest = String(body.interest || "").slice(0, 120);

  // Resumen corto de la necesidad con IA (si no hay Groq, se guarda la conversación tal cual).
  let summary = "";
  if (process.env.GROQ_API_KEY && chat) {
    const r = await groqChat({
      temperature: 0.2,
      maxTokens: 160,
      timeoutMs: 12000,
      messages: [
        { role: "system", content: "Resume en español, en máximo 2 frases, qué necesita el cliente según esta conversación con el asistente de un estudio de software. Solo el resumen, sin saludos." },
        { role: "user", content: chat },
      ],
    }).catch(() => null);
    if (r?.ok) summary = r.content.trim().slice(0, 400);
  }
  const message = `${summary ? `Resumen: ${summary}\n\n` : ""}Conversación con Aldo:\n${chat || "(sin conversación)"}`.slice(0, 5000);
  const data = { name, email: isEmail ? contact.toLowerCase() : "", phone: isPhone ? contact : "", company: "", service: `Chat con Aldo${interest ? ` · ${interest}` : ""}`.slice(0, 160), message };
  const lead = await prisma.lead.create({ data });
  try {
    await notifyLead(lead.id, data, `${name} dejó su solicitud con Aldo`, Boolean(isEmail));
  } catch (e) {
    console.error("Aviso de solicitud de Aldo", e);
  }
  return NextResponse.json({ ok: true });
}
