import fs from 'fs';
const s = fs.readFileSync('The-Bhu.Van-Project-Site.html', 'utf8');

// split into pages
const marks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([^"'+]+)"/g)];
const pages = marks.map((m, i) => ({
  name: m[1],
  html: s.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : s.lastIndexOf('<script>')),
}));

const strip = h => h
  .replace(/<script[\s\S]*?<\/script>/g, '')
  .replace(/<svg[\s\S]*?<\/svg>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '');

let totals = { text: 0, words: 0, inline: 0, ext: 0, inlineBytes: 0 };
console.log('page'.padEnd(30) + 'text blocks'.padStart(12) + 'words'.padStart(8)
          + 'inline imgs'.padStart(13) + 'ext imgs'.padStart(10) + 'inline MB'.padStart(11));
console.log('-'.repeat(84));
for (const p of pages) {
  const body = strip(p.html);
  // visible text nodes of a reasonable length
  const texts = [...body.matchAll(/>([^<>]{3,})</g)].map(m => m[1].trim())
    .filter(t => t && !/^[\s&;#\d.,·—–-]*$/.test(t));
  const words = texts.join(' ').split(/\s+/).filter(Boolean).length;
  const inline = [...p.html.matchAll(/src="data:image\/[a-z]+;base64,([^"]*)"/g)];
  const ext = (p.html.match(/src="images\//g) || []).length;
  const mb = inline.reduce((n, m) => n + m[1].length, 0) / 1048576;
  totals.text += texts.length; totals.words += words;
  totals.inline += inline.length; totals.ext += ext; totals.inlineBytes += mb;
  console.log(p.name.padEnd(30) + String(texts.length).padStart(12) + String(words).padStart(8)
    + String(inline.length).padStart(13) + String(ext).padStart(10) + mb.toFixed(2).padStart(11));
}
console.log('-'.repeat(84));
console.log('TOTAL'.padEnd(30) + String(totals.text).padStart(12) + String(totals.words).padStart(8)
  + String(totals.inline).padStart(13) + String(totals.ext).padStart(10) + totals.inlineBytes.toFixed(2).padStart(11));

// header/footer are cloned per page: how much is duplicated?
const hdr = (s.match(/<header class="site-header"/g) || []).length;
const ftr = (s.match(/<footer class="footer">/g) || []).length;
console.log(`\nchrome duplicated across pages: ${hdr} headers, ${ftr} footers`);
console.log('  -> editing the nav or footer today means editing it ' + hdr + ' times');
