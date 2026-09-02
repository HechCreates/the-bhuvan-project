import fs from 'fs';
import crypto from 'crypto';
const s = fs.readFileSync('The-Bhu.Van-Project-Site.html', 'utf8');
const marks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([^"'+]+)"/g)];
const pageAt = i => { let n = '(chrome)'; for (const m of marks) { if (m.index <= i) n = m[1]; else break; } return n; };

const groups = new Map();
for (const m of s.matchAll(/<img[^>]*src="data:image\/([a-z+]+);base64,([^"]+)"[^>]*>/g)) {
  const sha = crypto.createHash('sha1').update(Buffer.from(m[2], 'base64')).digest('hex').slice(0, 10);
  const tag = m[0].replace(/src="data:[^"]*"/, 'src="…"');
  // walk back for the nearest enclosing section/figure class and any heading text
  const back = s.slice(Math.max(0, m.index - 1800), m.index);
  const sect = [...back.matchAll(/<(?:section|div|figure|article)[^>]*class="([^"]+)"/g)].slice(-3).map(x => x[1]);
  const head = [...back.matchAll(/<(?:h1|h2|h3|span class="[^"]*(?:title|label|name)[^"]*")[^>]*>([^<]{2,60})</g)].slice(-2).map(x => x[1].trim());
  const g = groups.get(sha) || { sha, tag, sect, head, pages: new Set() };
  g.pages.add(pageAt(m.index));
  groups.set(sha, g);
}
for (const [sha, g] of groups) {
  if ([...g.pages].every(p => p === '(chrome)' || true) && g.tag.includes('brand-logo')) continue;
  console.log('■ ' + sha + '   pages: ' + [...g.pages].join(','));
  console.log('   tag  : ' + g.tag.slice(0, 150));
  console.log('   near : ' + (g.sect.join(' > ') || '-'));
  console.log('   text : ' + (g.head.join(' | ') || '-'));
}
