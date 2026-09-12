/* Re-fit the circular collaborator logos that came out small.

   Only 18-21 were ever put through build/convert-logos.mjs; 01-17 came from
   the original inline extraction with whatever padding they were drawn with.
   So Christ University, which the script did handle, fills 84% of its tile
   height while three circular marks beside it sit at 58-65% and read as
   illegible next to everything else.

   Same treatment as convert-logos: snap near-white so a JPEG's #F7F7F7 ground
   does not defeat the trim, trim, then fit the mark into the tile less an 8px
   inset. It is idempotent -- a second run trims the inset back off and refits
   to the same size.

   There is no larger source. 180x98 is all the extraction left, so a mark
   57px tall has to be enlarged about 1.4x to match the others. Slightly soft
   and legible beats sharp and unreadable, but that is the ceiling.        */

import sharp from 'sharp';
import fs from 'fs';

const TILE = { w: 180, h: 98 }, INSET = 8;
const FILES = ['13', '15', '16'];   // Bangalore University, South Western Railway, Brahma Kumaris

const inkBox = async file => {
  const { data, info } = await sharp(file).flatten({ background: '#fff' })
    .raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let L = W, R = 0, T = H, B = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    if (data[i] < 238 || data[i + 1] < 238 || data[i + 2] < 238) {
      if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y;
    }
  }
  return { w: R - L + 1, h: B - T + 1 };
};

for (const n of FILES) {
  const file = `images/partners/${n}.png`;
  const was = await inkBox(file);

  let img = sharp(file).flatten({ background: '#FFFFFF' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] >= 238 && data[i + 1] >= 238 && data[i + 2] >= 238) {
      data[i] = data[i + 1] = data[i + 2] = 255;
    }
  }
  img = sharp(await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png().toBuffer()).trim({ threshold: 5 });

  const inner = await img
    .resize(TILE.w - INSET * 2, TILE.h - INSET * 2, { fit: 'inside', withoutEnlargement: false, kernel: 'lanczos3' })
    .png().toBuffer();
  const m = await sharp(inner).metadata();

  const out = await sharp({ create: { width: TILE.w, height: TILE.h, channels: 3, background: '#FFFFFF' } })
    .composite([{ input: inner, left: Math.round((TILE.w - m.width) / 2), top: Math.round((TILE.h - m.height) / 2) }])
    .png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(file, out);

  const now = await inkBox(file);
  console.log(`  ${n}.png  mark ${String(was.w + 'x' + was.h).padEnd(8)} -> ${String(now.w + 'x' + now.h).padEnd(8)}` +
    `  fills ${((was.h / TILE.h) * 100).toFixed(0)}% -> ${((now.h / TILE.h) * 100).toFixed(0)}% of the tile height` +
    `  (x${(now.h / was.h).toFixed(2)})`);
}
