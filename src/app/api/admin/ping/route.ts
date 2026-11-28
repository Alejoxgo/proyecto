import { NextResponse } from "next/server";

// El middleware ya validó la sesión y renovó la marca de actividad; aquí solo respondemos.
export const dynamic = "force-dynamic";

export function POST() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
