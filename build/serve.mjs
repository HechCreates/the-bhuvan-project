import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.join(process.cwd(), 'dist');
const PORT = 8777;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  // mimic a static host: a directory serves its index.html, and a bare
  // directory path without the trailing slash redirects to one, which is what
  // GitHub Pages does -- worth reproducing so relative paths break here first
  let f = path.join(ROOT, p);
  /* extensionless path -> foo.html, which is what GitHub Pages does and what
     the old-URL redirect stubs rely on to answer in a single hop */
  if (!path.extname(p) && !fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isDirectory()) {
    if (!p.endsWith('/')) {
      res.writeHead(301, { Location: p + '/' });
      return res.end();
    }
    f = path.join(f, 'index.html');
  }
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    const nf = path.join(ROOT, '404.html');
    if (fs.existsSync(nf)) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return res.end(fs.readFileSync(nf));
    }
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
