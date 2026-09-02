import fs from 'fs';
import path from 'path';

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Abhaya+Libre:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap';
// Modern UA so Google serves woff2
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const OUT = path.join(process.cwd(), 'build', 'fonts');
fs.mkdirSync(OUT, { recursive: true });

const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();

// Keep only latin / latin-ext blocks. Abhaya Libre also ships sinhala, which this site never renders.
const blocks = css.split('@font-face').slice(1).map(b => '@font-face' + b);
let kept = 0, dropped = 0, out = [];

for (const b of blocks) {
  const subsetM = b.match(/\/\*\s*([a-z-]+)\s*\*\//);
  const subset = subsetM ? subsetM[1] : 'unknown';
  if (!/^latin/.test(subset)) { dropped++; continue; }
  const urlM = b.match(/url\((https:\/\/[^)]+\.woff2)\)/);
  const famM = b.match(/font-family:\s*'([^']+)'/);
  const wM   = b.match(/font-weight:\s*(\d+)/);
  if (!urlM) continue;
  const buf = Buffer.from(await (await fetch(urlM[1], { headers: { 'User-Agent': UA } })).arrayBuffer());
  const name = `${famM[1].replace(/\s+/g, '-')}-${wM ? wM[1] : 'var'}-${subset}.woff2`;
  fs.writeFileSync(path.join(OUT, name), buf);
  out.push({ family: famM[1], weight: wM ? wM[1] : '400', subset, file: name, bytes: buf.length,
             unicodeRange: (b.match(/unicode-range:\s*([^;]+);/) || [,''])[1].trim() });
  kept++;
}

const total = out.reduce((s, f) => s + f.bytes, 0);
console.log(`kept ${kept} latin faces, dropped ${dropped} non-latin (sinhala etc.)`);
for (const f of out) console.log(`  ${f.family.padEnd(14)} ${f.weight}  ${f.subset.padEnd(10)} ${String(f.bytes).padStart(7)} B`);
console.log(`total woff2: ${(total / 1024).toFixed(1)} KB  ->  base64 ${(total * 4 / 3 / 1024).toFixed(1)} KB`);
fs.writeFileSync(path.join(process.cwd(), 'build', 'fonts.json'), JSON.stringify(out, null, 2));
