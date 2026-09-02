/* Assemble dist/ from source. This is what Netlify runs, and what a GitHub
   Actions workflow will run when the site moves to its own domain.

   The page is still assembled around src/index.html rather than generated from
   templates end to end: the home and about pages have not been extracted into
   content yet. What IS driven by content/ today gets re-rendered on every
   build, so those parts have exactly one source of truth:

     header + footer   content/site.yml, written into all 11 pages
     (projects and testimonials follow, once their templates are wired in)

   Deliberately NOT part of this build: image resizing and icon generation.
   Those need sharp, they only matter when a source image changes, and making
   every deploy depend on a native binary is a poor trade. The generated files
   are committed; `npm run assets` regenerates them locally when needed.     */

import fs from 'fs';
import path from 'path';
import { header, footer, site } from './templates/chrome.mjs';

const SRC = 'src/index.html';
const DIST = 'dist';
const log = [];
const t0 = Date.now();

/* ---- clean ---- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

/* ---- 1. the page ---- */
let html = fs.readFileSync(SRC, 'utf8');

// which page each chrome block belongs to, so the nav can mark the current one
const marks = [...html.matchAll(/<div (?:id="[^"]*" )?data-page="([^"'+]+)"/g)];
const pageAt = i => { let n = ''; for (const m of marks) { if (m.index <= i) n = m[1]; else break; } return n; };
const currentFor = page => (page === 'about' ? 'about' : '');

const swapBlocks = (open, close, render) => {
  let out = '', i = 0, n = 0;
  for (;;) {
    const a = html.indexOf(open, i);
    if (a < 0) break;
    const b = html.indexOf(close, a) + close.length;
    out += html.slice(i, a) + render(currentFor(pageAt(a)));
    i = b; n++;
  }
  html = out + html.slice(i);
  return n;
};
// the footer is identical everywhere; the header takes the current route
log.push(`header  rendered from content/site.yml into ${swapBlocks('<header class="site-header"', '</header>', header)} pages`);
log.push(`footer  rendered from content/site.yml into ${swapBlocks('<footer class="footer">', '</footer>', () => footer())} pages`);

fs.writeFileSync(path.join(DIST, 'index.html'), html);
log.push(`index.html  ${(html.length / 1024).toFixed(0)} KB`);

/* ---- 2. static passthrough ---- */
const copyDir = (from, to) => {
  let n = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); n += copyDir(a, b); }
    else { fs.copyFileSync(a, b); n++; }
  }
  return n;
};
log.push(`static/   ${copyDir('static', DIST)} files copied`);
fs.mkdirSync(path.join(DIST, 'images'), { recursive: true });
log.push(`images/   ${copyDir('images', path.join(DIST, 'images'))} files copied`);

/* ---- 3. a 404 for hosts without rewrite rules -------------------------------
   Netlify's _redirects turns any unknown path into the app. GitHub Pages has
   no such mechanism, but it does serve 404.html, so shipping the same document
   under that name keeps stray URLs working there too. */
fs.copyFileSync(path.join(DIST, 'index.html'), path.join(DIST, '404.html'));
log.push('404.html  copy of index.html, for hosts without rewrite rules');

/* ---- report ---- */
const size = (function walk(d) {
  let n = 0;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    n += e.isDirectory() ? walk(p) : fs.statSync(p).size;
  }
  return n;
})(DIST);
console.log(log.map(l => '  ' + l).join('\n'));
console.log(`\n  dist/ ${(size / 1048576).toFixed(1)} MB in ${Date.now() - t0}ms`
  + `   nav: ${site.nav.length} entries from content/site.yml`);
