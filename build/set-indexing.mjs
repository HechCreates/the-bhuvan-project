/* Flip search indexing on or off, and optionally move the site to a new origin.

     node build/set-indexing.mjs off
     node build/set-indexing.mjs on  https://bhuvanproject.com

   "off" is the staging posture: crawlers may still FETCH the page, they are
   just refused permission to index it. That distinction matters twice over.
   A robots.txt "Disallow" would stop Google fetching at all, so it would never
   see the noindex and could still list a bare URL; and Facebook, LinkedIn,
   Twitter, Slack and WhatsApp all honour robots.txt, so disallowing would also
   kill the link preview card. Hence: crawling open, indexing refused.

   Passing an origin rewrites canonical, og:url, twitter/og image URLs, the
   sitemap and robots.txt together. That is the step that avoids the canonical
   trap, where a new domain keeps pointing search engines back at the old one. */

import fs from 'fs';
import path from 'path';

const SRC = 'src/index.html';
const D = 'static';
const mode = (process.argv[2] || '').toLowerCase();
const newOrigin = process.argv[3];

if (mode !== 'on' && mode !== 'off') {
  console.log('usage: node build/set-indexing.mjs <on|off> [https://new-origin]');
  process.exit(1);
}
if (newOrigin && !/^https:\/\/[^/]+$/.test(newOrigin)) {
  console.log('origin must look like https://example.com with no trailing slash');
  process.exit(1);
}

let s = fs.readFileSync(SRC, 'utf8');
const log = [];

/* ---- current origin, read out of the canonical tag ---- */
const cur = (s.match(/<link rel="canonical" href="(https:\/\/[^/"]+)\//) || [])[1];
if (!cur) { console.log('FAIL: could not read the canonical origin'); process.exit(1); }
const origin = newOrigin || cur;

/* ---- 1. the robots meta ---- */
const robotsMeta = mode === 'on' ? 'index, follow' : 'noindex, nofollow';
const RE = /<meta name="robots" content="[^"]*">/;
// test for the tag rather than for a changed string: re-running with the mode
// already set is a no-op, not a failure
if (!RE.test(s)) { console.log('FAIL: no robots meta found'); process.exit(1); }
s = s.replace(RE, `<meta name="robots" content="${robotsMeta}">`);
log.push(`ok    meta robots -> "${robotsMeta}"`);

/* ---- 2. origin rewrite ---- */
if (newOrigin && newOrigin !== cur) {
  const n = s.split(cur).length - 1;
  s = s.split(cur).join(newOrigin);
  log.push(`ok    origin ${cur} -> ${newOrigin} (${n} references)`);
}
fs.writeFileSync(SRC, s);
log.push('ok    src/index.html updated; run `npm run build` to publish');

/* ---- 3. robots.txt: crawling stays open either way ---- */
const robotsTxt = mode === 'on'
  ? `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
  : `# Staging. Crawling is deliberately left open so that crawlers can read the\n`
  + `# noindex in the page, and so link previews keep working; indexing is\n`
  + `# refused by the meta tag and the X-Robots-Tag header instead.\n`
  + `User-agent: *\nAllow: /\n`;
fs.writeFileSync(path.join(D, 'robots.txt'), robotsTxt);
log.push(`ok    robots.txt (crawling allowed, sitemap ${mode === 'on' ? 'advertised' : 'withheld'})`);

/* ---- 4. sitemap only when indexable ---- */
const sitemapPath = path.join(D, 'sitemap.xml');
if (mode === 'on') {
  fs.writeFileSync(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`);
  log.push('ok    sitemap.xml written');
} else if (fs.existsSync(sitemapPath)) {
  fs.unlinkSync(sitemapPath);
  log.push('ok    sitemap.xml removed');
}

/* ---- 5. X-Robots-Tag, which also covers the images ---- */
const HEAD_FILE = path.join(D, '_headers');
let h = fs.readFileSync(HEAD_FILE, 'utf8');
const MARK_A = '# --- indexing (managed by build/set-indexing.mjs) ---';
const MARK_B = '# --- end indexing ---';
const block = mode === 'on' ? '' :
`${MARK_A}
# Covers og-image.jpg and the photographs too, which a meta tag cannot reach.
/*
  X-Robots-Tag: noindex, nofollow
${MARK_B}

`;
h = h.replace(new RegExp(MARK_A.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      + '[\\s\\S]*?' + MARK_B.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n*'), '');
h = block + h;

/* Images revalidate on every view while the design is under review, so a
   re-crop actually reaches the reviewer. At launch the pictures stop changing
   and a month of caching is the right trade. */
const IMG_STAGING = '/images/*\n  Cache-Control: public, max-age=0, must-revalidate';
const IMG_LIVE = '/images/*\n  Cache-Control: public, max-age=2592000';
const [from, to] = mode === 'on' ? [IMG_STAGING, IMG_LIVE] : [IMG_LIVE, IMG_STAGING];
if (h.includes(from)) { h = h.replace(from, to); log.push(`ok    _headers /images/* -> ${mode === 'on' ? 'a month' : 'revalidate'}`); }
else if (h.includes(to)) log.push(`ok    _headers /images/* already ${mode === 'on' ? 'a month' : 'revalidate'}`);
else { log.push('FAIL  _headers: no /images/* cache rule found'); process.exitCode = 1; }

fs.writeFileSync(HEAD_FILE, h);
log.push(`ok    _headers X-Robots-Tag ${mode === 'on' ? 'removed' : 'added'}`);

/* ---- 6. the catch-all's status code ----
   _redirects sends every unknown path to index.html. At 200 that is friendly
   staging behaviour: a stray link shows the site rather than Netlify's 404
   page. Once the site is indexable the same rule would hand a crawler the
   whole homepage at an unlimited number of URLs, so it flips to 404 - the
   same page for a human, the correct status for a crawler. */
{
  const RED = path.join(D, '_redirects');
  const code = mode === 'on' ? '404' : '200';
  fs.writeFileSync(RED, `/*    /index.html   ${code}\n`);
  log.push('ok    _redirects catch-all -> ' + code);
}

console.log(log.join('\n'));
console.log(`\nindexing: ${mode.toUpperCase()}   origin: ${origin}`);
if (mode === 'off') console.log('\nreverse with:  node build/set-indexing.mjs on https://your-domain.com');
