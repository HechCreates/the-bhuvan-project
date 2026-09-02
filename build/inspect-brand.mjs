import sharp from 'sharp';
import fs from 'fs';
for (const f of ['Logo.webp', 'Spalsh Img.png', 'splash image hd.JPG', 'IMG_3463.webp', 'About Us pfp.jpg']) {
  if (!fs.existsSync(f)) { console.log(f.padEnd(24), 'MISSING'); continue; }
  const m = await sharp(f).metadata();
  console.log(f.padEnd(24), `${m.width}x${m.height}`.padEnd(12), m.format.padEnd(5),
    'alpha:' + !!m.hasAlpha, ' ', (fs.statSync(f).size / 1024).toFixed(0) + ' KB');
}
// what does the logo sit on?
const { data, info } = await sharp('Logo.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i+1], data[i+2], data[i+3]]; };
const hex = c => '#' + c.slice(0,3).map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
console.log('\nLogo corners:', ['0,0', `${info.width-1},0`, `0,${info.height-1}`].map(p => {
  const [x, y] = p.split(',').map(Number); const c = px(x, y);
  return hex(c) + ' a' + c[3];
}).join('  '));
console.log('Logo centre :', hex(px(info.width >> 1, info.height >> 1)));
