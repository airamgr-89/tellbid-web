# Hoja SEO por página (para GHL › Page settings › SEO meta data)

GHL controla el `<head>`, así que estos valores se copian en la configuración de cada página. El JSON-LD ya va dentro de cada fragmento.
Imagen OG por defecto: `assets/img/og-tellbid.jpg` (1200×630). Súbela a la biblioteca de medios de GHL y usa esa URL.
Idioma: `es`. Para cada página, usa el canonical de la tabla.

| Página (URL) | Title (≤60) | Meta description (≤155) | Canonical | Indexar |
|---|---|---|---|---|
| `/` | TellBid \| Automatización, CRM y software para tu empresa | Implementamos tu CRM, automatizamos ventas, atención y marketing, y desarrollamos software a la medida. Tu Growth Partner en español. | https://tellbid.io/ | Sí |
| `/soluciones` | Soluciones de automatización y CRM para tu empresa \| TellBid | Atiende 24/7 con IA, llena tu agenda, controla tus ventas, capta prospectos y cuida tu reputación. Lo implementamos por ti. | https://tellbid.io/soluciones | Sí |
| `/servicios` | Servicios de CRM, automatización y software \| TellBid | Implementamos y gestionamos tu CRM, automatizamos tus procesos, desarrollamos software a la medida y hacemos tu marketing. Un solo equipo. | https://tellbid.io/servicios | Sí |
| `/software-a-la-medida` | Desarrollo de software a la medida e integraciones \| TellBid | Apps, portales, integraciones con APIs y herramientas internas conectadas a tu CRM. Desarrollo a la medida para empresas que quieren escalar. | https://tellbid.io/software-a-la-medida | Sí |
| `/nosotros` | Nosotros: tu Growth Partner tecnológico \| TellBid | Somos TellBid, una agencia de automatización y desarrollo de software para empresas hispanas en EE. UU. y Latinoamérica. | https://tellbid.io/nosotros | Sí |
| `/contact` | Contacto | TellBid | Agenda tu diagnóstico gratis, llámanos o escríbenos por WhatsApp. Te atendemos en español desde EE. UU. y Latinoamérica. | https://tellbid.io/contact | Sí |
| `/diagnostico` | Agenda tu diagnóstico gratis | TellBid | Responde 4 preguntas y agenda 30 minutos con un especialista. Te mostramos qué puedes automatizar en tu empresa y cuánto cuesta. | https://tellbid.io/diagnostico | Sí |
| `/soporte` | Soporte e implementación para clientes | TellBid | Agenda tu sesión de soporte o implementación con el equipo de TellBid. | https://tellbid.io/soporte | **No** (noindex) |
| `/privacy-policy` | Privacy Policy | TellBid | How TELLBID LLC collects, uses, shares and protects personal information. | https://tellbid.io/privacy-policy | **No** (noindex) |
| `/terms-of-service` | Terms of Service | TellBid | Terms that govern the use of TellBid services, websites and messaging programs. | https://tellbid.io/terms-of-service | **No** (noindex) |

## Redirecciones (GHL › Settings › URL Redirects)
- `/demo` → `/diagnostico` (301)

## OG / redes (igual para todas, cambiando título y descripción)
- `og:type`: website · `og:locale`: es_US · `og:site_name`: TellBid
- `og:title` / `og:description`: los de la tabla
- `og:image`: URL de la imagen OG en GHL · `twitter:card`: summary_large_image

## Pendiente
- `sameAs` del JSON-LD de la home: URLs reales de redes sociales.
- `logo` del JSON-LD: confirmar la URL pública del logo (hoy `https://tellbid.io/logo.png`).
