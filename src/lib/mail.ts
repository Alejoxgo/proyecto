import "server-only";

/**
 * Envío de correos con Resend (https://resend.com). Si falta RESEND_API_KEY no envía nada
 * y el sitio sigue funcionando igual: los avisos son un extra, nunca bloquean un formulario.
 */
export function mailReady() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function esc(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendMail(opts: { to: string | string[]; subject: string; html: string; replyTo?: string; from?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, skipped: true as const };
  const from = opts.from || process.env.MAIL_FROM || "Aldore <avisos@aldore.co>";
  try {
    const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html, reply_to: opts.replyTo }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("Resend", res.status, await res.text().catch(() => ""));
    return { ok: res.ok };
  } catch (e) {
    console.error("Resend", e);
    return { ok: false };
  }
}

/** Plantilla sencilla con la marca: papel claro, tinta oscura y el bermellón de Aldore. */
export function mailLayout(title: string, body: string, footer = "aldore.co") {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16130f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e0d4">
<tr><td style="background:#16130f;padding:20px 28px;color:#f4f1ea;font-size:20px;font-weight:600;letter-spacing:-.01em">aldore<span style="color:#e2471c">.</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#16130f">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #eee7da;color:#8f8679;font-size:12px">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

export function rows(data: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">${data
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f1ece2;color:#6b6358;width:120px;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #f1ece2;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

/** Envío masivo: hasta 100 correos por llamada (API batch de Resend). Devuelve cuántos aceptó. */
export async function sendBatch(items: { to: string; subject: string; html: string; headers?: Record<string, string> }[], from?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !items.length) return { ok: false, sent: 0 };
  const sender = from || process.env.MAIL_MARKETING_FROM || process.env.MAIL_FROM || "Aldore <hola@aldore.co>";
  const base = (process.env.RESEND_API_URL || "https://api.resend.com/emails").replace(/\/emails$/, "");
  try {
    const res = await fetch(`${base}/emails/batch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(items.map((i) => ({ from: sender, to: i.to, subject: i.subject, html: i.html, headers: i.headers }))),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error("Resend batch", res.status, await res.text().catch(() => ""));
      return { ok: false, sent: 0 };
    }
    return { ok: true, sent: items.length };
  } catch (e) {
    console.error("Resend batch", e);
    return { ok: false, sent: 0 };
  }
}
