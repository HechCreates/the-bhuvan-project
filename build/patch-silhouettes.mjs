/* The silhouette on each testimonial card.

   The artwork places them at a different x on every card -- 17%, 43%, 52%,
   81%, 91% of the card width -- which is hand-placement, and it does not
   survive a card that narrows: at anything under about 1320px the farmer on
   the Raja Bhat card runs into "Organic farm owner", and the family group on
   the Muthuraman card into its address line. Measured, not guessed.

   So they all sit bottom-right instead, inset by the card's own padding: one
   rule, no per-card data, clear of the attribution block at bottom-left, and
   it cannot collide or overflow at any width. Three of the five mocks are
   already right of centre.                                                  */

import fs from 'fs';

const FILE = 'src/index.html';
const GEN = 'build/gen-testimonials.mjs';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

/* ---- 1. the markup, one per card ---------------------------------------- */
const SIL = {
  'Mahesh Basavanna': ['mcd-berls', 'A standing figure'],
  'Raja Bhat': ['raja-bhat', 'A farmer tending a plant'],
  'A.R Vasavi': ['punarchith', 'A person working the land with a hoe'],
  'Rammohan MN': ['monash', 'Two figures shaking hands'],
  'Muthuraman R': ['muthuraman', 'A family seated around a table'],
};
{
  let n = 0;
  s = s.replace(/(<footer class="tq-by">\s*<p class="tq-name">([^<]+)<\/p>)/g, (m, head, name) => {
    const hit = SIL[name.trim()];
    if (!hit) return m;
    n++;
    const [file, alt] = hit;
    return `<img class="tq-sil" src="images/testimonials/${file}.webp" alt="${alt}" loading="lazy" decoding="async">\n        ` + head;
  });
  if (n !== 5) { log.push(`FAIL  1 markup: expected 5, inserted ${n}`); failed++; }
  else log.push(`ok    1 ${n} silhouettes into the cards`);
}

/* ---- 2. the rules -------------------------------------------------------- */
const CSS = `
/* ---------- Testimonial card silhouettes ----------
   Bottom-right, flush with the card's edge the way the artwork has them
   standing on it, and behind the text. The height shrinks with the viewport so
   the widest of them -- the family group, nearly 2:1 -- still clears the
   address line on the narrowest card that shows one.

   The height is the artwork's: cropping the mock at the live card scale puts
   every figure at 30-37% of the card, standing below the last line of the
   quote, not level with it. */
.tq-card{position:relative;overflow:hidden}
/* img.tq-sil, not .tq-sil: .project-page img{height:auto} is 0,2,0 and would
   otherwise win and leave every figure at its natural 420px. */
.testimonials-page img.tq-sil{position:absolute;right:clamp(1.35rem,5.4vw,4rem);bottom:0;
  height:clamp(80px,9vw,116px);width:auto;max-width:none;pointer-events:none;user-select:none}
/* the quote and the attribution always sit over it */
.tq-body,.tq-more,.tq-by{position:relative;z-index:1}
/* Below this a card is too narrow for a figure and its attribution to share a
   line; the silhouette is decoration, the words are not. */
@media (max-width:760px){ .testimonials-page img.tq-sil{display:none} }
`;
{
  const i = s.indexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + CSS + s.slice(i); log.push('ok    2 rules'); }
}

fs.writeFileSync(FILE, s);

/* ---- 3. keep the generator in step --------------------------------------- */
{
  let g = fs.readFileSync(GEN, 'utf8');
  const find = `        <footer class="tq-by">`;
  const rep = `        \${t.silhouette ? \`<img class="tq-sil" src="images/testimonials/\${t.silhouette.file}" alt="\${esc(t.silhouette.alt)}" loading="lazy" decoding="async">\n        \` : ''}<footer class="tq-by">`;
  if (!g.includes(find)) { log.push('FAIL  3 generator anchor'); failed++; }
  else if (g.includes('tq-sil')) log.push('ok    3 generator already carries it');
  else { fs.writeFileSync(GEN, g.replace(find, rep)); log.push('ok    3 generator emits the silhouette'); }
}

console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
