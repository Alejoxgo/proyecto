const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Audiencias de una campaña: todos los suscritos, solo clientes, solo solicitudes web o una etiqueta. */
export const AUDIENCES = [
  { value: "todos", label: "Todos los suscritos" },
  { value: "clientes", label: "Clientes" },
  { value: "solicitudes", label: "Personas que escribieron por el sitio" },
] as const;

export function audienceWhere(audience: string) {
  const base = { subscribed: true };
  if (audience === "clientes") return { ...base, source: "clientes" };
  if (audience === "solicitudes") return { ...base, source: "solicitudes" };
  if (audience.startsWith("tag:")) return { ...base, tags: { contains: audience.slice(4) } };
  return base;
}

export function audienceLabel(a: string) {
  return AUDIENCES.find((x) => x.value === a)?.label ?? (a.startsWith("tag:") ? `Etiqueta «${a.slice(4)}»` : a);
}

/** Texto sencillo → HTML de correo: párrafos, **negrita**, *cursiva*, [enlaces](url), listas con "-" y títulos con "#". */
export function bodyToHtml(body: string) {
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" style="color:#e2471c">$1</a>');
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        return `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.6">${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      const h = block.match(/^#{1,3}\s+(.+)/);
      if (h) return `<h2 style="margin:8px 0 12px;font-size:19px;line-height:1.3;color:#16130f">${inline(h[1])}</h2>`;
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65">${lines.map(inline).join("<br>")}</p>`;
    })
    .join("\n");
}

type C = { subject: string; preheader: string; body: string; ctaLabel: string; ctaUrl: string };

/** El correo completo de la campaña, personalizado para un contacto. */
export function renderCampaign(c: C, opts: { site: string; name?: string; unsubscribe: string; pixel?: string; click?: string }) {
  const first = (opts.name || "").trim().split(/\s+/)[0];
  const body = bodyToHtml(c.body.replace(/\{\s*nombre\s*\}/gi, first || ""));
  const cta =
    c.ctaLabel && c.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px"><tr><td style="background:#e2471c;border-radius:999px"><a href="${esc(opts.click || c.ctaUrl)}" style="display:inline-block;padding:13px 26px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none">${esc(c.ctaLabel)}</a></td></tr></table>`
      : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(c.subject)}</title></head>
<body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16130f">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(c.preheader || "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e6e0d4">
<tr><td style="background:#16130f;padding:22px 30px;color:#f4f1ea;font-size:21px;font-weight:600;letter-spacing:-.01em">aldore<span style="color:#e2471c">.</span></td></tr>
<tr><td style="padding:30px">
${first ? `<p style="margin:0 0 14px;font-size:15px">Hola, ${esc(first)}:</p>` : ""}
${body}
${cta}
</td></tr>
<tr><td style="padding:18px 30px;border-top:1px solid #eee7da;color:#8f8679;font-size:12px;line-height:1.6">
Recibes este correo porque eres cliente o nos escribiste en ${esc(opts.site.replace(/^https?:\/\//, ""))}.<br>
<a href="${esc(opts.unsubscribe)}" style="color:#8f8679">No quiero recibir más correos</a>
</td></tr></table></td></tr></table>
${opts.pixel ? `<img src="${esc(opts.pixel)}" width="1" height="1" alt="" style="display:block;border:0">` : ""}
</body></html>`;
}
