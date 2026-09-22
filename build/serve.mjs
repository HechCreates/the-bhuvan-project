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

/* ---- the admin interface's save endpoint, LOCAL ONLY ----------------------
   This is how /admin/ saves while the site is being worked on: straight to
   the content files on this machine, then regenerate and rebuild, so the
   change is visible in the preview a second later.

   There is deliberately no authentication here, and there must never be:
   this server binds to 127.0.0.1 and exists only on a developer's laptop.
   In production the same requests go to a service that checks who is asking
   and commits to the repository instead. The editor sends identical payloads
   to both, so the difference is one URL.                                   */
const applyChanges = async body => {
  const { readYaml, writeYaml, set, fileFor } = await import('./content-io.mjs');
  const { changes = [], images = [] } = body;
  const touched = new Set();

  /* images first: a caption change and a photograph swap can arrive together,
     and the file write below should see the new filename */
  for (const im of images) {
    if (!/^[\w.-]+$/.test(im.filename)) throw new Error(`unsafe filename: ${im.filename}`);
    const dir = path.join(process.cwd(), im.dir);
    if (!dir.startsWith(path.join(process.cwd(), 'images'))) throw new Error('images only');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, im.filename), Buffer.from(im.base64, 'base64'));
  }

  for (const c of changes) {
    const file = fileFor(c.scope);
    const { data } = readYaml(file);
    set(data, c.path, c.value);
    writeYaml(file, data);
    touched.add(file);
  }

  const { execFileSync } = await import('child_process');
  execFileSync(process.execPath, ['build/gen-pages.mjs'], { stdio: 'pipe' });
  execFileSync(process.execPath, ['build/build.mjs'], { stdio: 'pipe' });
  return { ok: true, files: [...touched], images: images.length };
};

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.split('?')[0] === '/__save') {
    let raw = '';
    req.on('data', d => { raw += d; if (raw.length > 40e6) req.destroy(); });
    req.on('end', async () => {
      try {
        const out = await applyChanges(JSON.parse(raw));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

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
