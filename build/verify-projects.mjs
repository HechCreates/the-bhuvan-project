import fs from 'fs';
import { ORDER, META } from './projects-content.mjs';

const s = fs.readFileSync('dist/index.html', 'utf8');
const imgsManifest = JSON.parse(fs.readFileSync('build/projects-images.json', 'utf8'));

let bad = 0;
console.log('slug'.padEnd(28) + 'h1  sub   loc/status        paras rows imgs caps prev next');
console.log('-'.repeat(96));

for (const slug of ORDER) {
  const i = s.indexOf(`data-page="p-${slug}"`);
  if (i < 0) { console.log(slug.padEnd(28) + 'MISSING'); bad++; continue; }
  const end = s.indexOf('data-page="p-', i + 10);
  const block = s.slice(i, end > 0 ? end : s.lastIndexOf('<script>'));

  const h1 = (block.match(/<h1 class="proj-title">([\s\S]*?)<\/h1>/) || [, ''])[1].trim();
  const sub = (block.match(/<p class="proj-sub">([\s\S]*?)<\/p>/) || [, ''])[1].trim();
  const facts = [...block.matchAll(/<dt>(.*?)<\/dt><dd>(.*?)<\/dd>/g)].map(m => m[1] + '=' + m[2]);
  const paras = (block.match(/<div class="proj-copy">([\s\S]*?)<\/div>/) || [, ''])[1].match(/<p>/g) || [];
  const rows = block.match(/class="crow/g) || [];
  const imgs = block.match(/<img src="images\/projects\//g) || [];
  const caps = block.match(/class="ccap"/g) || [];
  const prev = /proj-step--prev/.test(block);
  const next = /proj-step--next/.test(block);

  const expected = imgsManifest.find(p => p.slug === slug);
  const expImgs = expected ? expected.items.length : 0;
  const expCaps = expected ? expected.items.filter(x => x.caption).length : 0;

  const idx = ORDER.indexOf(slug);
  const wantPrev = idx > 0, wantNext = idx < ORDER.length - 1;

  const problems = [];
  if (h1 !== META[slug].header.replace(/&/g, '&amp;')) problems.push('h1 mismatch');
  if (imgs.length !== expImgs) problems.push(`imgs ${imgs.length}!=${expImgs}`);
  if (caps.length !== expCaps) problems.push(`caps ${caps.length}!=${expCaps}`);
  if (prev !== wantPrev) problems.push('prev wrong');
  if (next !== wantNext) problems.push('next wrong');
  if (problems.length) bad++;

  console.log(
    slug.padEnd(28) +
    (h1 ? ' ok' : 'MIS') + '  ' +
    (sub ? 'yes' : ' - ') + '   ' +
    (facts.join(' ') || '-').padEnd(18).slice(0, 18) + ' ' +
    String(paras.length).padStart(4) + String(rows.length).padStart(5) +
    String(imgs.length).padStart(5) + String(caps.length).padStart(5) +
    (prev ? '  yes' : '   - ') + (next ? '  yes' : '   - ') +
    (problems.length ? '   << ' + problems.join(', ') : '')
  );
}

console.log('');
console.log('image files referenced but missing on disk:');
const refs = [...s.matchAll(/src="(images\/projects\/[^"]+)"/g)].map(m => m[1]);
const missing = refs.filter(r => !fs.existsSync(r));
console.log(missing.length ? missing.join('\n') : `  none (${refs.length} references all resolve)`);
console.log('');
console.log(bad ? `${bad} project(s) with problems` : 'all 7 projects consistent with the manifest');
