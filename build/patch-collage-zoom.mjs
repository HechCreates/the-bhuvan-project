/* A subtle hover zoom on every project-page photograph, matching the
   homepage project cards.

   The image needs a clipping box of its own: .cfig also holds the caption, so
   overflow:hidden there would let a scaled image grow over the caption text.
   The span carries no size of its own, so the layout is unchanged.         */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
let failed = 0;

/* ---- 1. one clipping span per figure ------------------------------------- */
const RE = /(<figure class="cfig"[^>]*>\s*)(<img [^>]*>)/g;
const n = [...s.matchAll(RE)].length;
const figures = [...s.matchAll(/<figure class="cfig"/g)].length;

if (n !== figures) {
  console.log(`FAIL  matched ${n} images across ${figures} figures`);
  process.exitCode = 1;
} else {
  s = s.replace(RE, (m, open, img) => `${open}<span class="czoom">${img}</span>`);
  console.log(`ok    wrapped ${n} collage images`);
}

/* ---- 2. the zoom ---------------------------------------------------------
   Easing and duration are the homepage plate's. The scale is the smaller
   1.04 the projects-index cards use: at 6% a full-bleed collage image travels
   far enough to stop reading as subtle. */
const CSS = `
/* ---------- Collage hover zoom ---------- */
.czoom{display:block;overflow:hidden}
.cfig img{transition:transform .6s cubic-bezier(.22,.61,.36,1)}
.cfig:hover img{transform:scale(1.04)}
`;
const anchor = `.ccap{padding:.6rem .2rem 0;`;
if (s.split(anchor).length - 1 !== 1) { console.log('FAIL  ccap anchor'); failed++; }
else { s = s.replace(anchor, CSS.trimStart() + anchor); console.log('ok    zoom css'); }

/* ---- 3. balance check ---------------------------------------------------- */
const open = (s.match(/<span\b/g) || []).length;
const close = (s.match(/<\/span>/g) || []).length;
console.log(`      spans: ${open} open, ${close} close`);
if (open !== close) { console.log('FAIL  span imbalance'); failed++; }

/* .cspace is a self-closing-style empty span pair, so the counts should match
   exactly; anything else means a replacement went wrong. */
if (!failed && process.exitCode !== 1) {
  fs.writeFileSync(FILE, s);
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
} else {
  console.log('\nnot written');
  process.exitCode = 1;
}
