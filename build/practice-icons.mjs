/* The supplied hand-drawn practice icons, brown and clay.

   The source PNGs are ~1254px and half a megabyte each; they render at 42px,
   so 168px covers a 4x screen and the ten come to a few KB.

   The two tones are separate exports and their transparent margins do not
   match -- ecological-restoration trims to 1236x1120 brown against 1137x1066
   clay. Trimming each on its own would scale them differently and the hover
   crossfade would jump, so each pair is cut to the union of both trim boxes
   and the two come out pixel-registered.                                   */
import sharp from 'sharp';
import fs from 'fs';

const OUT = 'site/images/icons';
const SIZE = 168;
fs.mkdirSync(OUT, { recursive: true });

const ICONS = [
  ['Ecological Restoration', 'ecological-restoration'],
  ['Landscape Architecture', 'landscape-architecture'],
  ['Resilient Watershed Management & Land Master Planning', 'watershed-management'],
  ['Sustainable Architecture', 'sustainable-architecture'],
  ['Academic Engagement', 'academic-engagement'],
];
const TONES = [['Brown', ''], ['Clay', '-clay']];

const src = (file, tone) => `Iconography/${file} (${tone}).png`;

let total = 0;
for (const [file, slug] of ICONS) {
  // where the drawing actually sits in each export
  const boxes = [];
  for (const [tone] of TONES) {
    const { info } = await sharp(src(file, tone)).trim({ threshold: 1 })
      .toBuffer({ resolveWithObject: true });
    const left = -info.trimOffsetLeft, top = -info.trimOffsetTop;
    boxes.push({ left, top, right: left + info.width, bottom: top + info.height });
  }
  const box = {
    left: Math.min(...boxes.map(b => b.left)), top: Math.min(...boxes.map(b => b.top)),
    right: Math.max(...boxes.map(b => b.right)), bottom: Math.max(...boxes.map(b => b.bottom)),
  };

  for (const [tone, suffix] of TONES) {
    const m = await sharp(src(file, tone)).metadata();
    const buf = await sharp(src(file, tone))
      .extract({
        left: Math.max(0, box.left), top: Math.max(0, box.top),
        width: Math.min(box.right - box.left, m.width - box.left),
        height: Math.min(box.bottom - box.top, m.height - box.top),
      })
      .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, effort: 6 }).toBuffer();
    fs.writeFileSync(`${OUT}/${slug}${suffix}.webp`, buf);
    total += buf.length;
    console.log(`  ${(slug + suffix + '.webp').padEnd(34)} ${(buf.length / 1024).toFixed(1)}KB`);
  }
  console.log(`     shared box ${box.right - box.left}x${box.bottom - box.top} at ${box.left},${box.top}`);
}
console.log(`\n  ${ICONS.length * 2} icons, ${(total / 1024).toFixed(0)}KB total`);
