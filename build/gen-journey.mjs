/* The Visual Journey page, built from content/journey.yml and inserted into
   src/index.html.

   The mosaic is the supplied template measured off the PDF: a 4-column,
   2-row grid where the first photograph spans 2x2, three more fill the
   remaining cells, and the View More tile takes the bottom-right corner.
   Ground #CAC7BF and the tile's #372807 are sampled from the same PDF.    */

import fs from 'fs';
import { load } from 'js-yaml';
import { header, footer, esc } from './templates/chrome.mjs';

const FILE = 'src/index.html';
const { categories } = load(fs.readFileSync('content/journey.yml', 'utf8'));

const HERO = [
  `This collection of photographs is a personal journey that runs alongside our work at The Bhu.Van Project. It comes from years of travelling through different landscapes, meeting people, watching seasons shift and noticing small details that often go unseen. The camera has been a way for us to slow down and understand places more deeply. It lets us document clouds moving across mountains, colours carried by changing weather, the everyday lives of communities, and the many creatures and patterns that shape a landscape.`,
  `These images reflect how we see the world and how we approach our work: with curiosity, patience and respect for the land. They are not only about beauty, but about understanding relationships between people, place, culture, climate and ecology. Together, they form a quiet record of the many geographies that have shaped our thinking and continue to guide the philosophy of The Bhu.Van Project.`,
];

/* alt text: the caption when there is one, otherwise the category */
const altOf = (p, title) => esc(p.caption || `${title.replace(/ Diversity$/, '')} — photograph from the Visual Journey`);

const block = c => {
  const byFile = Object.fromEntries(c.photos.map(p => [p.file, p]));
  const tiles = c.picks.map((f, i) => {
    const p = byFile[f];
    return `        <div class="vj-cell vj-cell-${i + 1}"><img src="images/journey/${esc(f)}" loading="lazy" decoding="async" alt="${altOf(p, c.title)}"></div>`;
  }).join('\n');
  return `      <article class="vj-block" data-reveal>
        <h2 class="vj-title">${esc(c.title)}</h2>
        <div class="vj-mosaic">
${tiles}
          <button type="button" class="vj-more" data-open-journey="${esc(c.key)}">
            <span>View More</span>
            <span class="vj-count">${c.photos.length} photographs</span>
          </button>
        </div>
      </article>`;
};

const modal = c => `<div class="modal vj-modal" data-journey-modal="${esc(c.key)}" role="dialog" aria-modal="true" aria-label="${esc(c.title)}" hidden>
  <div class="modal-backdrop" data-close-modal></div>
  <div class="modal-panel vj-panel">
    <div class="vj-panel-head">
      <h2 class="vj-panel-title">${esc(c.title)}</h2>
      <p class="vj-panel-count">${c.photos.length} photographs</p>
      <button type="button" class="modal-close" data-close-modal aria-label="Close">&times;</button>
    </div>
    <div class="vj-collage">
${c.photos.map(p => `      <figure class="vj-shot"><button type="button" class="vj-zoom" data-open-shot="images/journey/${esc(p.file)}"><img src="images/journey/${esc(p.file)}" loading="lazy" decoding="async" alt="${altOf(p, c.title)}"></button>
        ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
      </figure>`).join('\n')}
    </div>
  </div>
</div>`;

const page = `<div data-page="journey" class="project-page journey-page">
${header('journey')}
<section class="vj-open">
  <div class="wrap">
    <h1 class="vj-h1">Visual Journey<span class="sec-kicker">.</span></h1>
    <div class="vj-lede">
${HERO.map(p => `      <p>${esc(p)}</p>`).join('\n')}
    </div>
  </div>
</section>

<section class="vj-grid-sec">
  <div class="wrap">
    <div class="vj-grid">
${categories.map(block).join('\n')}
    </div>
  </div>
</section>

${footer()}
${categories.map(modal).join('\n')}
</div>`;

/* insert before the testimonials page so the document order matches the nav */
let s = fs.readFileSync(FILE, 'utf8');
const OLD = /<div data-page="journey"[\s\S]*?\n<\/div>\n(?=<div data-page="testimonials")/;
const ANCHOR = '<div data-page="testimonials" class="project-page testimonials-page">';

if (OLD.test(s)) { s = s.replace(OLD, page + '\n'); console.log('ok    replaced the existing journey page'); }
else if (s.includes(ANCHOR)) { s = s.replace(ANCHOR, page + '\n' + ANCHOR); console.log('ok    inserted the journey page'); }
else { console.log('FAIL  no testimonials page to anchor against'); process.exit(1); }

fs.writeFileSync(FILE, s);
const shots = categories.reduce((n, c) => n + c.photos.length, 0);
console.log(`      ${categories.length} categories, ${categories.length * 4} tiles, ${shots} photographs in the popups`);
console.log(`      ${FILE}: ${(s.length / 1024).toFixed(0)} KB`);
