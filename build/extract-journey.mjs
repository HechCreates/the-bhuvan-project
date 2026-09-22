/* Read the Visual Journey page out of src/index.html into content/journey.yml.

   The file already held the five categories, which photograph belongs to
   which, and every caption -- but nothing read it, so it was a copy rather
   than a source. This rewrites it from the markup, so the two are known to
   agree before anything starts generating from it.

   Adds the page's own copy, which was only ever in the HTML: the heading,
   the two opening paragraphs and the "View More" label.

   Picks are stored as filenames. Their alt text is not stored, because it is
   derived -- a photograph with a caption uses it, one without falls back to
   the category name -- and storing a derived value is how it comes to
   disagree with what it was derived from.                                  */

import fs from 'fs';
import { dump } from 'js-yaml';

const SRC = 'src/index.html';
const OUT = 'content/journey.yml';
const s = fs.readFileSync(SRC, 'utf8');

const all = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
const at = all.findIndex(m => m[1] === 'journey');
if (at < 0) { console.error('FAIL: no journey page'); process.exit(1); }
const seg = s.slice(all[at].index, at + 1 < all.length ? all[at + 1].index : s.indexOf('<script>', all[at].index));

const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1; };
const one = (re, what) => {
  const m = seg.match(re);
  if (!m) { fail(what); return null; }
  return m[1];
};

/* ---- the page's own copy ---- */
const title = one(/<h1 class="vj-h1"[^>]*>([\s\S]*?)<\/h1>/, 'page heading');
const ledeBlock = one(/<div class="vj-lede">([\s\S]*?)<\/div>/, 'page lede');
const lede = [...(ledeBlock || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[1].replace(/\s+/g, ' ').trim());
const moreLabel = one(/<button type="button" class="vj-more" data-open-journey="[^"]*">\s*<span>([\s\S]*?)<\/span>/, '"View More" label');

/* ---- the blocks on the page: title, key and four picks ---- */
const blocks = [...seg.matchAll(/<article class="vj-block" data-reveal>\s*<h2 class="vj-title"[^>]*>([\s\S]*?)<\/h2>\s*<div class="vj-mosaic">([\s\S]*?)<button type="button" class="vj-more" data-open-journey="([a-z-]+)"/g)];

/* ---- the popups: every photograph, in order, with its caption ---- */
const modals = [...seg.matchAll(/<div class="modal vj-modal" data-journey-modal="([a-z-]+)"[\s\S]*?<div class="vj-collage">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g)];

if (blocks.length !== 5 || modals.length !== 5) {
  fail(`expected 5 blocks and 5 popups, found ${blocks.length} and ${modals.length}`);
}

const categories = [];
for (const b of blocks) {
  const key = b[3];
  const picks = [...b[2].matchAll(/<div class="vj-cell vj-cell-\d"><img src="images\/journey\/([^"]+)"/g)].map(m => m[1]);
  if (picks.length !== 4) fail(`${key}: expected 4 picks, found ${picks.length}`);

  const modal = modals.find(m => m[1] === key);
  if (!modal) { fail(`${key}: no popup`); continue; }

  const photos = [...modal[2].matchAll(
    /<figure class="vj-shot"><button type="button" class="vj-zoom" data-open-shot="images\/journey\/([^"]+)"><img src="images\/journey\/[^"]+" loading="lazy" decoding="async" alt="([^"]*)"[^>]*><\/button>\s*(?:<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g,
  )].map(m => ({ file: m[1], caption: (m[3] ?? '').trim() }));

  if (!photos.length) fail(`${key}: no photographs parsed`);
  categories.push({ key, title: b[1].trim(), picks, photos });
}

if (process.exitCode) { console.error('\nNothing written.'); process.exit(1); }

const total = categories.reduce((n, c) => n + c.photos.length, 0);
if (total !== 214) fail(`expected 214 photographs, parsed ${total}`);
if (process.exitCode) { console.error('\nNothing written.'); process.exit(1); }

fs.writeFileSync(OUT,
  '# The Visual Journey: five categories, 214 photographs.\n'
  + '#\n'
  + '# Generated from the live markup by build/extract-journey.mjs and from now\n'
  + '# on the source of truth for the page; build/gen-pages.mjs renders it back.\n'
  + '#\n'
  + '# An EMPTY CAPTION is meaningful: it means the photograph shows no caption,\n'
  + '# and its alt text falls back to the category name. Give it a caption and a\n'
  + '# line appears under the photograph and its alt text improves at once.\n'
  + '#\n'
  + '# `picks` are the four photographs shown on the page itself, by filename.\n'
  + '# Counts and alt text are derived, never stored -- a stored copy is how a\n'
  + '# number comes to disagree with the thing it counts.\n\n'
  + dump({ page: { title, lede, moreLabel }, categories }, { lineWidth: 100, noRefs: true }));

console.log(`  page: "${title}", ${lede.length} paragraphs`);
for (const c of categories) {
  const caps = c.photos.filter(p => p.caption).length;
  console.log(`  ${c.key.padEnd(15)} ${String(c.photos.length).padStart(3)} photographs, ${String(caps).padStart(3)} captioned, ${c.picks.length} picks`);
}
console.log(`\n${total} photographs written to ${OUT}`);
