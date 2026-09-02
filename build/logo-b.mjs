import sharp from 'sharp';
const { data, info } = await sharp('Logo.webp').raw().toBuffer({ resolveWithObject: true });
const C = info.channels;
const px = (x, y) => { const i = (y * info.width + x) * C; return [data[i], data[i+1], data[i+2]]; };
const ink = c => !(c[0] > 232 && c[1] > 232 && c[2] > 232);
const prof = [];
for (let x = 138; x <= 264; x++) {
  let n = 0; for (let y = 230; y <= 300; y++) if (ink(px(x, y))) n++;
  prof.push([x, n]);
}
console.log('column ink counts, x142..x260 (looking for the gap after "B"):');
console.log(prof.map(([x, n]) => (n === 0 ? '.' : n < 4 ? ':' : n < 10 ? '-' : '#')).join(''));
console.log('x=138' + ' '.repeat(prof.length - 12) + 'x=264');
const thin = prof.filter(([x, n]) => n > 0 && n <= 3).map(([x]) => x);
console.log('near-empty columns:', thin.join(', ') || 'none');
