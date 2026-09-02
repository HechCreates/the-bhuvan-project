/* Compare the built page against the source it was assembled from.

   The only intended difference is that the 22 header and footer blocks are now
   rendered from content/site.yml instead of being 22 hand-maintained copies.
   Everything else must survive untouched. Both sides are normalised for
   whitespace and HTML entities before comparing -- neither can hide a changed
   element, attribute or word.                                               */

import fs from 'fs';
import path from 'path';

const SRC = 'src/index.html';
const OUT = 'dist/index.html';

const ENT = { middot: '·', copy: '©', amp: '&', rarr: '→', larr: '←',
              ldquo: '“', rdquo: '”', nbsp: ' ', mdash: '—', ndash: '–' };
const norm = t => t
  .replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m)
  .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

const a = norm(fs.readFileSync(SRC, 'utf8'));
const b = norm(fs.readFileSync(OUT, 'utf8'));

console.log('source  ' + a.length.toLocaleString() + ' chars (normalised)');
console.log('built   ' + b.length.toLocaleString() + ' chars (normalised)');

if (a === b) {
  console.log('\nIDENTICAL — the build reproduces the deployed page exactly.');
} else {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log('\nDIFFERS at char ' + i.toLocaleString() + ':');
  console.log('  source …' + a.slice(Math.max(0, i - 100), i + 100));
  console.log('  built  …' + b.slice(Math.max(0, i - 100), i + 100));
  process.exitCode = 1;
}

/* every asset the page asks for must exist in dist/ */
const html = fs.readFileSync(OUT, 'utf8');
const refs = [...new Set([...html.matchAll(/(?:src|href)="((?!https?:|#|mailto:|data:)[^"]+)"/g)].map(m => m[1]))];
const missing = refs.filter(r => !fs.existsSync(path.join('dist', r)));
console.log(`\nassets referenced: ${refs.length}`);
console.log(`missing in dist/ : ${missing.length ? '\n  ' + missing.join('\n  ') : 'none'}`);
if (missing.length) process.exitCode = 1;

/* nothing shipped that nothing asks for */
const shipped = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else shipped.push(path.relative('dist', p).split(path.sep).join('/'));
  }
})('dist/images');
const orphans = shipped.filter(f => !refs.includes(f));
console.log(`orphaned images  : ${orphans.length ? orphans.length + ' — ' + orphans.slice(0, 3).join(', ') : 'none'}`);
