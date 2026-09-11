/* Contact sheets for categorising the Visual Journey photographs.

   214 photographs, indexed in sorted order so sheet N covers
   (N-1)*PER+1 .. N*PER. The index is burned into each tile so the
   categorisation can refer to a number instead of a filename.            */
import sharp from 'sharp';
import fs from 'fs';

const DIR = 'Visual Journey (Gallery Page)';
const OUT = process.argv[2] || 'vj-sheets';
const PER = 20, COLS = 5, TILE = 250, PAD = 6, LABEL = 26;

fs.mkdirSync(OUT, { recursive: true });
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.webp')).sort();
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify(files, null, 0));
console.log(`${files.length} photographs`);

const rows = Math.ceil(PER / COLS);
const W = COLS * (TILE + PAD) + PAD;
const H = rows * (TILE + LABEL + PAD) + PAD;

for (let s = 0; s * PER < files.length; s++) {
  const slice = files.slice(s * PER, s * PER + PER);
  const layers = [];
  for (let i = 0; i < slice.length; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = PAD + col * (TILE + PAD), y = PAD + row * (TILE + LABEL + PAD);
    const img = await sharp(`${DIR}/${slice[i]}`)
      .resize(TILE, TILE, { fit: 'contain', background: '#1b1b1b' }).toBuffer();
    layers.push({ input: img, left: x, top: y });
    const n = s * PER + i + 1;
    const svg = `<svg width="${TILE}" height="${LABEL}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${TILE}" height="${LABEL}" fill="#000"/>
      <text x="4" y="19" font-family="monospace" font-size="18" fill="#fff">${n}</text></svg>`;
    layers.push({ input: Buffer.from(svg), left: x, top: y + TILE });
  }
  const out = `${OUT}/sheet-${String(s + 1).padStart(2, '0')}.png`;
  await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite(layers).png({ compressionLevel: 9 }).toFile(out);
  console.log(`  ${out}  ${s * PER + 1}-${s * PER + slice.length}`);
}
