import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(process.cwd());
const SRC  = path.join(ROOT, 'The-Bhu.Van-Project-Site.html');
const OUT  = path.join(ROOT, 'build', 'assets');
fs.mkdirSync(OUT, { recursive: true });

const html = fs.readFileSync(SRC, 'utf8');

// --- intrinsic dimensions from raw bytes, no deps -------------------------
function dims(buf, type) {
  try {
    if (type === 'png')  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (type === 'webp') {
      const fmt = buf.toString('ascii', 12, 16);
      if (fmt === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (fmt === 'VP8L') {
        const b = buf.readUInt32LE(21);
        return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
      }
      if (fmt === 'VP8X') return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
    }
    if (type === 'jpeg' || type === 'jpg') {
      let o = 2;
      while (o < buf.length) {
        if (buf[o] !== 0xff) { o++; continue; }
        const m = buf[o + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
          return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) };
        o += 2 + buf.readUInt16BE(o + 2);
      }
    }
  } catch {}
  return { w: 0, h: 0 };
}

// --- collect every data: URI, with its surrounding tag context ------------
const seen = new Map();          // sha1 -> record
const occurrences = [];          // every reference, in document order
const re = /data:image\/([a-zA-Z+]+);base64,([A-Za-z0-9+/=]+)/g;
let m;
while ((m = re.exec(html)) !== null) {
  const [full, type, b64] = m;
  const buf = Buffer.from(b64, 'base64');
  const sha = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const { w, h } = dims(buf, type.toLowerCase());

  // walk back to the opening tag to recover alt / class context
  const back = html.slice(Math.max(0, m.index - 700), m.index);
  const tagStart = back.lastIndexOf('<');
  const ctx = back.slice(tagStart).replace(/\s+/g, ' ').slice(0, 300);
  const altM = html.slice(m.index, m.index + 900).match(/alt="([^"]*)"/);
  const clsM = ctx.match(/class="([^"]*)"/);

  if (!seen.has(sha)) {
    seen.set(sha, {
      sha, type: type.toLowerCase(), bytes: buf.length, b64len: b64.length,
      w, h, refs: 0, alt: altM ? altM[1] : '', cls: clsM ? clsM[1] : '',
    });
    fs.writeFileSync(path.join(OUT, `${sha}.${type.toLowerCase() === 'jpeg' ? 'jpg' : type.toLowerCase()}`), buf);
  }
  const rec = seen.get(sha);
  rec.refs++;
  occurrences.push({ sha, index: m.index, len: full.length, cls: clsM ? clsM[1] : '', alt: altM ? altM[1] : '' });
}

const list = [...seen.values()].sort((a, b) => b.bytes - a.bytes);
const totalB64 = occurrences.reduce((s, o) => s + o.len, 0);
const uniqueBytes = list.reduce((s, r) => s + r.bytes, 0);
const dupB64 = occurrences.filter((o, i) => occurrences.findIndex(x => x.sha === o.sha) !== i)
                          .reduce((s, o) => s + o.len, 0);

console.log(`references      : ${occurrences.length}`);
console.log(`unique images   : ${list.length}`);
console.log(`base64 in file  : ${(totalB64 / 1048576).toFixed(2)} MB`);
console.log(`duplicate base64: ${(dupB64 / 1048576).toFixed(2)} MB  <-- recoverable`);
console.log(`unique decoded  : ${(uniqueBytes / 1048576).toFixed(2)} MB`);
console.log('');
console.log('sha          type  refs      bytes   w × h            class / alt');
for (const r of list) {
  const label = (r.cls || r.alt || '').slice(0, 46);
  console.log(
    `${r.sha}  ${r.type.padEnd(4)}  ${String(r.refs).padStart(2)}  ${String(r.bytes).padStart(9)}  ` +
    `${String(r.w).padStart(4)}×${String(r.h).padEnd(4)}  ${label}`
  );
}
fs.writeFileSync(path.join(ROOT, 'build', 'assets-manifest.json'),
  JSON.stringify({ images: list, occurrences }, null, 2));
console.log('\nwrote build/assets-manifest.json');
