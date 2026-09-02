/* Write the project and testimonial content out as CMS-editable files.

   These two already had structured sources -- META plus the PDF text for
   projects, the .txt files for testimonials -- so they convert cleanly. The
   point of moving them into content/ is that the CMS reads and writes these
   files directly; the PDFs and .txt files become the original import, not the
   thing anyone edits from now on.

   Collage geometry is deliberately NOT stored. Row packing is computed at build
   time from each image's real dimensions, so when the client adds or removes a
   photo the rows re-justify on their own. Storing packed rows would mean the
   client could break the layout by adding one picture.                      */

import fs from 'fs';
import path from 'path';
import { dump } from 'js-yaml';
import { META, ORDER, copyParagraphs } from './projects-content.mjs';
import { readAll } from './testimonials-content.mjs';
import { CARDS } from './gen-index.mjs';

const OUT = 'content';
const yml = o => dump(o, { lineWidth: 92, quotingType: '"', forceQuotes: false, noRefs: true });
const write = (p, data) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  return `${p}  ${(data.length / 1024).toFixed(1)} KB`;
};

const projImgs = JSON.parse(fs.readFileSync('build/projects-images.json', 'utf8'));
const log = [];

/* ---- projects ---- */
for (const [i, slug] of ORDER.entries()) {
  const m = META[slug];
  const card = CARDS[slug];
  const imgs = projImgs.find(p => p.slug === slug);
  const doc = {
    order: i + 1,
    slug,
    title: m.header,
    subtitle: m.sub || '',
    location: m.location || '',
    status: m.status || '',
    link: m.link ? { label: m.link.label, url: m.link.href } : null,
    body: copyParagraphs(slug),
    card: {
      number: card.n,
      title: card.title,
      subtitle: card.sub || '',
      image: `images/cards/${slug}.webp`,
      alt: card.alt,
    },
    // caption comes from the filename, as it always has; the client edits it here
    gallery: imgs.items.map(it => ({
      image: it.src,
      caption: it.caption || '',
      width: it.w,
      height: it.h,
    })),
  };
  log.push(write(path.join(OUT, 'projects', `${slug}.yml`), yml(doc)));
}

/* ---- testimonials ---- */
for (const [i, t] of readAll().entries()) {
  const doc = {
    order: i + 1,
    name: t.name,
    role: t.role,
    link: t.link ? { label: t.link.label, url: t.link.href } : null,
    quote: t.paras,
  };
  const slug = t.key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  log.push(write(path.join(OUT, 'testimonials', `${slug}.yml`), yml(doc)));
}

console.log(log.join('\n'));
const files = log.length;
const bytes = log.reduce((t, l) => t + parseFloat(l.split('  ')[1]), 0);
console.log(`\n${files} content files, ${bytes.toFixed(0)} KB total`);
