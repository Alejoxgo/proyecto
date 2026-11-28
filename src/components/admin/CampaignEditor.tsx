"use client";
import { useMemo, useState, useTransition } from "react";
import Aldo from "@/components/Aldo";
import { renderCampaign, AUDIENCES } from "@/lib/mailing";
import { aldoWriteCampaign, deleteCampaign, duplicateCampaign, saveCampaign, sendCampaign } from "@/app/admin/mailing-actions";

type C = { id: number; subject: string; preheader: string; body: string; ctaLabel: string; ctaUrl: string; audience: string; status: string; sentCount: number; openCount: number; clickCount: number };

export default function CampaignEditor({ c, counts, tags, me, mail, ai }: { c: C; counts: Record<string, number>; tags: string[]; me: string; mail: boolean; ai: boolean }) {
  const locked = c.status === "enviada";
  const [v, setV] = useState({ subject: c.subject, preheader: c.preheader, body: c.body, ctaLabel: c.ctaLabel, ctaUrl: c.ctaUrl });
  const [aud, setAud] = useState(c.audience.startsWith("tag:") ? "tag" : c.audience);
  const [tag, setTag] = useState(c.audience.startsWith("tag:") ? c.audience.slice(4) : tags[0] || "");
  const [idea, setIdea] = useState("");
  const [aldo, setAldo] = useState<{ busy: boolean; msg: string }>({ busy: false, msg: "" });
  const [device, setDevice] = useState<"desk" | "phone">("desk");
  const [, start] = useTransition();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));
  const audienceKey = aud === "tag" ? `tag:${tag}` : aud;
  const reach = counts[audienceKey] ?? 0;
  const remaining = Math.max(0, reach - c.sentCount);

  const html = useMemo(() => renderCampaign(v, { site: "https://aldore.co", name: me, unsubscribe: "#" }), [v, me]);

  const write = () =>
    start(async () => {
      setAldo({ busy: true, msg: "" });
      const r = await aldoWriteCampaign(idea || v.subject);
      if (r.ok) {
        setV((s) => ({ subject: r.subject || s.subject, preheader: r.preheader || s.preheader, body: r.body || s.body, ctaLabel: r.ctaLabel || s.ctaLabel, ctaUrl: r.ctaUrl || s.ctaUrl }));
        setAldo({ busy: false, msg: "Listo. Revísalo y ajusta lo que quieras antes de guardar." });
      } else setAldo({ busy: false, msg: r.error });
    });

  const pct = (a: number) => (c.sentCount ? `${Math.round((a / c.sentCount) * 100)}%` : "—");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        {c.sentCount > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[["Enviados", String(c.sentCount)], ["Abiertos", pct(c.openCount)], ["Clics", pct(c.clickCount)]].map(([l, x]) => (
              <div key={l} className="rounded-2xl border border-black/[0.06] bg-white p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{l}</p><p className="mt-1 font-display text-2xl text-ink-900">{x}</p></div>
            ))}
          </div>
        )}

        {!locked && (
          <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/70 to-white p-4">
            <div className="flex items-start gap-3">
              <Aldo pose={aldo.busy ? "think" : "code"} follow={false} className="h-14 w-14 shrink-0" title="Aldo" />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm text-ink-800">{aldo.msg || "Cuéntame la idea y escribo la campaña por ti: asunto, texto y botón."}</p>
                <div className="flex gap-2">
                  <input value={idea} onChange={(e) => setIdea(e.target.value)} disabled={!ai} placeholder={ai ? "Ej: promo de diciembre, 15% en páginas web para restaurantes" : "Aldo necesita la clave de Groq"} className="input !py-2 text-sm" />
                  <button type="button" onClick={write} disabled={!ai || aldo.busy} className="shrink-0 rounded-lg bg-ink-900 px-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40">{aldo.busy ? "Escribiendo…" : "Escribir"}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form action={saveCampaign.bind(null, c.id)} className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5">
          <fieldset disabled={locked} className="space-y-4">
            <label className="block text-sm"><span className="label">Asunto</span><input name="subject" value={v.subject} onChange={set("subject")} maxLength={160} className="input" required /></label>
            <label className="block text-sm"><span className="label">Texto de vista previa</span><input name="preheader" value={v.preheader} onChange={set("preheader")} placeholder="Lo que se ve junto al asunto en la bandeja de entrada" className="input" /></label>
            <label className="block text-sm">
              <span className="label">Mensaje</span>
              <textarea name="body" value={v.body} onChange={set("body")} rows={12} className="input text-[14px] leading-relaxed" />
              <span className="mt-1 block text-xs text-slate-500">**negrita**, *cursiva*, listas con «- », títulos con «# », enlaces [texto](https://…) y {"{nombre}"} para el nombre de cada persona.</span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><span className="label">Botón (opcional)</span><input name="ctaLabel" value={v.ctaLabel} onChange={set("ctaLabel")} placeholder="Ej: Agenda una llamada" className="input" /></label>
              <label className="text-sm"><span className="label">Enlace del botón</span><input name="ctaUrl" value={v.ctaUrl} onChange={set("ctaUrl")} placeholder="https://aldore.co/cotizar" className="input" /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="label">¿A quién va?</span>
                <select name="audience" value={aud} onChange={(e) => setAud(e.target.value)} className="input">
                  {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label} ({counts[a.value] ?? 0})</option>)}
                  {tags.length > 0 && <option value="tag">Una etiqueta…</option>}
                </select>
              </label>
              {aud === "tag" ? (
                <label className="text-sm">
                  <span className="label">Etiqueta</span>
                  <select name="tag" value={tag} onChange={(e) => setTag(e.target.value)} className="input">
                    {tags.map((t) => <option key={t} value={t}>#{t} ({counts[`tag:${t}`] ?? 0})</option>)}
                  </select>
                </label>
              ) : <input type="hidden" name="tag" value="" />}
            </div>
          </fieldset>
          {!locked && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <button className="btn-primary !py-2 text-sm">Guardar</button>
              <button name="next" value="test" disabled={!mail} className="btn-outline !py-2 text-sm disabled:opacity-40" title={mail ? "" : "Falta RESEND_API_KEY"}>Guardar y enviarme una prueba</button>
            </div>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-5">
          {locked ? (
            <p className="flex-1 text-sm text-slate-600">Esta campaña ya se envió. Para mandar algo parecido, duplícala.</p>
          ) : (
            <>
              <p className="flex-1 text-sm text-slate-600">
                {c.status === "enviando" ? <>Envío en curso: faltan <b>{remaining}</b> persona(s).</> : <>Se enviará a <b>{reach}</b> persona(s) suscrita(s). Guarda los cambios antes de enviar.</>}
              </p>
              <form action={sendCampaign.bind(null, c.id)} onSubmit={(e) => { if (!confirm(`¿Enviar «${v.subject}» a ${c.status === "enviando" ? remaining : reach} persona(s)? No se puede deshacer.`)) e.preventDefault(); }}>
                <button disabled={!mail || !reach} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-40">{c.status === "enviando" ? "Continuar envío" : "Enviar campaña"}</button>
              </form>
            </>
          )}
          <form action={duplicateCampaign.bind(null, c.id)}><button className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-ink-900">Duplicar</button></form>
          <form action={deleteCampaign.bind(null, c.id)} onSubmit={(e) => { if (!confirm("¿Eliminar esta campaña?")) e.preventDefault(); }}><button className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">Eliminar</button></form>
        </div>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,.25)]">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs">
            <span className="min-w-0 flex-1 truncate"><b className="text-ink-900">{v.subject || "Sin asunto"}</b> <span className="text-slate-400">— {v.preheader}</span></span>
            <button onClick={() => setDevice("desk")} className={`rounded-md px-2 py-1 ${device === "desk" ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>Escritorio</button>
            <button onClick={() => setDevice("phone")} className={`rounded-md px-2 py-1 ${device === "phone" ? "bg-white font-medium shadow-sm" : "text-slate-500"}`}>Celular</button>
          </div>
          <div className="flex justify-center bg-[#f4f1ea]">
            <iframe title="Vista previa del correo" srcDoc={html} sandbox="" className="h-[70vh] bg-white" style={{ width: device === "phone" ? 380 : "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
