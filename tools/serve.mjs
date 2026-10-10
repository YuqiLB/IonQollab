// Development-only static file server. The deployed app has no backend.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.md': 'text/plain; charset=utf-8' };
const port = Number(process.env.PORT || 4173);
createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = urlPath === '/' ? 'index.html' : urlPath.slice(1);
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root) || relative.split(/[\\/]/).some(p => p.startsWith('.')) || !types[path.extname(filename)]) throw new Error('Not found');
    const content = await readFile(filename);
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(content);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log('Qrush: http://127.0.0.1:' + port));
