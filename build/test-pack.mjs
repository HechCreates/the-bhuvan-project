import fs from 'fs';
import { META, copyParagraphs, packRows, PACK } from './projects-content.mjs';

const imgs = JSON.parse(fs.readFileSync('build/projects-images.json', 'utf8'));
const slug = process.argv[2] || 'bandipur-tiger-reserve';
const proj = imgs.find(p => p.slug === slug);
const meta = META[slug];

console.log('TITLE : ' + meta.title);
console.log('SUB   : ' + (meta.sub || '(none)'));
console.log('LINK  : ' + (meta.link ? meta.link.href : '(none)'));
console.log('');
const paras = copyParagraphs(slug);
console.log(`COPY  : ${paras.length} paragraphs`);
paras.forEach((p, i) => console.log(`  [${i + 1}] (${p.split(' ').length}w) ${p.slice(0, 110)}${p.length > 110 ? '…' : ''}`));
console.log('');

const rows = packRows(proj.items);
console.log(`ROWS  : ${rows.length} rows for ${proj.items.length} images   (ref width ${PACK.refWidth}px)`);
console.log('');
console.log(' #  imgs  sumR  spacer  h@1440  widths@1440');
rows.forEach((r, i) => {
  const total = r.sumRatio + r.spacer;
  const widths = r.items.map(it => Math.round(PACK.refWidth * it.ratio / total));
  console.log(
    String(i + 1).padStart(2) + '   ' +
    String(r.items.length).padStart(2) + '   ' +
    r.sumRatio.toFixed(2).padStart(5) + '  ' +
    r.spacer.toFixed(2).padStart(5) + '   ' +
    String(r.heightAtRef).padStart(4) + 'px  ' +
    widths.join(', ') + (r.isPano ? '   [panorama, full bleed]' : (r.spacer > 0.05 ? `   [+${Math.round(PACK.refWidth * r.spacer / total)}px empty]` : ''))
  );
});
const heights = rows.map(r => r.heightAtRef);
console.log('');
console.log(`height range: ${Math.min(...heights)} .. ${Math.max(...heights)}px`);
console.log(`rows per 820px viewport: ${(820 / (heights.reduce((a, b) => a + b, 0) / heights.length)).toFixed(1)} average`);
const narrow = rows.flatMap(r => r.items.map(it => Math.round(PACK.refWidth * it.ratio / (r.sumRatio + r.spacer))));
console.log(`narrowest image at ref width: ${Math.min(...narrow)}px`);
