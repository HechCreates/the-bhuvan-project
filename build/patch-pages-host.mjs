/* set-indexing.mjs for a host without _headers.

   GitHub Pages serves a project at /<repo>/ rather than a root, so the origin
   argument has to accept a path. And Pages ignores _headers, so the
   X-Robots-Tag that covered the photographs is gone: while the site is in
   staging, robots.txt has to refuse the image directory instead. The pages
   themselves still carry the noindex meta tag, which is why crawling stays
   open everywhere else -- a blanket Disallow would stop crawlers reading that
   tag, and would break link previews.                                      */

import fs from 'fs';

const FILE = 'build/set-indexing.mjs';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const swap = (name, find, replace, expect = 1) => {
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

swap('1 the origin may carry a path',
  `if (newOrigin && !/^https:\\/\\/[^/]+$/.test(newOrigin)) {
  console.log('origin must look like https://example.com with no trailing slash');
  process.exit(1);
}`,
  `/* a project page lives at https://user.github.io/repo, so a path is allowed;
   a trailing slash is not, because the references append their own */
if (newOrigin && !/^https:\\/\\/[^/]+(\\/[^/\\s]+)*$/.test(newOrigin)) {
  console.log('origin must look like https://example.com or');
  console.log('https://user.github.io/repo, with no trailing slash');
  process.exit(1);
}`);

swap('2 read back an origin that has a path',
  `const cur = (s.match(/<link rel="canonical" href="(https:\\/\\/[^/"]+)\\//) || [])[1];`,
  `const cur = (s.match(/<link rel="canonical" href="(https:\\/\\/[^"]*?)\\/">/) || [])[1];`);

swap('3 robots.txt refuses the photographs while staging',
  `  : \`# Staging. Crawling is deliberately left open so that crawlers can read the\\n\`
  + \`# noindex in the page, and so link previews keep working; indexing is\\n\`
  + \`# refused by the meta tag and the X-Robots-Tag header instead.\\n\`
  + \`User-agent: *\\nAllow: /\\n\`;`,
  `  : \`# Staging. Crawling is deliberately left open so that crawlers can read the\\n\`
  + \`# noindex in the page, and so link previews keep working; indexing is\\n\`
  + \`# refused by the meta tag instead.\\n\`
  + \`#\\n\`
  + \`# The photographs are the exception. A meta tag cannot reach an image, and\\n\`
  + \`# GitHub Pages ignores the _headers file that used to carry X-Robots-Tag\\n\`
  + \`# for them, so refusing the directory is the only lever left. og-image.jpg\\n\`
  + \`# sits at the root and stays fetchable, so link previews still work.\\n\`
  + \`User-agent: *\\nAllow: /\\nDisallow: /images/\\n\`;`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
