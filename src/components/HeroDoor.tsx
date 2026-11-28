import TC from "@/components/TC";
import HeroAldo from "./HeroAldo";

const chat = [
  { me: false, t: "Hola 👋 ¿tienen cita para mañana?" },
  { me: true, t: "¡Hola! Sí. Tengo 9:00 a. m. o 3:30 p. m. ¿Cuál te sirve?" },
  { me: false, t: "3:30 porfa" },
  { me: true, t: "Listo, quedaste agendada ✅ Te recuerdo por aquí una hora antes." },
];

/**
 * La puerta de Aldore: el arco del logo, grande, con un ejemplo real de lo que hacemos adentro
 * (un chatbot de citas por WhatsApp). Los mensajes aparecen uno a uno y se repiten.
 */
export default function HeroDoor({ caption }: { caption: string }) {
  return (
    <figure className="relative mx-auto w-full max-w-[420px]">
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <clipPath id="aldore-arch" clipPathUnits="objectBoundingBox">
          <path d="M0 1V.528C0 .25.233.083.5 0c.267.083.5.25.5.528V1z" />
        </clipPath>
      </svg>

      {/* Contorno de plano, como un dibujo técnico de la puerta */}
      <svg viewBox="0 0 300 360" className="pointer-events-none absolute -inset-3 z-0 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-ink-900/25" fill="none" aria-hidden="true">
        <path d="M2 358V191C2 91 72 31 150 2c78 29 148 89 148 189v167" stroke="currentColor" strokeDasharray="4 6" />
      </svg>

      {/* Aldo llega volando y se posa encima de la puerta; si lo tocas se va y luego regresa */}
      <HeroAldo />

      <div className="relative z-10 aspect-[30/36] w-full bg-ink-900" style={{ clipPath: "url(#aldore-arch)" }}>
        {/* El umbral bermellón: la entrada del logo */}
        <div className="absolute inset-x-[33%] bottom-0 h-[5px] bg-brand-500" />

        <div className="absolute inset-x-[9%] bottom-[7%] top-[30%] flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-white"><TC>{"PO"}</TC></span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-paper"><TC>{"Peluquería Ola"}</TC></p>
              <p className="font-mono text-[10px] text-emerald-400"><TC>{"bot · en línea"}</TC></p>
            </div>
          </div>
          <ul className="mt-3 flex flex-1 flex-col justify-end gap-2">
            {chat.map((m, i) => (
              <li
                key={i}
                className={`hero-msg max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                  m.me ? "self-end rounded-br-md bg-emerald-600 text-white" : "self-start rounded-bl-md bg-white/10 text-paper"
                }`}
                style={{ animationDelay: `${i * 1.4}s` }}
              >
                <TC>{m.t}</TC>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <figcaption className="mt-5 text-center font-mono text-xs text-ink-500">{caption}</figcaption>
    </figure>
  );
}
