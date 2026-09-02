import fs from 'fs';

const s = fs.readFileSync('dist/index.html', 'utf8');
const style = s.slice(s.indexOf('<style>') + 7, s.indexOf('</style>'));

function splitRules(css) {
  const out = []; let d = 0, b = '';
  for (const ch of css) { b += ch; if (ch === '{') d++; else if (ch === '}') { d--; if (!d) { out.push(b); b = '' } } }
  return out;
}
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
const sel = r => strip(r.slice(0, r.indexOf('{'))).replace(/\s+/g, ' ').trim();
const body = r => r.slice(r.indexOf('{') + 1, r.lastIndexOf('}'));

const rules = splitRules(style).filter(r => !sel(r).startsWith('@'));

const grab = (prop) => {
  const seen = new Map();
  for (const r of rules) {
    const m = body(r).match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`));
    if (!m) continue;
    const v = m[1].trim();
    if (!seen.has(v)) seen.set(v, []);
    seen.get(v).push(sel(r).slice(0, 46));
  }
  return seen;
};

console.log('==== SECTION RHYTHM (padding-block on the original pages) ====');
for (const [v, sels] of grab('padding-block')) {
  if (sels.some(x => /project|\.pi-/.test(x))) continue;
  console.log('  ' + v.padEnd(46) + sels.slice(0, 3).join(' | '));
}

console.log('');
console.log('==== DISPLAY TYPE (font-size on headings, original pages) ====');
const heads = ['sec-title', 'quote', 'meaning-text', 'practice-name', 'plate-title', 'closing h2', 'about-lede', 'philo-body', 'footer-name', 'label', 'sec-label', 'plate-sub'];
for (const r of rules) {
  const sl = sel(r);
  if (/project|\.pi-/.test(sl)) continue;
  if (!heads.some(h => sl.includes(h))) continue;
  const fs_ = body(r).match(/font-size\s*:\s*([^;]+)/);
  const lh = body(r).match(/line-height\s*:\s*([^;]+)/);
  const ls = body(r).match(/letter-spacing\s*:\s*([^;]+)/);
  if (fs_) console.log('  ' + sl.padEnd(40) + (fs_[1] || '').padEnd(30) + 'lh:' + (lh ? lh[1] : '-').padEnd(7) + 'ls:' + (ls ? ls[1] : '-'));
}

console.log('');
console.log('==== .sec-head signature (original) ====');
for (const r of rules) {
  const sl = sel(r);
  if (/project|\.pi-/.test(sl)) continue;
  if (!/sec-head|sec-title|sec-kicker|sec-label/.test(sl)) continue;
  console.log('  ' + sl);
  console.log('      ' + body(r).replace(/\s+/g, ' ').trim().slice(0, 150));
}

console.log('');
console.log('==== homepage project plates (the site\'s own card idiom) ====');
for (const r of rules) {
  const sl = sel(r);
  if (/\.pi-/.test(sl)) continue;
  if (!/plate/.test(sl)) continue;
  console.log('  ' + sl.padEnd(40) + body(r).replace(/\s+/g, ' ').trim().slice(0, 110));
}

console.log('');
console.log('==== grid gaps in use (original) ====');
for (const [v, sels] of grab('gap')) {
  if (sels.some(x => /project|\.pi-/.test(x))) continue;
  console.log('  ' + v.padEnd(34) + sels.slice(0, 3).join(' | '));
}
