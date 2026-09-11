/* The new map of India, and the four map-popup icons.

   The map is 1128x1394 and 1.4MB as supplied and never renders above 440px,
   so it is halved and re-encoded; both candidates are reported and the
   smaller one is kept. The icons are trimmed and sized the way the practice
   icons are.                                                               */
import sharp from 'sharp';
import fs from 'fs';

const ICON_OUT = 'site/images/icons';
const MAP_OUT = 'site/images/home/india-map.png';   // new name: the old URL may sit in caches under the month-long header that used to apply

/* ---- the map ---- */
const SRC = 'map - india new.png';
const W = 700;   // it never renders above ~372 CSS px
const png = await sharp(SRC).resize({ width: W }).png({ palette: true, colours: 64, effort: 10 }).toBuffer();
const webp = await sharp(SRC).resize({ width: W }).webp({ quality: 90, effort: 6 }).toBuffer();
console.log(`  map at ${W}px:  palette png ${(png.length / 1024).toFixed(0)}KB   webp ${(webp.length / 1024).toFixed(0)}KB`);
fs.writeFileSync(MAP_OUT, png);
console.log(`  ${MAP_OUT}  ${(fs.statSync(SRC).size / 1024).toFixed(0)}KB -> ${(png.length / 1024).toFixed(0)}KB`);

/* ---- the icons ---- */
const ICONS = [
  ['Diverse Geographies (Clay).png', 'map-diverse-geographies'],
  ['Living Systems (Clay).png', 'map-living-systems'],
  ['Integrated Approach (Clay).png', 'map-integrated-approach'],
  ['Regenerative Outcomes.png', 'map-regenerative-outcomes'],
];
const SIZE = 152;                                  // they render at 38px
let total = 0;
for (const [file, slug] of ICONS) {
  const buf = await sharp(`Iconography/Map Pop Up Iconography/${file}`).trim({ threshold: 1 })
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, effort: 6 }).toBuffer();
  fs.writeFileSync(`${ICON_OUT}/${slug}.webp`, buf);
  total += buf.length;
  console.log(`  ${(slug + '.webp').padEnd(34)} ${(buf.length / 1024).toFixed(1)}KB`);
}
console.log(`\n  4 map icons, ${(total / 1024).toFixed(0)}KB`);
