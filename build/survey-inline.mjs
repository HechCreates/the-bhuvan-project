import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';

const s = fs.readFileSync('The-Bhu.Van-Project-Site.html', 'utf8');
const marks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([^"'+]+)"/g)];
const pageAt = i => {
  let name = '(head/chrome)';
  for (const m of marks) { if (m.index <= i) name = m[1]; else break; }
  return name;
};

const seen = new Map();   // sha -> record
let n = 0;
for (const m of s.matchAll(/src="data:image\/([a-z+]+);base64,([^"]+)"/g)) {
  n++;
  const [, fmt, b64] = m;
  const buf = Buffer.from(b64, 'base64');
  const sha = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  // the class/alt nearest before the src tells us what it is
  const ctx = s.slice(Math.max(0, m.index - 320), m.index + 400);
  const cls = (ctx.match(/class="([^"]*)"[^>]*src="data:/) || [])[1] || '';
  const alt = (ctx.match(/alt="([^"]{0,80})"/) || [])[1] || '';
  const rec = seen.get(sha) || { sha, fmt, bytes: buf.length, uses: [], cls, alt, buf };
  rec.uses.push({ page: pageAt(m.index), cls, alt });
  seen.set(sha, rec);
}

const recs = [...seen.values()].sort((a, b) => b.bytes - a.bytes);
console.log(`${n} inline images, ${recs.length} unique after dedupe`);
console.log(`total inline: ${(recs.reduce((t, r) => t + r.bytes, 0) / 1048576).toFixed(2)} MB unique, `
  + `${([...s.matchAll(/src="data:image\/[a-z+]+;base64,([^"]+)"/g)].reduce((t, m) => t + m[1].length, 0) / 1048576).toFixed(2)} MB as encoded in the file`);
console.log('');
console.log('sha'.padEnd(12) + 'fmt'.padEnd(6) + 'KB'.padStart(7) + '  dims'.padEnd(14) + 'uses'.padStart(5) + '  pages / class');
console.log('-'.repeat(100));
for (const r of recs) {
  let dims = '?';
  try { const md = await sharp(r.buf).metadata(); dims = `${md.width}x${md.height}`; } catch {}
  const pages = [...new Set(r.uses.map(u => u.page))].join(',');
  console.log(r.sha.padEnd(12) + r.fmt.padEnd(6) + (r.bytes / 1024).toFixed(0).padStart(7) + '  '
    + dims.padEnd(12) + String(r.uses.length).padStart(5) + '  ' + pages + '  ' + (r.cls || r.alt).slice(0, 40));
}
