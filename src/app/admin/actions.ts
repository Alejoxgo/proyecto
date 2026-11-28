"use server";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAccess, requireAdmin, requireOwner, requirePerm } from "@/lib/auth";
import { permForResource, parsePerms } from "@/lib/permissions";
import { translateLater } from "@/lib/i18n";
import { MFA_COOKIE, SESSION_COOKIE, TRUST_COOKIE, TRUST_DAYS, authSecretReady, hashCode, sessionCookieOptions, signSession, signTrust, verifyTrust } from "@/lib/session";
import { esc, mailLayout, mailReady, sendMail } from "@/lib/mail";

const NO_SECRET =
  "Falta configurar la variable secreta AUTH_SECRET (mínimo 32 caracteres) en el servidor. Agrégala en Cloudflare → aldore → Settings → Variables and Secrets.";
import { getResource } from "@/lib/resources";
import { SETTING_KEYS } from "@/lib/settings";
import { randomKey, slugify } from "@/lib/utils";
import { verifyTotp } from "@/lib/totp";
import { startSession } from "@/lib/login";
import { LEAD_STATUSES } from "@/lib/leads";

/* ---------------- Autenticación ---------------- */

const attempts = new Map<string, { count: number; until: number }>();

export type LoginState = { error?: string; email?: string; step?: "code"; method?: "email" | "totp"; masked?: string; info?: string };

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const RESEND_WAIT_MS = 30 * 1000;

function maskEmail(email: string) {
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}`;
}

function sixDigits() {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return String(b[0] % 1_000_000).padStart(6, "0");
}

/** Segundo paso con app autenticadora: se guarda un reto sin código (el código lo genera la app). */
async function startTotpChallenge(userId: number) {
  const id = randomKey(32);
  const now = Math.floor(Date.now() / 1000);
  await prisma.mfaChallenge.deleteMany({ where: { OR: [{ userId }, { expires: { lt: now } }] } });
  await prisma.mfaChallenge.create({ data: { id, userId, codeHash: "totp", expires: now + CODE_TTL_MS / 1000, sentAt: now } });
  (await cookies()).set(MFA_COOKIE, id, { ...sessionCookieOptions(), maxAge: CODE_TTL_MS / 1000 });
}


/** Crea (o renueva) el código de 6 dígitos y lo envía al correo del administrador. */
async function sendLoginCode(user: { id: number; email: string; name: string }, challengeId?: string) {
  const code = sixDigits();
  const id = challengeId ?? randomKey(32);
  const now = Math.floor(Date.now() / 1000); // segundos: caben en un INT de SQLite
  const codeHash = await hashCode(code, id);
  if (challengeId) {
    await prisma.mfaChallenge.update({ where: { id }, data: { codeHash, expires: now + CODE_TTL_MS / 1000, sentAt: now, attempts: 0 } });
  } else {
    await prisma.mfaChallenge.deleteMany({ where: { OR: [{ userId: user.id }, { expires: { lt: now } }] } });
    await prisma.mfaChallenge.create({ data: { id, userId: user.id, codeHash, expires: now + CODE_TTL_MS / 1000, sentAt: now } });
  }
  const sent = await sendMail({
    to: user.email,
    subject: `${code} es tu código para entrar al panel de Aldore`,
    html: mailLayout(
      "Tu código de verificación",
      `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hola ${esc(user.name.split(/\s+/)[0])}, usa este código para terminar de ingresar al panel:</p>
<p style="margin:0 0 20px;font-family:ui-monospace,Menlo,monospace;font-size:34px;letter-spacing:10px;font-weight:700;color:#16130f">${code}</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#6b6358">Vence en 10 minutos. Si no fuiste tú, no compartas este código y cambia tu contraseña: alguien la conoce.</p>`,
    ),
  });
  if (!sent.ok) return null;
  (await cookies()).set(MFA_COOKIE, id, { ...sessionCookieOptions(), maxAge: CODE_TTL_MS / 1000 });
  return id;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.count >= 5 && a.until > Date.now()) {
    return { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!authSecretReady()) return { error: NO_SECRET, email };
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !ok) {
    const cur = a && a.until > Date.now() ? a : { count: 0, until: 0 };
    attempts.set(ip, { count: cur.count + 1, until: Date.now() + 10 * 60 * 1000 });
    return { error: "Correo o contraseña incorrectos.", email };
  }
  attempts.delete(ip);

  // Segundo paso: código por correo. Se omite si el correo no está configurado (para no dejarte por fuera)
  // o si este equipo ya se verificó en los últimos 30 días.
  const store = await cookies();
  const trusted = await verifyTrust(store.get(TRUST_COOKIE)?.value, user.id);
  // Con app autenticadora activa se pide su código (siempre, aunque no haya correo configurado).
  if (user.totpOn && user.totpSecret && !trusted) {
    await startTotpChallenge(user.id);
    return { step: "code", method: "totp", email };
  }
  if (mailReady() && !trusted) {
    const sent = await sendLoginCode(user);
    if (!sent) return { error: "No pudimos enviarte el código de verificación. Intenta de nuevo en un momento.", email };
    return { step: "code", method: "email", email, masked: maskEmail(user.email) };
  }

  await startSession(user);
  redirect("/admin");
}

export async function verifyLoginCode(prev: LoginState, formData: FormData): Promise<LoginState> {
  const store = await cookies();
  const id = store.get(MFA_COOKIE)?.value;
  const back = { email: prev.email };
  const ch = id ? await prisma.mfaChallenge.findUnique({ where: { id } }) : null;
  if (!ch || ch.expires * 1000 < Date.now() || ch.attempts >= CODE_MAX_ATTEMPTS) {
    if (ch) await prisma.mfaChallenge.delete({ where: { id: ch.id } }).catch(() => {});
    store.delete(MFA_COOKIE);
    return { ...back, error: "El código venció o tuvo demasiados intentos. Ingresa de nuevo tu contraseña." };
  }
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  let good = false;
  if (ch.codeHash === "totp") {
    const u = await prisma.user.findUnique({ where: { id: ch.userId }, select: { totpSecret: true } });
    good = Boolean(u?.totpSecret) && (await verifyTotp(u!.totpSecret, code));
  } else {
    good = code.length === 6 && (await hashCode(code, ch.id)) === ch.codeHash;
  }
  if (!good) {
    const left = CODE_MAX_ATTEMPTS - ch.attempts - 1;
    await prisma.mfaChallenge.update({ where: { id: ch.id }, data: { attempts: { increment: 1 } } });
    if (left <= 0) {
      await prisma.mfaChallenge.delete({ where: { id: ch.id } }).catch(() => {});
      store.delete(MFA_COOKIE);
      return { ...back, error: "Demasiados intentos con el código. Ingresa de nuevo tu contraseña." };
    }
    return { ...prev, info: undefined, error: `El código no es correcto. Te quedan ${left} ${left === 1 ? "intento" : "intentos"}.` };
  }

  await prisma.mfaChallenge.delete({ where: { id: ch.id } }).catch(() => {});
  store.delete(MFA_COOKIE);
  const user = await prisma.user.findUnique({ where: { id: ch.userId } });
  if (!user) return { ...back, error: "Ingresa de nuevo." };
  if (formData.get("remember") === "on") {
    store.set(TRUST_COOKIE, await signTrust(user.id), { ...sessionCookieOptions(), maxAge: TRUST_DAYS * 24 * 60 * 60 });
  }
  await startSession(user);
  redirect("/admin");
}

export async function resendLoginCode(prev: LoginState): Promise<LoginState> {
  const store = await cookies();
  const id = store.get(MFA_COOKIE)?.value;
  const ch = id ? await prisma.mfaChallenge.findUnique({ where: { id } }) : null;
  if (!ch || ch.expires * 1000 < Date.now()) return { email: prev.email, error: "El código venció. Ingresa de nuevo tu contraseña." };
  if (ch.codeHash === "totp") return { ...prev, error: "Este código lo genera tu app autenticadora; no se envía por correo.", info: undefined };
  if (Date.now() - ch.sentAt * 1000 < RESEND_WAIT_MS) return { ...prev, error: "Espera unos segundos antes de pedir otro código.", info: undefined };
  const user = await prisma.user.findUnique({ where: { id: ch.userId } });
  if (!user) return { email: prev.email, error: "Ingresa de nuevo." };
  const sent = await sendLoginCode(user, ch.id);
  if (!sent) return { ...prev, error: "No pudimos reenviar el código. Intenta de nuevo en un momento.", info: undefined };
  return { ...prev, error: undefined, info: "Te enviamos un código nuevo." };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ---------------- CRUD genérico ---------------- */

/** Exige el permiso de la sección a la que pertenece el recurso (servicios → catálogo, puertas → puertas…). */
async function requireResource(key: string) {
  const perm = permForResource(key);
  return perm ? requirePerm(perm) : requireAdmin();
}

function refreshSite() {
  revalidatePath("/", "layout");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function delegate(model: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model];
}

export async function saveResource(resourceKey: string, id: number | null, formData: FormData) {
  await requireResource(resourceKey);
  const res = getResource(resourceKey);
  if (!res) throw new Error("Recurso desconocido");

  const data: Record<string, unknown> = {};
  for (const f of res.fields) {
    const raw = formData.get(f.name);
    if (f.type === "checkbox") data[f.name] = raw === "on";
    else if (f.type === "number") data[f.name] = Number.parseInt(String(raw ?? "0"), 10) || 0;
    else if (f.type === "money") data[f.name] = Number.parseInt(String(raw ?? "").replace(/[^0-9-]/g, ""), 10) || 0;
    else if (f.type === "relation") data[f.name] = Number.parseInt(String(raw ?? ""), 10) || null;
    else data[f.name] = String(raw ?? "").replace(/\r\n/g, "\n").trim();
  }
  if (res.beforeSave) await res.beforeSave(data);
  const slugField = res.fields.find((f) => f.type === "slug");
  if (slugField) {
    data[slugField.name] = slugify(String(data[slugField.name] || data[res.titleField] || "")) || `item-${Date.now()}`;
  }

  const missing = res.fields.filter((f) => f.required && !data[f.name]);
  if (missing.length) {
    redirect(`/admin/${res.key}/${id ?? "nuevo"}?error=${encodeURIComponent("Completa: " + missing.map((m) => m.label).join(", "))}`);
  }

  try {
    if (id) await delegate(res.model).update({ where: { id }, data });
    else await delegate(res.model).create({ data });
  } catch (e: unknown) {
    const msg =
      (e as { code?: string }).code === "P2002"
        ? res.model === "payroll"
          ? "Ese empleado ya tiene nómina en ese periodo."
          : res.model === "linkPage"
            ? "Esa dirección ya la usa otra Puerta. Elige otra."
            : "Ya existe un registro con ese slug."
        : "No se pudo guardar.";
    redirect(`/admin/${res.key}/${id ?? "nuevo"}?error=${encodeURIComponent(msg)}`);
  }
  refreshSite();
  // Lo que se ve en el sitio público se traduce al inglés con Groq apenas se guarda.
  if (["service", "product", "plan", "testimonial", "faq", "post"].includes(res.model)) {
    translateLater(Object.values(data).filter((v): v is string => typeof v === "string"));
  }
  const back = String(formData.get("_back") ?? "");
  if (/^\/admin\/[\w/?=&-]*$/.test(back)) redirect(`${back}${back.includes("?") ? "&" : "?"}ok=${encodeURIComponent("Guardado correctamente")}`);
  redirect(`/admin/${res.key}?ok=${encodeURIComponent("Guardado correctamente")}`);
}

export async function deleteResource(resourceKey: string, id: number) {
  await requireResource(resourceKey);
  const res = getResource(resourceKey);
  if (!res) throw new Error("Recurso desconocido");
  await delegate(res.model).delete({ where: { id } });
  refreshSite();
  redirect(`/admin/${res.key}?ok=${encodeURIComponent("Eliminado")}`);
}

export async function toggleResource(resourceKey: string, id: number, published: boolean) {
  await requireResource(resourceKey);
  const res = getResource(resourceKey);
  if (!res) throw new Error("Recurso desconocido");
  await delegate(res.model).update({ where: { id }, data: { published } });
  refreshSite();
  revalidatePath(`/admin/${res.key}`);
}

/* ---------------- Textos del sitio ---------------- */

export async function saveSettings(formData: FormData) {
  await requirePerm("editor");
  const ops = [];
  for (const [key, value] of formData.entries()) {
    if (!SETTING_KEYS.has(key)) continue;
    const v = String(value).replace(/\r\n/g, "\n").trim();
    ops.push(prisma.setting.upsert({ where: { key }, create: { key, value: v }, update: { value: v } }));
  }
  await prisma.$transaction(ops);
  refreshSite();
  translateLater([...formData.entries()].filter(([k]) => SETTING_KEYS.has(k) && !/^(notify\.|social\.|seed\.|booking\.(days|hours|slot|ahead|meet)|billing\.)/.test(k)).map(([, v]) => String(v)));
  const group = String(formData.get("_group") ?? "");
  redirect(`/admin/contenido?ok=${encodeURIComponent("Textos actualizados")}${group ? `#${group}` : ""}`);
}

/* ---------------- Leads ---------------- */

export async function updateLead(id: number, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "nuevo");
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  await prisma.lead.update({
    where: { id },
    data: { status: (LEAD_STATUSES as readonly string[]).includes(status) ? status : "nuevo", notes },
  });
  redirect(`/admin/leads/${id}?ok=${encodeURIComponent("Lead actualizado")}`);
}

export async function deleteLead(id: number) {
  await requireAdmin();
  await prisma.lead.delete({ where: { id } });
  redirect(`/admin/leads?ok=${encodeURIComponent("Lead eliminado")}`);
}

/* ---------------- Usuarios ---------------- */

const backUsers = (kind: "ok" | "error", msg: string, to = "/admin/usuarios") => redirect(`${to}?${kind}=${encodeURIComponent(msg)}`);
const backProfile = (kind: "ok" | "error", msg: string) => backUsers(kind, msg, "/admin/perfil");

/** Lee el rol del formulario: "admin" (todo) o "role:ID" (un rol con permisos). */
async function readRole(v: FormDataEntryValue | null, me: number) {
  const raw = String(v ?? "");
  if (raw === "admin") {
    if (!(await getAccess(me)).admin) backUsers("error", "Solo un administrador puede dar el rol de administrador.");
    return { role: "admin", roleId: null as number | null };
  }
  const id = Number.parseInt(raw.replace(/^role:/, ""), 10);
  const r = id ? await prisma.role.findUnique({ where: { id } }) : null;
  if (!r) backUsers("error", "Elige un rol para el usuario.");
  return { role: "editor", roleId: r!.id };
}

export async function createUser(formData: FormData) {
  const session = await requireOwner();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !name || password.length < 10) backUsers("error", "Nombre, correo y contraseña (mín. 10 caracteres) son obligatorios.");
  const { role, roleId } = await readRole(formData.get("role"), session.uid);
  try {
    await prisma.user.create({ data: { email, name, role, roleId, title: String(formData.get("title") ?? "").trim().slice(0, 80), avatar: `aldo-${1 + Math.floor(Math.random() * 10)}`, passwordHash: await bcrypt.hash(password, 12) } });
  } catch {
    backUsers("error", "Ya existe un usuario con ese correo.");
  }
  backUsers("ok", "Usuario creado");
}

/** Foto de perfil válida: uno de los Aldos o una imagen pequeña (data URL de hasta ~200 KB). */
function cleanAvatar(v: FormDataEntryValue | null) {
  const a = String(v ?? "");
  if (/^aldo-([1-9]|10)$/.test(a)) return a;
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a) && a.length < 280_000) return a;
  return undefined;
}

export async function updateMyProfile(formData: FormData) {
  const session = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const avatar = cleanAvatar(formData.get("avatar"));
  if (!name) backProfile("error", "Escribe tu nombre.");
  await prisma.user.update({ where: { id: session.uid }, data: { name, title, ...(avatar ? { avatar } : {}) } });
  revalidatePath("/admin", "layout");
  backProfile("ok", "Perfil actualizado");
}

export async function updateUser(id: number, formData: FormData) {
  const session = await requireOwner();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) backUsers("error", "Ese usuario ya no existe.");
  const me = await getAccess(session.uid);
  if (user!.role === "admin" && !me.admin) backUsers("error", "Solo un administrador puede editar a otro administrador.");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { role, roleId } = await readRole(formData.get("role"), session.uid);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) backUsers("error", "Escribe un nombre y un correo válido.");
  if (password && password.length < 10) backUsers("error", "La nueva contraseña debe tener al menos 10 caracteres.");
  // Siempre debe quedar al menos un administrador.
  if (user!.role === "admin" && role !== "admin") {
    if (id === session.uid) backUsers("error", "No puedes quitarte a ti mismo el rol de administrador.");
    if ((await prisma.user.count({ where: { role: "admin" } })) <= 1) backUsers("error", "Debe quedar al menos un administrador.");
  }
  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        roleId,
        title: String(formData.get("title") ?? "").trim().slice(0, 80),
        ...(cleanAvatar(formData.get("avatar")) ? { avatar: cleanAvatar(formData.get("avatar")) } : {}),
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        ...(formData.get("resetMfa") === "on" ? { totpOn: false, totpSecret: "" } : {}),
      },
    });
    if (formData.get("resetMfa") === "on") await prisma.passkey.deleteMany({ where: { userId: id } });
  } catch {
    backUsers("error", "Ya existe otro usuario con ese correo.");
  }
  backUsers("ok", `Cambios guardados para ${name}`);
}

export async function deleteUser(id: number) {
  const session = await requireOwner();
  if (session.uid === id) backUsers("error", "No puedes eliminar tu propio usuario.");
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === "admin" && !(await getAccess(session.uid)).admin) backUsers("error", "Solo un administrador puede eliminar a otro administrador.");
  if (user && user.role === "admin" && (await prisma.user.count({ where: { role: "admin" } })) <= 1) backUsers("error", "Debe quedar al menos un administrador.");
  await prisma.user.delete({ where: { id } });
  await prisma.passkey.deleteMany({ where: { userId: id } });
  backUsers("ok", "Usuario eliminado");
}

/* ---------------- Portal del cliente ---------------- */

/** Da, cambia o quita el acceso del cliente a su portal (correo + contraseña). */
export async function setClientPortal(id: number, formData: FormData) {
  await requirePerm("clientes");
  const back = (kind: string, msg: string) => redirect(`/admin/clientes/${id}?tab=portal&${kind}=${encodeURIComponent(msg)}`);
  if (formData.get("off") === "1") {
    await prisma.client.update({ where: { id }, data: { portalHash: "" } });
    back("ok", "Acceso al portal quitado");
  }
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("error", "Escribe un correo válido.");
  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) back("error", "Ese cliente ya no existe.");
  if (!client!.portalHash && password.length < 8) back("error", "Ponle una contraseña de al menos 8 caracteres.");
  if (password && password.length < 8) back("error", "La contraseña debe tener al menos 8 caracteres.");
  const other = await prisma.client.findFirst({ where: { email, id: { not: id }, portalHash: { not: "" } } });
  if (other) back("error", "Otro cliente ya entra al portal con ese correo.");
  await prisma.client.update({ where: { id }, data: { email, ...(password ? { portalHash: await bcrypt.hash(password, 10) } : {}) } });
  back("ok", password ? "Listo: ya puede entrar en aldore.co/portal con ese correo y contraseña." : "Correo actualizado");
}

/* ---------------- Roles ---------------- */

const backRoles = (kind: "ok" | "error", msg: string) => redirect(`/admin/usuarios/roles?${kind}=${encodeURIComponent(msg)}`);

export async function saveRole(id: number | null, formData: FormData) {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const description = String(formData.get("description") ?? "").trim().slice(0, 200);
  const perms = parsePerms(formData.getAll("perms").map(String).join(","));
  if (!name) backRoles("error", "Ponle un nombre al rol.");
  if (/^administrador$/i.test(name)) backRoles("error", "«Administrador» ya existe y tiene todos los permisos. Usa otro nombre.");
  try {
    if (id) await prisma.role.update({ where: { id }, data: { name, description, perms: perms.join(",") } });
    else await prisma.role.create({ data: { name, description, perms: perms.join(",") } });
  } catch {
    backRoles("error", "Ya existe un rol con ese nombre.");
  }
  backRoles("ok", id ? `Rol «${name}» actualizado` : `Rol «${name}» creado`);
}

export async function deleteRole(id: number) {
  await requireOwner();
  const used = await prisma.user.count({ where: { roleId: id } });
  if (used) backRoles("error", `Ese rol lo tienen ${used} usuario(s). Cámbiales el rol antes de eliminarlo.`);
  await prisma.role.delete({ where: { id } }).catch(() => {});
  backRoles("ok", "Rol eliminado");
}

export async function changePassword(formData: FormData) {
  const session = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    backProfile("error", "La contraseña actual no es correcta.");
  }
  if (next.length < 10) backProfile("error", "La nueva contraseña debe tener al menos 10 caracteres.");
  await prisma.user.update({ where: { id: session.uid }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  backProfile("ok", "Contraseña actualizada");
}

/* ---------------- Primer administrador ---------------- */

export type SetupState = { error?: string };

/**
 * Crea el primer usuario administrador cuando la base está vacía (útil en Cloudflare D1).
 * En producción exige el código SETUP_CODE configurado como secreto del entorno.
 */
export async function createFirstAdmin(_prev: SetupState, formData: FormData): Promise<SetupState> {
  if (!authSecretReady()) return { error: NO_SECRET };
  if ((await prisma.user.count()) > 0) return { error: "Ya existe un administrador. Inicia sesión." };

  const expected = process.env.SETUP_CODE;
  if (process.env.NODE_ENV === "production" && !expected) {
    return { error: "Falta configurar la variable secreta SETUP_CODE en el servidor." };
  }
  if (expected && String(formData.get("code") ?? "") !== expected) {
    return { error: "El código de configuración no es correcto." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
    return { error: "Escribe nombre, un correo válido y una contraseña de al menos 10 caracteres." };
  }

  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  await startSession(user);
  redirect("/admin");
}

/* ---------------- Gestión del negocio ---------------- */

/** Crea la nómina del periodo para todos los empleados activos que aún no la tengan. */
export async function generatePayroll(formData: FormData) {
  await requireAdmin();
  const period = String(formData.get("period") ?? "");
  if (!/^\d{4}-\d{2}$/.test(period)) redirect(`/admin/nomina?error=${encodeURIComponent("Elige un periodo válido.")}`);
  const [employees, existing] = await Promise.all([
    prisma.employee.findMany({ where: { active: true } }),
    prisma.payroll.findMany({ where: { period }, select: { employeeId: true } }),
  ]);
  const done = new Set(existing.map((p) => p.employeeId));
  const todo = employees.filter((e) => !done.has(e.id));
  for (const e of todo) {
    await prisma.payroll.create({ data: { employeeId: e.id, period, baseSalary: e.salary, net: e.salary } });
  }
  revalidatePath("/admin/nomina");
  const msg = todo.length ? `Nómina de ${period} creada para ${todo.length} empleado(s).` : "Todos los empleados activos ya tienen nómina en ese periodo.";
  redirect(`/admin/nomina?ok=${encodeURIComponent(msg)}`);
}

/** Marca un registro de nómina como pagado hoy. */
export async function markPayrollPaid(id: number) {
  await requireAdmin();
  await prisma.payroll.update({ where: { id }, data: { status: "pagado", paidDate: new Date().toISOString().slice(0, 10) } });
  revalidatePath("/admin/nomina");
}

/** Cambia el estado de un pedido o solicitud desde el listado. */
export async function setStatus(resourceKey: string, id: number, formData: FormData) {
  await requireAdmin();
  const res = getResource(resourceKey);
  if (!res?.statusField) throw new Error("Recurso sin estado");
  const value = String(formData.get("status") ?? "");
  const allowed = res.fields.find((f) => f.name === res.statusField)?.options?.some((o) => o.value === value);
  if (!allowed) throw new Error("Estado inválido");
  await delegate(res.model).update({ where: { id }, data: { [res.statusField]: value } });
  revalidatePath(`/admin/${res.key}`);
}

/** Convierte una solicitud del sitio (lead) en cliente + pedido. */
export async function leadToOrder(leadId: number) {
  await requireAdmin();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) redirect("/admin/leads");
  const existing = await prisma.order.findFirst({ where: { leadId } });
  if (existing) redirect(`/admin/pedidos/${existing.id}`);
  let client = lead.email ? await prisma.client.findFirst({ where: { email: lead.email } }) : null;
  if (!client) {
    client = await prisma.client.create({
      data: { name: lead.name, company: lead.company, email: lead.email, phone: lead.phone },
    });
  }
  const order = await prisma.order.create({
    data: {
      title: lead.service ? `${lead.service}${lead.company ? ` · ${lead.company}` : ""}` : `Pedido de ${lead.name}`,
      clientId: client.id,
      service: lead.service,
      notes: lead.message,
      leadId,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });
  await prisma.lead.update({ where: { id: leadId }, data: { status: "ganado" } }).catch(() => {});
  redirect(`/admin/pedidos/${order.id}?ok=${encodeURIComponent("Pedido creado desde la solicitud")}`);
}

/* ---------------- Idioma del sitio (traducción con Groq) ---------------- */

/** Activa o apaga los idiomas extranjeros del sitio (inglés, portugués). */
export async function saveLanguages(formData: FormData) {
  await requirePerm("idiomas");
  const { FOREIGN } = await import("@/lib/langs");
  const list = formData.getAll("langs").map(String).filter((l) => (FOREIGN as string[]).includes(l));
  await prisma.setting.upsert({ where: { key: "site.langs" }, create: { key: "site.langs", value: list.join(", ") || "ninguno" }, update: { value: list.join(", ") || "ninguno" } });
  refreshSite();
  redirect(`/admin/idiomas?ok=${encodeURIComponent(list.length ? "Idiomas guardados" : "El sitio queda solo en español")}`);
}

/** Prueba la clave de Groq con una frase corta (sirve tanto para las traducciones como para el chat de Aldo). */
export async function testGroq() {
  await requireAdmin();
  const { groqPing } = await import("@/lib/i18n");
  const r = await groqPing();
  redirect(`/admin/idiomas?${r.ok ? "ok" : "error"}=${encodeURIComponent(r.ok ? `Groq funciona (${r.ms} ms). Prueba: «Abrimos la puerta digital de tu negocio.» → «${r.detail}». El chat de Aldo usa esta misma clave.` : `Groq no funciona: ${r.detail}`)}`);
}

/** Traduce de una vez todos los textos del sitio que falten en el idioma elegido (o en todos los activos). */
export async function translateEverything(formData: FormData) {
  await requireAdmin();
  const { activeForeign } = await import("@/lib/i18n");
  const want = String(formData.get("lang") ?? "all");
  const active = await activeForeign();
  const targets = want === "all" ? active : active.filter((l) => l === want);
  const { translateNow, pieces, groqReady } = await import("@/lib/i18n");
  if (!groqReady()) redirect(`/admin/idiomas?error=${encodeURIComponent("Falta la clave GROQ_API_KEY en Cloudflare.")}`);
  const { getRawSettings } = await import("@/lib/settings");
  const { UI_STRINGS } = await import("@/lib/ui-strings");
  const { SERVICE_GROUPS } = await import("@/lib/service-groups");
  const s = await getRawSettings();
  const pub = { where: { published: true } };
  const [services, products, plans, testimonials, faqs, posts] = await Promise.all([
    prisma.service.findMany(pub), prisma.product.findMany(pub), prisma.plan.findMany(pub),
    prisma.testimonial.findMany(pub), prisma.faq.findMany(pub), prisma.post.findMany(pub),
  ]);
  const texts: string[] = [
    ...Object.entries(s).filter(([k]) => !/^(notify\.|social\.|seed\.|site\.name)/.test(k)).flatMap(([, v]) => pieces(v)),
    ...UI_STRINGS,
    ...SERVICE_GROUPS.flatMap((g) => [g.title, g.text]),
    ...services.flatMap((x) => [x.title, x.shortDescription, x.description, x.features].flatMap(pieces)),
    ...products.flatMap((x) => [x.tagline, x.description, x.price, x.priceNote, x.features, x.ctaLabel].flatMap(pieces)),
    ...plans.flatMap((x) => [x.name, x.price, x.period, x.description, x.features].flatMap(pieces)),
    ...testimonials.flatMap((x) => [x.role, x.quote].flatMap(pieces)),
    ...faqs.flatMap((x) => [x.question, x.answer].flatMap(pieces)),
    ...posts.flatMap((x) => [x.title, x.excerpt, x.content, x.tags, x.author].flatMap(pieces)),
  ];
  const { LANG_NAMES } = await import("@/lib/langs");
  const done: string[] = [];
  for (const l of targets) {
    const n = await translateNow(texts, l);
    done.push(`${n} al ${LANG_NAMES[l].toLowerCase()}`);
  }
  refreshSite();
  redirect(`/admin/idiomas?ok=${encodeURIComponent(targets.length ? `Listo: textos nuevos traducidos ${done.join(" y ")}. Si sale 0, ya estaba todo traducido.` : "No hay idiomas activos para traducir.")}`);
}

/** Corrige a mano una traducción. Queda marcada para que Groq no la cambie. */
export async function saveTranslation(id: number, formData: FormData) {
  await requireAdmin();
  const text = String(formData.get("text") ?? "").trim();
  if (text) await prisma.translation.update({ where: { id }, data: { text, manual: true } });
  refreshSite();
  const q = String(formData.get("q") ?? "");
  const lang = String(formData.get("lang") ?? "en");
  redirect(`/admin/idiomas?lang=${lang}&ok=${encodeURIComponent("Traducción guardada")}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
}

/** Borra una traducción para que Groq la vuelva a hacer en la próxima visita. */
export async function redoTranslation(id: number) {
  await requireAdmin();
  await prisma.translation.delete({ where: { id } }).catch(() => {});
  refreshSite();
  redirect(`/admin/idiomas?ok=${encodeURIComponent("Se volverá a traducir")}`);
}

/* ---------------- Correo interno ---------------- */

export async function sendInternal(formData: FormData) {
  const session = await requireAdmin();
  const toIds = formData.getAll("to").map((x) => Number.parseInt(String(x), 10)).filter((n) => n > 0);
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 160) || "(Sin asunto)";
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 10000);
  const replyTo = Number.parseInt(String(formData.get("replyTo") ?? ""), 10) || null;
  if (!toIds.length || !body) redirect(`/admin/correo?nuevo=1&error=${encodeURIComponent("Elige al menos un destinatario y escribe el mensaje.")}`);
  const users = await prisma.user.findMany({ where: { id: { in: toIds } }, select: { id: true, email: true, name: true } });
  if (!users.length) redirect(`/admin/correo?nuevo=1&error=${encodeURIComponent("Ese destinatario ya no existe.")}`);
  for (const u of users) {
    await prisma.internalMessage.create({ data: { fromId: session.uid, toId: u.id, subject, body, replyTo } });
  }
  // Aviso por correo real (si Resend está configurado), sin incluir el contenido del mensaje.
  if (mailReady()) {
    const site = process.env.SITE_URL || "https://aldore.co";
    await Promise.all(
      users.filter((u) => u.id !== session.uid).map((u) =>
        sendMail({
          to: u.email,
          subject: `Nuevo mensaje de ${session.name} en el panel`,
          html: mailLayout(
            "Tienes un mensaje nuevo",
            `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${esc(session.name)} te escribió en el correo interno del panel: <b>${esc(subject)}</b>.</p>
<p style="margin:0"><a href="${site}/admin/correo" style="display:inline-block;background:#16130f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px">Abrir el panel</a></p>`,
          ),
        }).catch(() => null),
      ),
    );
  }
  redirect(`/admin/correo?f=enviados&ok=${encodeURIComponent(users.length > 1 ? `Mensaje enviado a ${users.length} personas` : `Mensaje enviado a ${users[0].name}`)}`);
}

export async function deleteInternal(id: number) {
  const session = await requireAdmin();
  const m = await prisma.internalMessage.findUnique({ where: { id } });
  if (m) {
    if (m.toId === session.uid) await prisma.internalMessage.update({ where: { id }, data: { toDeleted: true } });
    if (m.fromId === session.uid) await prisma.internalMessage.update({ where: { id }, data: { fromDeleted: true } });
  }
  redirect(`/admin/correo?ok=${encodeURIComponent("Mensaje eliminado")}`);
}
