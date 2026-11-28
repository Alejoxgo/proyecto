import type { AldoKnowledge, AldoTopic } from "@/components/AldoChat";
import type { Settings } from "./settings";
import { lines } from "./utils";

// Palabras con las que la gente suele pedir cada servicio (además del título).
const KEYWORDS: Record<string, string[]> = {
  "desarrollo-web": ["pagina", "web", "sitio", "tienda", "landing", "ecommerce", "online", "vender"],
  aplicaciones: ["app", "aplicacion", "movil", "android", "iphone", "ios", "sistema", "plataforma", "software"],
  chatbots: ["chatbot", "bot", "whatsapp", "inteligencia", "citas", "agendar", "automatico", "responder"],
  "integraciones-ti": ["integracion", "integrar", "automatizar", "api", "erp", "crm", "siigo", "alegra", "excel", "conectar"],
  "nube-y-soporte": ["nube", "servidor", "hosting", "soporte", "aws", "correo", "infraestructura"],
  ciberseguridad: ["seguridad", "hackeo", "virus", "auditoria", "contrasenas", "respaldo"],
  "carta-digital": ["carta", "menu", "restaurante", "pedido", "pedidos", "mesa", "comida", "cocina"],
  "tarjetas-nfc": ["tarjeta", "tarjetas", "presentacion", "contacto", "empleados", "vcard"],
  fidelizacion: ["fidelizacion", "fidelizar", "sellos", "puntos", "frecuentes", "premio", "volver"],
  "resenas-google": ["resena", "resenas", "google", "maps", "estrellas", "opiniones", "calificacion"],
  "mantenimiento-web": ["mantenimiento", "actualizar", "cambios", "dominio", "renovar", "copias"],
  "turnos-qr": ["turno", "turnos", "fila", "filas", "espera", "esperar", "cola", "sala"],
  "menu-del-dia": ["almuerzo", "almuerzos", "corrientazo", "ejecutivo", "dia", "restaurante"],
  "impresion-3d": ["3d", "impresion", "imprimir", "impresora", "prototipo", "pieza", "piezas", "llaveros", "figura", "modelo", "filamento"],
  "agenda-online": ["agenda", "agendar", "reserva", "reservas", "citas", "turnos", "recordatorio", "recordatorios", "peluqueria", "consultorio"],
  "catalogo-whatsapp": ["catalogo", "productos", "carrito", "vender", "pedidos", "tienda"],
  "facturacion-electronica": ["factura", "facturacion", "facturar", "dian", "siigo", "alegra", "electronica", "pos"],
  "pantallas-digitales": ["pantalla", "pantallas", "televisor", "tv", "senalizacion", "promociones", "menu"],
  automatizaciones: ["automatizar", "automatizacion", "automatizaciones", "excel", "sheets", "repetitivo", "procesos", "reportes"],
  capacitaciones: ["capacitacion", "capacitaciones", "curso", "cursos", "taller", "talleres", "aprender", "ensenar", "clases"],
  puerta: ["puerta", "qr", "nfc", "sticker", "stickers", "links", "enlaces", "wifi", "toque", "linktree"],
  castorly: ["castorly", "desk", "mesa", "ayuda", "tickets", "llamadas", "soporte", "agentes"],
  humano: ["persona", "asesor", "humano", "llamar", "hablar", "contacto", "equipo", "alguien"],
};

type Svc = { slug: string; title: string; shortDescription: string; features: string };
type Prod = { slug: string; name: string; tagline: string; features: string; price: string };
type PlanRow = { name: string; price: string; period: string };

export function buildAldo(s: Settings, services: Svc[], products: Prod[], plans: PlanRow[], faqs: { question: string; answer: string }[]): AldoKnowledge {
  const quote = "Cada proyecto es distinto, así que te enviamos una propuesta con precio cerrado en menos de 48 horas, sin compromiso.";
  const webPrices = plans.length ? `Nuestros planes de páginas web:\n${plans.map((p) => `• ${p.name}: ${p.price}${p.period ? ` (${p.period})` : ""}`).join("\n")}` : quote;
  const puertaPlans = lines(s["puerta.plans"]).map((l) => l.split("|").map((x) => x.trim()));
  const puertaPrice = puertaPlans.length
    ? `Puerta by Aldore:\n${puertaPlans.map(([n, p, note]) => `• ${n}: ${p} ${note ?? ""}`.trim()).join("\n")}${s["puerta.plansNote"] ? `\n${s["puerta.plansNote"]}` : ""}`
    : quote;

  const topics: AldoTopic[] = [
    ...services.map((sv) => ({
      id: sv.slug,
      label: sv.title,
      answer: sv.shortDescription,
      points: lines(sv.features).slice(0, 4),
      href: `/servicios/${sv.slug}`,
      price: sv.slug === "desarrollo-web" ? webPrices : quote,
      keywords: KEYWORDS[sv.slug] ?? [],
    })),
    {
      id: "puerta",
      label: "Puerta (QR / NFC)",
      answer: s["puerta.text"],
      points: lines(s["puerta.uses"]).slice(0, 4),
      href: "/puerta",
      price: puertaPrice,
      keywords: KEYWORDS.puerta,
    },
    ...products.map((p) => ({
      id: p.slug,
      label: p.name,
      answer: `${p.name}: ${p.tagline}`,
      points: lines(p.features).slice(0, 4),
      href: `/productos/${p.slug}`,
      price: p.price || quote,
      keywords: KEYWORDS[p.slug] ?? [],
    })),
    { id: "cotizar", label: "Cotizar en línea", answer: "En el cotizador eliges qué necesitas y ves un rango de precio al instante, sin dejar tus datos hasta el final.", href: "/cotizar", keywords: ["cotizar", "cotizacion", "cotizador", "presupuesto", "calcular"] },
    { id: "nosotros", label: "Quiénes somos", answer: "Somos Aldore, un estudio de software en Medellín. En la página Nosotros está nuestra misión, la visión, lo que nos guía… y mi propia sección. 🦉", href: "/nosotros", keywords: ["nosotros", "quienes", "somos", "empresa", "mision", "vision", "valores", "equipo", "aldo", "buho", "mascota"] },
    { id: "blog", label: "Blog", answer: "En el blog tenemos guías cortas sobre páginas web, chatbots, QR y más, escritas para dueños de negocio.", href: "/blog", keywords: ["blog", "articulo", "articulos", "guia", "guias", "aprender"] },
    { id: "precios", label: "Precios", answer: `${webPrices}\n\n${puertaPrice}\n\nPara apps, chatbots e integraciones: ${quote}\n\nSi quieres un número rápido, usa el cotizador en línea.`, href: "/cotizar", keywords: ["precio", "precios", "planes", "cuanto", "cuesta", "valor", "tarifa"] },
    { id: "humano", label: "Hablar con una persona", answer: "", keywords: KEYWORDS.humano },
  ];

  const pick = (slug: string) => topics.find((t) => t.id === slug)?.label;
  const quick = [pick("desarrollo-web"), pick("chatbots"), "Puerta (QR / NFC)", "Cotizar en línea", "Precios", "Ver otros servicios", "Hablar con una persona"].filter(Boolean) as string[];

  return {
    greeting: s["aldo.greeting"],
    bubble: s["aldo.bubble"],
    tips: (s["aldo.tips"] || "").split("\n").map((t) => t.trim()).filter(Boolean),
    whatsapp: s["contact.whatsapp"],
    hours: s["contact.hours"],
    topics,
    faqs: faqs.map((f) => ({ q: f.question, a: f.answer })),
    quick,
  };
}
