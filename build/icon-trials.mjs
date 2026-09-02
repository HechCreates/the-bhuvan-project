import sharp from 'sharp';
import fs from 'fs';
fs.mkdirSync('build/out/icons', { recursive: true });

// can librsvg render text here, and with which families?
const FAMS = ['Georgia', 'serif', 'Times New Roman', 'Abhaya Libre', 'Manrope', 'sans-serif'];
const svgText = (fam) => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
     <rect width="120" height="120" fill="#2A1F08"/>
     <text x="60" y="60" font-family="${fam}" font-size="86" font-weight="700"
           fill="#F3EFE6" text-anchor="middle" dominant-baseline="central">B</text>
   </svg>`);
const widths = {};
for (const f of FAMS) {
  const buf = await sharp(svgText(f)).png().toBuffer();
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let n = 0, x0 = 1e9, x1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * info.channels;
    if (data[i] > 120) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; }
  }
  widths[f] = n ? `ink ${x1 - x0 + 1}px wide, ${n}px` : 'NO TEXT RENDERED';
  await sharp(buf).toFile(`build/out/icons/trial-text-${f.replace(/\s+/g, '-')}.png`);
}
console.log('SVG text rendering:');
for (const [k, v] of Object.entries(widths)) console.log('  ' + k.padEnd(18) + v);

// crop trials from the real logo
const crops = {
  'wordmark':  { left: 138, top: 228, width: 310, height: 76 },
  'bhu':       { left: 138, top: 228, width: 128, height: 76 },
  'b-guess':   { left: 140, top: 230, width: 48,  height: 70 },
  'circle':    { left: 14,  top: 11,  width: 556, height: 544 },
};
for (const [name, c] of Object.entries(crops)) {
  await sharp('Logo.webp').extract(c).resize(240, 240, { fit: 'contain', background: '#F3EFE6' })
    .png().toFile(`build/out/icons/trial-crop-${name}.png`);
}
console.log('\nwrote crop trials:', Object.keys(crops).join(', '));
