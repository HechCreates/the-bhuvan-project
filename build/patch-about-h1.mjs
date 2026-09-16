/* The About page has no <h1>.

   It is the only page on the site without one, and it is the page a search for
   "the bhu.van project" most wants to rank. The heading it should have is
   already on the page as the hero lede -- the one sentence that says what the
   studio is -- it is just marked up as a paragraph.

   #page-about .about-lede sets margin, font-family, font-weight, font-size,
   line-height, max-width and color explicitly, which is every property a
   browser's default h1 style would otherwise change. So this swap is visually
   inert; the rendered page is identical to the pixel.                       */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;

const find = `<p class="about-lede">An ecological restoration and landscape architecture studio, designing with nature, culture and context across India.</p>`;
const n = s.split(find).length - 1;
if (n !== 1) { console.log(`FAIL: expected 1 about-lede paragraph, found ${n}`); process.exit(1); }

s = s.replace(find, find.replace(/^<p /, '<h1 ').replace(/<\/p>$/, '</h1>'));
fs.writeFileSync(FILE, s);
console.log(`ok    About hero lede is now the page's <h1>\n\n${FILE}: ${before} -> ${s.length} chars`);
