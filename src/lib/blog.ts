export function postDate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T00:00:00Z"));
}

export const tagList = (t: string) => t.split(",").map((x) => x.trim()).filter(Boolean);
