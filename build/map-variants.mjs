/* The dots are a neutral #AEAEAE, which is why they vanish on any light ground.
   Recolouring them is what buys contrast; the ground alone cannot. Saturated
   pixels (the red site markers) are left alone, and alpha is untouched so the
   dot shapes and their antialiasing survive. */
import sharp from 'sharp';
import fs from 'fs';

const SRC = 'Map Png.png';
const lin = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
const L = h => { const n = parseInt(h.slice(1), 16);
  return .2126 * lin((n >> 16) & 255) + .7152 * lin((n >> 8) & 255) + .0722 * lin(n & 255); };
const C = (a, b) => { const x = L(a), y = L(b), hi = Math.max(x, y), lo = Math.min(x, y);
  return ((hi + .05) / (lo + .05)).toFixed(2); };

async function recolour(dot) {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const t = [parseInt(dot.slice(1,3),16), parseInt(dot.slice(3,5),16), parseInt(dot.slice(5,7),16)];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 8) continue;
    const r = data[i], g = data[i+1], b = data[i+2];
    const sat = Math.max(r,g,b) - Math.min(r,g,b);
    if (sat > 40) continue;                       // the red markers keep their colour
    // keep each dot's own shading: darker source pixels stay darker
    const k = Math.min(1, (255 - (r*.299 + g*.587 + b*.114)) / 90);
    data[i]   = Math.round(255 - (255 - t[0]) * Math.max(k, .55));
    data[i+1] = Math.round(255 - (255 - t[1]) * Math.max(k, .55));
    data[i+2] = Math.round(255 - (255 - t[2]) * Math.max(k, .55));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .resize({ width: 820 }).png({ palette: true, colours: 64, compressionLevel: 9, effort: 10 }).toBuffer();
}

const OPTS = [
  ['A warm grey on cream',   '#6E6455', '#E9E5D9'],
  ['B moss on cream',        '#5C673C', '#E9E5D9'],
  ['C soil on deep cream',   '#43331A', '#DDD7C6'],
];
const comps = []; let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1290" height="620">'
  + '<rect width="100%" height="100%" fill="#372807"/>';
let i = 0;
for (const [label, dot, bg] of OPTS) {
  const png = await recolour(dot);
  fs.writeFileSync(`site/build/out/map-${label[0]}.png`, png);
  const small = await sharp(png).resize({ height: 470 }).toBuffer();
  const m = await sharp(small).metadata();
  const x = 30 + i * 420, y = 30;
  comps.push({ input: await sharp({ create: { width: 380, height: 500, channels: 3, background: bg } })
      .composite([{ input: small, left: Math.round((380 - m.width) / 2), top: 15 }]).png().toBuffer(),
    left: x, top: y });
  svg += `<text x="${x + 190}" y="${y + 545}" font-family="sans-serif" font-size="17" fill="#F3EFE6" text-anchor="middle">${label}</text>`
      + `<text x="${x + 190}" y="${y + 572}" font-family="sans-serif" font-size="14" fill="#B4703A" text-anchor="middle">dots ${C(dot, bg)}:1 &#183; markers ${C('#FF0000', bg)}:1</text>`;
  console.log(`  ${label.padEnd(24)} dots ${dot} on ${bg}  ->  ${C(dot, bg)}:1   (${(png.length/1024).toFixed(0)}KB)`);
  i++;
}
svg += '</svg>';
await sharp(Buffer.from(svg)).composite(comps).png().toFile('site/build/out/map-options.png');
console.log('\n  proof: site/build/out/map-options.png');
