"use server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { availability, bookingConfig, calendarLink, prettyDate } from "@/lib/booking";
import { notifyLead } from "@/lib/notify";
import { esc, mailLayout, rows, sendMail } from "@/lib/mail";
import { getRawSettings } from "@/lib/settings";

export type BookState = { ok: boolean; message: string; date?: string; time?: string; calendar?: string };

const tries = new Map<string, { n: number; until: number }>();

/** Agenda una llamada: revisa que la hora siga libre, crea la solicitud, avisa al equipo y confirma al cliente. */
export async function bookCall(_: BookState, formData: FormData): Promise<BookState> {
  const g = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max);
  if (g("website")) return { ok: true, message: "" }; // trampa para bots
  const ip = (await headers()).get("cf-connecting-ip") || (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const t = tries.get(ip);
  if (t && t.until > Date.now() && t.n >= 5) return { ok: false, message: "Ya agendaste varias llamadas. Si necesitas cambiar una, escríbenos." };
  tries.set(ip, t && t.until > Date.now() ? { n: t.n + 1, until: t.until } : { n: 1, until: Date.now() + 3600_000 });

  const name = g("name", 100), email = g("email", 160).toLowerCase(), phone = g("phone", 40), company = g("company", 120), topic = g("topic", 120), notes = g("notes", 1500);
  const date = g("date", 10), time = g("time", 5);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Escribe tu nombre y un correo válido." };
  const { days, slot } = await availability();
  if (!days.some((d) => d.date === date && d.slots.some((s) => s.time === time && s.free))) return { ok: false, message: "Esa hora ya no está disponible. Escoge otra, por favor." };

  const cfg = await bookingConfig();
  const when = `${prettyDate(date)} a las ${time} (hora de Colombia)`;
  const message = `Llamada agendada para el ${when}.${topic ? `\nTema: ${topic}` : ""}${notes ? `\n\n${notes}` : ""}`;
  const lead = await prisma.lead.create({ data: { name, email, phone, company, service: `Llamada agendada · ${date} ${time}`, message } });
  const booking = await prisma.booking.create({ data: { name, email, phone, company, topic, notes, date, time, leadId: lead.id } });
  // Si dos personas tomaron la misma hora al mismo tiempo, se queda la primera.
  const clash = await prisma.booking.findFirst({ where: { date, time, status: { not: "cancelada" }, id: { lt: booking.id } } });
  if (clash) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "cancelada" } });
    return { ok: false, message: "Alguien tomó esa hora hace un instante. Escoge otra, por favor." };
  }

  const s = await getRawSettings();
  const where = cfg.meet ? `Videollamada: ${cfg.meet}` : `Te llamamos al ${phone || "número que nos dejaste"}.`;
  const calendar = calendarLink(`Llamada con ${s["site.name"] || "Aldore"}`, date, time, slot, `${topic ? topic + "\n" : ""}${where}`);
  try {
    await Promise.all([
      notifyLead(lead.id, { name, email, phone, company, service: `Llamada · ${date} ${time}`, message }, `${name} agendó una llamada`, false),
      sendMail({
        to: email,
        from: s["notify.from"] || undefined,
        subject: `Tu llamada con ${s["site.name"] || "Aldore"} quedó agendada`,
        html: mailLayout(
          `¡Listo, ${esc(name.split(/\s+/)[0])}!`,
          `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Tu llamada quedó agendada. Te esperamos.</p>` +
            rows([["Cuándo", when], ["Duración", `${slot} minutos`], ["Cómo", where], ...(topic ? ([["Tema", topic]] as [string, string][]) : [])]) +
            `<p style="margin:24px 0 0"><a href="${calendar}" style="display:inline-block;background:#e2471c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">Agregar a mi calendario</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#6b6358">¿Necesitas cambiar la hora? Responde este correo.</p>`,
          `${esc(s["site.name"] || "Aldore")} · ${esc(s["contact.email"] || "")}`,
        ),
      }),
    ]);
  } catch (e) {
    console.error("Avisos de la llamada", e);
  }
  return { ok: true, message: "Tu llamada quedó agendada.", date, time, calendar };
}
