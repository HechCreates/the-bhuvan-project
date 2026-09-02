import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'Projects');
const IMG = /\.(webp|jpe?g|png)$/i;

// "(12) Some description.webp"  |  "12 Some description.webp"  |  "12.webp"
function parseName(base) {
  let m = base.match(/^\s*\((\d+)\)\s*(.*)$/) || base.match(/^\s*(\d+)[\s._-]+(.*)$/) || base.match(/^\s*(\d+)\s*$/);
  if (!m) return { order: null, desc: base.trim() };
  const order = parseInt(m[1], 10);
  let desc = (m[2] || '').trim();
  desc = desc.replace(/\.+$/, '').trim();
  if (/^unnamed$/i.test(desc)) desc = '';
  return { order, desc };
}

const out = [];
for (const dir of fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory())) {
  const folder = path.join(ROOT, dir.name);
  const files = fs.readdirSync(folder).filter(f => IMG.test(f));
  const items = [];
  for (const f of files) {
    const p = path.join(folder, f);
    const { order, desc } = parseName(path.basename(f, path.extname(f)));
    const meta = await sharp(p).metadata();
    items.push({ file: f, order, desc, w: meta.width, h: meta.height,
                 ratio: +(meta.width / meta.height).toFixed(3), bytes: fs.statSync(p).size });
  }
  items.sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || a.file.localeCompare(b.file));
  out.push({ project: dir.name, count: items.length, items });
}

fs.writeFileSync(path.join(process.cwd(), 'build', 'projects-manifest.json'), JSON.stringify(out, null, 2));

// ---- report ----
let totalBytes = 0, totalCount = 0;
for (const p of out) {
  const land = p.items.filter(i => i.ratio > 1.15).length;
  const port = p.items.filter(i => i.ratio < 0.87).length;
  const sq = p.items.length - land - port;
  const withDesc = p.items.filter(i => i.desc).length;
  const mb = p.items.reduce((s, i) => s + i.bytes, 0) / 1048576;
  totalBytes += mb; totalCount += p.items.length;
  const ratios = [...new Set(p.items.map(i => i.ratio))].sort((a, b) => a - b);
  console.log(`${p.project}`);
  console.log(`   ${p.items.length} imgs  |  landscape ${land}  portrait ${port}  square-ish ${sq}  |  captions ${withDesc}/${p.items.length}  |  ${mb.toFixed(1)} MB`);
  console.log(`   distinct ratios (${ratios.length}): ${ratios.slice(0, 8).join(', ')}${ratios.length > 8 ? ' …' : ''}`);
  const gaps = [];
  for (let i = 1; i <= p.items.length; i++) if (!p.items.find(x => x.order === i)) gaps.push(i);
  if (gaps.length) console.log(`   MISSING sequence numbers: ${gaps.join(', ')}`);
  const dup = p.items.map(i => i.order).filter((v, i, a) => v !== null && a.indexOf(v) !== i);
  if (dup.length) console.log(`   DUPLICATE order numbers: ${[...new Set(dup)].join(', ')}`);
  console.log('');
}
console.log(`TOTAL: ${totalCount} images, ${totalBytes.toFixed(1)} MB`);
console.log('wrote build/projects-manifest.json');
