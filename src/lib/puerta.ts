// Puerta by Aldore: páginas de un toque para negocios (se abren con QR o NFC).

export type PuertaButton = { icon: string; title: string; subtitle: string; href: string };

export const PUERTA_ICONS = ["carta", "resena", "whatsapp", "wifi", "pago", "instagram", "facebook", "tiktok", "mapa", "web", "llamar", "reservar", "link"] as const;

/** Cada línea: ícono | título | subtítulo | enlace. El subtítulo es opcional. */
export function parseButtons(value: string | null | undefined): PuertaButton[] {
  return (value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split("|").map((p) => p.trim());
      if (parts.length === 2) return { icon: "link", title: parts[0], subtitle: "", href: parts[1] };
      if (parts.length === 3) return { icon: parts[0], title: parts[1], subtitle: "", href: parts[2] };
      const [icon, title, subtitle, ...rest] = parts;
      return { icon: icon || "link", title: title || "", subtitle: subtitle || "", href: rest.join("|") };
    })
    .filter((b) => b.title);
}

/** Convierte atajos en enlaces reales: un número para WhatsApp, "tel:", etc. */
export function resolveHref(b: PuertaButton) {
  const h = b.href.trim();
  if (!h || h === "wifi") return h;
  if (b.icon === "whatsapp" && /^\+?[\d\s-]+$/.test(h)) return `https://wa.me/${h.replace(/\D/g, "")}`;
  if (b.icon === "llamar" && /^\+?[\d\s-]+$/.test(h)) return `tel:${h.replace(/[^\d+]/g, "")}`;
  if (/^(https?:|mailto:|tel:|\/)/.test(h)) return h;
  return `https://${h}`;
}

export const DEMO_BUTTONS = [
  "carta | Nuestra carta | Mira lo que tenemos hoy | https://aldore.co",
  "resena | ¿Cómo te fue hoy? | Déjanos tu reseña en Google | https://g.page/r/",
  "whatsapp | Escríbenos por WhatsApp | Pedidos y reservas | +573000000000",
  "wifi | Conéctate a nuestro WiFi | Toca para ver la clave | wifi",
  "pago | Métodos de pago | Nequi, Daviplata y tarjetas | https://aldore.co",
].join("\n");

/** ¿Un color hexadecimal es oscuro? Sirve para elegir texto claro u oscuro encima. */
export function isDark(hex: string) {
  const m = hex.trim().replace("#", "");
  const full = m.length === 3 ? m.split("").map((x) => x + x).join("") : m;
  if (!/^[0-9a-f]{6}$/i.test(full)) return true;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.55;
}

export function puertaBg(d: { bgColor?: string; theme: string }) {
  return d.bgColor || (d.theme === "claro" ? "#f4f1ea" : "#16130f");
}

