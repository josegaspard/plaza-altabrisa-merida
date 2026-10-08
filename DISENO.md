# Diseño — Plaza Altabrisa Mérida

Identidad: «Luz de Yucatán». Blanco limpio y fotografía grande de la plaza; el azul profundo manda (titulares, texto, pie); amarillo y rosa del logo solo como acentos pequeños (un botón, trazos de 2-3 px, el subrayado del menú). Sin bloques ni formas decorativas grandes. El único bloque de color es el panel «Cómo llegar» de la portada (azul del logo, texto blanco, filete y botón amarillos) y el pie en azul profundo.

## Fuentes (Google Fonts, ya en el HEAD de `_shell.html`)
- Titulares: **Red Hat Display** 400–600 (`--ff-titulo`). Texto: **Red Hat Text** 400–600 (`--ff-texto`). Ninguna otra.

## Tokens (`css/site.css`, `:root`)
- Logo: `--azul #274fa6` (principal), `--azul-900` (pie), `--sol #f8b800`, `--sol-2 #f8c000`, `--ocre #986018` (sombra de botón), `--rosa #dd3e9c`.
- Tintes claros: `--azul-50`, `--azul-100`, `--sol-50`, `--rosa-50` (fondos de iconos y etiquetas).
- Rosa del logo: acento fijo y discreto (subrayado del enlace activo del menú, iconos de lugar); nunca en fondos grandes.
- Titulares (h1–h4, `.hero-title`, `.page-title`) en `--azul-700`: azul que se lee azul, no casi negro.
- Neutros: `--tinta`, `--texto`, `--gris #5a6680` (contraste AA sobre blanco: contadores, nombres de marca), `--linea`, `--fondo #fff`, `--fondo-2` (azul muy claro, NUNCA crema).
- Familias: `--f-compras` azul · `--f-gastronomia` sol · `--f-entretenimiento` rosa · `--f-servicios` ocre. Clases `.fam-compras` etc. definen `--fam`.
- Radios `--r-s 8` · `--r-m 12` (fotos del hero y de Accesos, panel «Cómo llegar») · `--r-l 14` (nunca píldora). Sombras `--sh-1`, `--sh-2`, `--sh-btn`.
- Medidas `--gutter`, `--section`, `--maxw 1240`, `--hdr` (alto de cabecera; el body ya lo compensa).

## Esqueleto de cada página
1. `<head>`: PRIMERO `<meta charset>` y `viewport` (las 2 primeras líneas del bloque HEAD de `_shell.html`), luego title, description, canonical, og:* propios y el resto del bloque HEAD tal cual. Las `meta` description/og:description NO llevan `data-cc` (la descripción completa es demasiado larga para una meta).
2. CABECERA de `_shell.html` tal cual; pon `aria-current="page"` en tu enlace (en `.nav` y en `.mob-panel`).
3. `<main id="main">` empezando por el hero interno:
```html
<section class="page-hero"><div class="page-hero-box"><div class="container">
  <p class="page-crumb"><a href="index.html">Inicio</a> / Directorio</p>
  <h1 class="page-title">Directorio</h1>
  <p class="page-lead">(opcional, solo texto funcional o de la fuente)</p>
</div></div></section>
```
4. Secciones: `<section class="section">` (+ `.section-alt` para fondo azul claro) con `.container`. Encabezado: `.section-head` > `p.kicker` (opcional) + `h2.h2`. Kicker y h2 = rotulación funcional (Accesos, Cómo llegar, Directorio…), nada de frases de marketing («Explora», «Visítanos»). Un kicker nunca es el único título: si no hay h2 visible, `h2.sr-only` + `p.kicker aria-hidden`. Sin padding inferior: `.section.section-tight`.
5. PIE de `_shell.html` tal cual, luego `<script>const STORES = [...];</script>` (una línea) y `<script src="Scripts/site.js" defer></script>`.

## Componentes y clases
- Botones: `.btn` + `.btn-sol` (acción principal) / `.btn-azul` / `.btn-line` / `.btn-blanco` (sobre azul). Enlace con flecha: `.link-arrow`.
- Directorio (lo pinta `site.js` solo): `<div class="dir-bar"><div class="tabs" id="dirTabs"></div><label class="search"><span class="sr-only">Buscar tienda</span><input id="dirSearch" type="search" placeholder="Buscar tienda" autocomplete="off"></label></div><p class="dir-count" id="dirCount"></p><div class="store-grid" id="dirGrid"></div>`. Pestañas, contador, tarjetas, modal y `?cat=` / `?tienda=` funcionan sin más código.
- Modal de tienda: `openStore(nombre)` / `closeStore()` (lo crea el JS). `findStore()`, `familiaDe(giro)`, `famClass()`, `norm()` y `GIRO_FAMILIA` son globales.
- Mapa: reutiliza `.tabs/.tab` para niveles, `.legend` con `<span class="fam-compras"><i></i>Compras</span>`, colores `var(--f-…)`; clic en local → `openStore(nombre)` o `directorio.html?tienda=`.
- Eventos: marcado EXACTO del contrato (`.pub-section`, `.pub-h2`, `.pub-grid`, `.e-card`…); `openPub()` y el lightbox con flechas ya están en `site.js` (recorren `const EVENTS`). Sin publicaciones: `<div class="pub-empty"><p>…</p></div>` dentro de `.pub-grid`.
- Formulario: `.form-card` > `.form-grid` > `.field` (input/textarea con placeholder + aria-label), `.form-row` (2 columnas), `.check`, `.form-msg.ok/.err`. Renta de locales: `.rent-card` (solo borde).
- Datos con iconos: `.fact` (ver index) o `.visit-row`. Redes: `.social`.
- Hero interno con foto: `.page-hero-box.has-media` > `.container` > `.page-hero-text` + `.page-hero-media` (una imagen `images/home/slot-N.jpg` con `<img>` en el HTML). Foto sin velos ni degradados encima.
- Accesibilidad: zonas de toque ≥ 44 px (enlaces sueltos con `display:inline-flex; min-height:44px`). Modal, lightbox y menú móvil ya atrapan el foco y ponen `inert` al fondo (site.js). Pestañas del directorio = botones con `aria-pressed` (no `role=tab`).
- La clase `.rv` ya no oculta nada (se quitó la aparición al hacer scroll: dejaba secciones invisibles sin JS o en capturas de página entera). Puede quedarse en el HTML sin efecto.
- Marcas (portada `.brand-grid` y directorio `.store-grid`): misma rejilla de filetes finos, sin cajas, sombras ni puntos de color; nombre centrado en 13 px con interletra .04em. La familia solo se ve como texto (chip del modal) y en el mapa.
- Portada: foto del hero alineada al contenedor (1240 px) con radio 12; datos de «La plaza» a 18 px; en ≤480 px los botones del hero van apilados a ancho completo (48 px).
- Accesos: toda la tarjeta es el enlace; la foto hace zoom 1.03 al pasar el ratón; rótulo 19 px peso medio; flecha de 44 px.
- Chip de familia: `<span class="chip fam-gastronomia">Gastronomía</span>`.

## Reglas
- CSS propio en `css/<pagina>.css`, JS propio en `Scripts/<pagina>.js`. `site.css`, `site.js` y `_shell.html` son comunes: cualquier cambio vale para las 5 páginas y el 404.
- Solo colores por token; nada de hex nuevos ni gradientes (solo la máscara de fundido de las pestañas del directorio en móvil). Radios 8–16. Nada de `style="…"` en el HTML ni en el JS: clase en el CSS.
- Títulos del pie: `h2` (estilo de rótulo); el CSS acepta h3 por compatibilidad.
- Prohibido: cursivas en titulares, rótulos numerados «01/02», monospace, botones píldora, comillas decorativas, © o año en el pie, filtros extra en el directorio, texto inventado (copy = cc.json / web viva o rotulación funcional).
- Marcas `data-cc` del contrato donde aparezcan datos de la plaza. Teléfono: `<a data-cc="telefono" href="tel:9991679719">999 167 9719</a>` (Mérida tiene un solo teléfono; `telefono2` va vacío en el pie y se oculta solo).
- Imágenes: no hay originales de más de 1600×900 (carrusel vivo) ni logo de más de 250 px; no se suben de resolución. El hero y las cajas de página interna se limitan a 1600 px de ancho. Logo a 60 px (48 en móvil). Logos de tiendas en `images/locatarios/<idCatLocatario>.<ext>`.
- Imágenes `.jpg/.webp` optimizadas, `loading="lazy"` fuera del primer pantallazo, `width/height` puestos. Rutas siempre relativas.
- Probar a 320, 390, 768, 1440 y 1920: sin scroll horizontal y 0 errores de consola.
