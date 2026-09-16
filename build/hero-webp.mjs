/* The homepage hero is the LCP image, and it was the heaviest file on the
   site: 444 KB of JPEG at 2200x1467, fetched before anything else can finish
   painting. Every other photograph on the site is already WebP; this one was
   the holdout.

   It is a full-bleed background (object-fit:cover, animated zoom), so it is
   never seen at its own aspect ratio and never needs pixel-for-pixel detail
   -- which is exactly the case where WebP's losses are invisible and its
   savings are largest. Three widths so a phone does not download a 2200px
   image to show it 400px wide; the browser picks.

   The JPEG stays. og-image.jpg is a separate file, but some social scrapers
   are still unreliable with WebP, and a fallback costs nothing when the
   markup names both.                                                       */

import sharp from 'sharp';
import fs from 'fs';

const SRC = 'images/site/hero.jpg';
const WIDTHS = [1000, 1600, 2200];
const was = fs.statSync(SRC).size;
const meta = await sharp(SRC).metadata();
let total = 0;

for (const w of WIDTHS) {
  const out = `images/site/hero-${w}.webp`;
  await sharp(SRC)
    .resize(w, null, { withoutEnlargement: true, kernel: 'lanczos3' })
    .webp({ quality: 82, effort: 6 })
    .toFile(out);
  const size = fs.statSync(out).size;
  total += size;
  const m = await sharp(out).metadata();
  console.log(`  ${out.padEnd(30)} ${m.width}x${m.height}  ${(size / 1024).toFixed(0)} KB`);
}

console.log(`\n  source ${meta.width}x${meta.height} JPEG ${(was / 1024).toFixed(0)} KB`);
console.log(`  a phone now fetches ${(fs.statSync('images/site/hero-1000.webp').size / 1024).toFixed(0)} KB `
  + `instead of ${(was / 1024).toFixed(0)} KB `
  + `(${(100 - fs.statSync('images/site/hero-1000.webp').size / was * 100).toFixed(0)}% less)`);
console.log(`  a desktop fetches ${(fs.statSync('images/site/hero-1600.webp').size / 1024).toFixed(0)} KB`);
