/**
 * Llamadas a Groq compartidas por el chat de Aldo, las traducciones y el asistente del editor.
 *
 * El modelo se elige así: GROQ_MODEL (si lo pusiste en Cloudflare) y, si Groq dice que ese modelo
 * no existe o no tienes acceso, se prueba el siguiente de la lista. El que funcione se recuerda.
 */
export const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

let working: string | null = null;

function candidates(preferred?: string) {
  const list = [preferred, process.env.GROQ_MODEL, working, ...GROQ_MODELS].filter((m): m is string => Boolean(m && m.trim()));
  return [...new Set(list.map((m) => m.trim()))];
}

export type GroqMsg = { role: "system" | "user" | "assistant"; content: string };
export type GroqResult = { ok: true; content: string; model: string } | { ok: false; status: number; error: string; model?: string };

export async function groqChat(opts: { messages: GroqMsg[]; temperature?: number; maxTokens?: number; json?: boolean; model?: string; timeoutMs?: number }): Promise<GroqResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ok: false, status: 0, error: "No hay GROQ_API_KEY configurada en el servidor." };
  const url = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
  let last: GroqResult = { ok: false, status: 0, error: "Sin respuesta" };
  for (const model of candidates(opts.model)) {
    const reasoning = model.startsWith("openai/gpt-oss");
    const body: Record<string, unknown> = {
      model,
      temperature: opts.temperature ?? 0.4,
      messages: opts.messages,
      // Los gpt-oss "piensan" antes de responder: se les pide poco razonamiento y más espacio para la respuesta.
      ...(reasoning ? { reasoning_effort: "low", max_completion_tokens: Math.max(800, (opts.maxTokens ?? 1024) * 2) } : opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    };
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
      }).catch(() => null);
      if (!r) {
        last = { ok: false, status: 0, error: "No se pudo conectar con Groq.", model };
        break;
      }
      if (r.status === 429) {
        const wait = Math.min(20, Number(r.headers.get("retry-after")) || 5);
        await new Promise((res) => setTimeout(res, wait * 1000));
        continue;
      }
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        last = { ok: false, status: r.status, error: text.slice(0, 300), model };
        // Modelo inexistente, retirado o sin acceso: se prueba el siguiente.
        if (r.status === 404 || /model_not_found|decommissioned|does not exist|not have access/i.test(text)) break;
        if (r.status === 401) return { ok: false, status: 401, error: "La clave GROQ_API_KEY no es válida.", model };
        return last;
      }
      const data = (await r.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
      const content = data?.choices?.[0]?.message?.content?.trim() ?? "";
      if (!content) {
        last = { ok: false, status: 200, error: "Groq respondió vacío.", model };
        break;
      }
      working = model;
      return { ok: true, content, model };
    }
  }
  return last;
}
