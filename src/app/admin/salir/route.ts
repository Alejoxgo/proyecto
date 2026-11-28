import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Cierra la sesión (lo usa el aviso de inactividad) y vuelve al ingreso.
export function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = req.nextUrl.searchParams.get("motivo") === "inactividad" ? "?motivo=inactividad" : "";
  const res = NextResponse.redirect(url);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
