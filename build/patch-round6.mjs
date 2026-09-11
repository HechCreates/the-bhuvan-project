/* 1. member images move to new filenames -- see the _headers note below
   2. smaller member cards, spread across the layout
   3. the co-founder write-up fills the column and squares up with the photo */

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

/* ---- 1. new filenames -----------------------------------------------------
   /images/* is cached for a month, so five different crops shipped under
   images/team/aparna-pradeep.webp and no browser that had seen an earlier one
   ever asked for another. New names, new URLs. */
for (const n of ['harshita-nathan', 'aparna-pradeep', 'harsha-bhat'])
  swap(`1 ${n} -> -card`, `images/team/${n}.webp`, `images/team/${n}-card.webp`);

/* ---- 2. smaller cards, spread across the layout --------------------------
   19rem is the projects-index card width, so the two card sets on the site
   now agree. */
swap('2 card width 19rem, spread',
  `#page-about .team-members{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(1.2rem,2.5vw,2rem);margin-top:clamp(2.5rem,5vw,4rem);`,
  `#page-about .team-members{display:grid;grid-template-columns:repeat(3,minmax(0,19rem));
  justify-content:space-between;gap:clamp(1.2rem,2.5vw,2rem);margin-top:clamp(2.5rem,5vw,4rem);`);

swap('2b below 620 they go back to filling the row',
  `  #page-about .team-members{grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem}`,
  `  #page-about .team-members{grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem;justify-content:stretch}`);

/* ---- 3. the co-founder write-up ------------------------------------------
   The paragraph loses its measure cap and runs the column's full width, and
   the two halves of the row stretch to the same height with the button pinned
   to the bottom, so the copy block squares up with photo + name + role. */
swap('3a paragraph fills the column',
  `#page-about .lead-copy p{margin:0;font-size:clamp(1rem,1.2vw,1.15rem);line-height:1.7;
  color:rgba(243,239,230,.92);max-width:66ch}`,
  `#page-about .lead-copy p{margin:0;font-size:clamp(1rem,1.2vw,1.15rem);line-height:1.7;
  color:rgba(243,239,230,.92);max-width:none}`);

swap('3b the row stretches, the button sits at the bottom',
  `  gap:clamp(1.5rem,4vw,3.5rem);align-items:start}`,
  `  gap:clamp(1.5rem,4vw,3.5rem);align-items:stretch}`);

swap('3c copy fills its column height',
  `#page-about .lead-copy{display:flex;flex-direction:column;justify-content:flex-start;
  gap:clamp(1.4rem,2.5vw,2rem)}`,
  `#page-about .lead-copy{display:flex;flex-direction:column;justify-content:space-between;
  gap:clamp(1.4rem,2.5vw,2rem)}`);

/* the teasers grow to fill that height; the popups keep what is left */
swap('3d Nikhil, longer teaser',
  `<p>A landscape architect and ecological restoration practitioner with 13+ years in research-based spatial planning. His work spans landscapes across India, joining ecological thinking to cultural sensitivity.</p>`,
  `<p>A Landscape Architect and ecological restoration practitioner with 13+ years of experience in research-based spatial planning and sustainable design. His work spans a wide range of landscapes across India, integrating ecological thinking with cultural sensitivity to design resilient and inclusive spaces. His core expertise includes nature-based solutions, watershed and natural resource management, ecological restoration, wildlife habitat design, spatial design, master planning and disaster-resilient regional planning.</p>`);

swap('3e Shilpa, longer teaser',
  `<p>An architect and educator working on climate change and its impacts on ecosystems, settlements and the built environment, from climate-resilient settlements to inclusive spatial planning.</p>`,
  `<p>An architect and educator currently working on questions around climate change, with a particular interest in understanding its impacts on different ecosystems and on settlements, communities, and the built environment. Her areas of interest include climate-resilient settlements, migration and climate change, informal settlements, urban adaptation, and inclusive spatial planning. She also works on vernacular architecture, heritage documentation, building materials and energy-efficient design.</p>`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
