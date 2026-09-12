/* 1. the new logo mark, everywhere
   2. the Sustainable Architecture cover in What we do
   3. the About quote on one line, in a tighter box
   4. the Projects cards lifted so they break the fold sooner
   5. the Ecological Restoration collage: the 829px void at the bottom
   6. Context Responsive Design: captions as watermarks, and the cover first */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const swap = (name, find, replace, expect = 1) => {
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

/* ---- 2. the Sustainable Architecture cover ------------------------------- */
swap('2 sustainable architecture cover',
  `images/home/practice-sustainable-architecture.webp`,
  `images/home/sustainable-architecture-cover.webp`, 2);

/* ---- 3. the About quote ---------------------------------------------------
   24ch held it to two lines. Off, plus a smaller size so the whole line fits,
   and the padding comes in to what the quote and its attribution need. */
swap('3 quote on one line, tighter box',
  `#page-about .geo-quote{margin:0 0 clamp(3rem,5vw,4.5rem);background:var(--soil);
  border-radius:var(--radius);padding:clamp(2.5rem,5.5vw,4.5rem) clamp(1.5rem,4vw,3rem);
  text-align:center}
#page-about .geo-quote .quote{color:var(--light);max-width:24ch;margin-inline:auto}`,
  `#page-about .geo-quote{margin:0 0 clamp(3rem,5vw,4.5rem);background:var(--soil);
  border-radius:var(--radius);padding:clamp(1.5rem,2.6vw,2.1rem) clamp(1.25rem,2.5vw,2rem);
  text-align:center}
/* no measure cap and a size that fits the line whole, so it reads as one
   breath rather than two */
#page-about .geo-quote .quote{color:var(--light);max-width:none;margin-inline:auto;
  font-size:clamp(1rem,4.2vw,3.8rem);line-height:1.15}
#page-about .geo-quote .quote-attr{margin-top:.7rem;font-size:.7rem}`);

/* ---- 4. the Projects cards come up ---------------------------------------- */
swap('4a the opening quote lets go sooner',
  `.pi-open{padding-block:clamp(9rem,16vh,12rem) clamp(4rem,9vw,7rem)}`,
  `.pi-open{padding-block:clamp(9rem,16vh,12rem) clamp(1.75rem,3.5vw,2.75rem)}`);
swap('4b and the section head holds less air',
  `.projects-index .sec-head{display:flex;align-items:baseline;justify-content:space-between;
  gap:1rem 2rem;flex-wrap:wrap;border-bottom:1px solid rgba(243,239,230,.22);
  padding-bottom:clamp(.9rem,1.6vw,1.25rem);margin-bottom:clamp(2.5rem,5vw,4rem)}`,
  `.projects-index .sec-head{display:flex;align-items:baseline;justify-content:space-between;
  gap:1rem 2rem;flex-wrap:wrap;border-bottom:1px solid rgba(243,239,230,.22);
  padding-bottom:clamp(.9rem,1.6vw,1.25rem);margin-bottom:clamp(1.5rem,3vw,2.25rem)}`);

/* ---- 6a. the Terrace Garden captions become watermarks --------------------
   Scoped to this page: every other project page keeps its caption under the
   photograph, which is where a caption belongs when it is doing real work.
   These four repeat one place name across a run of images, so they read
   better on the picture than as four lines of text beneath it. */
const CSS = `
/* ---------- Context Responsive Design: captions on the image ---------- */
[data-page="p-context-responsive-design"] .cfig{position:relative}
[data-page="p-context-responsive-design"] .ccap{position:absolute;left:0;right:0;bottom:0;
  margin:0;padding:1.6rem .7rem .55rem;text-align:left;
  color:rgba(243,239,230,.96);opacity:1;font-weight:600;font-size:.75rem;letter-spacing:.01em;
  text-shadow:0 1px 3px rgba(20,15,4,.65);pointer-events:none;
  background:linear-gradient(to top,rgba(20,15,4,.62),rgba(20,15,4,0))}
@media (max-width:760px){
  [data-page="p-context-responsive-design"] .ccap{font-size:.8125rem;padding:1.4rem .6rem .5rem}
}
`;
{
  const i = s.indexOf('</style>');
  if (i < 0) { log.push('FAIL  6a no </style>'); failed++; }
  else { s = s.slice(0, i) + CSS + s.slice(i); log.push('ok    6a caption watermark rules'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
