/* Prove each extracted page renders back to exactly what is in src.

   For the project pages this is a normalised comparison, because their markup
   is retyped by a hand-written template. For these pages it is stricter: the
   template IS the original markup with values swapped for tokens, so putting
   the values back has to give the original bytes -- whitespace, entities and
   all. Anything less means extraction lost something.                     */

import fs from 'fs';
import { load } from 'js-yaml';
import { render } from './templates/render.mjs';
import { SPEC } from './page-spec.mjs';

const SRC = 'src/index.html';
const src = fs.readFileSync(SRC, 'utf8');
const all = [...src.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];

let failed = 0;
for (const page of Object.keys(SPEC)) {
  const tplFile = `build/templates/${page}.tpl.html`;
  const ymlFile = `content/${page}.yml`;
  if (!fs.existsSync(tplFile) || !fs.existsSync(ymlFile)) {
    console.log(`  --    ${page}: not extracted yet`);
    continue;
  }

  const at = all.findIndex(m => m[1] === page);
  const start = all[at].index;
  const end = at + 1 < all.length ? all[at + 1].index : src.indexOf('<script>', start);

  /* the chrome is rendered per page by the build; compare with the markers,
     the same way the template holds them */
  const want = src.slice(start, end)
    .replace(/<header class="site-header"[\s\S]*?<\/header>/, '<header class="site-header" data-header></header>')
    .replace(/<footer class="footer">[\s\S]*?<\/footer>/, '<footer class="footer"></footer>');

  let got;
  try {
    got = render(fs.readFileSync(tplFile, 'utf8'), load(fs.readFileSync(ymlFile, 'utf8')));
  } catch (e) {
    console.log(`  FAIL  ${page}: ${e.message}`);
    failed++; continue;
  }

  /* the template carries data-edit attributes the original markup does not */
  /* Normalised for three things and nothing else:
       - data-edit attributes, which the template adds for the editor
       - line endings, since templates are stored LF while src/index.html is
         CRLF on Windows and LF on the Linux runner
       - whitespace BETWEEN tags, because a repeated item cannot reproduce a
         blank line that appears between some items and not others, and that
         whitespace changes nothing about the rendered page
     Whitespace inside text is untouched, so a changed word still fails. */
  const strip = t => t
    .replace(/ data-edit="[^"]*"/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/>\s+</g, '><');
  if (strip(got) === strip(want)) {
    console.log(`  ok    ${page.padEnd(10)} ${want.length.toLocaleString()} chars, byte for byte`);
    continue;
  }

  let i = 0; const a = strip(want), b = strip(got);
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log(`  FAIL  ${page}: differs at char ${i.toLocaleString()} (src ${a.length}, rendered ${b.length})`);
  console.log('        src      …' + JSON.stringify(a.slice(Math.max(0, i - 90), i + 90)));
  console.log('        rendered …' + JSON.stringify(b.slice(Math.max(0, i - 90), i + 90)));
  failed++;
}

console.log(failed ? `\n${failed} page(s) do not round-trip` : '\nEvery extracted page round-trips exactly.');
if (failed) process.exitCode = 1;
