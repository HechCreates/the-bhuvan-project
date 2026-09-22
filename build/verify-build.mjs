/* Prove the build did not change the site, only where it lives.

   src/index.html holds twelve pages in one document; dist/ holds them as
   twelve documents at twelve paths. Two things have to be true for that to be
   a safe transformation, and this checks both.

   1. NOTHING CHANGED BUT THE PATHS.
      For each page, take its markup out of the source and out of the built
      file, remove the chrome (which is rendered from content/site.yml on
      purpose) and blank out every src= and href= VALUE -- those are the only
      things the build is allowed to rewrite. What is left is text, tags,
      classes, alt text, inline styles, ARIA. It must match byte for byte
      after whitespace and entity normalisation. A dropped paragraph, a
      reordered section, a mangled attribute or a lost image all fail here.

   2. EVERY PATH RESOLVES.
      The paths the first check blanked out are then checked on their own:
      every relative src and href in every built page must point at a file
      that exists, from that page's own depth. This is what catches a missing
      ../ -- the single likeliest way to break a site by moving its pages.

   Plus the things that are only true once pages are separate: one canonical
   per page and all of them distinct, one <title> per page and all distinct,
   exactly one <h1>, and no leftover "#/" links from the router era.        */

import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';

const SRC = 'src/index.html';
const DIST = 'dist';
const { pages } = load(fs.readFileSync('content/pages.yml', 'utf8'));
let failed = 0;
const fail = m => { console.log('  FAIL  ' + m); failed++; };

/* the origin the build stamped into canonicals, read back from what shipped */
const ORIGIN_FOR_CHECK = (fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
  .match(/<link rel="canonical" href="(https:[^"]*?)\/">/) || [])[1];

const ENT = { middot: '·', copy: '©', amp: '&', rarr: '→', larr: '←', lsaquo: '‹', rsaquo: '›',
              ldquo: '“', rdquo: '”', nbsp: ' ', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
              times: '×', hellip: '…', deg: '°', amp_: '&' };

/* the chrome is rendered from content/site.yml, so it is expected to differ */
const stripChrome = t => t
  .replace(/<header class="site-header"[\s\S]*?<\/header>/g, '')
  .replace(/<footer class="footer">[\s\S]*?<\/footer>/g, '');

const norm = t => stripChrome(t)
  .replace(/(src|href|srcset|data-open-shot)="[^"]*"/g, '$1=""')  // the build rewrites these by design
  .replace(/ data-route="[^"]*"/g, '')           // and strips these
  .replace(/&([a-z]+);/g, (m, n) => ENT[n] ?? m)
  .replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

/* ---- pull each page out of the source ---- */
const src = fs.readFileSync(SRC, 'utf8');
const marks = [...src.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
const tailStart = src.indexOf('<script>', marks[marks.length - 1].index);
const srcPage = new Map();
marks.forEach((m, i) => srcPage.set(m[1], src.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : tailStart)));

/* ---- 1. content identity ---- */
console.log('content identity (chrome and paths excluded)');
for (const p of pages) {
  const file = path.join(DIST, p.url, 'index.html');
  if (!fs.existsSync(file)) { fail(`${p.key}: ${file} was not built`); continue; }
  const built = fs.readFileSync(file, 'utf8');

  // the page div runs from <body> to the shared script
  const a = built.indexOf('<div ', built.indexOf('<body'));
  const b = built.indexOf('<script>', a);
  if (a < 0 || b < 0) { fail(`${p.key}: could not find the page div in the built file`); continue; }

  // is-active is added by the build: either as a new class attribute on a page
  // div that had none, or appended to the class list of one that did
  const got = norm(built.slice(a, b))
    .replace(/ class="is-active"/, '')
    .replace(/ is-active"/, '"');
  const want = norm(srcPage.get(p.key));
  if (got === want) { console.log(`  ok    /${p.url ? p.url + '/' : ''}`.padEnd(52) + `${want.length.toLocaleString()} chars`); continue; }

  let i = 0; while (i < got.length && i < want.length && got[i] === want[i]) i++;
  fail(`${p.key}: content differs at char ${i.toLocaleString()}`);
  console.log('        source …' + want.slice(Math.max(0, i - 90), i + 90));
  console.log('        built  …' + got.slice(Math.max(0, i - 90), i + 90));
}

/* ---- 2. every path resolves, from that page's own depth ---- */
console.log('\npath resolution');
let refs = 0, broken = 0;
const htmlFiles = [...pages.map(p => [`/${p.url ? p.url + '/' : ''}`, path.join(DIST, p.url, 'index.html')]),
                   ['404.html', path.join(DIST, '404.html')]];
for (const [url, file] of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  for (const m of html.matchAll(/(?:src|href)="((?!https?:|#|mailto:|tel:|data:)[^"]*)"/g)) {
    const v = m[1];
    if (v === '') continue;
    refs++;
    // a directory URL ("about/", "../") is served as its index.html
    const target = v.endsWith('/') ? path.join(dir, v, 'index.html') : path.join(dir, v);
    if (!fs.existsSync(target)) { fail(`${url} -> ${v}  (looked for ${path.relative(DIST, target)})`); broken++; }
  }
}
console.log(`  ${refs} src/href references checked, ${broken} broken`);

/* An image path does not have to live in a src attribute. The Visual Journey
   lightbox keeps 214 of them in data-open-shot, and JS reads that attribute
   straight into img.src -- so it needs the same ../ the markup got, and
   nothing in the src/href pass above would ever have noticed it missing.
   This checks EVERY attribute value that points into images/, whatever it is
   called, so the next such attribute is caught the day it is added. */
console.log('\nimage paths in other attributes');
let other = 0, otherBroken = 0;
const kinds = new Set();
for (const [url, file] of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  /* CSS url() in the inline stylesheet: the self-hosted @font-face rules live
     here, and a wrong depth means the page silently renders in the fallback
     typeface on every URL below the root. */
  for (const m of html.matchAll(/url\(((?:\.\.\/)*images\/[^)'"]+)\)/g)) {
    other++; kinds.add('css url()');
    if (!fs.existsSync(path.join(dir, m[1]))) {
      otherBroken++;
      if (otherBroken <= 3) fail(`${url} url(${m[1]}) does not resolve`);
    }
  }
  for (const m of html.matchAll(/([a-z-]+)="((?:\.\.\/)*images\/[^"]*)"/g)) {
    if (m[1] === 'src' || m[1] === 'href') continue;
    kinds.add(m[1]);
    /* srcset holds a list of "url descriptor" pairs, not one path; every
       candidate has to resolve or some screen widths get a broken image */
    const candidates = m[1] === 'srcset'
      ? m[2].split(',').map(p => p.trim().split(/\s+/)[0]).filter(Boolean)
      : [m[2]];
    for (const c of candidates) {
      other++;
      if (!fs.existsSync(path.join(dir, c))) {
        otherBroken++;
        if (otherBroken <= 3) fail(`${url} ${m[1]} candidate "${c}" does not resolve`);
      }
    }
  }
}
console.log(`  ${other} checked in ${[...kinds].join(', ') || 'no other attributes'}, ${otherBroken} broken`);

/* ---- 2c. nothing third-party in the critical path ----
   The typefaces are self-hosted so that no page waits on fonts.googleapis.com
   before it can paint. A single stray link would quietly put that round trip
   back, on whichever page it crept into. */
{
  const offenders = htmlFiles.filter(([, f]) => fs.existsSync(f)
    && /fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(f, 'utf8')));
  if (offenders.length) fail(`third-party font requests on: ${offenders.map(o => o[0]).join(', ')}`);
  else console.log('  no third-party font requests');
}

/* ---- 2d. no placeholder alt text ----
   115 images once shipped as alt="undefined, photograph 12", because a
   template read a variable that was not set. It is invisible on the page,
   passes any "does this image have alt text" check, and is what a blind
   visitor actually hears. Templating accidents spell themselves the same
   way every time, so they are worth naming. */
{
  let bad = 0;
  for (const [url, file] of htmlFiles) {
    if (!fs.existsSync(file)) continue;
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/\balt="([^"]*)"/g)) {
      if (!/\b(undefined|null|NaN|\[object Object\])\b/.test(m[1])) continue;
      bad++;
      if (bad <= 3) fail(`${url} has placeholder alt text: "${m[1].slice(0, 60)}"`);
    }
  }
  console.log(bad ? `  ${bad} placeholder alt attributes` : '  no placeholder alt text');
}

/* ---- 3. no hash links survive ---- */
const stale = htmlFiles.filter(([, f]) => fs.existsSync(f) && /href="#\//.test(fs.readFileSync(f, 'utf8')));
if (stale.length) fail(`hash links left in: ${stale.map(s => s[0]).join(', ')}`);
else console.log('  no "#/" links remain');

/* ---- 4. head uniqueness ---- */
console.log('\nhead');
const seen = { canonical: new Map(), title: new Map(), desc: new Map() };
for (const p of pages) {
  const file = path.join(DIST, p.url, 'index.html');
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const one = (re, what) => {
    const all = [...head.matchAll(re)];
    if (all.length !== 1) fail(`/${p.url} has ${all.length} ${what}`);
    return all.length ? all[0][1] : null;
  };
  const c = one(/<link rel="canonical" href="([^"]*)">/g, 'canonical tags');
  const t = one(/<title>([^<]*)<\/title>/g, '<title> tags');
  const d = one(/<meta name="description" content="([^"]*)">/g, 'meta descriptions');
  for (const [k, v] of [['canonical', c], ['title', t], ['desc', d]]) {
    if (v == null) continue;
    if (seen[k].has(v)) fail(`duplicate ${k} on /${p.url} and /${seen[k].get(v)}: "${v.slice(0, 60)}"`);
    else seen[k].set(v, p.url);
  }
  if (c && !c.endsWith(p.url ? p.url + '/' : '/')) fail(`/${p.url} canonical points at ${c}`);
  const h1 = (html.match(/<h1[ >]/g) || []).length;
  if (h1 !== 1) fail(`/${p.url || ''} has ${h1} <h1> elements (want exactly 1)`);
}
console.log(`  ${seen.title.size} distinct titles, ${seen.desc.size} distinct descriptions, ${seen.canonical.size} distinct canonicals`);

/* ---- 4b. the schema.org graph ----
   A graph is only as good as its references. An @id pointing at a node that
   was never declared is invisible in the rendered page, valid JSON, and
   silently useless to the engine reading it -- so every reference is resolved
   against the nodes actually present on that page. */
console.log('\nstructured data');
{
  let nodes = 0, refs = 0;
  for (const [url, file] of htmlFiles) {
    if (!fs.existsSync(file)) continue;
    const blocks = [...fs.readFileSync(file, 'utf8')
      .matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    const where = url;
    // the 404 is noindex and carries no schema on purpose
    if (url === '404.html') continue;
    if (blocks.length !== 1) { fail(`${where} has ${blocks.length} ld+json blocks (want 1)`); continue; }
    let graph;
    try { graph = JSON.parse(blocks[0][1])['@graph']; }
    catch (e) { fail(`${where} ld+json does not parse: ${e.message}`); continue; }
    if (!Array.isArray(graph) || !graph.length) { fail(`${where} has an empty @graph`); continue; }

    /* A node is DECLARED wherever it is spelled out, which in JSON-LD includes
       nested objects -- the Organization's logo is an ImageObject with its own
       @id sitting inside the logo property, and it is a real declaration. A
       REFERENCE is the other shape: an object whose only key is @id. */
    const declared = new Set(), seenRefs = [];
    (function walk(v) {
      if (Array.isArray(v)) return v.forEach(walk);
      if (!v || typeof v !== 'object') return;
      const keys = Object.keys(v);
      if (keys.length === 1 && keys[0] === '@id') { seenRefs.push(v['@id']); return; }
      if (v['@id']) declared.add(v['@id']);
      keys.forEach(k => walk(v[k]));
    })(graph);
    for (const r of new Set(seenRefs)) {
      if (!declared.has(r)) fail(`${where} references ${r} but no node declares it`);
    }
    nodes += graph.length; refs += seenRefs.length;

    const o = graph.find(n => [].concat(n['@type']).includes('Organization'));
    if (!o) fail(`${where} declares no Organization`);
    else for (const req of ['name', 'url', 'description', 'logo', 'address'])
      if (!o[req]) fail(`${where} Organization is missing ${req}`);
  }
  console.log(`  ${nodes} nodes across ${htmlFiles.length} pages, ${refs} @id references, all resolved`);
  const org = JSON.parse(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
    .match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
    .find(n => [].concat(n['@type']).includes('Organization'));
  if (!org.sameAs) console.log('  NOTE  Organization has no sameAs: no third-party profile ties this '
    + 'site to the studio as an entity. Add social/profile URLs to content/site.yml.');
}

/* ---- 4c. the migration map ----
   Every old Squarespace URL must have a stub, and every stub must point at a
   page that exists. A redirect into a 404 is worse than no redirect: it
   throws away the signal AND costs the visitor a dead end. */
console.log('\nredirects from the old site');
{
  const { redirects } = load(fs.readFileSync('content/redirects.yml', 'utf8'));
  const known = new Set(pages.map(p => p.url));
  let ok = 0;
  for (const r of redirects) {
    if (!known.has(r.to)) { fail(`${r.from} points at "${r.to}", which is not a page in content/pages.yml`); continue; }
    // a path that is also the parent of other redirects keeps its stub inside
    // it, so a .html file never sits beside a directory of the same name
    const bare = r.from.replace(/^\//, '');
    const isParent = redirects.some(o => o !== r && o.from.startsWith(r.from + '/'));
    const stub = path.join(DIST, isParent ? path.join(bare, 'index.html') : bare + '.html');
    if (!fs.existsSync(stub)) { fail(`${r.from} has no stub at ${path.relative(DIST, stub)}`); continue; }
    const html = fs.readFileSync(stub, 'utf8');
    const target = `${ORIGIN_FOR_CHECK}/${r.to ? r.to + '/' : ''}`;
    if (!html.includes(`<link rel="canonical" href="${target}">`)) fail(`${r.from} stub canonical is not ${target}`);
    else if (!html.includes(`content="0; url=${target}"`)) fail(`${r.from} stub does not refresh to ${target}`);
    else ok++;
  }
  /* a redirect must never point at another redirect */
  const froms = new Set(redirects.map(r => r.from.replace(/^\//, '')));
  for (const r of redirects) if (froms.has(r.to)) fail(`${r.from} redirects to ${r.to}, which is itself a redirect`);
  console.log(`  ${ok}/${redirects.length} old URLs resolve to a real page in one hop`);
}

/* ---- 5. nothing shipped that nothing asks for ---- */
const used = new Set();
for (const [, file] of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  for (const m of html.matchAll(/(?:src|href)="((?!https?:|#|mailto:|tel:|data:)[^"]*)"/g)) {
    if (m[1] && !m[1].endsWith('/')) used.add(path.relative(DIST, path.join(dir, m[1])).replace(/\\/g, '/'));
  }
  // a font reached only through a CSS url() is still in use
  for (const m of html.matchAll(/url\(((?:\.\.\/)*images\/[^)'"]+)\)/g)) {
    used.add(path.relative(DIST, path.join(dir, m[1])).split(path.sep).join('/'));
  }
  // an image reached only through srcset or data-open-shot is still in use
  for (const m of html.matchAll(/(?:srcset|data-open-shot)="([^"]+)"/g)) {
    for (const p of m[1].split(',').map(x => x.trim().split(/\s+/)[0]).filter(Boolean)) {
      used.add(path.relative(DIST, path.join(dir, p)).replace(/\\/g, '/'));
    }
  }
}
const orphans = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else {
      const rel = path.relative(DIST, f).replace(/\\/g, '/');
      if (rel.startsWith('images/') && !used.has(rel)) orphans.push(rel);
    }
  }
})(DIST);
console.log(`\norphaned images: ${orphans.length ? orphans.length + '\n  ' + orphans.slice(0, 10).join('\n  ') : 'none'}`);
if (orphans.length) failed++;

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed — the split changed where the pages live, nothing else.');
if (failed) process.exitCode = 1;
