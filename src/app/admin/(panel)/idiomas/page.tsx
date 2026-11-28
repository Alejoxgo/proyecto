import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { activeForeign, groqReady } from "@/lib/i18n";
import { FOREIGN, LANG_NAMES, type Lang } from "@/lib/langs";
import Flash from "@/components/admin/Flash";
import { redoTranslation, saveLanguages, saveTranslation, testGroq, translateEverything } from "../../actions";

const box = "rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04)]";
const FLAG: Record<Lang, string> = { es: "🇨🇴", en: "🇺🇸", pt: "🇧🇷" };

export default async function LanguagesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; q?: string; lang?: string }> }) {
  await requireAdmin();
  const { ok, error, q = "" } = await searchParams;
  const sp = await searchParams;
  const lang: Exclude<Lang, "es"> = sp.lang === "pt" ? "pt" : "en";
  const active = await activeForeign();
  const where = { lang, ...(q ? { OR: [{ source: { contains: q } }, { text: { contains: q } }] } : {}) };
  const [counts, manual, rows] = await Promise.all([
    Promise.all(FOREIGN.map((l) => prisma.translation.count({ where: { lang: l } }))),
    prisma.translation.count({ where: { lang, manual: true } }),
    prisma.translation.findMany({ where, orderBy: { updatedAt: "desc" }, take: 60 }),
  ]);
  const ready = groqReady();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Idioma del sitio</h1>
        <p className="mt-1 text-sm text-slate-500">
          El sitio se escribe en español y Groq lo traduce solo a los idiomas que actives. Cada vez que guardas algo en el panel, se traduce de inmediato. Aquí puedes revisar y corregir cualquier traducción.
        </p>
      </div>
      <Flash ok={ok} error={error} />

      {/* Idiomas activos */}
      <form action={saveLanguages} className={`${box} p-5`}>
        <p className="text-xs uppercase tracking-wider text-slate-500">Idiomas del sitio</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <input type="checkbox" checked disabled className="h-4 w-4" />
            <span className="text-lg">{FLAG.es}</span>
            <span>
              <b className="block text-ink-900">Español</b>
              <span className="text-xs text-slate-500">Original · aldore.co</span>
            </span>
          </label>
          {FOREIGN.map((l, i) => (
            <label key={l} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-ink-900 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40">
              <input type="checkbox" name="langs" value={l} defaultChecked={active.includes(l)} className="h-4 w-4 accent-brand-600" />
              <span className="text-lg">{FLAG[l]}</span>
              <span>
                <b className="block text-ink-900">{LANG_NAMES[l]}</b>
                <span className="text-xs text-slate-500">aldore.co/{l} · {counts[i]} textos</span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="btn-primary">Guardar idiomas</button>
          <p className="text-xs text-slate-500">Los idiomas apagados desaparecen del selector del sitio.</p>
        </div>
      </form>

      {/* Groq */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${box} p-5`}>
          <p className="text-xs uppercase tracking-wider text-slate-500">Traductor y chat de Aldo</p>
          <p className={`mt-1 font-display text-2xl ${ready ? "text-green-700" : "text-amber-700"}`}>{ready ? "Clave de Groq puesta" : "Sin clave de Groq"}</p>
          <p className="mt-1 text-xs text-slate-500">{ready ? "Pulsa «Probar» para confirmar que responde." : "Agrega GROQ_API_KEY como secreto en Cloudflare y vuelve a publicar."}</p>
          <form action={testGroq} className="mt-3">
            <button className="btn-outline !py-2 text-sm">Probar conexión con Groq</button>
          </form>
        </div>
        <form action={translateEverything} className={`${box} flex flex-col gap-3 p-5`}>
          <p className="text-xs uppercase tracking-wider text-slate-500">Traducir todo</p>
          <p className="text-sm text-slate-600">¿Primera vez o cambiaste muchas cosas? Traduce de una vez todo lo que falte. Puede tardar un par de minutos.</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <select name="lang" className="input !w-auto !py-2 text-sm" defaultValue="all">
              <option value="all">Todos los idiomas activos</option>
              {active.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
            </select>
            <button className="btn-primary" disabled={!ready || !active.length}>Traducir ahora</button>
          </div>
        </form>
      </div>

      {/* Revisión */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
            {FOREIGN.map((l) => (
              <a key={l} href={`/admin/idiomas?lang=${l}`} className={`rounded-lg px-3 py-1.5 ${l === lang ? "bg-ink-900 text-white" : "text-slate-600 hover:text-ink-900"}`}>
                {FLAG[l]} {LANG_NAMES[l]}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-500">{manual} corregidos a mano en {LANG_NAMES[lang].toLowerCase()}</p>
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="lang" value={lang} />
          <input name="q" defaultValue={q} placeholder={`Buscar un texto en español o ${LANG_NAMES[lang].toLowerCase()}…`} className="input" />
          <button className="btn-outline shrink-0">Buscar</button>
        </form>
        <div className={`divide-y divide-slate-100 ${box}`}>
          {rows.length === 0 && <p className="p-5 text-sm text-slate-500">{q ? "No hay traducciones con ese texto." : "Todavía no hay traducciones en este idioma. Pulsa «Traducir ahora» o abre el sitio en ese idioma."}</p>}
          {rows.map((r) => (
            <div key={r.id} className="grid gap-3 p-4 md:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Español</p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{r.source}</p>
              </div>
              <div>
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
                  {LANG_NAMES[lang]} {r.manual && <span className="rounded bg-sky-50 px-1.5 py-0.5 normal-case tracking-normal text-sky-700">corregido a mano</span>}
                </p>
                <form action={saveTranslation.bind(null, r.id)} className="mt-1 space-y-2">
                  <input type="hidden" name="q" value={q} />
                  <input type="hidden" name="lang" value={lang} />
                  <textarea name="text" defaultValue={r.text} rows={Math.min(6, Math.max(1, Math.ceil(r.text.length / 60)))} className="input text-sm" />
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-ink-900 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600">Guardar</button>
                    <button formAction={redoTranslation.bind(null, r.id)} className="rounded-lg border border-paper-line px-3 py-1 text-xs text-ink-700 hover:border-ink-900">Volver a traducir</button>
                  </div>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
