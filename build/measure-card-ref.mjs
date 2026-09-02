import sharp from 'sharp';

const { data, info } = await sharp('build/card-ref/page-01.png').ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, ch = info.channels;
const at = (x, y) => { const i = (y * W + x) * ch; return [data[i], data[i + 1], data[i + 2]] };
const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
const ground = at(8, 8);
const off = (x, y, t = 14) => { const c = at(x, y); return Math.abs(c[0] - ground[0]) > t || Math.abs(c[1] - ground[1]) > t || Math.abs(c[2] - ground[2]) > t };

// row occupancy: how many non-ground pixels per row
const rows = [];
for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x += 2) if (off(x, y)) n++; rows.push(n) }

const bands = []; let inB = false, s = 0;
for (let y = 0; y < H; y++) {
  if (rows[y] > 2 && !inB) { inB = true; s = y }
  else if (rows[y] <= 2 && inB) { inB = false; if (y - s > 8) bands.push([s, y - 1]) }
}
if (inB) bands.push([s, H - 1]);

const extent = (a, b) => {
  let l = W, r = 0;
  for (let y = a; y <= b; y++) for (let x = 0; x < W; x++) if (off(x, y)) { if (x < l) l = x; if (x > r) r = x }
  return [l, r];
};

console.log(`page ${W}x${H}   ground ${hex(ground)}`);
console.log('');
const names = ['index "01"', 'image', 'title', 'subhead line 1', 'subhead line 2'];
const info2 = bands.map(([a, b], i) => {
  const [l, r] = extent(a, b);
  return { name: names[i] || 'band ' + (i + 1), a, b, h: b - a + 1, l, r, w: r - l + 1 };
});
for (const bd of info2)
  console.log(`${bd.name.padEnd(16)} y ${String(bd.a).padStart(4)}..${String(bd.b).padStart(4)} (h ${String(bd.h).padStart(4)})   x ${String(bd.l).padStart(4)}..${String(bd.r).padStart(4)} (w ${bd.w})`);

const image = info2.find(b => b.name === 'image');
if (image) {
  const CW = image.w;                       // card content width
  const pc = v => (v / CW * 100).toFixed(1) + '%';
  console.log('');
  console.log(`image ratio        : ${(image.w / image.h).toFixed(3)}`);
  console.log(`image border colour: ${hex(at(image.l + 1, Math.round((image.a + image.b) / 2)))}`);
  console.log('');
  console.log(`--- proportions, relative to card content width ${CW}px ---`);
  console.log(`card padding left  : ${image.l}px   ${pc(image.l)}`);
  console.log(`card padding right : ${W - 1 - image.r}px   ${pc(W - 1 - image.r)}`);
  console.log(`card padding top   : ${info2[0].a}px   ${pc(info2[0].a)}`);
  for (let i = 1; i < info2.length; i++)
    console.log(`gap ${info2[i - 1].name} -> ${info2[i].name}: ${info2[i].a - info2[i - 1].b}px   ${pc(info2[i].a - info2[i - 1].b)}`);
  console.log(`card padding bottom: ${H - 1 - info2[info2.length - 1].b}px   ${pc(H - 1 - info2[info2.length - 1].b)}`);
  console.log('');
  console.log('--- text heights as a fraction of card width (drives font-size) ---');
  for (const bd of info2) if (bd.name !== 'image') console.log(`  ${bd.name.padEnd(16)} cap height ${bd.h}px = ${pc(bd.h)}`);
}
