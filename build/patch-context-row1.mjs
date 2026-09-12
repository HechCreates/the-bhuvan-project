/* Balance the row the cover opens.

   Adding the cover to row 1 put four figures in it, and a .crow sizes every
   figure to a common height, so the more ratio a row carries the shorter it
   gets: 1.5 + 3.13 + 1.33 + 1.33 came to 190px against the rest of the page's
   259-345. Moving the last figure down to row 2 leaves the cover in a row
   that reads like the others rather than like a strip.                     */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const a = s.indexOf('<div data-page="p-context-responsive-design"');
const b = s.indexOf('<div data-page=', a + 10);
let page = s.slice(a, b < 0 ? s.length : b);

const rows = [...page.matchAll(/[ \t]*<div class="crow[^"]*">[\s\S]*?<\/div>\n/g)];
if (rows.length !== 7) { log.push(`FAIL  expected 7 rows, found ${rows.length}`); failed++; }
else {
  const FIG = /[ \t]*<figure class="cfig"[\s\S]*?<\/figure>\n/g;
  const r1 = rows[0][0], r2 = rows[1][0];
  const f1 = [...r1.matchAll(FIG)].map(m => m[0]);
  if (f1.length !== 4) { log.push(`FAIL  row 1 should hold 4 figures, found ${f1.length}`); failed++; }
  else {
    const moved = f1[f1.length - 1];
    const newR1 = r1.replace(moved, '');
    // it goes to the front of row 2, keeping the reading order across the page
    const newR2 = r2.replace(/(<div class="crow[^"]*">\n)/, `$1${moved}`);
    page = page.replace(r1, newR1).replace(r2, newR2);
    s = s.slice(0, a) + page + s.slice(b < 0 ? s.length : b);
    log.push('ok    row 1 keeps three, row 2 takes the fourth');
  }
}

{
  const open = (s.match(/<figure[ >]/g) || []).length;
  const close = (s.match(/<\/figure>/g) || []).length;
  const cfig = (s.match(/<figure class="cfig"/g) || []).length;
  log.push(`      figures ${open} open / ${close} close   cfig ${cfig}`);
  if (open !== close) { log.push('FAIL  figure imbalance'); failed++; }
  if (cfig !== 165) { log.push(`FAIL  cfig should still be 165, got ${cfig}`); failed++; }
}

if (failed) { console.log(log.join('\n')); console.log(`\n${failed} step(s) failed, not written`); process.exitCode = 1; }
else {
  fs.writeFileSync(FILE, s);
  console.log(log.join('\n'));
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
}
