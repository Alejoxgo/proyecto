import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, touchSession } from "@/lib/session";

const LANG_COOKIE = "lang";

/** Sitio público: /en/... o /pt/... muestran la página en ese idioma y lo recuerdan; /es/... vuelve al español. */
async function publicSite(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Vista previa (borrador del editor visual o una temática) solo para quien tiene sesión en el panel.
  const base = new Headers(req.headers);
  base.delete("x-draft");
  base.delete("x-pathname");
  base.delete("x-theme-preview");
  const wantsDraft = req.nextUrl.searchParams.get("vista") === "borrador";
  const theme = req.nextUrl.searchParams.get("tema");
  if ((wantsDraft || theme) && (await touchSession(req.cookies.get(SESSION_COOKIE)?.value))) {
    if (wantsDraft) base.set("x-draft", "1");
    if (theme && /^[a-z]{2,12}$/.test(theme)) base.set("x-theme-preview", theme);
  }
  const m = pathname.match(/^\/(en|es|pt)(\/.*)?$/);
  const year = 60 * 60 * 24 * 365;
  if (m) {
    const lang = m[1];
    const rest = m[2] || "/";
    const headers = base;
    headers.set("x-lang", lang);
    // /es/... redirige a la ruta normal; /en/... y /pt/... se quedan con su prefijo (mejor para compartir y para Google).
    if (lang === "es") {
      const url = req.nextUrl.clone();
      url.pathname = rest;
      const res = NextResponse.redirect(url);
      res.cookies.set(LANG_COOKIE, "es", { path: "/", maxAge: year, sameSite: "lax" });
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = rest;
    const res = NextResponse.rewrite(url, { request: { headers } });
    res.cookies.set(LANG_COOKIE, lang, { path: "/", maxAge: year, sameSite: "lax" });
    return res;
  }
  const headers = base;
  const saved = req.cookies.get(LANG_COOKIE)?.value;
  headers.set("x-lang", saved === "en" || saved === "pt" ? saved : "es");
  return NextResponse.next({ request: { headers } });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdmin) return await publicSite(req);
  // El panel siempre en español: se ignora cualquier cabecera de idioma que llegue de afuera.
  const clean = new Headers(req.headers);
  clean.delete("x-lang");
  clean.delete("x-draft");
  // La ruta viaja al servidor para revisar los permisos de cada sección del panel.
  clean.set("x-pathname", pathname);
  if (pathname.startsWith("/admin/login") || pathname === "/admin/salir") return NextResponse.next({ request: { headers: clean } });

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const result = await touchSession(token);
  if (!result) {
    if (pathname.startsWith("/api/admin")) {
      const res = NextResponse.json({ error: "No autorizado" }, { status: 401 });
      if (token) res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = token ? "?motivo=inactividad" : "";
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  const res = NextResponse.next({ request: { headers: clean } });
  // Cada visita o acción en el panel cuenta como actividad: se renueva la marca de tiempo.
  if (result.renewed) res.cookies.set(SESSION_COOKIE, result.renewed, sessionCookieOptions());
  return res;
}

export const config = {
  // Todo menos archivos estáticos (imágenes, fuentes, etc.).
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|txt|xml|woff2?|css|js|map)$).*)"],
};
