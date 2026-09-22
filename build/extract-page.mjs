/* Turn a page's markup into a template plus a content file.

     node build/extract-page.mjs home
     node build/extract-page.mjs about

   Writes build/templates/<page>.tpl.html and content/<page>.yml.

   The template IS the page's own markup, with each editable value swapped for
   a token. Nothing about the layout is retyped, so nothing about the layout
   can be got wrong: render the template with the values that came out of it
   and the original bytes come back. build/verify-pages-render.mjs proves that
   before anything is allowed to use it.

   Every anchor in build/page-spec.mjs must match exactly once. A regex that
   quietly matches nothing is how the project extractor blanked seven content
   files earlier in this work, so here it is an error, not a shrug.        */

import fs from 'fs';
import { dump } from 'js-yaml';
import { SPEC } from './page-spec.mjs';

const page = process.argv[2];
if (!SPEC[page]) {
  console.error(`usage: node build/extract-page.mjs <${Object.keys(SPEC).join('|')}>`);
  process.exit(1);
}

const SRC = 'src/index.html';
const src = fs.readFileSync(SRC, 'utf8');

const all = [...src.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
const at = all.findIndex(m => m[1] === page);
if (at < 0) { console.error(`FAIL: no page div for "${page}"`); process.exit(1); }
const start = all[at].index;
const end = at + 1 < all.length ? all[at + 1].index : src.indexOf('<script>', start);

/* the chrome is rendered per page by the build, so it is replaced by its
   markers and never stored as content */
let tpl = src.slice(start, end)
  .replace(/<header class="site-header"[\s\S]*?<\/header>/, '<header class="site-header" data-header></header>')
  .replace(/<footer class="footer">[\s\S]*?<\/footer>/, '<footer class="footer"></footer>');

const data = {};
const fail = m => { console.error('FAIL: ' + m); process.exitCode = 1; };
const put = (path, value) => {
  const keys = path.split('.');
  let o = data;
  for (const k of keys.slice(0, -1)) o = (o[k] ??= {});
  o[keys[keys.length - 1]] = value;
};

/* ---- lists first: they rewrite whole containers, so doing them after the
   slots would clobber tokens placed inside them ---- */
let listCount = 0;
for (const L of SPEC[page].lists || []) {
  const c = tpl.match(L.container);
  if (!c) { fail(`${page}: list "${L.path}" container not found`); continue; }

  const items = [...c[2].matchAll(L.item)];
  if (!items.length) { fail(`${page}: list "${L.path}" matched no items`); continue; }

  /* everything inside the container has to be accounted for; if the item
     pattern skips some of it, rewriting the container would silently drop it */
  const bare = t => t.replace(/\s+/g, '');
  const leftover = bare(c[2]).length - items.reduce((n, m) => n + bare(m[0]).length, 0);
  if (leftover !== 0) {
    fail(`${page}: list "${L.path}" leaves ${leftover} characters unmatched inside its container`
      + ' -- rewriting it would drop them');
    continue;
  }

  put(L.path, items.map(m => Object.fromEntries(L.fields.map((f, i) => [f, m[i + 1]]))));
  tpl = tpl.replace(L.container, `$1{{#each ${L.path}}}${L.template}{{/each}}$3`);
  listCount++;
  console.log(`  list  ${L.path.padEnd(26)} ${items.length} items`);
}

/* ---- then the single values ---- */
let slotCount = 0;
for (const [path, re] of SPEC[page].slots) {
  const global = new RegExp(re.source, 'g');
  const hits = [...tpl.matchAll(global)];
  if (hits.length !== 1) { fail(`${page}: slot "${path}" matched ${hits.length} times, want exactly 1`); continue; }

  const m = hits[0];
  const value = m[1];
  /* Replace only the captured group; the surrounding markup is untouched
     apart from one added attribute. */
  const whole = m[0];
  const cut = whole.lastIndexOf(value);
  let swapped = whole.slice(0, cut) + `{{${path}}}` + whole.slice(cut + value.length);

  /* Stamp the element the value came out of with the field it belongs to.
     The tag is the last one opened before the value -- whether the value is
     that element's text ("<h1 …>VALUE</h1>") or one of its attributes
     ("<img … alt="VALUE">"), it is the same tag, and the attribute goes in
     just before its closing angle bracket. This is what lets the editor map
     a click on the page back to a line in a YAML file. */
  const tagStart = swapped.lastIndexOf('<', cut);
  const tagEnd = swapped.indexOf('>', tagStart);
  if (tagStart >= 0 && tagEnd > tagStart && !/ data-edit=/.test(swapped.slice(tagStart, tagEnd))) {
    swapped = swapped.slice(0, tagEnd) + ` data-edit="${path}"` + swapped.slice(tagEnd);
  }

  tpl = tpl.slice(0, m.index) + swapped + tpl.slice(m.index + whole.length);

  put(path, value);
  slotCount++;
}

if (process.exitCode) { console.error('\nNothing written.'); process.exit(1); }

/* Templates are stored with LF. git checks src/index.html out with LF on
   Linux and CRLF on Windows, so a template that hard-codes either one only
   round-trips on one platform; build/gen-pages.mjs converts to whatever the
   file it is writing into uses. */
fs.writeFileSync(`build/templates/${page}.tpl.html`, tpl.replace(/\r\n/g, '\n'));
fs.writeFileSync(`content/${page}.yml`,
  `# The editable content of the ${page} page.\n`
  + `#\n`
  + `# Generated by build/extract-page.mjs from the page's own markup, and from\n`
  + `# now on the source of truth for it. build/templates/${page}.tpl.html is that\n`
  + `# same markup with these values replaced by tokens; build/gen-pages.mjs puts\n`
  + `# the two back together. Edit here (or through /admin/), never in the HTML.\n\n`
  + dump(data, { lineWidth: 100, noRefs: true }));

console.log(`\n  ${slotCount} values, ${listCount} list(s)`);
console.log(`  build/templates/${page}.tpl.html  ${(tpl.length / 1024).toFixed(1)} KB`);
console.log(`  content/${page}.yml`);
