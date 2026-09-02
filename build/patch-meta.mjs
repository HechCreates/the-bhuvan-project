/* Head metadata, icons and the web manifest.

   Everything a link preview, a browser tab, a bookmark or a home-screen icon
   needs. Icon and manifest paths are document-relative: the site is hash
   routed, so the document path is always "/" and they resolve the same way at
   the domain root or under a subpath. og:image and canonical must be absolute
   for crawlers, so those carry the full origin.                             */

import fs from 'fs';
import path from 'path';

export const ORIGIN = 'https://thebhuvanproject.netlify.app';

const TITLE = 'The Bhu.Van Project';
const OG_TITLE = 'The Bhu.Van Project — Ecological Restoration & Landscape Architecture';
const DESC = 'The Bhu.Van Project is an ecological restoration and landscape architecture '
  + 'studio in Bengaluru, designing with water, soil and native ecology across India.';
const OG_ALT = 'Painted stork, grey heron and bar-headed geese in a restored wetland, '
  + 'with the words The Bhu.Van Project.';
const KEYWORDS = [
  'ecological restoration', 'landscape architecture', 'Bengaluru', 'India',
  'rewilding', 'native planting', 'watershed management', 'habitat restoration',
  'sustainable landscape design', 'regenerative farm landscape', 'Nikhil Udupa',
].join(', ');

export const HEAD = `<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<meta name="keywords" content="${KEYWORDS}">
<meta name="author" content="Nikhil Udupa, The Bhu.Van Project">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${ORIGIN}/">

<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="icon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<meta name="theme-color" content="#2A1F08">
<meta name="apple-mobile-web-app-title" content="Bhu.Van">
<meta name="color-scheme" content="light">

<meta property="og:type" content="website">
<meta property="og:site_name" content="${TITLE}">
<meta property="og:locale" content="en_IN">
<meta property="og:url" content="${ORIGIN}/">
<meta property="og:title" content="${OG_TITLE}">
<meta property="og:description" content="${DESC}">
<meta property="og:image" content="${ORIGIN}/og-image.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${OG_ALT}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${OG_TITLE}">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${ORIGIN}/og-image.jpg">
<meta name="twitter:image:alt" content="${OG_ALT}">`;

export const MANIFEST = JSON.stringify({
  name: TITLE,
  short_name: 'Bhu.Van',
  description: DESC,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#2A1F08',
  theme_color: '#2A1F08',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
}, null, 2) + '\n';

export const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;

/* Hash fragments are not separate URLs to a crawler, so the sitemap holds the
   one real document. */
export const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ORIGIN}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

if (process.argv[1] && process.argv[1].endsWith('patch-meta.mjs')) {
  const FILE = 'The-Bhu.Van-Project-Site.html';
  let s = fs.readFileSync(FILE, 'utf8');
  const before = s.length;
  const log = [];

  // replace the current title + description with the full block
  const old = `<title>The Bhu.Van Project</title>
<meta name="description" content="An ecological restoration and landscape architecture studio based in Bengaluru.">`;
  if (s.includes('property="og:')) {
    console.log('head metadata already present, nothing to do');
    process.exit(0);
  }
  if (!s.includes(old)) { console.log('FAIL: could not find the existing title/description'); process.exit(1); }
  s = s.replace(old, HEAD);
  log.push(`ok    head: ${(s.length - before)}b of metadata added`);
  fs.writeFileSync(FILE, s);

  // assets into the deploy folder
  const D = 'deploy';
  const BRAND = 'build/out/brand';
  const icons = ['favicon.ico', 'icon-16.png', 'icon-32.png', 'icon-48.png',
                 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'og-image.jpg'];
  for (const f of icons) fs.copyFileSync(path.join(BRAND, f), path.join(D, f));
  log.push(`ok    copied ${icons.length} brand assets into ${D}/`);

  fs.writeFileSync(path.join(D, 'site.webmanifest'), MANIFEST);
  fs.writeFileSync(path.join(D, 'robots.txt'), ROBOTS);
  fs.writeFileSync(path.join(D, 'sitemap.xml'), SITEMAP);
  log.push('ok    wrote site.webmanifest, robots.txt, sitemap.xml');

  fs.copyFileSync(FILE, path.join(D, 'index.html'));
  log.push('ok    refreshed deploy/index.html');

  console.log(log.join('\n'));
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
}
