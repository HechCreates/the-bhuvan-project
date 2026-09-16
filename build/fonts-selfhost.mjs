/* Self-host the two typefaces.

   The page asks Google Fonts for a stylesheet before it can finish painting:
   a DNS lookup, a TLS handshake and a round trip to fonts.googleapis.com, and
   only THEN does the browser learn which font files to fetch from a second
   host. That chain sits in front of first paint on every page.

   The fix has to be exactly neutral to look at, so this takes the identical
   CSS URL the page uses today and hosts the identical woff2 files Google
   would have served. Same binaries, same unicode-ranges, same weights -- so
   the rendering is unchanged by construction, not by judgement.

   Two deliberate preservations:

   - Only latin and latin-ext are kept. Abhaya Libre also ships a sinhala
     subset this site never renders; dropping it saves a file the browser
     would never have downloaded anyway, and keeping the unicode-range on the
     faces means a stray character still falls back exactly as it does now.

   - Manrope 800 is NOT added. The site's CSS asks for font-weight:800 twice,
     the Google Fonts URL has never requested it, and the browser has been
     synthesising it all along. Adding the real face would change how those
     two elements look. If that is wanted it is a design decision, not a
     performance one.                                                        */

import fs from 'fs';
import path from 'path';

/* the exact URL in src/index.html today -- read from the page, not retyped,
   so this cannot silently diverge from what the site actually asks for */
const page = fs.readFileSync('src/index.html', 'utf8');
/* Once the link has been replaced by the self-hosted faces there is nothing
   left in the page to read, so the request this all derives from is recorded
   here too. Change it in one place and re-run; the two agree by construction
   while the link still exists, and this is the record after it is gone. */
const ORIGINAL = 'https://fonts.googleapis.com/css2?family=Abhaya+Libre:wght@400;500;600;700;800'
  + '&family=Manrope:wght@300;400;500;600;700&display=swap';
const CSS_URL = process.argv[2]
  || (page.match(/href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/) || [])[1]
  || ORIGINAL;
console.log('source:', CSS_URL.replace(/&/g, '&\n        '));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const OUT = 'images/fonts';                 // under images/ so the build copies it
fs.mkdirSync(OUT, { recursive: true });

const css = await (await fetch(CSS_URL.replace(/&amp;/g, '&'), { headers: { 'User-Agent': UA } })).text();

/* Google writes the subset name in a comment BEFORE the block it describes:

     / * latin-ext * /   @font-face { ... }
     / * latin * /       @font-face { ... }

   so splitting on "@font-face" pairs every block with the NEXT one's label.
   Doing that silently mislabels every face by one, and -- because the last
   block has no comment after it -- drops the real latin face while keeping a
   sinhala one under the name "latin-ext". The result loads no font at all for
   ordinary English text. Match the comment and its block together instead. */
const blocks = [...css.matchAll(/\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
  .map(m => ({ subset: m[1], block: m[2] }));
if (!blocks.length) { console.error('FAIL: could not parse any @font-face blocks'); process.exit(1); }

const faces = [];
let dropped = 0;

for (const { subset, block: b } of blocks) {
  if (!/^latin/.test(subset)) { dropped++; continue; }
  const url = (b.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
  const family = (b.match(/font-family:\s*'([^']+)'/) || [])[1];
  const weight = (b.match(/font-weight:\s*([\d ]+)/) || [, '400'])[1].trim();
  const style = (b.match(/font-style:\s*(\w+)/) || [, 'normal'])[1];
  const range = (b.match(/unicode-range:\s*([^;]+);/) || [, ''])[1].trim();
  if (!url || !family) continue;

  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
  const file = `${family.replace(/\s+/g, '-').toLowerCase()}-${weight.replace(/\s+/g, '-')}-${subset}.woff2`;
  fs.writeFileSync(path.join(OUT, file), buf);
  faces.push({ family, weight, style, subset, range, file, bytes: buf.length });
}

/* Ordered so the latin subset is declared before latin-ext: the browser picks
   by unicode-range regardless, but this is the order Google emits and there is
   no reason to differ. */
const faceCss = faces.map(f =>
  `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};`
  + `font-display:swap;src:url(images/fonts/${f.file}) format('woff2');`
  + `unicode-range:${f.range}}`).join('\n');

fs.writeFileSync('build/fonts-face.css', faceCss + '\n');

const total = faces.reduce((s, f) => s + f.bytes, 0);
console.log(`\nkept ${faces.length} latin faces, dropped ${dropped} non-latin`);
for (const f of faces) {
  console.log(`  ${f.family.padEnd(13)} ${String(f.weight).padEnd(4)} ${f.subset.padEnd(10)} ${(f.bytes / 1024).toFixed(1).padStart(6)} KB`);
}
console.log(`\ntotal ${(total / 1024).toFixed(1)} KB in ${OUT}/`);
console.log('@font-face css written to build/fonts-face.css');
