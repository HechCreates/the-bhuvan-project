/* Homepage revision: ten changes, applied to src/index.html.

   Everything here is scoped to #page-home, so the About and project pages are
   untouched. Run once; `npm run build` publishes the result.               */

import fs from 'fs';
import { practiceIcon, mapIcon } from './icons-sketch.mjs';

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
const addCss = (name, css) => {
  const i = s.indexOf('</style>');
  s = s.slice(0, i) + css + '\n' + s.slice(i);
  log.push(`ok    ${name}`);
};

/* ---- 1. white fade at the top of the hero, and the contrast that follows -- */
swap('1a hero top band -> white fade, then the soil band lower down',
  `.hero-band-top{position:absolute;top:0;left:0;right:0;height:52%;background:linear-gradient(to bottom,rgba(42,31,8,.66),rgba(42,31,8,.22) 60%,rgba(42,31,8,0));z-index:1;pointer-events:none}`,
  `.hero-band-top{position:absolute;top:0;left:0;right:0;height:52%;z-index:1;pointer-events:none;
  /* Cream haze over the header so the logo disc reads as part of the picture
     rather than a cut-out, gone before the statement begins; the old soil
     band then resumes to keep the statement legible. */
  background:linear-gradient(to bottom,
    rgba(243,239,230,.95) 0%,
    rgba(243,239,230,.85) 9%,
    rgba(243,239,230,.40) 18%,
    rgba(243,239,230,0) 26%,
    rgba(42,31,8,.26) 40%,
    rgba(42,31,8,.18) 65%,
    rgba(42,31,8,0) 100%)}`);

swap('1b header ink dark over the fade',
  `#page-home .header-inner{display:flex;align-items:center;justify-content:space-between;padding-block:1.3rem;color:var(--light)}`,
  `#page-home .header-inner{display:flex;align-items:center;justify-content:space-between;padding-block:1.3rem;color:var(--primary);transition:color .35s ease}`);

addCss('1c header ink light again once it sticks, and the Get in Touch button becomes a link', `
/* ---------- Homepage header over the cream hero fade ---------- */
#page-home .site-header.stuck .header-inner{color:var(--light)}
#page-home .menu-toggle span{background:var(--primary)}
#page-home .site-header.stuck .menu-toggle span{background:var(--light)}
/* The nav CTA loses its pill and sits as one more link. Header only: the
   footer and mobile drawer keep the button. */
#page-home .nav .cta{background:none;color:inherit;border-radius:0;padding:.3rem 0;
  font-size:.72rem;letter-spacing:.16em;font-weight:600;text-transform:uppercase;
  opacity:.9;position:relative;transition:opacity .2s}
#page-home .nav .cta::after{content:'';position:absolute;left:0;bottom:0;height:1px;width:0;
  background:var(--clay);transition:width .28s}
#page-home .nav .cta:hover{background:none;color:inherit;opacity:1;transform:none}
#page-home .nav .cta:hover::after{width:100%}`);

/* ---- 2. emphasis on the three keywords ----------------------------------- */
swap('2a statement: keywords keep the size, the rest steps down',
  `<h1 class="hero-statement">The Bhu.Van Project is an evolving design practice exploring the deep relationship between people, place and ecology.</h1>`,
  `<h1 class="hero-statement">The Bhu.Van Project is an evolving design practice exploring the deep relationship between <span class="hero-key">people, place and ecology.</span></h1>`);

swap('2b lede: keywords step up to the statement size',
  `<p class="hero-lede">Through this lens, the studio seeks to rewild, restore, and reimagine landscapes that sustain life.</p>`,
  `<p class="hero-lede">Through this lens, the studio seeks to <span class="hero-key">rewild, restore, and reimagine</span> landscapes that sustain life.</p>`);

addCss('2c keyword sizing', `
/* ---------- Hero emphasis ----------
   The statement's own size drops to 0.62 of what it was and .hero-key holds
   the original, so "people, place and ecology" is what carries. The same class
   on the lede lifts "rewild, restore, and reimagine" to match it. */
#page-home .hero-statement{font-size:clamp(.85rem,min(2.1vw,6.2svh - 1.27vw - 2px),2.1rem)}
#page-home .hero-key{font-size:clamp(1.35rem,min(3.4vw,10svh - 2.05vw - 3px),3.4rem);
  line-height:1.1;display:inline}
#page-home .hero-lede .hero-key{font-weight:600}`);

/* ---- 3 + 4. the bottom keywords ------------------------------------------ */
swap('3 tag pills -> centre-dot dividers',
  `#page-home .hero-tag{font-family:var(--fb);font-weight:600;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--light);border:1px solid rgba(243,239,230,.45);border-radius:100px;padding:.42rem .9rem;backdrop-filter:blur(2px)}`,
  `#page-home .hero-tag{font-family:var(--fb);font-weight:600;font-size:.66rem;letter-spacing:.16em;
  text-transform:uppercase;color:rgba(243,239,230,.62);display:inline-flex;align-items:center}
#page-home .hero-tag + .hero-tag::before{content:'\\00B7';margin:0 .55rem 0 0;opacity:.7}`);

swap('3b tagpills sit on one line now the pills are gone',
  `#page-home .hero-tagpills{display:flex;gap:.5rem;flex-wrap:wrap;`,
  `#page-home .hero-tagpills{display:flex;gap:0;flex-wrap:wrap;`);

swap('4 eyebrow drops back in the hierarchy',
  `#page-home .hero-eyebrow{color:#f3efe6;`,
  `#page-home .hero-eyebrow{color:rgba(243,239,230,.62);`);

/* ---- 5. the meaning line reads as a watermark ---------------------------- */
swap('5 meaning line smaller and quieter',
  `#page-home .meaning-text{font-family:var(--fd);font-weight:600;font-size:clamp(1.5rem,3.4vw,2.9rem);line-height:1.2;color:var(--primary);margin:0;max-width:none}`,
  `#page-home .meaning-text{font-family:var(--fd);font-weight:600;font-size:clamp(.95rem,1.8vw,1.5rem);
  line-height:1.35;color:rgba(55,40,7,.55);margin:0;max-width:none;letter-spacing:.01em}
#page-home .meaning-text .bhu{color:rgba(180,112,58,.8)}`);

/* ---- 6. caption condensed, the long copy moves into the panel ------------- */
swap('6a map caption becomes a one-line description of what the map is',
  `<figcaption class="about-cap">From the high-altitude Himalayas to the southern forests and urban landscapes, our work spans India’s diverse geographies. Each place becomes an opportunity to understand its living systems, communities, and ecological context, and design with them.</figcaption>`,
  `<figcaption class="about-cap">Every mark is a place we have worked. Tap the map to see how far the work reaches.</figcaption>`);

swap('6b panel lead carries both paragraphs, rewritten as one',
  `<p class="map-lead">From the Himalayas to the Nilgiris, from forests to cities, we engage with India's diverse geographies and communities to design with nature, culture and context.</p>`,
  `<p class="map-lead">From the high-altitude Himalayas to the southern forests, from river basins to city edges, our work spans India&rsquo;s diverse geographies. Each place is an opportunity to understand its living systems, its communities and its ecological context &mdash; and to design with them rather than against them.</p>`);

/* ---- 7. the new map, on cream -------------------------------------------- */
swap('7a new map file, in the teaser and the panel',
  `images/home/about-map.webp`, `images/home/about-map.png`, 2);

addCss('7c cream ground behind the map', `
/* ---------- Map on the site's cream ----------
   The new drawing is transparent, so the ground now shows through where the
   old one carried its own white. */
#page-home .map-btn img{background:var(--light);padding:14px}
#page-home .map-panel-figure{background:var(--light)}`);

/* ---- 8. panel keywords match the hero ------------------------------------ */
swap('8 panel keywords -> Design, Ecology, Resilience',
  `<p class="map-keywords">Restoration &bull; Design &bull; Ecology &bull; Community</p>`,
  `<p class="map-keywords">Design &middot; Ecology &middot; Resilience</p>`);

/* ---- 9. What we do: drop the side note and the numbering ------------------ */
swap('9a remove the "Five practices" side note',
  `\n      <span class="label" style="color:var(--tertiary)">Five practices &middot; one ecology</span>`, '');

{
  const nums = [...s.matchAll(/<span class="p-num">\d\d<\/span>/g)];
  if (nums.length !== 5) { log.push(`FAIL  9b numbering: expected 5, found ${nums.length}`); failed++; }
  else { s = s.replace(/<span class="p-num">\d\d<\/span>/g, ''); log.push('ok    9b removed the 01-05 numbering'); }
}

addCss('9c coordinate column shrinks now it holds only the icon', `
/* ---------- What we do, without the numbering ---------- */
#page-home .practice-coord{min-width:0;gap:0}`);

/* ---- 10. hand-drawn icons ------------------------------------------------ */
{
  const practices = ['ecological-restoration', 'landscape-architecture', 'watershed-management',
                     'sustainable-architecture', 'academic-engagement'];
  // the practice blocks appear in document order; swap each one's svg
  let n = 0;
  s = s.replace(/<svg viewBox="0 0 32 32" class="p-icon" aria-hidden="true">[\s\S]*?<\/svg>/g, () => {
    const key = practices[n++];
    return practiceIcon(key).replace('<svg ', '<svg class="p-icon" ');
  });
  log.push(n === 5 ? `ok    10a replaced ${n} practice icons` : `FAIL  10a expected 5 practice icons, replaced ${n}`);
  if (n !== 5) failed++;

  const feats = ['diverse-geographies', 'living-systems', 'integrated-approach', 'regenerative-outcomes'];
  let m = 0;
  s = s.replace(/<svg viewBox="0 0 40 40" aria-hidden="true">[\s\S]*?<\/svg>/g, () => mapIcon(feats[m++]));
  log.push(m === 4 ? `ok    10b replaced ${m} map-panel icons` : `FAIL  10b expected 4 map icons, replaced ${m}`);
  if (m !== 4) failed++;
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
