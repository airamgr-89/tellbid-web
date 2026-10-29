// TellBid build
// - Empaqueta src/css/tb.css -> dist/tb.min.css y src/js/tb.js -> dist/tb.min.js
// - Ensambla src/pages/*.html (con <!-- @include partial -->) en:
//     dist/pages/<pagina>.html  -> fragmento listo para pegar en el elemento «Código» de GHL
//     preview/<pagina>.html     -> documento completo que imita los contenedores de GHL (pruebas locales)
//
// Uso:  node build.mjs            (assets locales, para preview)
//       node build.mjs --prod     (assets desde jsDelivr, versión de package.json)
//       node build.mjs --watch
import * as esbuild from 'esbuild';
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const PROD = args.has('--prod');
const WATCH = args.has('--watch');

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
// Repositorio público de GitHub que sirve jsDelivr: package.json › tellbid.ghRepo (o la variable TB_GH_REPO).
const GH_REPO = process.env.TB_GH_REPO || (pkg.tellbid && pkg.tellbid.ghRepo) || 'OWNER/tellbid-web';
const CDN = `https://cdn.jsdelivr.net/gh/${GH_REPO}@v${pkg.version}`;
const ASSET_PROD = CDN;
const ASSET_LOCAL = '..';

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap">';

const p = (...s) => path.join(ROOT, ...s);

async function buildAssets() {
  await mkdir(p('dist'), { recursive: true });
  await esbuild.build({
    entryPoints: { 'tb.min': p('src/css/tb.css'), 'tb-home.min': p('src/css/home.css') },
    bundle: true,
    minify: true,
    outdir: p('dist'),
    target: ['chrome100', 'safari15', 'firefox100'],
    logLevel: 'warning',
  });
  await esbuild.build({
    entryPoints: [p('src/js/tb.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: p('dist/tb.min.js'),
    target: ['es2019'],
    logLevel: 'warning',
  });
}

async function include(html, depth = 0) {
  if (depth > 6) throw new Error('Includes anidados demasiado profundos');
  const re = /<!--\s*@include\s+([\w./-]+)\s*-->/g;
  let out = '';
  let last = 0;
  for (const m of html.matchAll(re)) {
    out += html.slice(last, m.index);
    const file = p('src/partials', m[1].endsWith('.html') || m[1].endsWith('.svg') ? m[1] : m[1] + '.html');
    if (!existsSync(file)) throw new Error(`Partial no encontrado: ${m[1]}`);
    out += await include(await readFile(file, 'utf8'), depth + 1);
    last = m.index + m[0].length;
  }
  return out + html.slice(last);
}

// Frontmatter al inicio de la página, una clave por línea:
// <!---
// page: home
// css: home
// title: ...
// description: ...
// noindex
// --->
function readMeta(html, name) {
  const m = html.match(/^<!---([\s\S]*?)--->\s*/);
  const meta = { page: name, title: 'TellBid', description: '', noindex: false };
  if (!m) return { meta, body: html };
  for (const part of m[1].split(/\r?\n/)) {
    if (part.trim().startsWith('#')) continue;
    const [k, ...v] = part.split(':');
    const key = k.trim();
    if (!key) continue;
    meta[key] = v.length ? v.join(':').trim() : true;
  }
  return { meta, body: html.slice(m[0].length) };
}

const year = new Date().getFullYear();

function fill(html, asset) {
  return html.replaceAll('{{ASSET}}', asset).replaceAll('{{YEAR}}', String(year)).replaceAll('{{VERSION}}', pkg.version);
}

function fragment(meta, body, asset) {
  return fill(
    `<!-- TellBid · ${meta.page} · v${pkg.version} · Pegar completo en un elemento «Código» de GHL (sección a ancho completo). -->\n` +
      `${FONTS}\n<link rel="stylesheet" href="{{ASSET}}/dist/tb.min.css">\n` +
      (meta.css ? `<link rel="stylesheet" href="{{ASSET}}/dist/tb-${meta.css}.min.css">\n` : '') +
      `<div id="tb-site" data-page="${meta.page}">\n${body.trim()}\n</div>\n` +
      `<script src="{{ASSET}}/dist/tb.min.js" defer></script>\n`,
    asset
  );
}

// Imita la anidación de contenedores de GHL para detectar problemas de ancho/padding.
function previewDoc(meta, frag) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
${meta.noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<style>body{margin:0;font-family:system-ui;background:#fff}.c-code{padding:12px 15px;max-width:1170px;margin:0 auto}</style>
</head>
<body>
<div id="preview-container" class="hl_page-preview--content">
 <div class="fullSection"><div class="inner c-row"><div class="c-column"><div class="c-code">
${frag}
 </div></div></div></div>
</div>
</body>
</html>
`;
}

async function buildPages() {
  const dir = p('src/pages');
  if (!existsSync(dir)) return [];
  await mkdir(p('dist/pages'), { recursive: true });
  await mkdir(p('preview'), { recursive: true });
  const files = (await readdir(dir)).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
  const report = [];
  for (const f of files) {
    const name = f.replace(/\.html$/, '');
    const raw = await readFile(path.join(dir, f), 'utf8');
    const { meta, body } = readMeta(raw, name);
    const assembled = await include(body);
    const prodFrag = fragment(meta, assembled, ASSET_PROD);
    await writeFile(p('dist/pages', f), PROD ? prodFrag : prodFrag, 'utf8');
    await writeFile(p('preview', f), previewDoc(meta, fragment(meta, assembled, ASSET_LOCAL)), 'utf8');
    report.push([f, Buffer.byteLength(prodFrag)]);
  }
  return report;
}

async function sizes() {
  const kb = (n) => (n / 1024).toFixed(1) + ' KB';
  for (const f of ['dist/tb.min.css', 'dist/tb-home.min.css', 'dist/tb.min.js']) {
    if (existsSync(p(f))) console.log(`  ${f.padEnd(26)} ${kb((await stat(p(f))).size)}`);
  }
}

async function run() {
  const t = Date.now();
  await buildAssets();
  const pages = await buildPages();
  console.log(`✓ build (${PROD ? 'prod · ' + CDN : 'local'}) en ${Date.now() - t} ms`);
  await sizes();
  for (const [f, n] of pages) console.log(`  dist/pages/${f.padEnd(15)} ${(n / 1024).toFixed(1)} KB`);
}

await run();

if (WATCH) {
  let timer;
  console.log('… observando src/');
  watch(p('src'), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => run().catch((e) => console.error(e.message)), 120);
  });
}
