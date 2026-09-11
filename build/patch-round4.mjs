/* Four changes:
     1. the footer sits closer to the section above it
     2. the co-founder photographs come down by a third
     3. the supplied hand-drawn icons replace the generated ones in What we do
   (Aparna's crop is in build/team-images.mjs, not here.)                   */

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

/* ---- 1. the footer comes up ---------------------------------------------- */
swap('1 footer top padding halved',
  `.footer{background:var(--bg);color:var(--primary);
  padding-block:clamp(3rem,6vw,4.5rem) 2rem}`,
  `.footer{background:var(--bg);color:var(--primary);
  padding-block:clamp(1.4rem,2.6vw,2.1rem) 2rem}`);

/* ---- 2. the co-founder photographs, a third smaller ----------------------
   290px at 1440 becomes 195px, which is narrower than the 260px column the
   old Founder section used but close to it in height. */
swap('2 lead photo column x2/3',
  `#page-about .lead-row{display:grid;grid-template-columns:clamp(190px,23vw,290px) minmax(0,1fr);`,
  `#page-about .lead-row{display:grid;grid-template-columns:clamp(130px,15.3vw,195px) minmax(0,1fr);`);

/* ---- 3. the supplied icons ----------------------------------------------
   Two images rather than one recoloured: the client supplied both tones, and
   a filter cannot be trusted to land on the exact clay across a drawing with
   this much tonal variation. They are pixel-registered, so the crossfade does
   not shift. */
{
  const slugs = ['ecological-restoration', 'landscape-architecture', 'watershed-management',
                 'sustainable-architecture', 'academic-engagement'];
  const alt = {
    'ecological-restoration': 'Ecological restoration',
    'landscape-architecture': 'Landscape architecture',
    'watershed-management': 'Resilient watershed management and land master planning',
    'sustainable-architecture': 'Sustainable architecture',
    'academic-engagement': 'Academic engagement',
  };
  let n = 0;
  s = s.replace(/<svg class="p-icon" viewBox="0 0 32 32"[\s\S]*?<\/svg>/g, () => {
    const k = slugs[n++];
    if (!k) return '';
    return `<img class="p-icon" src="images/icons/${k}.webp" width="168" height="168" loading="lazy" alt="${alt[k]}">` +
           `<img class="p-icon p-icon-hover" src="images/icons/${k}-clay.webp" width="168" height="168" loading="lazy" alt="" aria-hidden="true">`;
  });
  if (n !== 5) { log.push(`FAIL  3 icons: expected 5, replaced ${n}`); failed++; }
  else log.push(`ok    3 replaced ${n} practice icons`);
}

swap('3b icon rules: two stacked images instead of one coloured svg',
  `#page-home .p-icon-wrap{display:inline-flex}
#page-home .p-icon{width:42px;height:42px;color:var(--secondary);transition:color .25s,transform .25s}
#page-home .practice-row:hover .p-icon{color:var(--clay);transform:translateY(-1px)}`,
  `#page-home .p-icon-wrap{display:inline-flex;position:relative;flex:none}
#page-home .p-icon{width:42px;height:42px;display:block;transition:transform .25s}
#page-home .p-icon-hover{position:absolute;inset:0;opacity:0;transition:opacity .25s,transform .25s}
#page-home .practice-row:hover .p-icon{transform:translateY(-1px)}
#page-home .practice-row:hover .p-icon-hover{opacity:1}`);

swap('3c mobile icon size keeps both layers square',
  `#page-home .p-icon{width:26px;height:26px}`,
  `#page-home .p-icon{width:26px;height:26px}#page-home .p-icon-wrap{width:26px;height:26px}`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
