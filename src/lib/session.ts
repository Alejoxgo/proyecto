// Funciones de sesión compatibles con el runtime Edge (usadas por el middleware).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "nb_session";
/** Duración máxima de una sesión, aunque haya actividad. */
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas
/** Minutos sin actividad tras los que se cierra la sesión (variable SESSION_IDLE_MINUTES, por defecto 15). */
export function idleMinutes() {
  const n = Number.parseInt(process.env.SESSION_IDLE_MINUTES ?? "", 10);
  return n >= 2 && n <= 240 ? n : 15;
}
/** Cada cuánto se renueva la marca de actividad en la cookie. */
export const TOUCH_EVERY_MS = 60 * 1000;

export function authSecretReady() {
  return (process.env.AUTH_SECRET ?? "").length >= 32;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET debe estar definido y tener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = { uid: number; email: string; name: string };
type Claims = SessionPayload & { last?: number; iat?: number; exp?: number };

/** Firma la sesión. `start` conserva la hora de inicio al renovar, para que el máximo de 8 horas no se reinicie. */
export async function signSession(payload: SessionPayload, start?: number) {
  const now = Math.floor(Date.now() / 1000);
  const iat = start ?? now;
  return new SignJWT({ uid: payload.uid, email: payload.email, name: payload.name, last: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_MAX_AGE)
    .sign(secret());
}

async function readClaims(token?: string): Promise<Claims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const c = payload as unknown as Claims;
    // Sesiones sin marca de actividad (anteriores a este cambio) o inactivas: fuera.
    if (!c.last || Date.now() - c.last > idleMinutes() * 60 * 1000) return null;
    return c;
  } catch {
    return null;
  }
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  const c = await readClaims(token);
  return c ? { uid: c.uid, email: c.email, name: c.name } : null;
}

/**
 * Para el middleware: valida la sesión y, si la última marca de actividad tiene más de un minuto,
 * devuelve un token renovado para guardar en la cookie.
 */
export async function touchSession(token?: string): Promise<{ session: SessionPayload; renewed?: string } | null> {
  const c = await readClaims(token);
  if (!c) return null;
  const session = { uid: c.uid, email: c.email, name: c.name };
  if (Date.now() - (c.last ?? 0) < TOUCH_EVERY_MS) return { session };
  return { session, renewed: await signSession(session, c.iat) };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/* ---------- Verificación por correo (MFA) ---------- */

export const MFA_COOKIE = "nb_mfa";
export const TRUST_COOKIE = "nb_trust";
export const TRUST_DAYS = 30;

/** Marca "este equipo es de confianza" para no pedir el código por correo durante 30 días. */
export async function signTrust(uid: number) {
  return new SignJWT({ uid, purpose: "trust" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TRUST_DAYS}d`)
    .sign(secret());
}

export async function verifyTrust(token: string | undefined, uid: number) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.purpose === "trust" && payload.uid === uid;
  } catch {
    return false;
  }
}

/** Huella del código: nunca se guarda el código en claro. */
export async function hashCode(code: string, challengeId: string) {
  const data = new TextEncoder().encode(`${challengeId}:${code}:${process.env.AUTH_SECRET ?? ""}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
