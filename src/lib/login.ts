import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "./session";

/** Abre la sesión del panel. Solo se llama después de comprobar la contraseña, el código o la llave de acceso. */
export async function startSession(user: { id: number; email: string; name: string }) {
  const token = await signSession({ uid: user.id, email: user.email, name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions());
}
