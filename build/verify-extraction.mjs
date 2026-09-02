/* Prove the extraction changed nothing except where the bytes live.

   Both versions are normalised by replacing every image reference with the
   SHA-1 of the bytes it resolves to: a base64 payload hashes to itself, a file
   path hashes to the file on disk. If the two normalised documents are
   identical, then every element, attribute and character of text is unchanged
   AND every image still resolves to exactly the same pixels.                */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OLD = 'The-Bhu.Van-Project-Site.preimg.bak';
const NEW = 'The-Bhu.Van-Project-Site.html';
const sha = b => crypto.createHash('sha1').update(b).digest('hex').slice(0, 12);

const missing = [];
const norm = (s, label) => s
  .replace(/src="data:image\/[a-z+]+;base64,([^"]+)"/g,
    (_, b64) => `src="IMG:${sha(Buffer.from(b64, 'base64'))}"`)
  .replace(/src="(images\/[^"]+)"/g, (m, p) => {
    if (!fs.existsSync(p)) { missing.push(`${label}: ${p}`); return `src="IMG:MISSING"`; }
    return `src="IMG:${sha(fs.readFileSync(p))}"`;
  })
  // the hero gained two loading hints it did not need while inline
  .replace(/<img fetchpriority="high" decoding="async" class="hero-img"/g, '<img class="hero-img"');

const a = norm(fs.readFileSync(OLD, 'utf8'), 'old');
const b = norm(fs.readFileSync(NEW, 'utf8'), 'new');

console.log('normalised old : ' + a.length.toLocaleString() + ' chars');
console.log('normalised new : ' + b.length.toLocaleString() + ' chars');
console.log('missing files  : ' + (missing.length ? '\n  ' + missing.join('\n  ') : 'none'));

if (a === b) {
  console.log('\nIDENTICAL — every element, attribute, text node and image resolves the same.');
} else {
  console.log('\nDIFFERENT. First divergence:');
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log('  at char ' + i.toLocaleString());
  console.log('  old: …' + JSON.stringify(a.slice(Math.max(0, i - 90), i + 90)));
  console.log('  new: …' + JSON.stringify(b.slice(Math.max(0, i - 90), i + 90)));
  process.exitCode = 1;
}

// what the visitor actually pays for, first load
const inlineOld = [...fs.readFileSync(OLD, 'utf8').matchAll(/data:image\/[a-z+]+;base64,([^"]+)/g)]
  .reduce((t, m) => t + m[1].length, 0);
const htmlNew = fs.statSync(NEW).size;
const htmlOld = fs.statSync(OLD).size;
let imgBytes = 0, imgCount = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/site|home|about|partners/.test(d)) { imgBytes += fs.statSync(p).size; imgCount++; }
  }
})('images');
console.log('\nweight');
console.log('  HTML before      ' + (htmlOld / 1048576).toFixed(2) + ' MB  (' + (inlineOld / 1048576).toFixed(2) + ' MB of it base64)');
console.log('  HTML after       ' + (htmlNew / 1048576).toFixed(2) + ' MB');
console.log('  extracted files  ' + (imgBytes / 1048576).toFixed(2) + ' MB across ' + imgCount + ', fetched only when used');
