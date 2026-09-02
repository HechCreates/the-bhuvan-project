import fs from 'fs';
import { packRows, PACK } from './projects-content.mjs';

const imgs = JSON.parse(fs.readFileSync('build/projects-images.json', 'utf8'));
console.log('project'.padEnd(28) + 'rows  imgs  worst upscale   frames over 1x   narrowest  h range');
console.log('-'.repeat(100));

let worstAll = 0, overAll = 0, totalAll = 0;
for (const p of imgs) {
  const rows = packRows(p.items);
  let worst = 0, over = 0, narrow = 1e9;
  const heights = [];
  for (const r of rows) {
    const total = r.sumRatio + r.spacer;
    heights.push(Math.round(PACK.refWidth / total));
    for (const it of r.items) {
      const dispW = (PACK.refWidth * it.ratio) / total;
      const up = dispW / it.w;
      if (up > worst) worst = up;
      if (up > 1.001) over++;
      if (dispW < narrow) narrow = dispW;
      totalAll++;
    }
  }
  overAll += over;
  if (worst > worstAll) worstAll = worst;
  console.log(
    p.slug.padEnd(28) +
    String(rows.length).padStart(4) + String(p.items.length).padStart(6) +
    ('  ' + worst.toFixed(2) + 'x').padStart(15) +
    String(over).padStart(15) +
    String(Math.round(narrow)).padStart(12) + 'px' +
    `   ${Math.min(...heights)}..${Math.max(...heights)}`
  );
}
console.log('');
console.log(`worst upscale anywhere: ${worstAll.toFixed(2)}x   frames shown above 1x: ${overAll} of ${totalAll}`);
