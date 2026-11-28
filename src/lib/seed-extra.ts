// Contenido inicial de la tanda "blog, cotizador, portal, turnos y menú". Se crea una sola vez.
export const NEW_SERVICES_2 = [
  {
    slug: "turnos-qr",
    title: "Turnos con QR",
    shortDescription: "Tus clientes escanean, toman turno y ven en el celular cuándo les toca. Sin filas ni papelitos.",
    description:
      "Pones un QR en la entrada. El cliente lo escanea, toma su turno y puede ir por un café: su celular le muestra cuántos faltan y le avisa cuando es su turno.\n\nQuien atiende tiene un botón de «Llamar siguiente» en el celular o el computador, y si quieres, una pantalla en TV que muestra el turno actual. Ideal para peluquerías, consultorios, laboratorios, talleres y trámites.",
    icon: "screen",
    features: "QR para imprimir con tu marca\nEl cliente ve su turno y la espera en el celular\nBotón «Llamar siguiente» para quien atiende\nPantalla para TV o tablet\nSe reinicia sola cada día",
    order: 60,
  },
  {
    slug: "menu-del-dia",
    title: "Menú del día por QR y WhatsApp",
    shortDescription: "Publicas el almuerzo desde el celular en un minuto y tus clientes lo ven y lo piden por WhatsApp.",
    description:
      "Para restaurantes de almuerzo, corrientazo o ejecutivo. Cada mañana cambias el menú desde tu celular con un enlace privado: sopa, principio, proteína, bebida y precio. Si algo se acaba, lo marcas como agotado.\n\nTus clientes lo ven en una página con tu marca (por QR, por tus redes o por WhatsApp) y piden con un toque, con el mensaje ya escrito.",
    icon: "receipt",
    features: "Página del menú con tu logo y colores\nLo cambias desde el celular en un minuto\nPlatos agotados marcados al instante\nBotón para pedir por WhatsApp\nQR para mesas, vitrina y domicilios",
    order: 61,
  },
];

export const DEMO_QUEUE = {
  slug: "demo",
  name: "Ola Peluquería",
  subtitle: "Envigado · Sin cita previa",
  logoUrl: "/puerta/ola-logo.svg",
  color: "#FF4D6D",
  prefix: "A",
  avgMinutes: 15,
  staffKey: "demo-atender",
};

export const DEMO_MENU = {
  slug: "demo",
  name: "Fogón 1950",
  subtitle: "Medellín · Cocina antioqueña a la leña",
  logoUrl: "/puerta/fogon-logo.svg",
  color: "#C2410C",
  whatsapp: "+573000000000",
  price: "$19.000 · Con jugo y postre",
  hours: "Almuerzos de 11:30 a. m. a 3:00 p. m.",
  notes: "Domicilios gratis en Laureles y Estadio.",
  items: [
    "Sopa | Sancocho de gallina | con arepa",
    "Principio | Frijoles con garra",
    "Proteína | Carne asada a la leña | o pechuga a la plancha",
    "!Proteína | Chicharrón carnudo",
    "Acompañantes | Arroz, maduro, hogao y ensalada",
    "Bebida | Jugo de mora en agua",
    "Postre | Arroz con leche",
  ].join("\n"),
  // La clave para editar el menú de demo se genera al sembrar (no es pública).
};
