import fs from 'fs';
import path from 'path';

const m = JSON.parse(fs.readFileSync('build/projects-manifest.json', 'utf8'));
const TXT = 'build/pdftext';

function pdfFor(name) {
  const f = path.join(TXT, name.replace(/[^\w]/g, '_') + '.txt');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
}

for (const p of m) {
  const raw = pdfFor(p.project);
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean).filter(l => !/^-- \d+ of \d+ --$/.test(l));
  const paras = raw.split(/\n\s*\n/).map(s => s.replace(/\n/g, ' ').trim())
                   .filter(s => s && !/^-- \d+ of \d+ --$/.test(s));
  const urls = raw.match(/https?:\/\/\S+/g) || [];
  const words = raw.replace(/https?:\/\/\S+/g, '').split(/\s+/).filter(Boolean).length;

  console.log('='.repeat(78));
  console.log(p.project.toUpperCase());
  console.log('='.repeat(78));
  console.log('PDF line 1 : ' + (lines[0] || '-'));
  console.log('PDF line 2 : ' + (lines[1] || '-'));
  console.log('PDF line 3 : ' + (lines[2] || '-'));
  console.log(`copy       : ${paras.length} paragraphs, ${words} words`);
  if (urls.length) console.log('links      : ' + urls.join('  '));
  console.log('');

  const land = p.items.filter(i => i.ratio > 1.15);
  const port = p.items.filter(i => i.ratio < 0.87);
  const sq = p.items.filter(i => i.ratio >= 0.87 && i.ratio <= 1.15);
  console.log(`images     : ${p.items.length}   landscape ${land.length} | portrait ${port.length} | square ${sq.length}`);
  console.log(`ratio range: ${Math.min(...p.items.map(i => i.ratio))} .. ${Math.max(...p.items.map(i => i.ratio))}`);
  const wide = p.items.filter(i => i.ratio >= 2.5);
  const tall = p.items.filter(i => i.ratio <= 0.6);
  if (wide.length) console.log(`  extreme wide : ${wide.map(i => i.order + ' (' + i.ratio + ')').join(', ')}`);
  if (tall.length) console.log(`  extreme tall : ${tall.map(i => i.order + ' (' + i.ratio + ')').join(', ')}`);
  const capped = p.items.filter(i => i.desc);
  console.log(`captions   : ${capped.length}/${p.items.length}`);
  for (const i of capped) console.log(`   ${String(i.order).padStart(2)}  ${i.desc}`);
  const uncapped = p.items.filter(i => !i.desc).map(i => i.order);
  if (uncapped.length) console.log(`   no caption: ${uncapped.join(', ')}`);
  console.log('');
}
