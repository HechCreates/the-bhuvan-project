import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd());
const IN   = path.join(ROOT, 'build', 'assets');
const OUT  = path.join(ROOT, 'build', 'assets-opt');
fs.mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'assets-manifest.json'), 'utf8'));

// Display-width budget per role. Source w×h identifies the role unambiguously here.
function budget(img) {
  const { w, h, refs, cls } = img;
  if (cls === 'hero-img')                return { width: 1920, fmt: 'jpeg', q: 70 };
  if (cls === 'brand-logo')              return { width: 200,  fmt: 'webp', q: 90 };
  if (w === 180 && h === 98)             return { width: 180,  fmt: 'webp', q: 88 }; // collaborator logos
  if (w === 1100)                        return { width: 900,  fmt: 'webp', q: 72 }; // practice photos
  if (w === 480 && h === 640)            return { width: 440,  fmt: 'webp', q: 72 }; // project plates
  if (w === 400 && h === 920)            return { width: 400,  fmt: 'webp', q: 74 }; // about triptych
  if (w === 800 && h === 800)            return { width: 620,  fmt: 'webp', q: 76 }; // founder portrait
  if (w === 700 || w === 600)            return { width: Math.min(w, 700), fmt: 'webp', q: 74 }; // maps
  return { width: Math.min(w, 1200), fmt: 'webp', q: 74 };
}

const results = [];
let before = 0, after = 0;

for (const img of manifest.images) {
  const ext = img.type === 'jpeg' ? 'jpg' : img.type;
  const src = path.join(IN, `${img.sha}.${ext}`);
  const b = budget(img);
  const outExt = b.fmt === 'jpeg' ? 'jpg' : b.fmt;
  const dst = path.join(OUT, `${img.sha}.${outExt}`);

  let pipe = sharp(src);
  if (img.w > b.width) pipe = pipe.resize({ width: b.width, withoutEnlargement: true });
  pipe = b.fmt === 'jpeg'
    ? pipe.jpeg({ quality: b.q, progressive: true, mozjpeg: true })
    : pipe.webp({ quality: b.q, effort: 6 });

  const buf = await pipe.toBuffer();
  const meta = await sharp(buf).metadata();
  fs.writeFileSync(dst, buf);

  before += img.bytes;
  after  += buf.length;
  results.push({
    sha: img.sha, refs: img.refs, cls: img.cls, alt: img.alt,
    fmt: outExt, mime: b.fmt === 'jpeg' ? 'image/jpeg' : 'image/webp',
    w: meta.width, h: meta.height,
    was: img.bytes, now: buf.length,
    file: `${img.sha}.${outExt}`,
  });
}

results.sort((a, b) => b.now - a.now);
console.log('sha            refs   was       now      saved   w × h        role');
for (const r of results) {
  const pct = ((1 - r.now / r.was) * 100).toFixed(0);
  console.log(
    `${r.sha}  ${String(r.refs).padStart(2)}  ${String(r.was).padStart(8)}  ${String(r.now).padStart(8)}  ` +
    `${String(pct).padStart(4)}%  ${String(r.w).padStart(4)}×${String(r.h).padEnd(4)}  ${(r.cls || r.alt || '').slice(0, 34)}`
  );
}

const b64after = Math.ceil(after * 4 / 3);
console.log('');
console.log(`unique decoded : ${(before / 1048576).toFixed(2)} MB  ->  ${(after / 1048576).toFixed(2)} MB  (${((1 - after / before) * 100).toFixed(0)}% smaller)`);
console.log(`as base64      : ${(b64after / 1048576).toFixed(2)} MB   (was 3.16 MB inc. duplicates)`);

fs.writeFileSync(path.join(ROOT, 'build', 'assets-opt.json'), JSON.stringify(results, null, 2));
console.log('wrote build/assets-opt.json');
