/* Turn a page's markup into a template plus a content file.
 *
 *     node build/extract-page.mjs home
 *     node build/extract-page.mjs about faq contact projects
 *     node build/extract-page.mjs --all
 *
 * Writes build/templates/<page>.tpl.html and content/<page>.yml.
 *
 * The template IS the page's own markup, with each editable value swapped for
 * a token. Nothing about the layout is retyped, so nothing about the layout
 * can be got wrong: render the template with the values that came out of it
 * and the original bytes come back. build/verify-pages-render.mjs proves that
 * before anything is allowed to use it.
 *
 * WHAT IS EDITABLE is decided by build/discover.mjs, which walks the page and
 * takes every text element and every image. The first version of this listed
 * them by hand instead, and the result was that 24% of the site's text was
 * editable and four pages had none at all. Naming things one at a time
 * guarantees an incomplete list.
 *
 * build/page-spec.mjs now only declares LISTS -- the parts a person can add
 * to, remove from and reorder. Everything else is found, not declared.
 */

import fs from 'fs';
import { dump } from 'js-yaml';
import { SPEC } from './page-spec.mjs';
import { discover } from './discover.mjs';

const args = process.argv.slice(2);
const pages = args.includes('--all') ? Object.keys(SPEC) : args;
if (!pages.length) {
  console.error(`usage: node build/extract-page.mjs <${Object.keys(SPEC).join('|')}|--all>`);
  process.exit(1);
}

const SRC = 'src/index.html';

for (const page of pages) {
  if (!SPEC[page]) { console.error(`FAIL: no spec for "${page}"`); process.exitCode = 1; continue; }
  extract(page);
}

function extract(page) {
  const src = fs.readFileSync(SRC, 'utf8');
  const all = [...src.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
  const at = all.findIndex(m => m[1] === page);
  if (at < 0) { console.error(`FAIL: no page div for "${page}"`); process.exitCode = 1; return; }
  const start = all[at].index;
  const end = at + 1 < all.length ? all[at + 1].index : src.indexOf('<script>', start);

  /* the chrome comes from content/site.yml and is rendered per page by the
     build, so it is replaced by its markers and never stored as content */
  let tpl = src.slice(start, end)
    .replace(/<header class="site-header"[\s\S]*?<\/header>/, '<header class="site-header" data-header></header>')
    .replace(/<footer class="footer">[\s\S]*?<\/footer>/, '<footer class="footer"></footer>');

  const data = {};
  let failed = 0;
  const fail = m => { console.error('  FAIL ' + m); failed++; };
  const put = (path, value) => {
    const keys = path.split('.');
    let o = data;
    for (const k of keys.slice(0, -1)) o = (o[k] ??= {});
    o[keys[keys.length - 1]] = value;
  };

  /* ---- 1. everything the walker finds ----
     Spliced back to front so each range stays valid while the ones before it
     are still being replaced. */
  const lists = SPEC[page].lists || [];
  const found = discover(tpl, { skipRanges: lists.map(l => l.skipClass).filter(Boolean) });

  let textCount = 0, imageCount = 0;
  for (const f of [...found].sort((a, b) => b.el.range[0] - a.el.range[0])) {
    const [s, e] = f.el.range;
    const outer = tpl.slice(s, e);
    let replaced;

    if (f.kind === 'text') {
      const inner = f.el.innerHTML;
      const cut = outer.lastIndexOf(inner);
      if (cut < 0) { fail(`${page}: could not place ${f.path} in its own markup`); continue; }
      replaced = withEditAttr(outer.slice(0, cut), f.path) + `{{${f.path}}}` + outer.slice(cut + inner.length);
      put(f.path, inner);
      textCount++;
    } else if (f.kind === 'image') {
      /* The image names its own fields. Different parts of the site store a
         filename under different keys -- "src" here, "image" on a project
         collage, "file" in the Visual Journey -- and an editor that guessed
         "src" everywhere would write a field that does not exist. */
      const base = f.path.replace(/\.src$/, '');
      replaced = withImageAttrs(outer, `${base}.src`, `${base}.alt`)
        .replace(/src="[^"]*"/, `src="{{${f.path}}}"`);
      put(f.path, f.value);
      imageCount++;
    } else if (f.kind === 'alt') {
      replaced = outer.replace(/alt="[^"]*"/, `alt="{{${f.path}}}"`);
      put(f.path, f.value);
    } else continue;

    tpl = tpl.slice(0, s) + replaced + tpl.slice(e);
  }

  /* ---- 2. the declared lists ---- */
  let listCount = 0;
  for (const L of lists) {
    const c = tpl.match(L.container);
    if (!c) { fail(`${page}: list "${L.path}" container not found`); continue; }
    const items = [...c[2].matchAll(L.item)];
    if (!items.length) { fail(`${page}: list "${L.path}" matched no items`); continue; }

    const bare = t => t.replace(/\s+/g, '');
    const leftover = bare(c[2]).length - items.reduce((n, m) => n + bare(m[0]).length, 0);
    if (leftover !== 0) {
      fail(`${page}: list "${L.path}" leaves ${leftover} characters unmatched -- rewriting it would drop them`);
      continue;
    }

    put(L.path, items.map(m => Object.fromEntries(L.fields.map((f, i) => [f, m[i + 1]]))));
    tpl = tpl.replace(L.container, `$1{{#each ${L.path}}}${L.template}{{/each}}$3`);
    listCount++;
    console.log(`  list  ${L.path.padEnd(26)} ${items.length} items`);
  }

  if (failed) { console.error(`\n${page}: nothing written.`); process.exitCode = 1; return; }

  fs.writeFileSync(`build/templates/${page}.tpl.html`, tpl.replace(/\r\n/g, '\n'));
  fs.writeFileSync(`content/${page}.yml`,
    `# The editable content of the ${page} page.\n`
    + `#\n`
    + `# Generated by build/extract-page.mjs from the page's own markup, and from\n`
    + `# now on the source of truth for it. build/templates/${page}.tpl.html is that\n`
    + `# same markup with these values replaced by tokens; build/gen-pages.mjs puts\n`
    + `# the two back together. Edit here, or through /admin/, never in the HTML.\n`
    + `#\n`
    + `# Names come from the markup's own structure -- section, then class, then\n`
    + `# position -- so they can be read, but they are not promises: re-extracting\n`
    + `# after a layout change can rename them.\n\n`
    + dump(data, { lineWidth: 100, noRefs: true }));

  console.log(`  ${page.padEnd(16)} ${textCount} texts, ${imageCount} images, ${listCount} list(s)`
    + `  -> ${(tpl.length / 1024).toFixed(1)} KB template`);
}

/* Stamp the element with the field it came from, so the editor can map a
   click on the page back to a line in a YAML file. */
function withEditAttr(openTagAndBefore, path) {
  const tagEnd = openTagAndBefore.lastIndexOf('>');
  if (tagEnd < 0) return openTagAndBefore;
  if (/ data-edit=/.test(openTagAndBefore)) return openTagAndBefore;
  return openTagAndBefore.slice(0, tagEnd) + ` data-edit="${path}"` + openTagAndBefore.slice(tagEnd);
}

function withImageAttrs(tag, srcPath, altPath) {
  const tagEnd = tag.lastIndexOf('>');
  if (tagEnd < 0 || / data-edit-src=/.test(tag)) return tag;
  return tag.slice(0, tagEnd) + ` data-edit-src="${srcPath}" data-edit-alt="${altPath}"` + tag.slice(tagEnd);
}
