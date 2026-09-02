import fs from 'fs';
import path from 'path';

const DIR = 'testimonials';

/* Order as supplied by the client, led by the card used as the design
   reference. `link` is pulled out of the role line where the source text
   carries a URL, so the role reads as a name rather than a raw address. */
export const ORDER = [
  'McD Berls',
  'Raja Bhat',
  'Punarchith',
  'Monash Molding Solutions',
  'Muthuraman R',
];

export const LINKS = {
  'Punarchith': { href: 'https://www.punarchith.org/', label: 'Punarchith' },
};

/* Typos and house style, corrected on the way out (same list the project
   copy uses: em dashes become commas). */
const FIXES = [
  [/clarity-\s/g, 'clarity, '],      // "design clarity- he reads" -> comma
  [/\s+—\s*/g, ', '],
];
const fix = s => FIXES.reduce((a, [re, to]) => a.replace(re, to), s).replace(/\s+/g, ' ').trim();

export function readAll() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.txt'));
  const byKey = {};
  for (const f of files) {
    const raw = fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r/g, '');
    const blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const tail = blocks[blocks.length - 1].split('\n').map(l => l.trim()).filter(Boolean);
    const quoteBlocks = blocks.slice(0, -1);

    // the quote is every block before the attribution; a block can itself hold
    // several source lines, which are wrapped lines of one paragraph
    let paras = quoteBlocks.flatMap(b => b.split('\n').map(l => l.trim()).filter(Boolean));
    // rejoin: a paragraph ends where the source had a hard break AND the line
    // ends a sentence. These files put one paragraph per line already.
    paras = paras.map(fix);
    // strip the outer curly quotes: the card supplies its own quotation mark
    if (paras.length) {
      paras[0] = paras[0].replace(/^[“"]/, '').trim();
      const last = paras.length - 1;
      paras[last] = paras[last].replace(/[”"]\s*$/, '').trim();
    }

    const name = tail[0];
    let role = tail.slice(1).join(', ').replace(/,\s*$/, '').trim();
    const key = path.basename(f, '.txt');
    const link = LINKS[key];
    if (link) role = role.replace(/,?\s*https?:\/\/\S+/, '').trim();

    byKey[key] = { key, name, role, link: link || null, paras };
  }
  return ORDER.map(k => {
    if (!byKey[k]) throw new Error('no testimonial file for ' + k);
    return byKey[k];
  });
}

if (process.argv[1] && process.argv[1].endsWith('testimonials-content.mjs')) {
  for (const t of readAll()) {
    console.log('=== ' + t.key);
    console.log('  name :', t.name);
    console.log('  role :', t.role, t.link ? '  -> ' + t.link.href : '');
    t.paras.forEach((p, i) => console.log('  p' + (i + 1) + '   :', p.slice(0, 110) + (p.length > 110 ? '…' : '')));
  }
}
