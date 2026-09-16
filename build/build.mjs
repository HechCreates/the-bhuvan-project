/* Assemble dist/ from source.

   src/index.html holds all twelve pages in one document, which is how it was
   authored and how every patch script in build/ still edits it. What it is NOT
   any more is how the site is published. A hash router put all twelve pages at
   one URL, and a URL fragment is invisible to every crawler there is: Google
   has never indexed "#/", and GPTBot, ClaudeBot and PerplexityBot do not run
   the router at all. Twelve pages of work were competing as one document with
   one title and one description.

   So this build cuts the document up. Each page in content/pages.yml becomes
   its own file at its own path, carrying only its own markup, its own <title>,
   description and canonical, and the shared chrome rendered from
   content/site.yml. The markup inside each page is copied byte for byte --
   build/verify-build.mjs proves it -- so the design cannot drift.

   Paths are rewritten relative to each page's depth rather than made
   root-relative, because the site is staged on a GitHub project page at
   /the-bhuvan-project/ and will launch at the root of its own domain. Relative
   paths are correct on both without a base tag or a configured prefix.

   Deliberately NOT part of this build: image resizing and icon generation.
   Those need sharp, they only matter when a source image changes, and making
   every deploy depend on a native binary is a poor trade. The generated files
   are committed; `npm run assets` regenerates them locally when needed.     */

import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import { header, footer, site, esc } from './templates/chrome.mjs';
import { schemaFor } from './templates/schema.mjs';

const SRC = 'src/index.html';
const DIST = 'dist';
const log = [];
const t0 = Date.now();

const { pages } = load(fs.readFileSync('content/pages.yml', 'utf8'));
const byKey = new Map(pages.map(p => [p.key, p]));

/* ---- clean ---- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const src = fs.readFileSync(SRC, 'utf8');

/* ---- 1. cut the source into head / pages / tail --------------------------
   The tail is the shared script and the contact modal: everything after the
   last page div. Both go into every page unchanged. */
const headEnd = src.indexOf('</head>');
const bodyOpen = src.indexOf('>', src.indexOf('<body')) + 1;
if (headEnd < 0 || bodyOpen < 1) { console.error('FAIL: no </head> or <body>'); process.exit(1); }

const head = src.slice(0, headEnd);
const bodyTag = src.slice(headEnd + '</head>'.length, bodyOpen);

const marks = [...src.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
if (marks.length !== pages.length) {
  console.error(`FAIL: src has ${marks.length} page divs, content/pages.yml lists ${pages.length}`);
  process.exit(1);
}
const tailStart = src.indexOf('<script>', marks[marks.length - 1].index);
const tail = src.slice(tailStart);

const markup = new Map();
marks.forEach((m, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].index : tailStart;
  markup.set(m[1], src.slice(m.index, end));
});
for (const p of pages) {
  if (!markup.has(p.key)) { console.error(`FAIL: no markup for "${p.key}"`); process.exit(1); }
}

/* ---- 2. the origin, read out of the canonical tag ----------------------
   One source of truth, the same one build/set-indexing.mjs rewrites when the
   site moves to its own domain. */
const ORIGIN = (head.match(/<link rel="canonical" href="(https:\/\/[^"]*?)\/">/) || [])[1];
if (!ORIGIN) { console.error('FAIL: could not read the canonical origin'); process.exit(1); }

/* ---- 3. link and asset rewriting ---------------------------------------
   Two passes, in this order. The hash links become real paths first, then
   every still-relative reference on the page is lifted to the page's depth. */
const depthOf = url => (url === '' ? 0 : url.split('/').length);
const relTo = (url, depth) => (depth === 0 ? (url === '' ? './' : `${url}/`)
                                           : '../'.repeat(depth) + (url === '' ? '' : `${url}/`));

/* "#/projects/karavulapalli-farm" is the old route; the page key is the slug
   with a "p-" in front. Everything else is the key itself. */
const hashTarget = hash => {
  const r = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (r === '') return byKey.get('home');
  if (r.startsWith('projects/')) return byKey.get('p-' + r.slice('projects/'.length));
  return byKey.get(r);
};

const ABS = /^(?:https?:|mailto:|tel:|data:|#|\/)/;

/* Lift every still-relative reference to this page's depth. Must run BEFORE
   the hash links are resolved: relTo already returns a path relative to the
   page, and prefixing it a second time is how /about/ ends up asking for
   ../../about/. Hash links start with "#", so this pass skips them. */
const prefixAssets = (html, depth) => depth === 0 ? html
  : html
    .replace(/(src|href|data-open-shot)="([^"]+)"/g, (m, a, v) =>
      ABS.test(v) ? m : `${a}="${'../'.repeat(depth)}${v}"`)
    /* srcset is a comma-separated list of "url descriptor" pairs, so each
       candidate needs lifting on its own -- treating the whole attribute as
       one path silently breaks every image in the set */
    /* CSS url() in the inline stylesheet -- the self-hosted @font-face rules
       point at images/fonts/, and a font path is no more absolute than an
       image one. Missing this leaves every page below the root rendering in
       the fallback typeface, which looks like a design bug, not a path bug. */
    .replace(/url\((images\/[^)'"]+)\)/g, (m, v) => `url(${'../'.repeat(depth)}${v})`)
    .replace(/srcset="([^"]+)"/g, (m, v) => 'srcset="' + v.split(',').map(part => {
      const t = part.trim();
      if (!t) return t;
      const sp = t.indexOf(' ');
      const url = sp < 0 ? t : t.slice(0, sp);
      const rest = sp < 0 ? '' : t.slice(sp);
      return (ABS.test(url) ? url : '../'.repeat(depth) + url) + rest;
    }).join(', ') + '"');

const resolveLinks = (html, depth) => html
  .replace(/href="(#\/[^"]*)"/g, (m, h) => {
    const t = hashTarget(h);
    if (!t) { console.error(`FAIL: link to unknown route ${h}`); process.exitCode = 1; return m; }
    return `href="${relTo(t.url, depth)}"`;
  })
  // the router used to intercept these; the href is the whole mechanism now
  .replace(/ data-route="[^"]*"/g, '');

const rewrite = (html, depth) => resolveLinks(prefixAssets(html, depth), depth);

/* Links to the old hash routes were shared for months while the design was
   being reviewed, and they are sitting in inboxes. One redirect, before the
   page paints, costs a few hundred bytes and keeps every one of them working. */
const legacyRedirect = depth => {
  const map = {};
  for (const p of pages) {
    const hash = p.key === 'home' ? '#/'
      : p.key.startsWith('p-') ? `#/projects/${p.key.slice(2)}`
      : `#/${p.key}`;
    map[hash] = relTo(p.url, depth);
  }
  return `<script>(function(){var m=${JSON.stringify(map)},h=location.hash;`
    + `if(h.slice(0,2)==="#/"){var t=m[h]||m[h.replace(/\\/+$/,"")]||m[h+"/"];`
    + `if(t)location.replace(t);}})();</script>`;
};

/* ---- 4. the head, per page --------------------------------------------- */
const swapMeta = (h, re, replacement, what) => {
  if (!re.test(h)) { console.error(`FAIL: head has no ${what}`); process.exitCode = 1; return h; }
  return h.replace(re, replacement);
};

const pageHead = (p, depth) => {
  const canonical = `${ORIGIN}/${p.url ? p.url + '/' : ''}`;
  let h = head;
  h = swapMeta(h, /<title>[^<]*<\/title>/, `<title>${esc(p.title)}</title>`, '<title>');
  h = swapMeta(h, /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${esc(p.desc)}">`, 'meta description');
  h = swapMeta(h, /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${canonical}">`, 'canonical');
  h = swapMeta(h, /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${canonical}">`, 'og:url');
  h = swapMeta(h, /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${esc(p.title)}">`, 'og:title');
  h = swapMeta(h, /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${esc(p.desc)}">`, 'og:description');
  h = swapMeta(h, /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${esc(p.title)}">`, 'twitter:title');
  h = swapMeta(h, /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${esc(p.desc)}">`, 'twitter:description');
  // the favicons and the manifest are relative too, so the head needs the same
  // depth treatment as the body; og:image and the canonical are absolute
  return prefixAssets(h, depth)
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + legacyRedirect(depth));
};

/* ---- 5. chrome ---------------------------------------------------------- */
/* which nav item to mark: a project page belongs under Projects */
const navRouteFor = key => (key.startsWith('p-') ? 'projects' : key);

const withChrome = (html, key) => {
  const cur = navRouteFor(key);
  const swap = (open, close, render) => {
    let out = '', i = 0;
    for (;;) {
      const a = html.indexOf(open, i);
      if (a < 0) break;
      const b = html.indexOf(close, a) + close.length;
      out += html.slice(i, a) + render();
      i = b;
    }
    html = out + html.slice(i);
  };
  swap('<header class="site-header"', '</header>', () => header(cur));
  swap('<footer class="footer">', '</footer>', () => footer());
  return html;
};

/* One page per document, so it is always the active one. The router used to
   add this class; now the build does, and a page renders even if JS never
   runs -- which is exactly the case for most AI crawlers. */
const markActive = html => {
  const end = html.indexOf('>') + 1;
  const tag = html.slice(0, end);
  return (/ class="/.test(tag)
    ? tag.replace(/ class="([^"]*)"/, (m, c) => ` class="${c} is-active"`)
    : tag.replace(/>$/, ' class="is-active">')) + html.slice(end);
};

/* ---- 6. write the pages -------------------------------------------------- */
let written = 0, bytes = 0;
for (const p of pages) {
  const depth = depthOf(p.url);
  const body = markActive(withChrome(markup.get(p.key), p.key));
  /* the schema reads the page's own markup, so it is generated from the body
     that is actually shipped -- never from a second description of it */
  const doc = pageHead(p, depth) + schemaFor(ORIGIN, p, body) + '</head>'
    + bodyTag + rewrite(body + '\n' + tail, depth);
  const dir = p.url ? path.join(DIST, p.url) : DIST;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), doc);
  written++; bytes += doc.length;
  log.push(`  /${p.url ? p.url + '/' : ''}`.padEnd(48) + `${(doc.length / 1024).toFixed(0)} KB`);
}
log.unshift(`${written} pages, ${(bytes / 1024 / written).toFixed(0)} KB average `
  + `(was one ${(src.length / 1024).toFixed(0)} KB document at one URL)`);

/* ---- 7. sitemap ---------------------------------------------------------
   Derived from content/pages.yml, so a page cannot be published without being
   listed. build/set-indexing.mjs decides whether robots.txt advertises it. */
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  + pages.map(p => `  <url>\n    <loc>${ORIGIN}/${p.url ? p.url + '/' : ''}</loc>\n`
      + `    <lastmod>${today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')
  + `\n</urlset>\n`);
log.push(`sitemap.xml  ${pages.length} URLs`);

/* ---- 8. static passthrough ---------------------------------------------- */
const copyDir = (from, to) => {
  let n = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); n += copyDir(a, b); }
    else { fs.copyFileSync(a, b); n++; }
  }
  return n;
};
log.push(`static/   ${copyDir('static', DIST)} files copied`);
fs.mkdirSync(path.join(DIST, 'images'), { recursive: true });
log.push(`images/   ${copyDir('images', path.join(DIST, 'images'))} files copied`);

/* ---- 8b. redirects from the old Squarespace site ------------------------
   GitHub Pages cannot issue a 301: there is no server configuration to put
   one in. So each old URL gets a small HTML stub instead -- a canonical to
   the new page, an instant meta refresh, and a script fallback. Google treats
   a zero-delay refresh as a redirect and the canonical carries the signals
   either way; it is weaker than a real 301 and it is what this host allows.

   The stub is written as <path>.html rather than <path>/index.html so the old
   extensionless URL is answered in one hop instead of redirecting to a
   trailing slash first.

   A _redirects file is generated alongside it with genuine 301s. GitHub Pages
   ignores that file, but Cloudflare Pages and Netlify honour it, so moving
   the site to either of those upgrades every one of these to a real 301 with
   no further work.

   No noindex on the stubs: it would contradict the canonical and could stop
   the signals passing at all. */
{
  const { redirects } = load(fs.readFileSync('content/redirects.yml', 'utf8'));
  const known = new Set(pages.map(p => p.url));
  let n = 0;
  const rules = [];

  for (const r of redirects) {
    if (!known.has(r.to)) {
      console.error(`FAIL: redirect ${r.from} points at "${r.to}", which is not a page`);
      process.exitCode = 1; continue;
    }
    const target = `/${r.to ? r.to + '/' : ''}`;
    const absolute = `${ORIGIN}${target}`;
    /* /portfolio-1 is both a redirect of its own and the parent of eight
       others, so a portfolio-1.html file would sit beside a portfolio-1/
       directory and which one a host serves is anyone's guess. Where a path
       is also a parent, the stub goes inside it as index.html and costs one
       extra hop; everywhere else it is <path>.html and answers directly. */
    const bare = r.from.replace(/^\//, '');
    const isParent = redirects.some(o => o !== r && o.from.startsWith(r.from + '/'));
    const file = path.join(DIST, isParent ? path.join(bare, 'index.html') : bare + '.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file,
      `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n`
      + `<title>Moved — The Bhu.Van Project</title>\n`
      + `<link rel="canonical" href="${absolute}">\n`
      + `<meta http-equiv="refresh" content="0; url=${absolute}">\n`
      + `<script>location.replace(${JSON.stringify(absolute)})</script>\n`
      + `</head>\n<body>\n`
      + `<p>This page has moved to <a href="${absolute}">${absolute}</a>.</p>\n`
      + `</body>\n</html>\n`);
    rules.push(`${r.from}  ${target}  301`);
    n++;
  }

  /* generated rules first: a catch-all placed above them would swallow every
     one of them before they were ever reached */
  const existing = fs.existsSync(path.join(DIST, '_redirects'))
    ? fs.readFileSync(path.join(DIST, '_redirects'), 'utf8') : '';
  fs.writeFileSync(path.join(DIST, '_redirects'),
    `# Generated from content/redirects.yml. GitHub Pages ignores this file and\n`
    + `# uses the .html stubs instead; Cloudflare Pages and Netlify honour it and\n`
    + `# turn every line below into a real 301.\n`
    + rules.join('\n') + '\n\n' + existing);
  log.push(`redirects ${n} old URLs -> stubs + _redirects 301s`);
}

/* ---- 9. 404 -------------------------------------------------------------
   GitHub Pages serves this for any unknown path. It used to be a copy of the
   whole site, which hands a crawler the homepage at an unlimited number of
   URLs -- a soft 404. It is now its own small page that says so. */
{
  const notFound = `<div data-page="notfound" class="project-page is-active">
${header('')}
  <section class="pi-open" style="min-height:46vh;display:flex;align-items:center">
    <div class="wrap">
      <div class="sec-head"><h1 class="sec-title">Page not found<span class="sec-kicker">.</span></h1></div>
      <p class="pi-sub" style="max-width:52ch;margin:0 0 1.6rem">That link does not lead anywhere on this site. The work is all still here &mdash; start from the projects, or go back to the beginning.</p>
      <p><a class="pi-cue" href="#/projects">See the projects <span aria-hidden="true">&rarr;</span></a></p>
      <p><a class="pi-cue" href="#/">Go to the homepage <span aria-hidden="true">&rarr;</span></a></p>
    </div>
  </section>
${footer()}
</div>`;
  let h = pageHead({ url: '', title: 'Page not found — The Bhu.Van Project',
    desc: 'That link does not lead anywhere on this site.' }, 0);
  // a 404 must never be indexed, whatever the site-wide posture is, and it has
  // no canonical of its own: it is served at whatever URL was not found
  h = h.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, follow">')
       .replace(/<link rel="canonical" href="[^"]*">\r?\n?/, '')
       .replace(/<meta property="og:url" content="[^"]*">\r?\n?/, '');
  fs.writeFileSync(path.join(DIST, '404.html'),
    h + '</head>' + bodyTag + rewrite(notFound + '\n' + tail, 0));
  log.push('404.html  its own page, noindex');
}

/* ---- report ---- */
const size = (function walk(d) {
  let n = 0;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    n += e.isDirectory() ? walk(p) : fs.statSync(p).size;
  }
  return n;
})(DIST);
console.log(log.map(l => '  ' + l).join('\n'));
console.log(`\n  dist/ ${(size / 1048576).toFixed(1)} MB in ${Date.now() - t0}ms`
  + `   nav: ${site.nav.length} entries from content/site.yml`);
