/* Hero emphasis by weight, a legible map panel, and regrouped collaborators. */

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
const addCss = (name, css) => {
  const i = s.indexOf('</style>');
  s = s.slice(0, i) + css + '\n' + s.slice(i);
  log.push(`ok    ${name}`);
};

/* ---- 1. hero: emphasis moves from size to weight ------------------------- */
swap('1a drop the statement size override, back to one size for the line',
  `#page-home .hero-statement{font-size:clamp(.85rem,min(2.1vw,6.2svh - 1.27vw - 2px),2.1rem)}\n`, '');

swap('1b drop the keyword size override',
  `#page-home .hero-key{font-size:clamp(1.35rem,min(3.4vw,10svh - 2.05vw - 3px),3.4rem);
  line-height:1.1;display:inline}
#page-home .hero-lede .hero-key{font-weight:600}`,
  `/* One size per line; the keywords carry on weight alone. The paragraph sits
   a step below the face's normal display weight so the phrase lifts off it
   without breaking the line's rhythm, and takes the full off-white while the
   surrounding copy stays slightly back. */
#page-home .hero-statement{font-weight:500}
#page-home .hero-key{display:inline;color:#FFF;text-shadow:0 2px 22px rgba(42,31,8,.55)}
#page-home .hero-statement .hero-key{font-weight:800;letter-spacing:-.025em}
#page-home .hero-lede .hero-key{font-weight:700;letter-spacing:-.005em}`);

/* ---- 2. map panel: darker ground, and it fits the viewport ---------------- */
swap('2a figure ground -> soil, so the grey dots read',
  `#page-home .map-panel-figure{background:var(--light)}\n`, '');

addCss('2b soil ground behind the map, and a rhythm that fits a short laptop', `
/* ---------- Map panel ----------
   The drawing's dots are #AEAEAE. On the cream they measured 1.8:1 and washed
   out; on soil they are 6.4:1, and the red site markers 3.6:1. */
#page-home .map-panel-figure{background:var(--soil)}
#page-home .map-panel-figure img{max-height:min(440px,44svh)}

/* At 1440x700 the body column ran 101px past the panel and cut the keywords
   off. The rhythm tightens with the viewport instead of scrolling. */
@media (max-height:840px){
  #page-home .map-panel-grid{padding:clamp(1.2rem,2.4vw,2rem);gap:clamp(1.2rem,2.4vw,2rem)}
  #page-home .map-lead{margin-top:.75rem}
  #page-home .map-features{margin-top:1.1rem;padding-top:1.1rem;gap:1rem 1.5rem}
  #page-home .map-feat svg{width:32px;height:32px}
  #page-home .map-feat h3{margin:.45rem 0 .25rem}
  #page-home .map-keywords{margin-top:1.1rem;padding-top:.9rem}
}
@media (max-height:700px){
  #page-home .map-h{font-size:clamp(1.35rem,2.2vw,1.9rem)}
  #page-home .map-lead{font-size:.9rem;line-height:1.5}
  #page-home .map-feat p{font-size:.8rem;line-height:1.45}
  #page-home .map-features{margin-top:.8rem;padding-top:.8rem;gap:.8rem 1.4rem}
  #page-home .map-feat svg{width:28px;height:28px}
}`);

/* ---- 3. collaborators: regrouped, on white, larger -----------------------
   The seventeen fall into three kinds, and the client asked for that order:
   design studios, then ecology and organisations, then academic institutions.
   One continuous run, not three rows. */
const NAMES = {
  '01': 'Souk', '02': 'Collaborator logo', '03': 'apt', '04': 'Collaborator logo',
  '05': 'Collaborator logo', '06': 'Junglescapes', '07': 'Punarchith', '08': 'Biome Farms',
  '09': 'Ananda Marga Pracaraka Samgha', '10': 'Wadiyar Centre for Architecture',
  '11': 'DSCA', '12': 'BMS College of Architecture', '13': 'Bangalore University',
  '14': 'BVBCET, KLE Society', '15': 'South Western Railway, Indian Railways',
  '16': 'Brahma Kumaris', '17': 'Tophills77',
};
const ORDER = ['01','02','03','04','05',              // design studios
               '06','07','08','09','15','16','17',    // ecology and organisations
               '10','11','12','13','14'];             // academic institutions
const grid = ORDER.map(n =>
  `<div class="collab-item"><img src="images/partners/${n}.png" alt="${NAMES[n]}" loading="lazy"></div>`).join('');

{
  const re = /<div class="collab-grid" data-reveal>[\s\S]*?<\/div>\s*<\/div>/g;
  const found = [...s.matchAll(/<div class="collab-grid" data-reveal>/g)].length;
  if (found !== 2) { log.push(`FAIL  3a collab-grid: expected 2, found ${found}`); failed++; }
  else {
    let n = 0;
    s = s.replace(/(<div class="collab-grid" data-reveal>)([\s\S]*?)(<\/div>\s*<\/div>)/g, (m, a, inner, z) => {
      const items = (inner.match(/<div class="collab-item">/g) || []).length;
      if (items !== 17) return m;
      n++;
      return a + grid + z;
    });
    log.push(n === 2 ? `ok    3a regrouped ${n} collaborator grids (17 logos each)`
                     : `FAIL  3a rewrote ${n} of 2 grids`);
    if (n !== 2) failed++;
  }
}

addCss('3b white tiles, larger marks, same container', `
/* ---------- Collaborator logos ----------
   White rather than cream: several of these marks are supplied on white and
   were showing a faint square against the tile. Padding drops so the mark
   itself grows while the tile keeps its dimensions. */
#page-home .collab-item,#page-about .collab-item{background:#FFF;padding:4px}
#page-home .collab-item img,#page-about .collab-item img{width:100%;height:100%;object-fit:contain}`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
