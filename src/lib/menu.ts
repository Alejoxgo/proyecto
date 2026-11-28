export type MenuItem = { section: string; dish: string; detail: string; soldOut: boolean };

export function parseMenu(v: string): MenuItem[] {
  return v
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const soldOut = l.startsWith("!");
      const [section = "", dish = "", detail = ""] = l.replace(/^!\s*/, "").split("|").map((x) => x.trim());
      return dish ? { section, dish, detail, soldOut } : { section: "", dish: section, detail: "", soldOut };
    });
}

export function menuDate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));
}
