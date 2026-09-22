/* Render the content files back into src/index.html.

   This is the step that makes content/ the source of truth. src/index.html
   stays exactly what it has always been -- the one document holding every
   page, which build.mjs then cuts into the published site -- but the parts of
   it that have been extracted are now WRITTEN by this script rather than
   edited by hand.

   Run it two ways:

     node build/gen-pages.mjs          rewrite the pages from content/
     node build/gen-pages.mjs --check  fail if that would change anything

   The --check form is the guard. If someone edits the markup directly, or
   edits a content file without regenerating, the two disagree and CI stops.
   Without it the content files would quietly drift into being a stale copy
   of the site -- which is exactly what had already happened to the old
   content/projects/*.yml before this work started.                        */

import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import { header, footer } from './templates/chrome.mjs';
import { projectPage } from './templates/project.mjs';
import { render } from './templates/render.mjs';
import { SPEC } from './page-spec.mjs';

const SRC = 'src/index.html';
const check = process.argv.includes('--check');

const before = fs.readFileSync(SRC, 'utf8');
let s = before;

/* Match the file's own line endings rather than always writing CRLF. The
   working copy on Windows is CRLF; git stores LF and checks out LF on the
   Linux runner, so a generator that hard-codes CRLF differs from the file by
   exactly one character per line and --check fails in CI while passing
   locally. */
const eol = /\r\n/.test(before) ? '\r\n' : '\n';
const crlf = t => t.replace(/\r?\n/g, eol);

const projects = fs.readdirSync('content/projects')
  .filter(f => f.endsWith('.yml'))
  .map(f => load(fs.readFileSync(path.join('content/projects', f), 'utf8')))
  .sort((a, b) => a.order - b.order);

/* back to front, so the offsets of the pages still to do stay valid */
const marks = () => [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
const log = [];

for (let i = marks().length - 1; i >= 0; i--) {
  const all = marks();
  const key = all[i][1];
  const isProject = key.startsWith('p-');
  const isTemplated = Boolean(SPEC[key]);
  if (!isProject && !isTemplated) continue;

  const start = all[i].index;
  const end = i + 1 < all.length ? all[i + 1].index : s.indexOf('<script>', start);
  const old = s.slice(start, end);

  let page;
  if (isProject) {
    const slug = key.slice(2);
    const n = projects.findIndex(p => p.slug === slug);
    if (n < 0) { console.error(`FAIL: no content file for ${key}`); process.exit(1); }
    /* the chrome is rendered in, exactly as it sits in the file today; the
       build re-renders it per page anyway, this just keeps src self-consistent */
    page = crlf(projectPage(projects[n], {
      prev: projects[n - 1], next: projects[n + 1],
      header: header(''), footer: footer(),
    }));
  } else {
    /* home and about: the page's own markup as a template, with the values
       put back in from content/<page>.yml */
    const tplFile = `build/templates/${key}.tpl.html`;
    if (!fs.existsSync(tplFile)) { console.error(`FAIL: ${tplFile} is missing`); process.exit(1); }
    page = crlf(render(fs.readFileSync(tplFile, 'utf8'), load(fs.readFileSync(`content/${key}.yml`, 'utf8')))
      .replace('<header class="site-header" data-header></header>', header(key === 'about' ? 'about' : 'home'))
      .replace('<footer class="footer"></footer>', footer()));
  }

  /* keep whatever blank space separated this page from the next */
  const gap = old.match(/\s*$/)[0];
  const next = page.replace(/\s*$/, '') + gap;

  if (next !== old) log.push(`  ${key}: ${old.length} -> ${next.length} chars`);
  s = s.slice(0, start) + next + s.slice(end);
}

if (s === before) {
  console.log(`${SRC} is already in step with content/ (${projects.length} projects)`);
} else if (check) {
  console.log('FAIL: src/index.html does not match content/\n');
  console.log(log.join('\n'));
  console.log('\nRun `npm run content` to regenerate, or put the change in content/ instead.');
  process.exitCode = 1;
} else {
  fs.writeFileSync(SRC, s);
  console.log(log.join('\n'));
  console.log(`\n${SRC}: ${before.length} -> ${s.length} chars`);
}
