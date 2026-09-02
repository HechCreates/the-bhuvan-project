import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'Projects');
const OUT = path.join(ROOT, 'images', 'projects');

export const SLUGS = {
  'Bandipur Tiger Reserve, Karnataka': 'bandipur-tiger-reserve',
  "Chairman's Bungalow Landscape": 'chairmans-bungalow',
  'Context-Responsive Design': 'context-responsive-design',
  'Ecological Restoration of Degraded Wildlife Habitat': 'ecological-restoration',
  'Mysuru Rail Museum': 'mysuru-rail-museum',
  'Nilgiris Biospehere Reserve': 'nilgiris-biosphere-reserve',
  'Regenerative Farm Landscapes, Karavulapalli': 'karavulapalli-farm',
};

// Displayed at most ~1320 wide (a full-width panorama) or ~900 tall (a tall
// frame in a taller row). These caps give roughly 2x on a 320px row without
// shipping 14 MB of pixels.
const FIT = { width: 1500, height: 900 };
const QUALITY = 75;

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'projects-manifest.json'), 'utf8'));
const result = [];
let totalIn = 0, totalOut = 0;

for (const proj of manifest) {
  const slug = SLUGS[proj.project];
  if (!slug) { console.log('!! no slug for ' + proj.project); continue; }
  const dir = path.join(OUT, slug);
  fs.mkdirSync(dir, { recursive: true });

  const items = [];
  let n = 0;
  for (const item of proj.items) {
    n++;
    const src = path.join(SRC, proj.project, item.file);
    const name = String(n).padStart(2, '0') + '.webp';
    const buf = await sharp(src)
      .resize({ ...FIT, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toBuffer();
    const meta = await sharp(buf).metadata();
    fs.writeFileSync(path.join(dir, name), buf);
    totalIn += item.bytes; totalOut += buf.length;
    items.push({
      n, file: name, src: `images/projects/${slug}/${name}`,
      w: meta.width, h: meta.height, ratio: +(meta.width / meta.height).toFixed(4),
      caption: item.desc || '', bytes: buf.length,
    });
  }
  const mb = items.reduce((s, i) => s + i.bytes, 0) / 1048576;
  console.log(`${slug.padEnd(32)} ${String(items.length).padStart(3)} imgs   ${mb.toFixed(2)} MB`);
  result.push({ project: proj.project, slug, items });
}

fs.writeFileSync(path.join(ROOT, 'build', 'projects-images.json'), JSON.stringify(result, null, 2));
console.log('');
console.log(`source ${(totalIn / 1048576).toFixed(1)} MB  ->  output ${(totalOut / 1048576).toFixed(1)} MB`);
console.log('wrote build/projects-images.json  and  images/projects/<slug>/');
