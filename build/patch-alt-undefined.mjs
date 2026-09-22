/* 115 collage images shipped with alt="undefined, photograph N".

   The project page generator built alt text as `${title}, photograph ${n}`
   from a variable that was not set for projects whose images carry no
   captions, so the word "undefined" went out in place of the title on four
   project pages. Pages whose images DO have captions used the caption and
   were unaffected -- which is why only four pages are badly hit.

   A screen reader currently announces "undefined, photograph 12", and Google
   Images has nothing to go on for a third of the site's photographs.

   The fix takes each page's own <h1> as the title, which is what was meant.
   That is honest and useful, but it is not a real description of what is in
   each photograph -- only Nikhil can write those. Alt text is therefore one
   of the fields the admin interface should expose per image.               */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;

const marks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="(p-[a-z0-9-]+)"/g)];
if (!marks.length) { console.log('FAIL: no project pages found'); process.exit(1); }

let total = 0;
const log = [];

/* walk the pages back to front so earlier offsets stay valid */
for (let i = marks.length - 1; i >= 0; i--) {
  const start = marks[i].index;
  const next = s.indexOf('<div data-page=', start + 10);
  const end = next < 0 ? s.length : next;
  let page = s.slice(start, end);

  const n = (page.match(/alt="undefined, photograph \d+"/g) || []).length;
  if (!n) { log.push(`  ok    ${marks[i][1]}: none`); continue; }

  const h1 = (page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  if (!h1) { log.push(`  FAIL  ${marks[i][1]}: no <h1> to take a title from`); continue; }
  const title = h1.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (!title || /"/.test(title)) { log.push(`  FAIL  ${marks[i][1]}: unusable title ${JSON.stringify(title)}`); continue; }

  page = page.replace(/alt="undefined, (photograph \d+)"/g, `alt="${title}, $1"`);
  s = s.slice(0, start) + page + s.slice(end);
  total += n;
  log.push(`  ok    ${marks[i][1]}: ${String(n).padStart(2)} -> "${title}, photograph N"`);
}

const left = (s.match(/alt="undefined/g) || []).length;
console.log(log.reverse().join('\n'));
console.log(`\n${total} alt attributes fixed, ${left} left`);
if (left) process.exitCode = 1;
else {
  fs.writeFileSync(FILE, s);
  console.log(`${FILE}: ${before} -> ${s.length} chars`);
}
