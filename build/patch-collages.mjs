/* Two collage rows that were leaving holes.

   Ecological Restoration ended on two rows that could not fill themselves:

     row 7   two portraits, 282px wide and 619px tall, beside an 829px void
     row 8   two landscapes, and a 370px void

   The void is structural, not a bug: a .crow sizes every figure to a common
   height by giving each a flex-grow of its aspect ratio, so two 0.46 portraits
   alone would have to be 692px wide and 1500px tall to fill the row. The
   spacer is what stops that. The fix is therefore not to stretch them but to
   put all four in one row: ratios 0.46 + 0.46 + 1.78 + 1.33 come to 4.03,
   which lands at about 344px tall -- the same band as every other row on that
   page (269-327) -- and fills the width exactly.

   Context Responsive Design gets the Sustainable Architecture cover as the
   first figure of row 1, and that row's small spacer comes out to pay for it. */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const pageOf = slug => {
  const a = s.indexOf(`<div data-page="${slug}"`);
  if (a < 0) return null;
  const b = s.indexOf('<div data-page=', a + 10);
  return [a, b < 0 ? s.length : b];
};

/* ---- 1. Ecological Restoration: merge the last two rows ------------------ */
{
  const [a, b] = pageOf('p-ecological-restoration');
  let page = s.slice(a, b);
  const rows = [...page.matchAll(/[ \t]*<div class="crow[^"]*">[\s\S]*?<\/div>\n/g)];
  if (rows.length !== 8) { log.push(`FAIL  1 expected 8 rows, found ${rows.length}`); failed++; }
  else {
    const r7 = rows[6][0], r8 = rows[7][0];
    const figs = t => [...t.matchAll(/[ \t]*<figure class="cfig"[\s\S]*?<\/figure>\n?/g)].map(m => m[0]);
    const all = [...figs(r7), ...figs(r8)];
    if (all.length !== 4) { log.push(`FAIL  1 expected 4 figures, found ${all.length}`); failed++; }
    else {
      const merged = '      <div class="crow">\n' + all.join('') + '      </div>\n';
      page = page.replace(r7, merged).replace(r8, '');
      s = s.slice(0, a) + page + s.slice(b);
      log.push('ok    1 the last two rows are one row of four, no void');
    }
  }
}

/* ---- 2. Context Responsive Design: the cover leads ---------------------- */
{
  const [a, b] = pageOf('p-context-responsive-design');
  let page = s.slice(a, b);
  const open = page.indexOf('<div class="crow');
  if (open < 0) { log.push('FAIL  2 no rows'); failed++; }
  else {
    const rowEnd = page.indexOf('</div>\n', open);
    let row = page.slice(open, rowEnd);
    const spacer = row.match(/\n?[ \t]*<span class="cspace"[^>]*><\/span>/);
    if (!spacer) { log.push('FAIL  2 row 1 has no spacer to trade'); failed++; }
    else {
      const COVER = '        <figure class="cfig" style="flex:1.5006 1 0">\n' +
        '          <span class="czoom"><img src="images/home/sustainable-architecture-cover.webp" ' +
        'width="1280" height="853" style="aspect-ratio:1.5006"\n' +
        '               loading="lazy" decoding="async" alt="Vaulted brick and concrete houses under construction on a terraced slope, with young planting establishing around them"></span>\n' +
        '        </figure>\n';
      row = row.replace(spacer[0], '');                       // the space it takes
      row = row.replace(/(<div class="crow[^"]*">\n)/, `$1${COVER}`);
      page = page.slice(0, open) + row + page.slice(rowEnd);
      s = s.slice(0, a) + page + s.slice(b);
      log.push('ok    2 the cover opens the collage, in place of the spacer');
    }
  }
}

/* ---- balance ------------------------------------------------------------- */
{
  /* every <figure> on the page, not just the collage: the Visual Journey
     contributes 214 of the closing tags and would swamp a cfig-only count */
  const open = (s.match(/<figure[ >]/g) || []).length;
  const close = (s.match(/<\/figure>/g) || []).length;
  const cfig = (s.match(/<figure class="cfig"/g) || []).length;
  const rows = (s.match(/<div class="crow/g) || []).length;
  log.push(`      figures ${open} open / ${close} close   cfig ${cfig}   rows ${rows}`);
  if (open !== close) { log.push('FAIL  figure imbalance'); failed++; }
  if (cfig !== 165) { log.push(`FAIL  cfig should be 165 (164 + the cover), got ${cfig}`); failed++; }
}

if (failed) { console.log(log.join('\n')); console.log(`\n${failed} step(s) failed, not written`); process.exitCode = 1; }
else {
  fs.writeFileSync(FILE, s);
  console.log(log.join('\n'));
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
}
