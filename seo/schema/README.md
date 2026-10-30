# Schema markup (JSON-LD) por página, para GHL

Cada archivo trae el bloque `<script type="application/ld+json">` completo y listo para pegar.

**Dónde se pega:** GHL › página › **Settings › Custom code / Tracking code › Head**. Copia el archivo entero, con las etiquetas `<script>` incluidas.

| Archivo | Página | Tipos |
|---|---|---|
| home.html | `/` (hoy `/inicio`) | Organization, ProfessionalService + OfferCatalog, WebSite, WebPage, FAQPage |
| soluciones.html | `/soluciones` | Organization, WebSite, WebPage, BreadcrumbList, ItemList (7 soluciones) |
| servicios.html | `/servicios` | Organization, WebSite, WebPage, BreadcrumbList, 4 × Service (CRM con planes $99 / $187 / $347) |
| software-a-la-medida.html | `/software-a-la-medida` | Organization, WebSite, WebPage, BreadcrumbList, Service + OfferCatalog |
| nosotros.html | `/nosotros` | Organization, WebSite, AboutPage, BreadcrumbList |
| contact.html | `/contact` | Organization, WebSite, ContactPage, BreadcrumbList |
| diagnostico.html | `/diagnostico` | Organization, WebSite, WebPage + ReserveAction, BreadcrumbList |

`/soporte`, `/privacy-policy` y `/terms-of-service` llevan `noindex`, así que no necesitan schema.

## Reglas

- Cada página es autocontenida: repite Organization y WebSite con el mismo `@id`, y Google los fusiona.
- **Esta carpeta es el único sitio del JSON-LD.** Los fragmentos de `dist/pages/` ya no lo incluyen. Los fragmentos viejos que sigan pegados en GHL sí lo traen: vuelve a pegar el fragmento nuevo de cada página a la vez que pegas su schema en el Head. Si no, la home tendrá dos `FAQPage` y Search Console marcará error.
- No se incluyen reseñas ni valoraciones (`Review`, `AggregateRating`): Google no muestra reseñas que una empresa publica sobre sí misma.
- Valida cada página publicada en https://validator.schema.org y en https://search.google.com/test/rich-results.

## Pendiente

- `sameAs`: URLs reales de redes sociales (hoy vacío).
- `logo`: confirmar la URL pública del logo (hoy `https://tellbid.io/logo.png`, sin verificar). Lo ideal es subir el logo a la biblioteca de medios de GHL y poner esa URL.
- Si la home sigue en `/inicio`, el canonical y estas URLs apuntan a `https://tellbid.io/`: deja así la home como página principal del dominio.
