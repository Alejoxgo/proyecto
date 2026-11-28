/**
 * Códigos de app autenticadora (TOTP, RFC 6238): Google Authenticator, Microsoft Authenticator, Authy, 1Password…
 * Usa Web Crypto, así que funciona igual en Node y en Cloudflare Workers.
 */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function newTotpSecret(bytes = 20) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  let bits = "";
  for (const x of b) bits += x.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[Number.parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function fromB32(s: string) {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, "0");
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return out;
}

async function hotp(secret: string, counter: number) {
  const key = await crypto.subtle.importKey("raw", fromB32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[h.length - 1] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

/** Valida un código de 6 dígitos, aceptando 30 s antes o después por diferencias de reloj. */
export async function verifyTotp(secret: string, code: string, at = Date.now()) {
  const c = code.replace(/\D/g, "");
  if (c.length !== 6 || !secret) return false;
  const step = Math.floor(at / 30000);
  for (const d of [0, -1, 1]) if ((await hotp(secret, step + d)) === c) return true;
  return false;
}

export function totpUri(secret: string, account: string, issuer = "Aldore") {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Para las pruebas: el código vigente. */
export async function currentTotp(secret: string, at = Date.now()) {
  return hotp(secret, Math.floor(at / 30000));
}
