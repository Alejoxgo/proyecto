import { requireAdmin } from "@/lib/auth";
import { getRawSettings } from "@/lib/settings";
import { activeSeason, autoSeason, SEASONS } from "@/lib/season";
import ThemeStudio from "@/components/admin/ThemeStudio";

export default async function ThemesPage() {
  await requireAdmin();
  const s = await getRawSettings();
  const mode = (s["theme.mode"] || "auto").trim().toLowerCase();
  const effects = !/^(no|0|false)$/i.test((s["theme.effects"] || "").trim());
  const auto = autoSeason();
  const live = activeSeason(mode);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink-900">Temáticas de temporada</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Elige una temática para ver cómo queda el sitio antes de activarla. Cada una cuelga adornos bajo el menú, le pone a Aldo el accesorio de la fecha y, si quieres, deja caer detalles suaves.
        </p>
      </div>
      <ThemeStudio
        mode={mode}
        effects={effects}
        live={live}
        auto={auto}
        seasons={Object.entries(SEASONS).map(([id, v]) => ({ id, name: v.name, colors: v.colors }))}
      />
    </div>
  );
}
