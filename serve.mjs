// Servidor estático mínimo para revisar /preview en local (sin dependencias).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.json': 'application/json', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

http
  .createServer(async (req, res) => {
    try {
      let url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (url === '/') url = '/preview/index.html';
      const file = path.normalize(path.join(ROOT, url));
      if (!file.startsWith(ROOT)) throw new Error('fuera de raíz');
      let target = file;
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
  })
  .listen(PORT, () => console.log(`TellBid preview → http://localhost:${PORT}/`));
