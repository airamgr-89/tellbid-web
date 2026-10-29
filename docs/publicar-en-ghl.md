# Publicar la web en GHL

## 1. Una sola vez: configuración del sitio

En **Sites › Websites › (sitio de tellbid.io) › Settings**:

1. **Tracking Code › Header**: pega esto para que el diseño cargue sin parpadeo:
   ```html
   <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   ```
   El código de seguimiento de GHL (`external-tracking.js`, id `tk_3d33d4cf183b48ebb43f1fdeae0c927d`) se queda como está.
2. **Idioma**: confirma que el sitio publique `<html lang="es">`. Si GHL deja `en`, cámbialo en la configuración del sitio.
3. **URL Redirects**: `/demo` → `/diagnostico`, permanente (301).
4. **Favicon**: el de TellBid.

## 2. Por cada página

| URL en GHL | Archivo que se pega |
|---|---|
| `/` (home) | `dist/pages/home.html` |
| `/soluciones` | `dist/pages/soluciones.html` |
| `/servicios` | `dist/pages/servicios.html` |
| `/software-a-la-medida` | `dist/pages/software-a-la-medida.html` |
| `/nosotros` | `dist/pages/nosotros.html` |
| `/contact` | `dist/pages/contact.html` |
| `/diagnostico` | `dist/pages/diagnostico.html` |
| `/soporte` | `dist/pages/soporte.html` |
| `/privacy-policy` | `dist/pages/privacy-policy.html` |
| `/terms-of-service` | `dist/pages/terms-of-service.html` |

En cada página:

1. Deja **una sola sección** a ancho completo, con una fila y una columna, y quita el header y el footer de GHL. El header y el footer ya vienen en el fragmento.
2. Agrega un elemento **Code (Código)** y pega el archivo completo de `dist/pages/`.
3. En **Page settings › SEO meta data**, copia el título, la descripción, el canonical y la imagen OG de `seo/paginas.md`.
4. En `/soporte`, `/privacy-policy` y `/terms-of-service`, marca **noindex**. El fragmento no lo agrega por su cuenta.
5. Guarda y abre la vista previa. Si queda un margen blanco alrededor, el script ya quita el padding de los contenedores de GHL. Revisa que la sección no tenga un ancho máximo fijo en sus ajustes.

## 3. Formulario de diagnóstico: campos nuevos

El formulario sigue enviando al mismo webhook entrante, `…/hooks/356V1gJOBVlJPx16a8iv/webhook-trigger/7cb8d76c-…`. En el workflow de GHL, mapea estos campos nuevos además de los que ya tenías:

| Campo | Ejemplo |
|---|---|
| `necesidades` | Software a la medida o integraciones, Marketing y publicidad |
| `sector` | Seguros y finanzas |
| `tamano_equipo` | 3-10 |
| `inversion` | $1,000 - $3,000 |
| `urgencia` | Este mes |
| `proyecto` | (texto libre, solo si eligió software) |
| `tags` | web-diagnostico, califica, interes-software… |

- Se siguen enviando: `first_name`, `last_name`, `full_name`, `email`, `phone` (E.164), `website`, `lead_score`, `calificacion`, `source` (`web-tellbid`), `cta_origen`, `page_url`, `submitted_at` y las UTM/gclid/fbclid/ttclid.
- Etiquetas por línea de servicio: `interes-crm`, `interes-automatizacion`, `interes-software`, `interes-marketing` e `interes-asesoria`. Úsalas para enviar cada lead a su pipeline.
- Califica con puntaje de 30 o más. Quien califica ve el calendario `3dc6GJoakmLjvIZRJ7QV` con sus datos ya cargados.

**Prueba:** después de publicar, envía el formulario una vez con un email tuyo y confirma en GHL que el contacto llegó con sus campos y etiquetas.

## 4. Actualizar el diseño (nueva versión)

1. Haz los cambios en `src/` y sube la versión en `package.json` (por ejemplo `1.0.1`).
2. Ejecuta `npm run build`.
3. Haz commit, crea el tag (`git tag v1.0.1`) y súbelo (`git push && git push --tags`).
4. Vuelve a pegar en GHL los fragmentos de las páginas que cambiaron. Cada fragmento apunta a su versión, así que las páginas que no toques siguen funcionando con la anterior.

Si solo cambió texto de una página, no hace falta versión nueva: edita `src/pages/…`, ejecuta `npm run build` y pega de nuevo ese fragmento.

## 5. Verificación después de publicar

- [ ] Cada URL carga sin margen blanco y sin errores en la consola.
- [ ] El menú móvil abre y cierra, y el desplegable de Soluciones funciona.
- [ ] El envío de prueba del formulario llega a GHL y se muestra el calendario.
- [ ] `/soporte` muestra su calendario (`PsE5UCshOe8gZU2JkWwn`).
- [ ] `/demo` redirige a `/diagnostico` con un solo salto.
- [ ] Soporte y las legales tienen `noindex` en el código fuente de la página publicada.
- [ ] El sitemap de GHL no incluye Soporte ni las legales.
- [ ] Rich Results Test de la home: Organization, ProfessionalService y FAQPage válidos.
- [ ] PageSpeed Insights en móvil de la home y de Diagnóstico.
