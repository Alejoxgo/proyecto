import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DoorTransition from "@/components/DoorTransition";
import TiltCards from "@/components/TiltCards";
import AldoChat from "@/components/AldoChat";
import { loadAldo } from "@/lib/aldo-server";
import { linkList } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { SeasonWear } from "@/components/Aldo";
import SeasonLayer from "@/components/SeasonLayer";
import { SEASONS, activeSeason } from "@/lib/season";
import { getRawSettings } from "@/lib/settings";
import { headers } from "next/headers";
import { enabledLangs } from "@/lib/langs";
import SeasonDecor from "@/components/SeasonDecor";
import PreviewLinks from "@/components/PreviewLinks";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ s, services, knowledge }, session] = await Promise.all([loadAldo(), getSession().catch(() => null)]);
  // Temática de temporada (Navidad, Halloween…). La vista previa del panel (?tema=…) manda sobre el ajuste guardado.
  const raw = await getRawSettings();
  const h = await headers();
  const preview = h.get("x-theme-preview");
  const draft = h.get("x-draft") === "1";
  const seasonId = activeSeason(preview || raw["theme.mode"]);
  const season = seasonId ? SEASONS[seasonId] : null;
  const effects = !/^(no|0|false)$/i.test((raw["theme.effects"] || "").trim());
  return (
    <SeasonWear wear={season?.wear ?? []}>
    <div className={`site-grain ${seasonId ? `season-${seasonId}` : ""}`}>
      {season && effects && <SeasonLayer particle={season.particle} colors={season.colors} />}
      <Header
        name={s["site.name"]}
        links={linkList(s["nav.items"])}
        cta={s["nav.cta"]}
        ctaUrl={s["nav.ctaUrl"]}
        login={s["nav.login"]}
        user={session?.name || null}
        lang={knowledge.lang}
        langs={enabledLangs(raw["site.langs"])}
        decor={seasonId ? <SeasonDecor kind={seasonId} /> : null}
      />
      <main>{children}</main>
      <DoorTransition />
      <TiltCards />
      <Footer s={s} services={services} lang={knowledge.lang} langs={enabledLangs(raw["site.langs"])} />
      <AldoChat k={knowledge} />
      {(draft || preview) && <PreviewLinks params={draft ? "vista=borrador" : `tema=${preview}`} />}
    </div>
    </SeasonWear>
  );
}
