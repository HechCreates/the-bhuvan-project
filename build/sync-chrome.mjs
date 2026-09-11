/* Write the rendered chrome back into src/index.html.

   build.mjs renders the header and footer from content/site.yml into dist on
   every build, so after a change to that file dist and src disagree and
   verify-build stops reporting IDENTICAL. This applies the same swap to the
   source, which is where the check wants them to match.                    */

import fs from 'fs';
import { header, footer } from './templates/chrome.mjs';

const FILE = 'src/index.html';
let html = fs.readFileSync(FILE, 'utf8');
const before = html.length;

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

console.log(`ok    header into ${swapBlocks('<header class="site-header"', '</header>', header)} pages`);
console.log(`ok    footer into ${swapBlocks('<footer class="footer">', '</footer>', () => footer())} pages`);
fs.writeFileSync(FILE, html);
console.log(`      ${FILE}: ${before} -> ${html.length} chars`);
