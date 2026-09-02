import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PORT = 8777;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  // mimic a static host: "/" serves index.html where one exists
  if (p === '/') p = fs.existsSync(path.join(ROOT, 'index.html'))
    ? '/index.html' : '/The-Bhu.Van-Project-Site.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('not found: ' + p);
  }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream',
    // never cache while iterating, stale CSS wastes a whole debugging cycle
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log('serving ' + ROOT + ' on http://127.0.0.1:' + PORT));
