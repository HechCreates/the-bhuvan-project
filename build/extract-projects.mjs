/* Read the seven project pages out of src/index.html into content/projects/.

   The existing content/projects/*.yml were exported from the ORIGINAL PDFs
   months ago and the build has never read them. Since then the pages have
   been hand-edited many times: collage rows merged to close a gap, a figure
   moved between rows, the Sustainable Architecture cover inserted as the
   first image, 115 alt attributes corrected. Those edits exist only in the
   markup.

   So this extracts from the MARKUP, which is what is actually on the site,
   rather than re-deriving anything. In particular the collage row grouping is
   captured exactly as it stands: it was tuned by hand and cannot be
   recomputed from aspect ratios.

   Run once. After this, content/projects/*.yml is the truth and the markup is
   generated from it.                                                       */

import fs from 'fs';
import path from 'path';
import { dump, load } from 'js-yaml';

const SRC = 'src/index.html';
const OUT = 'content/projects';
const s = fs.readFileSync(SRC, 'utf8');

/* every page mark, not just the project ones: the boundary of the LAST
   project page is the page that follows it, which is not a project. */
const allMarks = [...s.matchAll(/<div (?:id="[^"]*" )?data-page="([a-z0-9-]+)"/g)];
const marks = allMarks.filter(m => m[1].startsWith('p-'));
const boundary = i => {
  const at = allMarks.findIndex(m => m.index === marks[i].index);
  return at + 1 < allMarks.length ? allMarks[at + 1].index : s.indexOf('<script>', marks[i].index);
};
if (marks.length !== 7) { console.error(`FAIL: expected 7 project pages, found ${marks.length}`); process.exit(1); }

const one = (re, html, what, required = true) => {
  const m = html.match(re);
  if (!m && required) { console.error(`FAIL: ${what} not found`); process.exitCode = 1; }
  return m ? m[1] : null;
};

const projects = [];

marks.forEach((mk, idx) => {
  const end = boundary(idx);
  const html = s.slice(mk.index, end);
  const slug = mk[1].slice(2);

  /* [^>]* on every opening tag. Once gen-pages.mjs has written these pages
     they carry data-edit attributes, and regexes expecting bare tags match
     nothing -- which on a re-run silently extracts empty titles and empty
     bodies over good content files. This has to stay re-runnable against its
     own output. */
  const title = one(/<h1 class="proj-title"[^>]*>([\s\S]*?)<\/h1>/, html, `${slug} title`);
  const subtitle = one(/<p class="proj-sub"[^>]*>([\s\S]*?)<\/p>/, html, '', false);

  const facts = [...html.matchAll(/<div class="proj-fact"><dt[^>]*>([\s\S]*?)<\/dt><dd[^>]*>([\s\S]*?)<\/dd><\/div>/g)]
    .map(m => ({ label: m[1].trim(), value: m[2].trim() }));

  const copy = one(/<div class="proj-copy">([\s\S]*?)<\/div>/, html, `${slug} copy`);
  const body = [...(copy || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[1].replace(/\s+/g, ' ').trim());

  const linkM = html.match(/<a class="proj-link" href="([^"]+)"[^>]*><span[^>]*>([\s\S]*?)<\/span>/);
  const link = linkM ? { label: linkM[2].trim(), url: linkM[1] } : null;

  /* the collage, row by row, exactly as grouped today */
  const collage = one(/<section class="proj-collage"[^>]*>([\s\S]*?)<\/section>/, html, `${slug} collage`);
  const rows = [];
  for (const rm of (collage || '').matchAll(/<div class="crow">([\s\S]*?)<\/div>\s*(?=<div class="crow">|$)/g)) {
    const inner = rm[1];
    const figures = [];
    for (const fm of inner.matchAll(/<figure class="cfig" style="flex:([0-9.]+) 1 0">([\s\S]*?)<\/figure>/g)) {
      const flex = fm[1], body2 = fm[2];
      const img = body2.match(/<img src="([^"]+)" width="(\d+)" height="(\d+)" style="aspect-ratio:([0-9.]+)"[\s\S]*?alt="([^"]*)"/);
      if (!img) { console.error(`FAIL: ${slug} figure did not parse`); process.exitCode = 1; continue; }
      if (img[4] !== flex) { console.error(`FAIL: ${slug} ${img[1]} flex ${flex} != aspect-ratio ${img[4]}`); process.exitCode = 1; }
      const cap = body2.match(/<figcaption class="ccap"[^>]*>([\s\S]*?)<\/figcaption>/);
      figures.push({
        image: img[1], width: +img[2], height: +img[3], ratio: flex,
        alt: img[5], caption: cap ? cap[1].trim() : '',
      });
    }
    const sp = inner.match(/<span class="cspace" style="flex:([0-9.]+) 1 0"/);
    rows.push(sp ? { figures, spacer: sp[1] } : { figures });
  }

  projects.push({ slug, title, subtitle, facts, body, link, gallery: { rows } });
});

/* Refuse to write anything if a page came back empty. An extractor that
   half-parses is far more dangerous than one that fails: it overwrites good
   content files with blanks, and the only copy of that content was the
   markup it just misread. */
{
  const bad = projects.filter(p => !p.title || !p.body.length || !p.gallery.rows.length);
  if (bad.length || process.exitCode) {
    for (const p of bad) {
      console.error(`FAIL: ${p.slug} extracted as `
        + `title=${JSON.stringify(p.title)}, ${p.body.length} paragraphs, ${p.gallery.rows.length} rows`);
    }
    console.error('\nNothing written. The markup did not parse as expected.');
    process.exit(1);
  }
}

/* the card on the projects index, kept from the existing files so nothing is
   lost -- the index page is extracted separately */
for (const p of projects) {
  const file = path.join(OUT, `${p.slug}.yml`);
  /* The index card is not in the project page's markup -- it lives on the
     projects index -- so it is carried across from the existing file. Parse
     it rather than regexing it out: the first version of this used a regex
     ending in \Z, which JavaScript reads as a literal Z, so on a second run
     it silently matched nothing and dropped all seven cards. */
  const existing = fs.existsSync(file) ? load(fs.readFileSync(file, 'utf8')) : null;
  const card = existing && existing.card;

  const out = { order: projects.indexOf(p) + 1, slug: p.slug, title: p.title };
  if (p.subtitle) out.subtitle = p.subtitle;
  out.facts = p.facts;
  out.body = p.body;
  if (p.link) out.link = p.link;
  if (card) out.card = card;
  out.gallery = p.gallery;

  let yaml = '# Generated from the live markup by build/extract-projects.mjs, and from\n'
    + '# now on the source of truth for this page: build/gen-pages.mjs renders the\n'
    + '# markup back out of it. Edit here (or through /admin/), never in the HTML.\n'
    + '#\n'
    + '# gallery.rows is the collage exactly as it stands. The grouping was tuned\n'
    + '# by hand -- rows merged to close gaps, a figure moved, a cover inserted --\n'
    + '# and cannot be recomputed from the aspect ratios. `ratio` is both the\n'
    + "# figure's flex growth and its aspect-ratio; a row's figures therefore\n"
    + '# share one height, and `spacer` absorbs the width left over.\n\n'
    + dump(out, { lineWidth: 96, noRefs: true });

  fs.writeFileSync(file, yaml);
  const figs = p.gallery.rows.reduce((n, r) => n + r.figures.length, 0);
  console.log(`  ${p.slug.padEnd(30)} ${p.body.length} paras, ${p.gallery.rows.length} rows, ${figs} figures`
    + `${card ? ', card kept' : ', NO CARD'}`);
}
console.log(`\n${projects.length} project files written to ${OUT}/`);
