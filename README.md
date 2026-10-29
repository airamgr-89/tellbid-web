# TellBid · web principal

Web de [tellbid.io](https://tellbid.io): páginas para el elemento «Código» de GoHighLevel, con un CSS y un JS compartidos que sirve jsDelivr desde este repositorio.

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/css/` | `tokens.css` (paleta y tokens), base, layout, componentes. `tb.css` es la hoja común y `home.css` la de las páginas con animaciones |
| `src/js/` | `tb.js` (entrada), `core.js` y `modules/` (hero animado, workflow, editor, formulario, tabs…) |
| `src/partials/` | Header, footer, sprite de iconos, formulario de diagnóstico y piezas reutilizables |
| `src/pages/` | Una página por archivo. El nombre del archivo es la URL (`servicios.html` → `/servicios`) |
| `dist/` | **Generado.** `tb.min.css`, `tb-home.min.css`, `tb.min.js` y `pages/*.html`, los fragmentos que se pegan en GHL |
| `assets/img/` | Logo e imagen OG |
| `seo/paginas.md` | Título, descripción, canonical e indexación de cada página, para la configuración de GHL |
| `docs/publicar-en-ghl.md` | Paso a paso para publicar y actualizar |

## Comandos

```bash
npm install
npm run build      # genera dist/ y preview/
npm run serve      # vista previa en http://localhost:4321
```

En local el formulario **no envía nada** al webhook: solo muestra el payload en la consola. Para probar un envío real desde local, abre la página con `?tb_send=1`.

## Cada página

Arranca con un bloque de metadatos, una clave por línea:

```html
<!---
page: servicios
css: home          (opcional: añade tb-home.min.css)
title: …
description: …
noindex            (opcional)
--->
<!-- @include header -->
```

`<!-- @include nombre -->` inserta `src/partials/nombre.html`.

## Versiones

Los fragmentos apuntan a una versión fija (`@vX.Y.Z`), así que un cambio nunca rompe las páginas ya publicadas. Los pasos para publicar una versión nueva están en `docs/publicar-en-ghl.md`.
