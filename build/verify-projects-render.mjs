/* Prove the project template reproduces the live pages.

   Extraction is only safe if generating from the extracted content gives back
   what was there. This renders each project page from content/projects/*.yml
   and compares it with the markup currently in src/index.html, normalised for
   whitespace and HTML entities -- the same normalisation build/verify-build
   uses, so text, tags, attributes and alt text all still have to match.

   The chrome is excluded: the header and footer are rendered from
   content/site.yml by the build, and the template only emits their markers.

   data-edit attributes are excluded too. They are added by the template for
   the editor's benefit and are not in the hand-written markup; they are inert
   for a visitor and carry no styling.                                      */

import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import { projectPage } from './templates/project.mjs';

const SRC = 'src/index.html';
const DIR = 'content/projects';

const ENT = { middot: '·', copy: '©', amp: '&', rarr: '→', larr: '←', lsaquo: '‹', rsaquo: '›',
              ldquo: '“', rdquo: '”', nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
              times: '×', hellip: '…', deg: '°' };

const norm = t => t
  .replace(/<header class="site-header"[\s\S]*?<\/header>/g, '')
  .replace(/<footer class="footer">[\s\S]*?<\/footer>/g, '')
  .replace(/ data-(edit|edit-src|edit-alt|item)="[^"]*"/g, '')
  .replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m)
  .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

const s = fs.readFileSync(SRC, 'utf8');
/* every page mark, not just the project ones: the boundary of the LAST
   project page is the page that follows it, which is not a project. */
const allMarks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
const marks = allMarks.filter(m => m[1].startsWith('p-'));
const boundary = i => {
  const at = allMarks.findIndex(m => m.index === marks[i].index);
  return at + 1 < allMarks.length ? allMarks[at + 1].index : s.indexOf('<script>', marks[i].index);
};

const all = fs.readdirSync(DIR).filter(f => f.endsWith('.yml'))
  .map(f => load(fs.readFileSync(path.join(DIR, f), 'utf8')))
  .sort((a, b) => a.order - b.order);

let failed = 0;
for (const [i, mk] of marks.entries()) {
  const slug = mk[1].slice(2);
  const p = all.find(x => x.slug === slug);
  if (!p) { console.log(`  FAIL  ${slug}: no content file`); failed++; continue; }

  const end = boundary(i);
  const want = norm(s.slice(mk.index, end));

  const n = all.findIndex(x => x.slug === slug);
  const got = norm(projectPage(p, { prev: all[n - 1], next: all[n + 1] }));

  if (got === want) { console.log(`  ok    ${slug.padEnd(30)} ${want.length.toLocaleString()} chars`); continue; }

  let k = 0; while (k < got.length && k < want.length && got[k] === want[k]) k++;
  console.log(`  FAIL  ${slug}: differs at char ${k.toLocaleString()} (live ${want.length}, generated ${got.length})`);
  console.log('        live      …' + want.slice(Math.max(0, k - 110), k + 110));
  console.log('        generated …' + got.slice(Math.max(0, k - 110), k + 110));
  failed++;
}

console.log(failed
  ? `\n${failed} page(s) do not round-trip -- content is NOT yet safe to generate from`
  : '\nAll 7 project pages round-trip exactly. The content files can now drive the markup.');
if (failed) process.exitCode = 1;
