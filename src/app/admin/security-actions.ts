"use server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { SignJWT, jwtVerify } from "jose";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { newTotpSecret, totpUri, verifyTotp } from "@/lib/totp";
import { startSession } from "@/lib/login";
import { sessionCookieOptions } from "@/lib/session";

/* ---------------- App autenticadora (TOTP) ---------------- */

/** Crea un secreto nuevo (aún no activo) y devuelve el QR para escanearlo. */
export async function totpBegin() {
  const session = await requireAdmin();
  const secret = newTotpSecret();
  await prisma.user.update({ where: { id: session.uid }, data: { totpSecret: secret, totpOn: false } });
  const uri = totpUri(secret, session.email);
  const svg = await QRCode.toString(uri, { type: "svg", margin: 1, color: { dark: "#16130f", light: "#ffffff" } });
  return { secret: secret.replace(/(.{4})/g, "$1 ").trim(), svg };
}

/** Confirma con un código de la app y deja activo el segundo factor. */
export async function totpConfirm(code: string) {
  const session = await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id: session.uid }, select: { totpSecret: true } });
  if (!u?.totpSecret || !(await verifyTotp(u.totpSecret, code))) return { ok: false, error: "El código no coincide. Revisa que la hora de tu celular esté bien y prueba con el siguiente." };
  await prisma.user.update({ where: { id: session.uid }, data: { totpOn: true } });
  revalidatePath("/admin/perfil");
  return { ok: true };
}

export async function totpDisable(code: string) {
  const session = await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id: session.uid }, select: { totpSecret: true, totpOn: true } });
  if (u?.totpOn && !(await verifyTotp(u.totpSecret, code))) return { ok: false, error: "Escribe un código válido de tu app para desactivarla." };
  await prisma.user.update({ where: { id: session.uid }, data: { totpOn: false, totpSecret: "" } });
  revalidatePath("/admin/perfil");
  return { ok: true };
}

/* ---------------- Llaves de acceso (passkeys / WebAuthn) ---------------- */

const WA_COOKIE = "nb_wa";

function secretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "");
}

async function site() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "localhost").split(",")[0].trim();
  const rpID = host.replace(/:\d+$/, "");
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (rpID === "localhost" ? "http" : "https");
  return { rpID, origin: `${proto}://${host}` };
}

async function keepChallenge(challenge: string, purpose: "reg" | "auth", uid?: number) {
  const token = await new SignJWT({ challenge, purpose, uid: uid ?? 0 }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("5m").sign(secretKey());
  (await cookies()).set(WA_COOKIE, token, { ...sessionCookieOptions(), maxAge: 300 });
}

async function takeChallenge(purpose: "reg" | "auth") {
  const store = await cookies();
  const token = store.get(WA_COOKIE)?.value;
  store.delete(WA_COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.purpose === purpose ? { challenge: String(payload.challenge), uid: Number(payload.uid) } : null;
  } catch {
    return null;
  }
}

/** Paso 1 para registrar una llave de acceso en este equipo o celular. */
export async function passkeyRegisterOptions() {
  const session = await requireAdmin();
  const { rpID } = await site();
  const existing = await prisma.passkey.findMany({ where: { userId: session.uid } });
  const options = await generateRegistrationOptions({
    rpName: "Aldore · Panel",
    rpID,
    userName: session.email,
    userDisplayName: session.name,
    userID: new TextEncoder().encode(`aldore-user-${session.uid}`),
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({ id: p.credId, transports: (p.transports ? p.transports.split(",") : undefined) as AuthenticatorTransportFuture[] | undefined })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  await keepChallenge(options.challenge, "reg", session.uid);
  return options;
}

/** Paso 2: guarda la llave si el navegador la creó bien. */
export async function passkeyRegisterVerify(response: RegistrationResponseJSON, name: string) {
  const session = await requireAdmin();
  const ch = await takeChallenge("reg");
  if (!ch || ch.uid !== session.uid) return { ok: false, error: "La solicitud venció. Intenta de nuevo." };
  const { rpID, origin } = await site();
  try {
    const v = await verifyRegistrationResponse({ response, expectedChallenge: ch.challenge, expectedOrigin: origin, expectedRPID: rpID });
    if (!v.verified || !v.registrationInfo) return { ok: false, error: "No pudimos verificar la llave." };
    const c = v.registrationInfo.credential;
    await prisma.passkey.create({
      data: {
        userId: session.uid,
        credId: c.id,
        publicKey: isoBase64URL.fromBuffer(c.publicKey),
        counter: c.counter,
        transports: (c.transports || response.response.transports || []).join(","),
        name: name.trim().slice(0, 60) || "Llave de acceso",
      },
    });
    revalidatePath("/admin/perfil");
    return { ok: true };
  } catch (e) {
    console.error("Passkey registro", e);
    return { ok: false, error: "No pudimos guardar la llave. Intenta de nuevo." };
  }
}

export async function passkeyDelete(id: number) {
  const session = await requireAdmin();
  await prisma.passkey.deleteMany({ where: { id, userId: session.uid } });
  revalidatePath("/admin/perfil");
}

/** Ingreso con llave de acceso (sin contraseña): el navegador muestra las llaves guardadas para este sitio. */
export async function passkeyLoginOptions() {
  const { rpID } = await site();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred" });
  await keepChallenge(options.challenge, "auth");
  return options;
}

export async function passkeyLoginVerify(response: AuthenticationResponseJSON) {
  const ch = await takeChallenge("auth");
  if (!ch) return { ok: false, error: "La solicitud venció. Intenta de nuevo." };
  const pk = await prisma.passkey.findUnique({ where: { credId: response.id } });
  if (!pk) return { ok: false, error: "Esa llave no está registrada en el panel. Entra con tu contraseña y agrégala en Mi perfil." };
  const { rpID, origin } = await site();
  try {
    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: { id: pk.credId, publicKey: isoBase64URL.toBuffer(pk.publicKey), counter: pk.counter, transports: (pk.transports ? pk.transports.split(",") : undefined) as AuthenticatorTransportFuture[] | undefined },
    });
    if (!v.verified) return { ok: false, error: "No pudimos verificar la llave." };
    await prisma.passkey.update({ where: { id: pk.id }, data: { counter: v.authenticationInfo.newCounter, lastUsed: new Date() } });
    const user = await prisma.user.findUnique({ where: { id: pk.userId } });
    if (!user) return { ok: false, error: "Ese usuario ya no existe." };
    await startSession(user);
    return { ok: true };
  } catch (e) {
    console.error("Passkey ingreso", e);
    return { ok: false, error: "No pudimos verificar la llave. Intenta de nuevo." };
  }
}
