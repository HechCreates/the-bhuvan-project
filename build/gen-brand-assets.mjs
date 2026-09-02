/* Favicons, app icons and the social share card.

   The supplied Logo.webp is a circular sketch enclosing "THE / Bhu.Van /
   PROJECT". Measured, the wordmark is only 60px tall inside a 566px canvas, so
   at a 16px favicon the whole lockup renders as an illegible smudge. The icon
   therefore uses a mark cut from the logo itself: the "B" of "Bhu" in its own
   gold, on the site's soil ground, with the site's clay dot standing in for the
   logo's blue one (the blue is 2.3:1 on soil and disappears; clay is 3.6:1).
   The full lockup is used where it is actually legible, on the share card.   */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT = 'build/out/brand';
fs.mkdirSync(OUT, { recursive: true });

const SOIL = '#2A1F08';
const LIGHT = '#F3EFE6';
const CLAY = '#B4703A';
const GOLD = '#A98B5B';          // the logo gold, lifted slightly to hold up at 16px

/* ---- 1. cut the "B" out of the logo as an alpha mask --------------------- */
// measured with build/logo-letters.mjs: the "Bhu" run is x142-260, y236-295;
// the B occupies the first ~38px of it
const B_BOX = { left: 140, top: 234, width: 35, height: 64 };

async function bMask(size) {
  const { data, info } = await sharp('Logo.webp').extract(B_BOX)
    .resize(size, Math.round(size * B_BOX.height / B_BOX.width), { fit: 'fill' })
    .raw().toBuffer({ resolveWithObject: true });
  // white ground -> transparent, gold ink -> opaque; a flat fill with a
  // luminance-derived alpha avoids the white fringing a plain crop would give
  const px = info.width * info.height;
  const alpha = Buffer.alloc(px);
  for (let i = 0; i < px; i++) {
    const o = i * info.channels;
    const lum = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    alpha[i] = Math.max(0, Math.min(255, Math.round((255 - lum) * 255 / 115)));
  }
  return { alpha, w: info.width, h: info.height };
}

/* ---- 2. the icon mark ---------------------------------------------------- */
async function mark(size) {
  const bW = Math.round(size * 0.40);
  const { alpha, w, h } = await bMask(bW);
  const gold = await sharp({ create: { width: w, height: h, channels: 3, background: GOLD } })
    .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();

  const dot = Math.max(2, Math.round(size * 0.093));
  const gap = Math.max(1, Math.round(size * 0.055));
  const blockW = w + gap + dot;
  const left = Math.round((size - blockW) / 2);
  const top = Math.round((size - h) / 2);

  const dotPng = await sharp({ create: { width: dot, height: dot, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${dot}" height="${dot}">
           <circle cx="${dot/2}" cy="${dot/2}" r="${dot/2}" fill="${CLAY}"/></svg>`) }])
    .png().toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: SOIL } })
    .composite([
      { input: gold, left, top },
      { input: dotPng, left: left + w + gap, top: top + h - dot },
    ]).png({ compressionLevel: 9 }).toBuffer();
}

/* ---- 3. .ico container (PNG payloads, understood by every current browser) */
function ico(pngs) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir[o] = size >= 256 ? 0 : size;
    dir[o + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, dir, ...pngs.map(p => p.buf)]);
}

/* ---- 4. the 1200x630 share card ------------------------------------------ */
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function shareCard() {
  const W = 1200, H = 630;
  const photo = await sharp('IMG_3463.webp')
    .resize(W, H, { fit: 'cover', position: 'attention' }).toBuffer();

  // logo on its own off-white disc, as it appears in the site header
  const D = 104;
  const disc = await sharp({ create: { width: D, height: D, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}">
          <circle cx="${D/2}" cy="${D/2}" r="${D/2}" fill="${LIGHT}"/></svg>`) },
      { input: await sharp('Logo.webp').resize(D - 26, D - 26, { fit: 'contain', background: LIGHT }).toBuffer(),
        left: 13, top: 13 },
    ]).png().toBuffer();

  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"    stop-color="${SOIL}" stop-opacity="0.97"/>
      <stop offset="0.46" stop-color="${SOIL}" stop-opacity="0.88"/>
      <stop offset="0.74" stop-color="${SOIL}" stop-opacity="0.34"/>
      <stop offset="1"    stop-color="${SOIL}" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SOIL}" stop-opacity="0"/>
      <stop offset="1" stop-color="${SOIL}" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect y="${H - 190}" width="${W}" height="190" fill="url(#foot)"/>
  <text x="74" y="316" font-family="Georgia, serif" font-size="70" font-weight="700"
        fill="${LIGHT}" letter-spacing="-1">The Bhu.Van Project</text>
  <rect x="76" y="352" width="66" height="3" fill="${CLAY}"/>
  <text x="74" y="404" font-family="Georgia, serif" font-size="30" fill="${LIGHT}"
        opacity="0.92">${esc('Ecological restoration & landscape architecture')}</text>
  <text x="74" y="556" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="600"
        fill="${CLAY}" letter-spacing="3.4">BENGALURU, KARNATAKA</text>
</svg>`);

  return sharp(photo)
    .composite([{ input: overlay }, { input: disc, left: 74, top: 108 }])
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4' }).toBuffer();
}

/* ---- 5. build ------------------------------------------------------------ */
const sizes = [16, 32, 48, 180, 192, 512];
const made = [];
for (const s of sizes) {
  const buf = await mark(s);
  const name = s === 180 ? 'apple-touch-icon.png' : `icon-${s}.png`;
  fs.writeFileSync(path.join(OUT, name), buf);
  made.push({ name, size: s, kb: (buf.length / 1024).toFixed(1) });
}
const icoBuf = ico(await Promise.all([16, 32, 48].map(async s => ({ size: s, buf: await mark(s) }))));
fs.writeFileSync(path.join(OUT, 'favicon.ico'), icoBuf);
made.push({ name: 'favicon.ico', size: '16/32/48', kb: (icoBuf.length / 1024).toFixed(1) });

const og = await shareCard();
fs.writeFileSync(path.join(OUT, 'og-image.jpg'), og);
made.push({ name: 'og-image.jpg', size: '1200x630', kb: (og.length / 1024).toFixed(1) });

for (const m of made) console.log('  ' + m.name.padEnd(22) + String(m.size).padEnd(11) + m.kb + ' KB');

// a proof sheet, so the small sizes can actually be looked at
const strip = await sharp({ create: { width: 760, height: 200, channels: 4, background: '#DDD7C6' } })
  .composite(await Promise.all([16, 32, 48, 180].map(async (s, i) => ({
    input: await sharp(await mark(s)).resize(160, 160, { kernel: 'nearest' }).png().toBuffer(),
    left: 20 + i * 185, top: 20,
  })))).png().toFile(path.join(OUT, 'proof-icons.png'));
console.log('\n  proof-icons.png        16/32/48/180 shown at 160px');
