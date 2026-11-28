import { getT } from "./i18n";
import { prisma } from "./db";

type Field = { key: string; label: string; type?: "text" | "textarea" | "url"; default: string; help?: string };
export type SettingsGroup = { id: string; title: string; description?: string; fields: Field[] };

/** Todos los textos editables del sitio. Agregar un campo aquí lo hace editable en /admin/contenido. */
export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: "marca",
    title: "Marca y SEO",
    fields: [
      { key: "site.name", label: "Nombre de la empresa", default: "Aldore" },
      { key: "site.tagline", label: "Eslogan", default: "Software para empresas que no pueden parar" },
      { key: "seo.title", label: "Título SEO", default: "Aldore | Desarrollo web, apps, chatbots e integraciones TI" },
      {
        key: "seo.description",
        label: "Descripción SEO",
        type: "textarea",
        default:
          "Creamos páginas web, aplicaciones, chatbots con IA e integraciones TI para empresas que quieren crecer. Conoce también Castorly, nuestra plataforma para Service Desk.",
      },
    ],
  },
  {
    id: "hero",
    title: "Portada (Hero)",
    fields: [
      { key: "hero.kicker", label: "Línea pequeña sobre el título (vacío = sin línea)", default: "Estudio de software" },
      { key: "hero.title", label: "Título principal", help: "Encierra una palabra entre *asteriscos* para resaltarla.", default: "Abrimos la puerta *digital* de tu negocio." },
      {
        key: "hero.subtitle",
        label: "Subtítulo",
        type: "textarea",
        default:
          "Páginas web, apps, chatbots de WhatsApp e integraciones, hechos a la medida por un equipo pequeño. Hablas directo con quien escribe el código y sabes el precio antes de empezar.",
      },
      { key: "hero.ctaPrimary", label: "Botón principal", default: "Cuéntanos tu proyecto" },
      { key: "hero.ctaSecondary", label: "Botón secundario", default: "Ver lo que hacemos" },
      { key: "hero.caption", label: "Texto bajo la puerta", default: "Ejemplo: chatbot de citas por WhatsApp" },
      { key: "hero.stat1Value", label: "Compromiso 1 – título", default: "48 horas" },
      { key: "hero.stat1Label", label: "Compromiso 1 – texto", default: "para enviarte una propuesta concreta" },
      { key: "hero.stat2Value", label: "Compromiso 2 – título", default: "Precio cerrado" },
      { key: "hero.stat2Label", label: "Compromiso 2 – texto", default: "lo sabes antes de empezar, sin sorpresas" },
      { key: "hero.stat3Value", label: "Compromiso 3 – título", default: "Es tuyo" },
      { key: "hero.stat3Label", label: "Compromiso 3 – texto", default: "el código, el dominio y los datos" },
    ],
  },
  {
    id: "cotizador",
    title: "Cotizador en línea",
    description: "Precios del cotizador de aldore.co/cotizar. El resultado es un rango aproximado; la cotización final la confirmas tú.",
    fields: [
      { key: "quote.title", label: "Título", default: "¿Cuánto cuesta *lo que necesitas*?" },
      { key: "quote.text", label: "Texto", type: "textarea", default: "Responde tres preguntas y te mostramos un rango de precio al instante. Sin compromiso y sin dar tus datos hasta el final." },
      {
        key: "quote.types",
        label: "Tipos de proyecto",
        type: "textarea",
        help: "Uno por línea: id | nombre | precio desde | precio hasta | descripción | ícono | nota de mensualidad (opcional). Íconos: code, cart, smartphone, bot, plug, sparkles, cloud, shield, cube, calendar.",
        default: [
          "web | Página web | 1200000 | 3500000 | Sitio para tu empresa o marca, con panel para editarlo | code",
          "tienda | Tienda online | 4500000 | 9000000 | Catálogo, carrito y pagos en línea | cart",
          "app | Aplicación a la medida | 12000000 | 40000000 | App web o móvil para tu operación | smartphone",
          "chatbot | Chatbot de WhatsApp con IA | 1800000 | 6000000 | Atiende, agenda y vende 24/7 | bot | + desde $150.000/mes de mantenimiento",
          "integracion | Integración o automatización | 1500000 | 8000000 | Conecta tu ERP, facturación, inventario o CRM | plug",
          "puerta | Puerta (QR / NFC) | 120000 | 400000 | Página de un toque para tu local | sparkles | + desde $35.000/mes",
          "impresion | Impresión 3D | 80000 | 600000 | Piezas, prototipos o soportes con tu marca | cube",
        ].join("\n"),
      },
      {
        key: "quote.scopes",
        label: "Pregunta de alcance por tipo",
        type: "textarea",
        help: "Uno por línea: id del tipo | pregunta | Opción = multiplicador = detalle ; Opción = multiplicador = detalle ; … El multiplicador se aplica al rango 'desde – hasta' del tipo (1 = precio base). Si un tipo no tiene línea, se usa Básico / Completo / A la medida.",
        default: [
          "web | ¿Cuántas secciones o páginas? | Hasta 5 páginas = 1 = Inicio, servicios, nosotros, contacto ; De 6 a 12 páginas = 1.4 = Varias líneas de servicio o sedes ; Más de 12 páginas = 1.9 = Sitio grande, varios idiomas o catálogos",
          "tienda | ¿Cuántos productos vas a vender? | Hasta 50 productos = 1 = Catálogo pequeño ; De 50 a 300 productos = 1.3 = Con categorías y variantes (talla, color) ; Más de 300 productos = 1.7 = Catálogo grande o mayoristas",
          "app | ¿Qué tan grande es la aplicación? | Un solo tipo de usuario = 1 = Pocas pantallas, un flujo principal ; Varios roles = 1.5 = Clientes, empleados y administrador ; Web + app móvil = 2.2 = Con integraciones y app en las tiendas",
          "chatbot | ¿Qué debe hacer el chatbot? | Responder preguntas = 1 = Horarios, precios, ubicación, preguntas frecuentes ; Agendar o tomar pedidos = 1.5 = Guarda citas o pedidos y te avisa ; Conectado a tu sistema = 2.2 = Consulta inventario, cartera o estados en tiempo real",
          "integracion | ¿Cuántos sistemas hay que conectar? | 2 sistemas = 1 = Ej: tienda online y facturación ; 3 o 4 sistemas = 1.6 = Ej: ERP, CRM, bodega y facturación ; 5 sistemas o más = 2.4 = Procesos grandes con varias áreas",
          "puerta | ¿Cuántos locales o sedes? | Un local = 1 = Una Puerta con su QR y NFC ; De 2 a 3 sedes = 2.2 = Una Puerta por sede ; 4 sedes o más = 3.5 = Cadena o franquicia",
          "impresion | ¿Cuántas piezas necesitas? | De 1 a 5 piezas = 1 = Prototipo o pieza única ; De 6 a 50 piezas = 3 = Lote pequeño ; Más de 50 piezas = 6 = Producción por lotes",
        ].join("\n"),
      },
      {
        key: "quote.extras",
        label: "Extras",
        type: "textarea",
        help: "Uno por línea: nombre | precio | para qué tipos (ids separados por coma, o * para todos).",
        default: [
          "Diseño de logo | 450000 | web,tienda,puerta,app",
          "Textos escritos por nosotros | 350000 | web,tienda",
          "Blog autoadministrable | 400000 | web",
          "Versión en inglés | 600000 | web,tienda",
          "Agenda de citas en línea | 600000 | web,chatbot",
          "Pagos en línea (Wompi o Mercado Pago) | 700000 | web,app,chatbot",
          "Fotos de producto (hasta 20) | 600000 | tienda",
          "Carga de tu catálogo por nosotros | 400000 | tienda",
          "Envíos con transportadora integrada | 800000 | tienda",
          "Facturación electrónica conectada | 900000 | tienda,app,integracion",
          "App publicada en Play Store y App Store | 2500000 | app",
          "Panel de administración con reportes | 1500000 | app,chatbot,integracion",
          "Conexión con tu inventario o catálogo | 800000 | chatbot",
          "Pasar la conversación a una persona | 500000 | chatbot",
          "Alertas por correo o WhatsApp cuando algo falle | 400000 | integracion",
          "Stickers NFC adicionales (10) | 150000 | puerta",
          "Soportes de mesa impresos en 3D (10) | 250000 | puerta",
          "Menú del día o turnos con QR | 200000 | puerta",
          "Modelado 3D de tu idea | 200000 | impresion",
          "Pintura y acabado a mano | 150000 | impresion",
          "Capacitación para tu equipo | 300000 | web,tienda,app,chatbot,integracion",
        ].join("\n"),
      },
    ],
  },
  {
    id: "nosotros",
    title: "Nosotros: misión, visión y Aldo",
    description: "Todo lo que aparece en /nosotros. Si dejas un campo vacío, esa parte no se muestra.",
    fields: [
      { key: "about.kicker", label: "Línea pequeña sobre el título", default: "Quiénes somos" },
      { key: "about.title", label: "Título", help: "Encierra una palabra entre *asteriscos* para resaltarla.", default: "Tecnología hecha en Medellín para negocios que *no pueden parar*." },
      { key: "about.text", label: "Introducción", type: "textarea", default: "Aldore es un estudio de software. Hacemos páginas web, aplicaciones, chatbots e integraciones para empresas de Latinoamérica, y les hablamos claro: qué se puede hacer, cuánto cuesta y cuándo está listo." },
      { key: "about.storyTitle", label: "Historia – título", default: "Por qué existimos" },
      {
        key: "about.story",
        label: "Historia",
        type: "textarea",
        help: "Deja una línea en blanco entre párrafos.",
        default: "Vimos a muchos negocios pagar por páginas que nadie podía editar, por sistemas que no se hablaban entre sí y por proveedores que desaparecían después de cobrar.\n\nPor eso trabajamos distinto: precio cerrado antes de empezar, entregas cortas que puedes ver y probar, y todo queda a tu nombre: el código, el dominio y los datos.\n\nSomos un equipo pequeño a propósito. Hablas con quien hace el trabajo, no con un intermediario.",
      },
      { key: "about.imageUrl", label: "Foto del equipo u oficina (opcional)", type: "url", default: "" },
      { key: "about.mission", label: "Misión", type: "textarea", default: "Abrir la puerta digital de cada negocio con tecnología útil, bien hecha y explicada sin rodeos, para que sus dueños vendan más y pierdan menos tiempo." },
      { key: "about.vision", label: "Visión", type: "textarea", default: "Ser en 2030 el estudio de software de confianza de las pymes de Latinoamérica: el equipo al que llaman primero cuando quieren crecer con tecnología." },
      {
        key: "about.values",
        label: "Valores",
        type: "textarea",
        help: "Uno por línea: Título | explicación.",
        default: [
          "Claridad | Precio cerrado, plazos reales y cero palabras raras.",
          "Es tuyo | El código, el dominio y los datos quedan a tu nombre.",
          "Hecho para durar | Preferimos lo simple y sólido a lo que está de moda.",
          "Cerca | Respondemos rápido y te enseñamos a usar lo que construimos.",
        ].join("\n"),
      },
      {
        key: "about.stats",
        label: "Cifras o compromisos",
        type: "textarea",
        help: "Uno por línea: valor | texto. Ej: 48 h | para enviarte una propuesta.",
        default: ["48 h | para enviarte una propuesta concreta", "100% | del código y los datos quedan a tu nombre", "1 equipo | de principio a fin, sin intermediarios", "Medellín | trabajando con toda Latinoamérica"].join("\n"),
      },
      { key: "about.team", label: "Equipo (opcional)", type: "textarea", help: "Uno por línea: Nombre | cargo | enlace a la foto (opcional). Vacío = no se muestra.", default: "" },
      { key: "about.ctaTitle", label: "Cierre – título", default: "¿Construimos algo *juntos*?" },
      { key: "about.ctaText", label: "Cierre – texto", type: "textarea", default: "Cuéntanos qué te quita tiempo o qué quieres lograr. En 48 horas te respondemos con una propuesta concreta." },
      { key: "aldo.title", label: "Aldo – título", default: "Conoce a *Aldo*, nuestro búho." },
      { key: "aldo.text", label: "Aldo – presentación", type: "textarea", default: "Aldo es la mascota de Aldore y el que te recibe en la esquina de cada página. Los búhos ven en la oscuridad: él ve lo que a tu negocio le cuesta tiempo y te ayuda a encontrar cómo arreglarlo." },
      {
        key: "aldo.facts",
        label: "Aldo – datos curiosos",
        type: "textarea",
        help: "Uno por línea: Título | texto.",
        default: [
          "Su forma | Su cuerpo es el arco de nuestro logo: una puerta abierta.",
          "Su trabajo | Responde preguntas en el chat del sitio y te lleva a lo que buscas.",
          "Su color | El bermellón de su pecho es el mismo de la marca.",
          "Su lema | «Si se puede automatizar, se automatiza.»",
        ].join("\n"),
      },
      { key: "aldo.quote", label: "Aldo – frase", default: "Yo no duermo de noche: reviso que tu página siga en pie." },
    ],
  },
  {
    id: "temporada",
    title: "Temáticas de temporada",
    description: "Decora el sitio según la época: bajo el menú cuelgan adornos (luces de Navidad, banderines, corazones…), Aldo se pone el accesorio de la fecha y caen detalles suaves. Para verlas y activarlas con vista previa usa Panel → Temáticas.",
    fields: [
      {
        key: "theme.mode",
        label: "Temática",
        help: "auto (según la fecha en Colombia) · ninguna · navidad · anionuevo · halloween · amor · patria · madres",
        default: "auto",
      },
      { key: "theme.effects", label: "Detalles que caen: nieve, confeti, corazones (sí / no)", default: "sí" },
    ],
  },
  {
    id: "identidad",
    title: "Página de marca",
    description: "Textos de la página /marca (logo, colores, tipografía y voz de Aldore).",
    fields: [
      { key: "brand.title", label: "Título", help: "Encierra una palabra entre *asteriscos* para resaltarla.", default: "Una marca que *abre puertas*." },
      { key: "brand.text", label: "Introducción", type: "textarea", default: "Todo lo que hace que Aldore se vea y suene como Aldore: el logo, los colores, las letras, a Aldo y nuestra forma de hablar. Úsalo para que cada pieza, de una tarjeta a una publicación, se sienta de la misma casa." },
      { key: "brand.concept", label: "Concepto (frase grande)", type: "textarea", default: "Una A que también es una puerta: la entrada al mundo digital de cada negocio, con una luz encendida adentro." },
    ],
  },
  {
    id: "navidad",
    title: "Árbol de Navidad",
    description: "Sale en Inicio solo cuando está activa la temática de Navidad.",
    fields: [
      { key: "xmas.title", label: "Título", help: "Encierra una palabra entre *asteriscos* para resaltarla.", default: "Ayúdale a Aldo a *decorar el árbol*." },
      { key: "xmas.text", label: "Texto", type: "textarea", default: "Arrastra las bolitas de la repisa a los ganchos del árbol. Aldo también va colgando las suyas. Cuando esté lleno, se enciende la estrella." },
      { key: "xmas.done", label: "Mensaje cuando el árbol queda lleno", default: "¡Quedó precioso! Feliz Navidad de parte de Aldore." },
    ],
  },
  {
    id: "avisos",
    title: "Avisos por correo",
    description: "Se envían cuando alguien escribe desde el sitio. Necesitan la clave RESEND_API_KEY en Cloudflare; sin ella no se envía nada.",
    fields: [
      { key: "notify.email", label: "Correo que recibe los avisos", help: "Puedes poner varios separados por coma. Si lo dejas vacío se usa el correo de contacto.", default: "" },
      { key: "notify.from", label: "Remitente", help: "Debe ser de tu dominio verificado en Resend.", default: "Aldore <avisos@aldore.co>" },
      {
        key: "notify.autoReply",
        label: "Respuesta automática al cliente",
        type: "textarea",
        help: "Se envía a quien llenó el formulario. Déjalo vacío para no enviarla.",
        default: "Hola {nombre}, recibimos tu mensaje y ya lo estamos revisando. Te respondemos en menos de 48 horas hábiles. Si es urgente, escríbenos por WhatsApp.",
      },
    ],
  },
  {
    id: "secciones",
    title: "Títulos de secciones",
    fields: [
      { key: "services.title", label: "Servicios – título", default: "Lo que *hacemos*" },
      {
        key: "services.subtitle",
        label: "Servicios – subtítulo",
        type: "textarea",
        default: "Un mismo equipo para tu software, tu local y tu infraestructura. Puedes contratarnos para uno solo o para todos.",
      },
      { key: "servicesPage.title", label: "Página de servicios – título", default: "Todo lo que hacemos, *explicado sin rodeos*." },
      {
        key: "servicesPage.text",
        label: "Página de servicios – texto",
        type: "textarea",
        default: "Desde una página web hasta la impresión 3D de una pieza. Cada servicio tiene precio claro, tiempos reales y un equipo que te habla en tu idioma, no en jerga técnica.",
      },
      { key: "servicesPage.ctaTitle", label: "Página de servicios – cierre", default: "¿No ves lo que *necesitas*?" },
      { key: "servicesPage.ctaText", label: "Página de servicios – texto de cierre", type: "textarea", default: "Cuéntanos el problema, no la solución. Si se puede resolver con tecnología, te decimos cómo y cuánto cuesta." },
      { key: "blog.title", label: "Blog – título", default: "Tecnología *sin rodeos* para tu negocio." },
      { key: "blog.text", label: "Blog – texto", type: "textarea", default: "Guías cortas y honestas sobre páginas web, chatbots, QR y automatización. Escritas para dueños de negocio, no para programadores." },
      { key: "products.title", label: "Productos – título", default: "Productos *propios*" },
      { key: "products.subtitle", label: "Productos – subtítulo", type: "textarea", default: "Herramientas que construimos, usamos y mantenemos nosotros." },
      { key: "plans.title", label: "Planes – título", default: "Páginas web con precio *cerrado*" },
      { key: "plans.subtitle", label: "Planes – subtítulo", type: "textarea", default: "Sabes cuánto pagas antes de empezar. Hosting, dominio y SSL incluidos el primer año." },
      { key: "process.title", label: "Proceso – título", default: "Sin sorpresas, de principio a fin" },
      {
        key: "process.steps",
        label: "Proceso – pasos (uno por línea, formato: Título | Descripción)",
        type: "textarea",
        default:
          "Llamada inicial | 30 minutos para entender qué necesitas. Si no somos los indicados, te lo decimos.\nPropuesta | En 48 horas recibes alcance, precio y fechas por escrito.\nConstrucción | Cada semana te mostramos avances en un enlace que abres desde el celular.\nEntrega y soporte | Publicamos, capacitamos a tu equipo y seguimos disponibles.",
      },
      { key: "testimonials.title", label: "Testimonios – título", default: "Clientes" },
      { key: "faq.title", label: "Preguntas frecuentes – título", default: "Preguntas *frecuentes*" },
    ],
  },
  {
    id: "tecnologia",
    title: "Tecnología e integraciones",
    description: "Franja de tecnologías bajo la portada, terminal animada y diagrama de integraciones.",
    fields: [
      { key: "tech.title", label: "Título de la franja de tecnologías", default: "Con qué construimos" },
      {
        key: "tech.stack",
        label: "Tecnologías (una por línea)",
        type: "textarea",
        default: "Next.js\nReact\nReact Native\nNode.js\nPython\nPostgreSQL\nDocker\nAWS\nGoogle Cloud\nWhatsApp Business API\nOpenAI\nClaude\nn8n\nREST · Webhooks",
      },
      { key: "integrations.title", label: "Integraciones – título", default: "Tus sistemas, hablando entre sí." },
      {
        key: "integrations.text",
        label: "Integraciones – texto",
        type: "textarea",
        default: "Conectamos lo que ya usas para que un pedido, una factura o un ticket viajen solos de un sistema a otro, sin copiar y pegar.",
      },
      {
        key: "integrations.nodes",
        label: "Integraciones – sistemas del diagrama (uno por línea, máx. 8)",
        type: "textarea",
        default: "ERP\nCRM\nFacturación\nPagos\nWhatsApp\nTienda online\nCastorly\nBI",
      },
    ],
  },
  {
    id: "castorly",
    title: "Sección Castorly",
    description: "Bloque destacado de la portada y página /castorly. Los detalles del producto se editan en Productos.",
    fields: [
      { key: "castorly.badge", label: "Etiqueta", default: "Nuestra app" },
      { key: "castorly.title", label: "Título", default: "Castorly: *calma* en cada llamada" },
      {
        key: "castorly.text",
        label: "Texto",
        type: "textarea",
        default:
          "Castorly es el centro de trabajo para tu Service Desk: llamadas, tickets, base de conocimiento y Cástor, el asistente que te acompaña, todo en un solo lugar.",
      },
      { key: "castorly.cta", label: "Texto del botón", default: "Conocer Castorly" },
      { key: "castorly.url", label: "Enlace a la app", type: "url", default: "https://castorly.co" },
      { key: "castorly.urlLabel", label: "Texto del botón de la app", default: "Ir a castorly.co" },
      { key: "castorly.imageUrl", label: "Captura principal (URL)", type: "url", help: "Puede ser una ruta del sitio como /castorly/panel.png o una URL completa.", default: "/castorly/tickets.webp" },
      { key: "castorly.mascotUrl", label: "Imagen de la mascota (el castor)", type: "url", help: "PNG o SVG con fondo transparente. Aparece junto a la captura.", default: "/castorly/castor-saludando.svg" },
      { key: "castorly.mascotName", label: "Nombre de la mascota", default: "Cástor" },
      { key: "castorly.pageTitle", label: "Título de la página de Castorly", help: "Lo que va entre asteriscos sale con el degradado de Castorly.", default: "Calma en cada llamada. *Con Cástor.*" },
      { key: "castorly.pageChips", label: "Etiquetas de la página de Castorly", type: "textarea", help: "Una por línea.", default: "Llamadas y tickets\nAsistente IA\nHorarios y turnos\nIntegración Webex" },
      { key: "castorly.galleryTitle", label: "Título del carrusel", default: "Así se ve Castorly por dentro" },
      {
        key: "castorly.gallery",
        label: "Galería de capturas",
        type: "textarea",
        help: "Una imagen por línea. Opcional: agrega una descripción después de una barra, por ejemplo /castorly/tickets.png | Bandeja de tickets",
        default: [
          "/castorly/portada.webp | Calma en cada llamada",
          "/castorly/conocimiento.webp | Cástor responde con tu base de conocimiento",
          "/castorly/horarios.webp | Horarios y turnos del equipo",
          "/castorly/meet.webp | Castorly Meet: llama a tu equipo sin salir del portal",
          "/castorly/webex-alertas.webp | Alertas en Webex",
          "/castorly/castor-estados.webp | Conoce a Cástor",
        ].join("\n"),
      },
    ],
  },
  {
    id: "cta",
    title: "Llamado a la acción final",
    fields: [
      { key: "cta.title", label: "Título", default: "Cuéntanos qué *necesitas*" },
      { key: "cta.text", label: "Texto", type: "textarea", default: "Respondemos en menos de 48 horas con una propuesta concreta y sin compromiso." },
    ],
  },
  {
    id: "puerta",
    title: "Puerta by Aldore (QR / NFC)",
    description: "Sección de la portada y página /puerta. Las páginas de cada cliente se crean en Puertas.",
    fields: [
      { key: "puerta.badge", label: "Etiqueta", default: "Nuevo · Puerta by Aldore" },
      { key: "puerta.title", label: "Título", help: "Encierra una palabra entre *asteriscos* para resaltarla.", default: "Tu negocio, a *un toque*." },
      {
        key: "puerta.text",
        label: "Texto",
        type: "textarea",
        default:
          "Un sticker NFC o un código QR en cada mesa, mostrador o vitrina. Tus clientes lo tocan con el celular y ven tu carta, te dejan reseña en Google, te escriben por WhatsApp, se conectan al WiFi y conocen tus medios de pago. Sin descargar nada.",
      },
      {
        key: "puerta.uses",
        label: "Para quién (uno por línea)",
        type: "textarea",
        default: "Restaurantes y cafés\nBares y discotecas\nTiendas y almacenes\nPeluquerías y spas\nConsultorios y clínicas\nHoteles y eventos",
      },
      {
        key: "puerta.steps",
        label: "Cómo funciona (Título | texto, uno por línea)",
        type: "textarea",
        default:
          "Diseñamos tu Puerta | Con tu logo, tus colores y los botones que necesitas.\nLa ponemos en tu local | Te entregamos los QR impresos y los stickers NFC listos para pegar.\nMides y cambias cuando quieras | Ves cuántas personas la abren y cambiamos la carta o los enlaces sin reimprimir nada.",
      },
      {
        key: "puerta.plans",
        label: "Planes (Nombre | precio | nota | incluye; separado; por punto y coma)",
        type: "textarea",
        default:
          "QR | $35.000/mes | + $120.000 de instalación | Página Puerta con tu marca; Hasta 6 botones; QR en alta calidad para imprimir; Cambios ilimitados\nQR + NFC | $49.000/mes | + $250.000 de instalación | Todo lo del plan QR; 10 stickers NFC personalizados; Estadísticas de visitas y toques; Soportes de mesa impresos en 3D con tu marca\nMultisede | $39.000/mes por sede | + desde $400.000 de instalación | Varias sedes o puntos de venta; QR y NFC por mesa o punto; Estadísticas por sede; Soporte prioritario",
      },
      { key: "puerta.plansNote", label: "Nota bajo los planes", default: "¿Pagas el año por adelantado? Te regalamos 2 meses." },
      { key: "puerta.cta", label: "Texto del botón", default: "Quiero mi Puerta" },
      { key: "puerta.demo", label: "Dirección de la Puerta de demostración", type: "url", default: "/p/demo", help: "Crea en Puertas una con la dirección demo para que el botón «Ver demo» funcione." },
    ],
  },
  {
    id: "menu",
    title: "Menú superior",
    description: "Enlaces de la barra de navegación del sitio.",
    fields: [
      {
        key: "nav.items",
        label: "Enlaces del menú",
        type: "textarea",
        help: "Uno por línea con el formato Texto | enlace. Ej: Castorly | /castorly",
        default: "Servicios | /servicios\nCastorly | /castorly\nPuerta | /puerta\nNosotros | /nosotros\nBlog | /blog\nCotizar | /cotizar",
      },
      { key: "nav.cta", label: "Botón destacado – texto", default: "Hablemos" },
      { key: "nav.ctaUrl", label: "Botón destacado – enlace", type: "url", default: "/contacto" },
      { key: "nav.login", label: "Botón de ingreso al panel – texto (vacío = ocultarlo)", default: "Ingresar" },
    ],
  },
  {
    id: "pie",
    title: "Pie de página",
    fields: [
      { key: "footer.cta", label: "Frase grande", default: "¿Tienes un proyecto en mente?" },
      { key: "footer.ctaLink", label: "Texto del enlace de la frase", default: "Escríbenos" },
      { key: "footer.ctaUrl", label: "Enlace de la frase", type: "url", default: "/contacto" },
      { key: "footer.text", label: "Texto bajo el logo", type: "textarea", default: "Estudio de software en Medellín. Páginas web, aplicaciones, chatbots e integraciones para empresas de Latinoamérica." },
      { key: "footer.servicesTitle", label: "Título de la columna de servicios", default: "Servicios", help: "Se muestran las áreas de servicio; cada una lleva a su parte de /servicios." },
      { key: "footer.contactTitle", label: "Título de la columna de contacto", default: "Contacto", help: "Los datos salen de «Datos de contacto y redes»." },
      {
        key: "footer.links",
        label: "Enlaces extra (abajo)",
        type: "textarea",
        help: "Uno por línea: Texto | enlace. Ej: Política de privacidad | /privacidad",
        default: "",
      },
      { key: "footer.copyright", label: "Texto final (junto al ©)", default: "" },
    ],
  },
  {
    id: "cobros",
    title: "Cuentas de cobro y pagos",
    fields: [
      { key: "billing.legalName", label: "Razón social o nombre de quien cobra", default: "Aldore S.A.S." },
      { key: "billing.nit", label: "NIT o cédula", default: "" },
      { key: "billing.address", label: "Dirección para la cuenta de cobro", default: "Medellín, Colombia" },
      { key: "billing.bank", label: "Datos para transferencia (banco, tipo y número de cuenta)", type: "textarea", default: "" },
      { key: "billing.note", label: "Nota al pie de la cuenta de cobro", type: "textarea", default: "Gracias por confiar en nosotros." },
    ],
  },
  {
    id: "agenda",
    title: "Agendar llamada",
    fields: [
      { key: "booking.title", label: "Título de la página /agendar", default: "Agenda una llamada de 30 minutos" },
      { key: "booking.text", label: "Texto bajo el título", type: "textarea", default: "Escoge el día y la hora. Te escuchamos, resolvemos tus dudas y te decimos cómo lo haríamos. Sin costo y sin compromiso." },
      { key: "booking.link", label: "Enlace a la agenda en Inicio y Contacto (vacío = sin enlace)", default: "¿Prefieres hablar? Agenda una llamada" },
    ],
  },
  {
    id: "agendaHorario",
    title: "Horarios de la agenda",
    fields: [
      { key: "booking.days", label: "Días que atiendes (1 = lunes … 7 = domingo)", default: "1,2,3,4,5" },
      { key: "booking.hours", label: "Franjas de atención (hora de Colombia)", default: "09:00-12:00, 14:00-17:00" },
      { key: "booking.slot", label: "Duración de cada llamada (minutos)", default: "30" },
      { key: "booking.ahead", label: "Cuántos días hacia adelante se puede agendar", default: "21" },
      { key: "booking.meet", label: "Enlace fijo de videollamada (Meet, Zoom…). Vacío = te llamamos al celular", type: "url", default: "" },
    ],
  },
  {
    id: "casos",
    title: "Casos de éxito",
    description: "Se ven cuando publiques el primer caso.",
    fields: [
      { key: "cases.title", label: "Título de la sección en Inicio", default: "Resultados que se pueden contar" },
      { key: "cases.pageTitle", label: "Título de la página /casos", default: "Lo que hemos construido" },
      { key: "cases.pageText", label: "Texto de la página /casos", type: "textarea", default: "Cada caso cuenta el reto, lo que hicimos y lo que cambió después. Con números, no con adjetivos." },
      { key: "cases.ctaTitle", label: "Cierre de cada caso – título", default: "¿Quieres algo así para tu negocio?" },
      { key: "cases.ctaText", label: "Cierre de cada caso – texto", type: "textarea", default: "Agenda una llamada de 30 minutos y te decimos cómo lo haríamos." },
    ],
  },
  {
    id: "contacto",
    title: "Datos de contacto y redes",
    fields: [
      { key: "contact.email", label: "Correo", default: "hola@aldore.co" },
      { key: "contact.phone", label: "Teléfono", default: "+57 300 000 0000" },
      { key: "contact.whatsapp", label: "WhatsApp (con indicativo)", default: "+573000000000" },
      { key: "contact.address", label: "Dirección / ciudad", default: "Medellín, Colombia · Trabajo remoto en toda Latam" },
      { key: "contact.hours", label: "Horario", default: "Lunes a viernes, 8:00 a. m. – 6:00 p. m." },
      { key: "aldo.bubble", label: "Mensaje de Aldo junto a su botón (vacío = sin mensaje)", default: "¡Hola! Soy Aldo 🦉 ¿Te ayudo a encontrar lo que necesitas?" },
      { key: "aldo.tips", label: "Otros mensajes que Aldo va rotando en su pestaña", type: "textarea", help: "Uno por línea.", default: "¿Tienes una idea? Te ayudo a cotizarla en un minuto.\nPregúntame lo que quieras sobre Aldore 🦉" },
      {
        key: "aldo.greeting",
        label: "Saludo de Aldo al abrir el chat",
        type: "textarea",
        default: "¡Hola! Soy Aldo, el búho de Aldore 🦉\nTe ayudo a encontrar lo que necesitas y, si quieres, te paso con el equipo por WhatsApp. ¿Qué tienes en mente?",
      },
      { key: "social.instagram", label: "Instagram (URL)", type: "url", default: "" },
      { key: "social.linkedin", label: "LinkedIn (URL)", type: "url", default: "" },
      { key: "social.facebook", label: "Facebook (URL)", type: "url", default: "" },
      { key: "social.x", label: "X / Twitter (URL)", type: "url", default: "" },
    ],
  },
];

export const SETTING_KEYS = new Set(SETTINGS_GROUPS.flatMap((g) => g.fields.map((f) => f.key)));

export type Settings = Record<string, string>;

/** Prefijo de los cambios sin publicar del editor visual (se guardan en la misma tabla Setting). */
export const DRAFT = "draft:";

/** ¿Esta visita es la vista previa del borrador? */
export async function draftMode() {
  try {
    const { headers } = await import("next/headers");
    return (await headers()).get("x-draft") === "1";
  } catch {
    return false;
  }
}

/** Textos que nunca se traducen: datos técnicos o que solo ve el panel. */
const NO_TRANSLATE = /^(notify\.|seo\.keywords|social\.|contact\.(email|phone)|site\.name|seed\.|theme\.(mode|effects))/;

/** Textos del sitio en español, tal como están guardados (lo que usa el panel). */
export async function getRawSettings(): Promise<Settings> {
  const defaults: Settings = {};
  for (const g of SETTINGS_GROUPS) for (const f of g.fields) defaults[f.key] = f.default;
  const rows = await prisma.setting.findMany();
  const drafts: [string, string][] = [];
  for (const r of rows) {
    if (r.key.startsWith(DRAFT)) drafts.push([r.key.slice(DRAFT.length), r.value]);
    else defaults[r.key] = r.value;
  }
  // Vista previa del editor visual: solo un usuario del panel con sesión ve el borrador (lo marca el middleware).
  if (drafts.length && (await draftMode())) for (const [k, v] of drafts) defaults[k] = v;
  return defaults;
}

/** Textos del sitio en el idioma de la visita (en el panel siempre en español). */
export async function getSettings(): Promise<Settings> {
  const raw = await getRawSettings();
  const { lang, tx } = await getT();
  if (lang === "es") return raw;
  const out: Settings = {};
  for (const [k, v] of Object.entries(raw)) out[k] = NO_TRANSLATE.test(k) ? v : tx(v);
  return out;
}
