/* Turn supplied logo files into partner tiles that match the existing set.

   Three things the naive path gets wrong:
   - a JPEG "white" is usually #F7F7F7, which shows as a faint square against a
     pure-white tile; near-white is snapped to white before anything else
   - trim() alone leaves the mark flush to the tile edge, so a small inset is
     added back after fitting
   - a wide mark must letterbox, never crop                                  */

import sharp from 'sharp';
import fs from 'fs';

const TILE = { w: 180, h: 98 }, INSET = 8;

async function tile(src, out, { snapWhite = true } = {}) {
  let img = sharp(src).flatten({ background: '#FFFFFF' });

  if (snapWhite) {
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const ch = info.channels;
    for (let i = 0; i < data.length; i += ch) {
      if (data[i] >= 238 && data[i + 1] >= 238 && data[i + 2] >= 238) {
        data[i] = data[i + 1] = data[i + 2] = 255;
      }
    }
    img = sharp(data, { raw: { width: info.width, height: info.height, channels: ch } });
    img = sharp(await img.png().toBuffer()).trim({ threshold: 5 });
  }

  const inner = await img
    .resize(TILE.w - INSET * 2, TILE.h - INSET * 2, { fit: 'inside', withoutEnlargement: false })
    .png().toBuffer();
  const m = await sharp(inner).metadata();

  const buf = await sharp({ create: { width: TILE.w, height: TILE.h, channels: 3, background: '#FFFFFF' } })
    .composite([{ input: inner, left: Math.round((TILE.w - m.width) / 2), top: Math.round((TILE.h - m.height) / 2) }])
    .png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(out, buf);
  return `${out.split('/').pop()}  mark ${m.width}x${m.height} in ${TILE.w}x${TILE.h}  ${(buf.length / 1024).toFixed(0)}KB`;
}

const JOBS = [
  ['Landartistry Solutions.jpeg', 'site/images/partners/18.png', { snapWhite: false }], // the red ground is the mark
  ['DA Architects .jpeg',         'site/images/partners/19.png', {}],
  ['Deshpande Foundation.jpeg',   'site/images/partners/20.png', {}],
  ['Christ University .jpeg',     'site/images/partners/21.png', {}],
];
for (const [src, out, opt] of JOBS) console.log('  ' + await tile(src, out, opt));
