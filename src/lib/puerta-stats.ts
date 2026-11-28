import "server-only";
import { prisma } from "@/lib/db";

/** Día "AAAA-MM-DD" en hora de Colombia (UTC-5). */
export function dayCO(d = new Date()) {
  return new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
}

/** Suma una visita o un toque de botón al día de hoy. Nunca rompe la página si falla. */
export async function bumpPuerta(pageId: number, kind: "view" | "click", label = "") {
  const day = dayCO();
  label = label.slice(0, 80);
  await prisma.puertaStat
    .upsert({
      where: { pageId_day_kind_label: { pageId, day, kind, label } },
      create: { pageId, day, kind, label, count: 1 },
      update: { count: { increment: 1 } },
    })
    .catch(() => {});
}

/** Visitas y toques de los últimos `days` días y los botones más tocados. */
export async function puertaStats(pageId: number, days = 14) {
  const from = dayCO(new Date(Date.now() - (days - 1) * 86400_000));
  const rows = await prisma.puertaStat.findMany({ where: { pageId, day: { gte: from } } });
  const series = Array.from({ length: days }, (_, i) => {
    const day = dayCO(new Date(Date.now() - (days - 1 - i) * 86400_000));
    return {
      day,
      views: rows.filter((r) => r.day === day && r.kind === "view").reduce((a, r) => a + r.count, 0),
      clicks: rows.filter((r) => r.day === day && r.kind === "click").reduce((a, r) => a + r.count, 0),
    };
  });
  const byButton = new Map<string, number>();
  for (const r of rows) if (r.kind === "click") byButton.set(r.label || "Botón", (byButton.get(r.label || "Botón") || 0) + r.count);
  const top = [...byButton.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, count }));
  return { series, top, views: series.reduce((a, d) => a + d.views, 0), clicks: series.reduce((a, d) => a + d.clicks, 0) };
}
