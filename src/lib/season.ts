import type { AldoWear } from "@/components/Aldo";

/** Temáticas de temporada. "auto" elige según la fecha en Colombia. */
export type SeasonId = "navidad" | "anionuevo" | "halloween" | "amor" | "patria" | "madres";
export type Particle = "snow" | "bats" | "hearts" | "confetti" | "flowers";

export const SEASONS: Record<SeasonId, { name: string; wear: AldoWear[]; particle: Particle; banner: string; colors: string[] }> = {
  navidad: { name: "Navidad", wear: ["santa", "scarf"], particle: "snow", banner: "🎄 ¡Feliz Navidad! Gracias por un año increíble.", colors: ["#d12a2a", "#15803d"] },
  anionuevo: { name: "Año nuevo", wear: ["party"], particle: "confetti", banner: "🎉 ¡Feliz año nuevo! Que este año tu negocio crezca.", colors: ["#7c3aed", "#f5b400"] },
  halloween: { name: "Halloween", wear: ["witch"], particle: "bats", banner: "🎃 Feliz Halloween. Aquí los únicos sustos son los precios bajos.", colors: ["#f97316", "#6d28d9"] },
  amor: { name: "Amor y amistad", wear: ["heart"], particle: "hearts", banner: "💛 Feliz mes de amor y amistad.", colors: ["#e11d48", "#f59e0b"] },
  patria: { name: "Fiestas patrias", wear: ["flag"], particle: "confetti", banner: "🇨🇴 ¡Viva Colombia!", colors: ["#fcd116", "#003893", "#ce1126"] },
  madres: { name: "Día de la madre", wear: ["heart", "bowtie"], particle: "flowers", banner: "🌷 Feliz día a todas las mamás.", colors: ["#ec4899", "#f472b6"] },
};

/** Fecha de hoy en Colombia como [mes 1-12, día]. */
function todayCO(): [number, number] {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", month: "numeric", day: "numeric" }).formatToParts(new Date());
  return [Number(parts.find((p) => p.type === "month")!.value), Number(parts.find((p) => p.type === "day")!.value)];
}

export function autoSeason(): SeasonId | null {
  const [m, d] = todayCO();
  if (m === 12 && d <= 30) return "navidad";
  if ((m === 12 && d === 31) || (m === 1 && d <= 6)) return "anionuevo";
  if (m === 10 && d >= 20) return "halloween";
  if (m === 9) return "amor";
  if ((m === 7 && d >= 15) || (m === 8 && d <= 8)) return "patria";
  if (m === 5 && d <= 12) return "madres";
  return null;
}

/** Temática activa según el ajuste del panel: auto, ninguna o una fija. */
export function activeSeason(mode: string): SeasonId | null {
  const v = (mode || "auto").trim().toLowerCase();
  if (v === "ninguna" || v === "no" || v === "off") return null;
  if (v in SEASONS) return v as SeasonId;
  return autoSeason();
}

/** Temática que se está mostrando en esta petición (la vista previa ?tema=… manda sobre el ajuste). */
export async function currentSeason(): Promise<SeasonId | null> {
  const [{ headers }, { getRawSettings }] = await Promise.all([import("next/headers"), import("@/lib/settings")]);
  const [h, raw] = await Promise.all([headers(), getRawSettings()]);
  return activeSeason(h.get("x-theme-preview") || raw["theme.mode"]);
}
