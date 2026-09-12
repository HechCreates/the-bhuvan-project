/* Five copy edits.

   "Co-founder" appears five times -- twice for each of the two leads, plus a
   CSS comment -- so Nikhil's two are anchored to his own name and his own
   modal rather than taken by position.                                     */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const swap = (name, find, replace, expect = 1) => {
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

/* ---- 1. Nikhil is Founder, Shilpa stays Co-founder ---------------------- */
swap('1a section role, anchored to his name',
  `<p class="lead-name">Nikhil Udupa</p>
            <p class="lead-role">Co-founder</p>`,
  `<p class="lead-name">Nikhil Udupa</p>
            <p class="lead-role">Founder</p>`);

{
  const at = s.indexOf('data-member-modal="nikhil-udupa"');
  const eye = s.indexOf('<span class="modal-eyebrow">Co-founder</span>', at);
  if (at < 0 || eye < 0) { log.push('FAIL  1b Nikhil modal eyebrow'); failed++; }
  else {
    s = s.slice(0, eye) + '<span class="modal-eyebrow">Founder</span>' +
        s.slice(eye + '<span class="modal-eyebrow">Co-founder</span>'.length);
    log.push('ok    1b popup role, anchored to his modal');
  }
}

swap('1c the rule comment no longer says both are co-founders',
  `/* ---------- Co-founder modals on a short screen ----------`,
  `/* ---------- Founder and co-founder modals on a short screen ----------`);

/* ---- 2. Nikhil: 13+ -> 14+, in the section and the popup ---------------- */
swap('2 fourteen years', `13+ years of experience`, `14+ years of experience`, 2);

/* ---- 3. Shilpa's copy ---------------------------------------------------
   The condensed version in the section is the first of the two paragraphs;
   the popup carries both, which is how Nikhil's reads too. */
const SHILPA_1 = 'An architect and educator working at the intersection of climate change, the built environment and the ways in which people and places respond to a changing environment. Her work focuses on climate adaptation in urban areas, climate change and migration and inclusive spatial planning, with a particular interest in the ways vulnerable communities experience and respond to climate impacts.';
const SHILPA_2 = 'With a background in sustainable architecture, she is also interested in landscape restoration, vernacular and heritage documentation and energy-efficient design. Across these areas, her work explores how environmental conditions, local knowledge, and spatial interventions shape the ways in which people and places adapt to change.';

swap('3a the section teaser',
  `<p>An architect and educator currently working on questions around climate change, with a particular interest in understanding its impacts on different ecosystems and on settlements, communities, and the built environment. Her areas of interest include climate-resilient settlements, migration and climate change, informal settlements, urban adaptation, and inclusive spatial planning. She also works on vernacular architecture, heritage documentation, building materials and energy-efficient design.</p>`,
  `<p>${SHILPA_1}</p>`);

swap('3b the popup, first paragraph',
  `<p class="modal-para">An architect and educator currently working on questions around climate change, with a particular interest in understanding its impacts on different ecosystems and on settlements, communities, and the built environment. Her areas of interest include climate-resilient settlements, migration and climate change, informal settlements, urban adaptation, and inclusive spatial planning.</p>`,
  `<p class="modal-para">${SHILPA_1}</p>`);

swap('3c the popup, second paragraph',
  `<p class="modal-para">With a background in sustainable architecture, she is also interested in vernacular architecture, heritage documentation, building materials, and energy-efficient design. Her work brings together an interest in climate-responsive design, local building practices, and the ways in which people and places adapt to changing environmental conditions.</p>`,
  `<p class="modal-para">${SHILPA_2}</p>`);

/* ---- 4. the map panel's first feature ------------------------------------
   The brief calls it "Diverse Architecture"; the panel has no such heading.
   Diverse Geographies is the only one it can be, and the replacement line is
   about landscapes, so that is the one changed. */
swap('4 Diverse Geographies sub-line',
  `<p>Mountains, forests, river basins, and urban landscapes.</p>`,
  `<p>Agrarian, protected, urban, peri-urban landscapes and community commons.</p>`);

/* ---- 5. the map panel's description ------------------------------------- */
swap('5 map description',
  `<p class="map-lead">From the high-altitude Himalayas to the southern forests, from river basins to city edges, our work spans India&rsquo;s diverse geographies. Each place is an opportunity to understand its living systems, its communities and its ecological context &mdash; and to design with them rather than against them.</p>`,
  `<p class="map-lead">Our geographic footprint, mapping projects across India’s diverse landscapes, communities, and ecology</p>`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
