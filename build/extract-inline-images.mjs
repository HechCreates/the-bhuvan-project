/* Move the 80 inline base64 images out of the HTML into real files.

   This is the first step of the CMS work: an image the client can replace has
   to BE a file. It also pays for itself immediately, because base64 costs a
   third in encoding overhead and the same picture is repeated wherever it is
   used -- the brand logo alone is inlined 22 times, once per cloned header and
   footer. 80 uses collapse to 36 files.

   Names are derived from what each image actually is, so the CMS shows the
   client "practice-ecological-restoration.webp", not a hash.                */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const FILE = 'The-Bhu.Van-Project-Site.html';
const IMG = 'images';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;

const marks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([^"'+]+)"/g)];
const pageAt = i => { let n = 'chrome'; for (const m of marks) { if (m.index <= i) n = m[1]; else break; } return n; };
const STOP = new Set(['a', 'an', 'the', 'of', 'in', 'at', 'on', 'and', 'with', 'its']);
const slug = t => t.toLowerCase().replace(/&[a-z]+;/g, ' ').replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '').split('-').filter(w => w && !STOP.has(w)).slice(0, 3).join('-');

/* ---- pass 1: collect every occurrence, dedupe by content ---- */
const RE = /<img([^>]*?)src="data:image\/([a-z+]+);base64,([^"]+)"([^>]*)>/g;
const uniq = new Map();
const hits = [];
for (const m of s.matchAll(RE)) {
  const [full, pre, fmt, b64, post] = m;
  const buf = Buffer.from(b64, 'base64');
  const sha = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const attrs = pre + post;
  const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
  const alt = (attrs.match(/alt="([^"]*)"/) || [])[1] || '';
  const back = s.slice(Math.max(0, m.index - 1800), m.index);
  const near = [...back.matchAll(/class="([^"]+)"/g)].slice(-4).map(x => x[1]).join(' ');
  // the markup already names these: data-practice="..." on a practice block and
  // the project href on a homepage plate
  const practice = [...back.matchAll(/data-practice="([^"]+)"/g)].slice(-1).map(x => x[1])[0] || '';
  const project = [...back.matchAll(/data-route="p-([^"]+)"/g)].slice(-1).map(x => x[1])[0] || '';
  const head = '';
  hits.push({ full, sha, page: pageAt(m.index) });
  if (!uniq.has(sha)) uniq.set(sha, { sha, fmt, buf, cls, alt, near, practice, project, page: pageAt(m.index) });
}

/* ---- pass 2: give each unique image a name ---- */
const used = new Set();
const nameFor = r => {
  const ext = r.fmt === 'jpeg' ? 'jpg' : r.fmt;
  let p;
  if (/hero-img/.test(r.cls)) p = 'site/hero';
  else if (/brand-logo/.test(r.cls)) p = 'site/logo';
  else if (/Partner or collaborator logo (\d+)/.test(r.alt))
    p = 'partners/' + String(r.alt.match(/(\d+)/)[1]).padStart(2, '0');
  else if (/practice-media/.test(r.near)) p = 'home/practice-' + (r.practice || 'panel');
  else if (/plate-media/.test(r.near)) p = 'home/plate-' + (r.project || slug(r.alt) || 'card');
  else if (/about-figure/.test(r.near)) p = 'home/about-map';
  else p = (r.page === 'about' ? 'about/' : 'home/') + (slug(r.alt) || 'image');
  let name = `${p}.${ext}`, n = 2;
  while (used.has(name)) name = `${p}-${n++}.${ext}`;
  used.add(name);
  return name;
};
for (const r of uniq.values()) r.name = nameFor(r);

/* ---- pass 3: write files, rewrite the HTML ---- */
for (const r of uniq.values()) {
  const dest = path.join(IMG, r.name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, r.buf);
}
let rewritten = 0;
s = s.replace(RE, (full, pre, fmt, b64, post) => {
  const sha = crypto.createHash('sha1').update(Buffer.from(b64, 'base64')).digest('hex').slice(0, 10);
  const r = uniq.get(sha);
  rewritten++;
  let tag = `<img${pre}src="${IMG}/${r.name}"${post}>`;
  // the hero is the largest-contentful paint; as a file it now needs telling
  // the browser to fetch it early, which an inline image never needed
  if (/hero-img/.test(pre + post) && !/fetchpriority/.test(tag))
    tag = tag.replace('<img', '<img fetchpriority="high" decoding="async"');
  return tag;
});

fs.writeFileSync(FILE, s);

/* ---- report ---- */
const bytes = [...uniq.values()].reduce((t, r) => t + r.buf.length, 0);
console.log(`${hits.length} inline uses -> ${uniq.size} files`);
console.log(`HTML ${(before / 1048576).toFixed(2)} MB -> ${(s.length / 1048576).toFixed(2)} MB`
  + `   (${((1 - s.length / before) * 100).toFixed(0)}% smaller)`);
console.log(`images written: ${(bytes / 1048576).toFixed(2)} MB across ${uniq.size} files\n`);
const byDir = {};
for (const r of uniq.values()) {
  const d = path.dirname(r.name);
  (byDir[d] ||= []).push(`${path.basename(r.name)} (${(r.buf.length / 1024).toFixed(0)}k)`);
}
for (const [d, list] of Object.entries(byDir).sort()) {
  console.log(`  ${IMG}/${d}/  ${list.length} file(s)`);
  for (const f of list.sort()) console.log('      ' + f);
}
