import { requireAdmin } from "@/lib/auth";
import { SETTINGS_GROUPS, getRawSettings } from "@/lib/settings";
import Flash from "@/components/admin/Flash";
import { saveSettings } from "../../actions";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireAdmin();
  const { ok } = await searchParams;
  const s = await getRawSettings();
  return (
    <div>
      <h1 className="font-display text-3xl text-ink-900">Textos del sitio</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Edita los títulos, textos, datos de contacto y redes sociales. Los cambios se ven de inmediato. En los títulos puedes encerrar una palabra entre *asteriscos* para resaltarla.</p>
      <Flash ok={ok} />
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
      <nav aria-label="Secciones" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:sticky lg:top-10 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0">
        {SETTINGS_GROUPS.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-ink-700 transition hover:border-brand-500 hover:text-brand-700 lg:rounded-lg lg:border-transparent lg:bg-transparent lg:px-3 lg:py-1.5 lg:text-sm lg:hover:bg-white">{g.title}</a>
        ))}
      </nav>
      <div className="min-w-0 max-w-3xl space-y-8">
        {SETTINGS_GROUPS.map((g) => (
          <form key={g.id} id={g.id} action={saveSettings} className="scroll-mt-10 space-y-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
            <input type="hidden" name="_group" value={g.id} />
            <div>
              <h2 className="font-display text-xl text-ink-900">{g.title}</h2>
              {g.description && <p className="text-sm text-slate-500">{g.description}</p>}
            </div>
            {g.fields.map((f) => (
              <div key={f.key}>
                <label className="label" htmlFor={f.key}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea id={f.key} name={f.key} defaultValue={s[f.key]} rows={Math.min(14, Math.max(3, (s[f.key] || "").split("\n").length + 1))} className="input" />
                ) : (
                  <input id={f.key} name={f.key} defaultValue={s[f.key]} className="input" placeholder={f.type === "url" ? "https://…" : undefined} />
                )}
                {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
              </div>
            ))}
            <button className="btn-primary">Guardar «{g.title}»</button>
          </form>
        ))}
      </div>
      </div>
    </div>
  );
}
