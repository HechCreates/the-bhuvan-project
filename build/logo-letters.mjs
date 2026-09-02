import sharp from 'sharp';
const { data, info } = await sharp('Logo.webp').raw().toBuffer({ resolveWithObject: true });
const C = info.channels;
const px = (x, y) => { const i = (y * info.width + x) * C; return [data[i], data[i+1], data[i+2]]; };
const ink = c => !(c[0] > 232 && c[1] > 232 && c[2] > 232);

// column ink profile across the wordmark band, ignoring the sketch circle by
// staying inside its horizontal span
const Y0 = 230, Y1 = 300;
const cols = [];
for (let x = 100; x < 500; x++) {
  let n = 0;
  for (let y = Y0; y <= Y1; y++) if (ink(px(x, y))) n++;
  cols.push([x, n]);
}
const runs = []; let run = null;
for (const [x, n] of cols) {
  if (n > 0 && !run) run = { a: x };
  else if (n === 0 && run) { run.b = x - 1; runs.push(run); run = null; }
}
if (run) { run.b = 499; runs.push(run); }
console.log('ink runs across the wordmark (x0-x1, width):');
runs.forEach(r => console.log(`   ${r.a}-${r.b}   w${r.b - r.a + 1}`));

// vertical extent of the first run = the "B"
const first = runs[0];
let t = 1e9, b = -1;
for (let x = first.a; x <= first.b; x++) for (let y = Y0; y <= Y1; y++)
  if (ink(px(x, y))) { if (y < t) t = y; if (y > b) b = y; }
console.log(`\n"B" glyph: x ${first.a}-${first.b}  y ${t}-${b}   ${first.b-first.a+1}x${b-t+1}`);
const hex = c => '#' + c.map(v => v.toString(16).padStart(2,'0')).join('').toUpperCase();
console.log('B colour  :', hex(px(first.a + 4, Math.round((t + b) / 2))));
