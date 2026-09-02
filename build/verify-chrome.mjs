/* Check the templated header and footer reproduce all 22 copies in the page.

   Compared after two normalisations, neither of which can hide a changed
   element, attribute or word:

     whitespace  the hand-patched originals picked up stray double spaces
                 between attributes from the regex edits that produced them,
                 and reproducing a typo is not the goal
     entities    the content file stores literal characters, because a client
                 editing "Design · Ecology" should never be shown "&middot;".
                 &middot; and · are the same character to a reader, so both
                 sides are decoded before comparing.                         */

import fs from 'fs';
import { header, footer, site } from './templates/chrome.mjs';

const s = fs.readFileSync('src/index.html', 'utf8');
const body = s.slice(s.indexOf('</style>'));

const ENT = { middot: '·', copy: '©', amp: '&', rarr: '→', larr: '←',
              ldquo: '“', rdquo: '”', nbsp: ' ', mdash: '—', ndash: '–' };
const norm = t => t
  .replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m)
  .replace(/\s+/g, ' ')
  .replace(/>\s+</g, '><')
  .trim();

const marks = [...body.matchAll(/<div (?:id="[^"]*" )?data-page="([^"'+]+)"/g)];
const pageAt = i => { let n = '?'; for (const m of marks) { if (m.index <= i) n = m[1]; else break; } return n; };

const slices = (open, close) => {
  const out = [];
  let i = 0;
  for (;;) {
    const a = body.indexOf(open, i);
    if (a < 0) break;
    const b = body.indexOf(close, a) + close.length;
    out.push({ page: pageAt(a), html: body.slice(a, b) });
    i = b;
  }
  return out;
};

// only the About page marks its own nav item today
const currentFor = page => (page === 'about' ? 'about' : '');

let bad = 0;
for (const [label, open, close, render, perPage] of [
  ['header', '<header class="site-header"', '</header>', header, true],
  ['footer', '<footer class="footer">', '</footer>', footer, false],
]) {
  const found = slices(open, close);
  const mismatched = found.filter(f =>
    norm(f.html) !== norm(perPage ? render(currentFor(f.page)) : render()));
  console.log(`${label}: ${found.length} in the page, ${found.length - mismatched.length} reproduced exactly`);
  if (mismatched.length) {
    bad += mismatched.length;
    const f = mismatched[0];
    const got = norm(f.html);
    const want = norm(perPage ? render(currentFor(f.page)) : render());
    let k = 0; while (k < got.length && k < want.length && got[k] === want[k]) k++;
    console.log(`  first mismatch on "${f.page}" at char ${k}:`);
    console.log(`    page     …${got.slice(Math.max(0, k - 70), k + 70)}`);
    console.log(`    template …${want.slice(Math.max(0, k - 70), k + 70)}`);
  }
}

const bytes = [...slices('<header class="site-header"', '</header>'),
               ...slices('<footer class="footer">', '</footer>')]
  .reduce((t, x) => t + x.html.length, 0);
console.log(`\n${(bytes / 1024).toFixed(0)} KB of chrome across 22 copies in the page`);
console.log(`now one source: content/site.yml, ${site.nav.length} nav entries`);
console.log(bad ? `\n${bad} copy/copies differ` : '\nall 22 copies reproduce from the one template');
process.exitCode = bad ? 1 : 0;
