/* The testimonial-card silhouettes.

   The supplied PNGs carry a lot of transparent margin -- "Mahesh Basavanna
   Silhouette.png" is 941x1672 but the figure inside it is 489x1610 -- so each
   is trimmed before export, otherwise the padding, not the drawing, would set
   the size on the card. They are already the clay the artwork uses, so nothing
   is recoloured.                                                            */
import sharp from 'sharp';
import fs from 'fs';

const SRC = 'testimonials/Testimonial Card Artworks';
const OUT = 'site/images/testimonials';
const H = 420;                     // they render at 200px tall at most, so 2x

fs.mkdirSync(OUT, { recursive: true });

const JOBS = [
  ['Mahesh Basavanna Silhouette.png', 'mcd-berls',  'A standing figure'],
  ['Organic Farmer Silhouette.png',   'raja-bhat',  'A farmer tending a plant'],
  ['Punarchith.png',                  'punarchith', 'A person working the land with a hoe'],
  ['Monash Modlings.png',             'monash',     'Two figures shaking hands'],
  ['Family.png',                      'muthuraman', 'A family seated around a table'],
];

let total = 0;
for (const [file, slug, alt] of JOBS) {
  const src = `${SRC}/${file}`;
  const raw = await sharp(src).metadata();
  const { data, info } = await sharp(src).trim({ threshold: 1 })
    .resize({ height: H, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 }).toBuffer({ resolveWithObject: true });
  fs.writeFileSync(`${OUT}/${slug}.webp`, data);
  total += data.length;
  console.log(`  ${(slug + '.webp').padEnd(18)} ${String(raw.width + 'x' + raw.height).padEnd(11)}` +
    ` -> ${String(info.width + 'x' + info.height).padEnd(9)} ar ${(info.width / info.height).toFixed(3)}` +
    `  ${(data.length / 1024).toFixed(1)}KB   ${alt}`);
}
console.log(`\n  ${JOBS.length} silhouettes, ${(total / 1024).toFixed(0)}KB`);
