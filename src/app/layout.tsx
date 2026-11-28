import type { Metadata } from "next";
import "./fonts";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { HTML_LANG } from "@/lib/langs";
import { UI_STRINGS } from "@/lib/ui-strings";
import { UiProvider } from "@/components/TC";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(process.env.SITE_URL || "https://aldore.co"),
    title: { default: s["seo.title"], template: `%s | ${s["site.name"]}` },
    description: s["seo.description"],
    openGraph: { title: s["seo.title"], description: s["seo.description"], type: "website", locale: { es: "es_CO", en: "en_US", pt: "pt_BR" }[(await getT()).lang] },
    alternates: { canonical: "/", languages: { es: "/", en: "/en", pt: "/pt" } },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  // En inglés o portugués, el diccionario de textos fijos de la interfaz viaja a los componentes (ver TC.tsx).
  const dict: Record<string, string> = {};
  if (lang !== "es") for (const k of UI_STRINGS) { const v = t(k); if (v !== k) dict[k] = v; }
  // Modo oscuro elegido en el pie de página (solo afecta al sitio público, ver globals.css).
  const dark = (await cookies()).get("nb_theme")?.value === "dark";
  return (
    <html lang={HTML_LANG[lang]} className={dark ? "dark" : undefined}>
      <body>
        <UiProvider dict={dict}>{children}</UiProvider>
      </body>
    </html>
  );
}
