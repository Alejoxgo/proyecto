"use client";
import TC, { useTr } from "@/components/TC";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Aldo from "./Aldo";
import { celebrate } from "@/lib/celebrate";
import { whatsappLink } from "@/lib/utils";

export type AldoTopic = {
  id: string;
  label: string;
  answer: string;
  points?: string[];
  href?: string;
  price?: string;
  keywords: string[];
};

export type AldoKnowledge = {
  greeting: string;
  bubble: string;
  tips?: string[];
  whatsapp: string;
  hours: string;
  topics: AldoTopic[];
  faqs: { q: string; a: string }[];
  quick: string[];
  /** true si el servidor tiene GROQ_API_KEY: el texto libre lo responde la IA. */
  ai?: boolean;
  /** Idioma de la página en que está la visita (es, en, pt). */
  lang?: string;
};

type Msg = { from: "aldo" | "me"; text: string; topic?: AldoTopic; chips?: string[]; wa?: boolean; link?: string; form?: boolean };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ");

const STOP = new Set("de la el los las un una y o a en con por para que me mi tu su es se lo al del quiero necesito tengo como hola buenas cual cuales hay sobre algo mas".split(" "));
const words = (s: string) => norm(s).split(/\s+/).filter((w) => (w.length > 2 || /\d/.test(w)) && !STOP.has(w));
const hits = (a: string[], b: string[]) => a.filter((w) => b.some((k) => k.startsWith(w.slice(0, 5)) || w.startsWith(k.slice(0, 5)))).length;

/** Aldo: asistente que guía por los servicios, responde preguntas frecuentes y pasa a WhatsApp. */
export default function AldoChat({ k }: { k: AldoKnowledge }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [interest, setInterest] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);

  // El globo de Aldo aparece, se queda unos segundos y se va; vuelve un par de veces con otro mensaje.
  const [tip, setTip] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("aldo-bubble") === "0"; } catch {}
    if (dismissed || !k.bubble) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    [3500, 30000, 70000].forEach((at, i) => {
      timers.push(setTimeout(() => { setTip(i); setLeaving(false); setTeaser(true); }, at));
      timers.push(setTimeout(() => setLeaving(true), at + 8000));
      timers.push(setTimeout(() => setTeaser(false), at + 8500));
    });
    return () => timers.forEach(clearTimeout);
  }, [k.bubble]);
  // Aldo con vida: se duerme si no haces nada, aletea mientras haces scroll y celebra cuando envías un formulario.
  const [mood, setMood] = useState<"wave" | "sleep" | "fly" | "cheer">("wave");
  const [party, setParty] = useState(0);
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>;
    let scrollEnd: ReturnType<typeof setTimeout>;
    let cheering = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const arm = () => { clearTimeout(idle); idle = setTimeout(() => !cheering && setMood("sleep"), 35000); };
    const wake = () => { if (!cheering) setMood((m) => (m === "sleep" ? "wave" : m)); arm(); };
    const onScroll = () => {
      wake();
      if (reduce || cheering) return;
      setMood("fly");
      clearTimeout(scrollEnd);
      scrollEnd = setTimeout(() => !cheering && setMood("wave"), 650);
    };
    const onParty = () => {
      cheering = true;
      setMood("cheer");
      setParty((n) => n + 1);
      setTimeout(() => { cheering = false; setMood("wave"); arm(); }, 3200);
    };
    arm();
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("aldore:celebrate", onParty);
    return () => {
      clearTimeout(idle); clearTimeout(scrollEnd);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("aldore:celebrate", onParty);
    };
  }, []);
  const tips = [k.bubble, ...(k.tips ?? [])].filter(Boolean);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const waHref = (topic?: string) => {
    const text = topic ? `Hola Aldore, vengo de la página web. Me interesa: ${topic}.` : "Hola Aldore, vengo de la página web y quiero más información.";
    return whatsappLink(k.whatsapp, text) || `/contacto${topic ? `?servicio=${encodeURIComponent(topic)}` : ""}`;
  };

  const say = (m: Msg) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((xs) => [...xs, m]);
    }, 550);
  };

  const start = () => {
    setOpen(true);
    setTeaser(false);
    try { sessionStorage.setItem("aldo-bubble", "0"); } catch {}
    if (msgs.length === 0) say({ from: "aldo", text: k.greeting, chips: k.quick });
  };

  const answerTopic = (t: AldoTopic) => {
    if (t.id === "humano") {
      const hours = k.hours.replace(/\.+$/, "");
      say({ from: "aldo", text: `${tr("¡Claro! Te paso con el equipo por WhatsApp, o déjame tus datos y te contactan ellos.")}${hours ? ` ${tr("Horario:")} ${hours}.` : ""}`, wa: true, form: !sentLead });
      return;
    }
    if (t.id !== "precios") setInterest(t.label);
    say({ from: "aldo", text: t.answer, topic: t, chips: t.id === "precios" ? [tr("Hablar con una persona")] : [tr("¿Cuánto cuesta?"), tr("Ver otros servicios"), tr("Hablar con una persona")] });
  };

  // Aldo deja la solicitud lista: nombre y contacto, y el equipo recibe el resumen de la conversación.
  const [sentLead, setSentLead] = useState(false);
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadErr, setLeadErr] = useState("");
  const sendLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const contact = String(f.get("contact") || "").trim();
    setLeadBusy(true);
    setLeadErr("");
    try {
      const r = await fetch("/api/aldo/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, contact, interest, messages: msgs.filter((m) => m.text).map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text })) }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setSentLead(true);
      setMsgs((xs) => [...xs.map((m) => ({ ...m, form: false })), { from: "aldo", text: `${tr("¡Listo")}, ${name.split(/\s+/)[0]}! ${tr("Le pasé tu solicitud al equipo con todo lo que hablamos. Te contactan muy pronto 🦉")}` }]);
      celebrate();
    } catch {
      setLeadErr(tr("Revisa tu nombre y escribe un correo o celular válido."));
    } finally {
      setLeadBusy(false);
    }
  };

  const askAi = async (text: string) => {
    const history = [...msgs, { from: "me" as const, text }]
      .filter((m) => m.text)
      .slice(-10)
      .map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text }));
    setTyping(true);
    try {
      const r = await fetch("/api/aldo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history, lang: k.lang || document.documentElement.lang.slice(0, 2) }) });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as { text: string; wa?: boolean; link?: string };
      setTyping(false);
      setMsgs((xs) => [...xs, { from: "aldo", text: d.text, wa: d.wa, form: d.wa && !sentLead, link: d.link, chips: [tr("Ver otros servicios"), tr("Hablar con una persona")] }]);
    } catch {
      setTyping(false);
      keywordAnswer(text);
    }
  };

  const handle = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMsgs((xs) => [...xs, { from: "me", text }]);
    setInput("");

    const n = norm(text);
    const byLabel = k.topics.find((t) => norm(t.label) === n) || (n === norm(tr("Hablar con una persona")) ? k.topics.find((t) => t.id === "humano") : undefined);
    if (byLabel) return answerTopic(byLabel);
    if (n.includes("ver otros") || n === norm(tr("Ver otros servicios"))) return say({ from: "aldo", text: tr("Esto es todo lo que hacemos. ¿Qué te interesa?"), chips: k.topics.filter((t) => !["humano", "precios"].includes(t.id)).map((t) => t.label) });
    const isPriceChip = n === norm("¿Cuánto cuesta?") || n === norm(tr("¿Cuánto cuesta?"));
    if (k.ai && !isPriceChip) return askAi(text);
    if (/(cuanto|precio|cuesta|valor|tarifa|cotiza)/.test(n)) {
      const current = k.topics.find((t) => t.label === interest);
      if (current?.price) return say({ from: "aldo", text: current.price, chips: [tr("Hablar con una persona"), tr("Ver otros servicios")], wa: true });
      const p = k.topics.find((t) => t.id === "precios");
      if (p) return answerTopic(p);
    }

    keywordAnswer(text);
  };

  const keywordAnswer = (text: string) => {
    const w = words(text);
    let best: { t?: AldoTopic; f?: { q: string; a: string }; score: number } = { score: 0 };
    for (const t of k.topics) {
      const sc = hits(w, t.keywords) * 2 + hits(w, words(t.label));
      if (sc > best.score) best = { t, score: sc };
    }
    for (const f of k.faqs) {
      const sc = hits(w, words(f.q)) * 1.5;
      if (sc > best.score) best = { f, score: sc };
    }
    if (best.t && best.score >= 2) return answerTopic(best.t);
    if (best.f && best.score >= 2) return say({ from: "aldo", text: best.f.a, chips: [tr("Ver otros servicios"), tr("Hablar con una persona")] });
    say({
      from: "aldo",
      text: tr("Mmm, eso no lo tengo claro todavía 🦉 Pero el equipo sí: escríbenos por WhatsApp y te respondemos con detalle."),
      chips: [tr("Ver otros servicios")],
      wa: true,
    });
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {open && (
        <section
          aria-label="Chat con Aldo"
          className="flex h-[min(560px,calc(100dvh-7rem))] w-[min(370px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-ink-900/10 bg-paper shadow-2xl shadow-black/30 [animation:aldo-pop_.25s_ease-out]"
        >
          <header className="flex items-center gap-3 bg-ink-900 px-4 py-3 text-paper">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-paper">
              <Aldo pose={typing ? "code" : "base"} follow={false} className={`mt-3 h-12 w-12 ${typing ? "aldo-chat-typing" : ""}`} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-semibold"><TC>{"Aldo"}</TC></p>
              <p className="font-mono text-[11px] text-paper/60">{typing ? <span className="text-emerald-400"><TC>{"escribiendo…"}</TC></span> : <TC>{"asistente de Aldore"}</TC>}</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="grid h-8 w-8 place-items-center rounded-full text-paper/70 hover:bg-white/10 hover:text-paper">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "me" ? "flex justify-end" : "space-y-2"}>
                <p className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug ${m.from === "me" ? "rounded-br-md bg-ink-900 text-paper" : "rounded-bl-md border border-paper-line bg-white text-ink-900"}`}>
                  {m.text}
                </p>
                {m.topic?.points && m.topic.points.length > 0 && (
                  <ul className="max-w-[88%] space-y-1 rounded-2xl border border-paper-line bg-white px-3.5 py-2.5 text-[13px] text-ink-700">
                    {m.topic.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-brand-500" />{p}</li>)}
                  </ul>
                )}
                {(m.topic?.href || m.link || m.wa) && (
                  <div className="flex flex-wrap gap-2">
                    {(m.topic?.href || m.link) && (
                      <Link href={(m.topic?.href || m.link)!} onClick={() => setOpen(false)} className="rounded-full border border-ink-900/20 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-900 hover:border-ink-900"><TC>{"Ver más →"}</TC></Link>
                    )}
                    {m.wa && (
                      <a href={waHref(interest)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-95"><TC>{"Escribir por WhatsApp ↗"}</TC></a>
                    )}
                  </div>
                )}
                {m.form && !sentLead && (
                  <form onSubmit={sendLead} className="max-w-[92%] space-y-2 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-3">
                    <p className="text-[13px] font-medium text-ink-900"><TC>{"¿Te dejo la solicitud lista? El equipo te contacta."}</TC></p>
                    <input name="name" required placeholder={tr("Tu nombre")} className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500" autoComplete="name" />
                    <input name="contact" required placeholder={tr("Correo o celular")} className="w-full rounded-lg border border-paper-line bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500" />
                    {leadErr && <p className="text-[12px] text-red-600">{leadErr}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      <button disabled={leadBusy} className="rounded-full bg-brand-500 px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-brand-600 disabled:opacity-60">{leadBusy ? <TC>{"Enviando…"}</TC> : <TC>{"Enviar al equipo"}</TC>}</button>
                      <Link href="/agendar" onClick={() => setOpen(false)} className="text-[13px] font-medium text-ink-700 underline-offset-2 hover:underline"><TC>{"o agenda una llamada"}</TC></Link>
                    </div>
                  </form>
                )}
                {m.chips && i === msgs.length - 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.chips.map((c) => (
                      <button key={c} onClick={() => handle(c)} className="rounded-full border border-brand-500/40 bg-brand-500/5 px-3 py-1.5 text-[13px] text-brand-700 transition hover:bg-brand-500 hover:text-white">
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex items-end gap-2" aria-label={tr("Aldo está escribiendo")} role="status">
                <Aldo pose="code" follow={false} className="aldo-chat-typing h-11 w-11 shrink-0" title="" />
                <p className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-paper-line bg-white px-4 py-3">
                  {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: `${d * 0.15}s` }} />)}
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handle(input);
            }}
            className="flex items-center gap-2 border-t border-paper-line bg-white px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr("Escríbele a Aldo…")}
              aria-label={tr("Mensaje para Aldo")}
              className="min-w-0 flex-1 rounded-full border border-paper-line bg-paper px-4 py-2 text-[14px] outline-none focus:border-brand-500"
            />
            <button aria-label="Enviar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
          <a href={waHref(interest)} target="_blank" rel="noopener noreferrer" className="bg-white pb-2 text-center text-[11px] text-ink-500 hover:text-ink-900"><TC>{"¿Prefieres hablar con una persona? "}</TC><span className="font-semibold text-[#128C7E]"><TC>{"WhatsApp ↗"}</TC></span>
          </a>
        </section>
      )}

      <div className="flex items-end gap-2">
        {teaser && !open && (
          <div className={`aldo-tab relative mb-11 max-w-[250px] ${leaving ? "aldo-tab-out" : ""}`}>
            <button
              onClick={() => {
                setTeaser(false);
                try { sessionStorage.setItem("aldo-bubble", "0"); } catch {}
              }}
              aria-label={tr("Cerrar mensaje")}
              className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-ink-900 text-xs text-paper hover:bg-brand-500"
            >
              ×
            </button>
            <button onClick={start} className="group block overflow-hidden rounded-2xl rounded-br-sm bg-ink-900 text-left text-paper shadow-xl shadow-black/30 ring-1 ring-white/10">
              <span className="flex items-center gap-2 border-b border-white/10 px-4 pb-2 pt-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
                <svg viewBox="0 0 40 40" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M5 38V21C5 11 12 5 20 2c8 3 15 9 15 19v17z" fill="none" stroke="currentColor" strokeWidth={3.5} />
                  <path d="M15 38V25c0-4 2-7 5-9 3 2 5 5 5 9v13z" fill="#e2471c" />
                </svg>
                Aldo · {tr("en línea")}
                <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              </span>
              <span className="block px-4 py-3 text-[14px] leading-snug">{tips[tip] || k.bubble}</span>
              <span className="block h-0.5 origin-left bg-brand-500 [animation:aldo-tab-time_8s_linear_both]" />
            </button>
          </div>
        )}
        <button
          onClick={() => (open ? setOpen(false) : start())}
          aria-label={open ? "Cerrar chat con Aldo" : "Hablar con Aldo"}
          aria-expanded={open}
          className="aldo-hover group relative block h-20 w-20"
        >
          {mood === "sleep" && !open && <span className="aldo-zz pointer-events-none absolute -left-1 -top-3 font-mono text-sm font-bold text-ink-500" aria-hidden>z<span>z</span><span>z</span></span>}
          {party > 0 && (
            <span key={party} className="pointer-events-none absolute inset-0" aria-hidden>
              {Array.from({ length: 22 }, (_, i) => (
                <span
                  key={i}
                  className="aldo-confetti"
                  style={{ "--a": `${(i / 22) * 360}deg`, "--d": `${70 + (i % 5) * 22}px`, "--c": ["#e2471c", "#f6bfa9", "#16130f", "#34d399", "#fbbf24"][i % 5], animationDelay: `${(i % 4) * 40}ms` } as React.CSSProperties}
                />
              ))}
            </span>
          )}
          <span className="absolute inset-0 overflow-hidden rounded-full border border-paper-line bg-paper shadow-xl shadow-black/25">
            <span className="aldo-peek absolute inset-x-0 -bottom-3 block [animation:aldo-peek_.7s_cubic-bezier(.2,.9,.3,1.2)_1.2s_both]">
              <Aldo pose={open ? "wave" : mood} className={`mx-auto h-[84px] w-[84px] ${mood === "cheer" ? "aldo-jump" : ""}`} />
            </span>
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow ring-2 ring-white">
            {open ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M6 6l12 12M18 6 6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z" /></svg>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
