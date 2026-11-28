import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/** Sesión del portal de clientes (aparte de la del panel: un cliente nunca entra al panel). */
export const CLIENT_COOKIE = "nb_client";
const HOURS = 12;

function key() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "");
}

export async function startClientSession(cid: number) {
  const token = await new SignJWT({ cid, purpose: "client" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${HOURS}h`).sign(key());
  (await cookies()).set(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    path: "/portal",
    maxAge: HOURS * 3600,
  });
}

export async function getClientId(): Promise<number | null> {
  const token = (await cookies()).get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.purpose === "client" ? Number(payload.cid) : null;
  } catch {
    return null;
  }
}
