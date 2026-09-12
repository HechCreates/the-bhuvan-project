/* The new logo mark, and the Sustainable Architecture cover.

   "Logo new.png" is 1936px and 647KB: a white disc on a transparent square,
   so it reads on any ground. It renders at 44px in the header and up to 100px
   in the footer, so 256px covers both at 2x.

   A new filename on purpose. images/site/logo.webp was served for a month
   under the old cache header, and some browsers will still be holding it.  */
import sharp from 'sharp';
import fs from 'fs';

const logo = await sharp('Logo new.png')
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 92, effort: 6 }).toBuffer();
fs.writeFileSync('site/images/site/logo-mark.webp', logo);
console.log(`  logo-mark.webp   1936x1936 647KB -> 256x256 ${(logo.length / 1024).toFixed(1)}KB`);

/* The cover is used twice: the What we do panel for Sustainable Architecture,
   and the first frame of the Context Responsive Design collage. The panel is
   the larger of the two, so one file at 1280 serves both. */
const cover = await sharp('Sustainable Architecture Cover Image.jpeg')
  .resize({ width: 1280, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 }).toBuffer();
const m = await sharp(cover).metadata();
fs.writeFileSync('site/images/home/sustainable-architecture-cover.webp', cover);
console.log(`  sustainable-architecture-cover.webp  ${m.width}x${m.height}` +
  `  ar ${(m.width / m.height).toFixed(4)}  ${(cover.length / 1024).toFixed(0)}KB`);
