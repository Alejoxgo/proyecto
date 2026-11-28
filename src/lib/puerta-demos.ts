// Negocios inventados para mostrar Puerta. Cada uno con su propia identidad.
export type PuertaDemo = {
  slug: string;
  name: string;
  subtitle: string;
  logoUrl: string;
  coverUrl: string;
  color: string;
  bgColor: string;
  theme: "claro" | "oscuro";
  font: string;
  buttonStyle: string;
  buttons: string;
  wifiName: string;
  wifiPass: string;
};

export const PUERTA_DEMOS: PuertaDemo[] = [
  {
    slug: "demo",
    name: "La Esquina Café",
    subtitle: "Sabaneta · Café de origen tostado en casa",
    logoUrl: "/puerta/la-esquina-logo.svg",
    coverUrl: "/puerta/la-esquina-cover.svg",
    color: "#1F5C45",
    bgColor: "#F3EADB",
    theme: "claro",
    font: "elegante",
    buttonStyle: "tarjeta",
    buttons: [
      "carta | Nuestra carta | Cafés, postres y desayunos | https://aldore.co/puerta",
      "resena | ¿Cómo te fue hoy? | Déjanos tu reseña en Google | https://aldore.co/puerta",
      "whatsapp | Pide para llevar | Te lo tenemos listo | +573000000000",
      "wifi | WiFi de la casa | Toca para ver la clave | wifi",
      "pago | Paga aquí | Nequi, Daviplata y tarjetas | https://aldore.co/puerta",
      "instagram | @laesquinacafe | Mira lo que tostamos hoy | https://instagram.com",
    ].join("\n"),
    wifiName: "LaEsquina_Clientes",
    wifiPass: "cafecito2026",
  },
  {
    slug: "ola-peluqueria",
    name: "Ola Peluquería",
    subtitle: "Envigado · Color, corte y cuidado",
    logoUrl: "/puerta/ola-logo.svg",
    coverUrl: "/puerta/ola-cover.svg",
    color: "#FF4D6D",
    bgColor: "#FFF4F2",
    theme: "claro",
    font: "redondeada",
    buttonStyle: "solido",
    buttons: [
      "reservar | Agenda tu cita | Elige día y estilista | https://aldore.co/puerta",
      "whatsapp | Escríbenos | Respondemos en minutos | +573000000000",
      "instagram | Nuestros trabajos | @ola.peluqueria | https://instagram.com",
      "pago | Precios y pagos | Nequi y tarjetas | https://aldore.co/puerta",
      "resena | ¿Te gustó tu look? | Cuéntalo en Google | https://aldore.co/puerta",
    ].join("\n"),
    wifiName: "",
    wifiPass: "",
  },
  {
    slug: "fogon-1950",
    name: "Fogón 1950",
    subtitle: "Medellín · Cocina antioqueña a la leña",
    logoUrl: "/puerta/fogon-logo.svg",
    coverUrl: "/puerta/fogon-cover.svg",
    color: "#F2A541",
    bgColor: "#1B1512",
    theme: "oscuro",
    font: "tecnica",
    buttonStyle: "contorno",
    buttons: [
      "carta | La carta | Bandeja, sancocho y más | https://aldore.co/puerta",
      "reservar | Reserva tu mesa | Fines de semana se llena | https://aldore.co/puerta",
      "mapa | Cómo llegar | Cra. 70 con Calle 44 | https://maps.google.com",
      "wifi | WiFi | Toca para ver la clave | wifi",
      "resena | Califícanos | Tu opinión nos ayuda | https://aldore.co/puerta",
    ].join("\n"),
    wifiName: "Fogon1950",
    wifiPass: "lena1950",
  },
];
