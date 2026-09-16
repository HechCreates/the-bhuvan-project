/* Serve the hero at the size the screen actually needs.

   It is the LCP element of the homepage and was 444 KB of JPEG at 2200px
   wide, downloaded in full by a phone that shows it 400px wide. Three WebP
   widths and a sizes hint cut that to 62 KB on a phone and 133 KB on a
   desktop, with the JPEG kept as the fallback source for anything that cannot
   read WebP.

   <picture> rather than a bare srcset, because a browser that understands
   srcset but not WebP would otherwise pick a file it cannot decode and show
   nothing. That combination is close to extinct, but the fallback is one
   element and a blank hero is the whole first screen.

   The <img> keeps its class, its alt and fetchpriority, and stays the element
   the CSS positions -- <picture> is an inline wrapper that creates no
   containing block, so an absolutely positioned child still resolves against
   .hero exactly as before.                                                 */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;

const ALT = 'A wetland with many migratory birds — painted stork, grey heron and bar-headed geese — feeding among the reeds, in clear natural light.';
const find = `<img class="hero-img" src="images/site/hero.jpg" alt="${ALT}" fetchpriority="high">`;

const n = s.split(find).length - 1;
if (n !== 1) { console.log(`FAIL: expected 1 hero img, found ${n}`); process.exit(1); }

const replace = `<picture>
      <source type="image/webp"
              srcset="images/site/hero-1000.webp 1000w, images/site/hero-1600.webp 1600w, images/site/hero-2200.webp 2200w"
              sizes="100vw">
      <img class="hero-img" src="images/site/hero.jpg" width="2200" height="1467" alt="${ALT}" fetchpriority="high">
    </picture>`;

s = s.replace(find, replace.replace(/\n/g, '\r\n'));
fs.writeFileSync(FILE, s);
console.log(`ok    hero serves 62/133/221 KB WebP by width, JPEG fallback kept\n\n${FILE}: ${before} -> ${s.length} chars`);
