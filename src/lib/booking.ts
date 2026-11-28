import "server-only";
import { prisma } from "@/lib/db";
import { getRawSettings } from "@/lib/settings";

export type Slot = { time: string; free: boolean };
export type BookingDay = { date: string; slots: Slot[] };

const pad = (n: number) => String(n).padStart(2, "0");
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };

/** "Ahora" en hora de Colombia (UTC-5, sin horario de verano). */
export function nowCO() {
  const d = new Date(Date.now() - 5 * 3600_000);
  return { date: d.toISOString().slice(0, 10), minutes: d.getUTCHours() * 60 + d.getUTCMinutes(), weekday: d.getUTCDay() || 7 };
}

export async function bookingConfig() {
  const s = await getRawSettings();
  const days = (s["booking.days"] || "1,2,3,4,5").split(/[\s,]+/).map(Number).filter((n) => n >= 1 && n <= 7);
  const ranges = (s["booking.hours"] || "09:00-12:00, 14:00-17:00")
    .split(",")
    .map((r) => r.trim().split("-").map((x) => x.trim()))
    .filter((r) => r.length === 2 && /^\d{1,2}:\d{2}$/.test(r[0]) && /^\d{1,2}:\d{2}$/.test(r[1]))
    .map(([a, b]) => [toMin(a), toMin(b)] as const);
  const slot = Math.min(180, Math.max(10, Number(s["booking.slot"]) || 30));
  const ahead = Math.min(60, Math.max(1, Number(s["booking.ahead"]) || 21));
  return { days, ranges, slot, ahead, meet: s["booking.meet"] || "", title: s["booking.title"], text: s["booking.text"] };
}

/** Días y horas disponibles. Quita las horas ya tomadas y las que están a menos de 2 horas. */
export async function availability(): Promise<{ days: BookingDay[]; slot: number }> {
  const cfg = await bookingConfig();
  const now = nowCO();
  const base = new Date(now.date + "T12:00:00Z");
  const dates: string[] = [];
  for (let i = 0; i <= cfg.ahead; i++) {
    const d = new Date(base.getTime() + i * 86400_000);
    if (cfg.days.includes(d.getUTCDay() || 7)) dates.push(d.toISOString().slice(0, 10));
  }
  const taken = await prisma.booking.findMany({ where: { date: { in: dates }, status: { not: "cancelada" } }, select: { date: true, time: true } });
  const busy = new Set(taken.map((t) => `${t.date} ${t.time}`));
  const days = dates
    .map((date) => {
      const slots: Slot[] = [];
      for (const [a, b] of cfg.ranges) {
        for (let m = a; m + cfg.slot <= b; m += cfg.slot) {
          const time = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
          const past = date === now.date && m < now.minutes + 120;
          if (!past) slots.push({ time, free: !busy.has(`${date} ${time}`) });
        }
      }
      return { date, slots };
    })
    .filter((d) => d.slots.some((s) => s.free));
  return { days, slot: cfg.slot };
}

/** Enlace para agregar la llamada a Google Calendar. */
export function calendarLink(title: string, date: string, time: string, minutes: number, details: string) {
  const start = new Date(`${date}T${time}:00-05:00`);
  const end = new Date(start.getTime() + minutes * 60_000);
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(start)}/${f(end)}&details=${encodeURIComponent(details)}&ctz=America/Bogota`;
}

export function prettyDate(date: string, lang = "es") {
  return new Date(date + "T12:00:00Z").toLocaleDateString({ es: "es-CO", en: "en-US", pt: "pt-BR" }[lang] || "es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}
