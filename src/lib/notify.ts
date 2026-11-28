import "server-only";
import { getRawSettings as getSettings } from "@/lib/settings";
import { esc, mailLayout, rows, sendMail } from "@/lib/mail";

export async function notifyLead(id: number, d: { name: string; email: string; phone: string; company: string; service: string; message: string }, title = "Llegó una nueva solicitud desde el sitio", autoReply = true) {
  const s = await getSettings();
  const site = (process.env.SITE_URL || "https://aldore.co").replace(/\/$/, "");
  const from = s["notify.from"] || undefined;
  const to = (s["notify.email"] || s["contact.email"] || "").split(",").map((x) => x.trim()).filter(Boolean);
  const jobs: Promise<unknown>[] = [];
  if (to.length) {
    jobs.push(
      sendMail({
        to,
        from,
        replyTo: d.email,
        subject: `Nueva solicitud: ${d.name}${d.service ? ` · ${d.service}` : ""}`,
        html: mailLayout(
          title,
          rows([["Nombre", d.name], ["Correo", d.email], ["Teléfono", d.phone], ["Empresa", d.company], ["Servicio", d.service], ["Mensaje", d.message]]) +
            `<p style="margin:24px 0 0"><a href="${site}/admin/leads/${id}" style="display:inline-block;background:#16130f;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px">Abrir en el panel</a></p>
<p style="margin:12px 0 0;font-size:13px;color:#6b6358">Puedes responder este correo y le llega directo a ${esc(d.name)}.</p>`,
          "Aviso automático del sitio aldore.co",
        ),
      }),
    );
  }
  const auto = autoReply ? (s["notify.autoReply"] || "").trim() : "";
  if (auto) {
    const first = d.name.split(/\s+/)[0];
    jobs.push(
      sendMail({
        to: d.email,
        from,
        replyTo: to[0],
        subject: "Recibimos tu mensaje · Aldore",
        html: mailLayout(
          `¡Gracias, ${esc(first)}!`,
          `<p style="margin:0;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(auto.replace(/\{nombre\}/g, first))}</p>`,
          `Aldore · ${esc(s["contact.email"] || "hola@aldore.co")}`,
        ),
      }),
    );
  }
  await Promise.all(jobs);
}
