/* The supplied Figma cards and crops.

     1. member cards take the design's ground, inset and photo ratio
     2. co-founder photographs become the supplied squares; the popups keep
        the full frames
     3. the practice icons swap rather than crossfade                        */

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

/* ---- 1. the member card, to the supplied proportions ---------------------
   828x875 card, ground #CAC7BF, photo 734x643 inset at 47,50. The inset is
   5.7% of the card width, and the photo ratio 734/643 is what the three
   supplied crops already are, so object-fit has nothing to cut. */
swap('1a card ground, inset and photo ratio',
  `#page-about .member{margin:0;background:var(--light);border-radius:var(--radius);
  padding:clamp(.8rem,1.4vw,1.1rem)}
#page-about .member img{width:100%;aspect-ratio:1;object-fit:cover;display:block;
  border-radius:calc(var(--radius) - 1px)}`,
  `#page-about .member{margin:0;background:#CAC7BF;border-radius:var(--radius);padding:5.7%}
#page-about .member img{width:100%;aspect-ratio:734/643;object-fit:cover;display:block}`);

swap('1b name and role on the card ground',
  `#page-about .member-name{font-family:var(--fd);font-weight:700;font-size:1.02rem;
  margin:.8rem 0 .12rem;color:var(--primary)}
#page-about .member-role{font-family:var(--fb);font-weight:600;font-size:.6875rem;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(55,40,7,.68);margin:0;line-height:1.35}`,
  `#page-about .member-name{font-family:var(--fd);font-weight:700;font-size:1.05rem;
  margin:.85rem 0 .22rem;color:var(--primary);line-height:1.2}
/* .68 measured 3.95:1 on this ground; .78 is 5.08:1 */
#page-about .member-role{font-family:var(--fb);font-weight:600;font-size:.6875rem;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(55,40,7,.78);margin:0;line-height:1.4}`);

swap('1c the stacked card keeps the photo ratio',
  `  #page-about .member{display:grid;grid-template-columns:88px minmax(0,1fr);
    column-gap:1rem;row-gap:0;padding:.7rem}`,
  `  #page-about .member{display:grid;grid-template-columns:100px minmax(0,1fr);
    column-gap:1rem;row-gap:0;padding:.7rem}`);

/* ---- 2. the co-founder squares ------------------------------------------ */
swap('2a Nikhil, square in the section',
  `<img src="images/team/nikhil-udupa-full.webp" width="900" height="1351" loading="lazy"`,
  `<img src="images/team/nikhil-udupa-sq.webp" width="640" height="640" loading="lazy"`);
swap('2b Shilpa, square in the section',
  `<img src="images/team/shilpa-shirish-full.webp" width="900" height="1351" loading="lazy"`,
  `<img src="images/team/shilpa-shirish-sq.webp" width="640" height="640" loading="lazy"`);

swap('2c the photo and the copy start on the same line',
  `#page-about .lead-row{display:grid;grid-template-columns:clamp(130px,15.3vw,195px) minmax(0,1fr);
  gap:clamp(1.5rem,4vw,3.5rem);align-items:stretch}`,
  `#page-about .lead-row{display:grid;grid-template-columns:clamp(130px,15.3vw,195px) minmax(0,1fr);
  gap:clamp(1.5rem,4vw,3.5rem);align-items:start}`);

swap('2d copy runs from the top, not the middle',
  `#page-about .lead-copy{display:flex;flex-direction:column;justify-content:center;
  gap:clamp(1.4rem,2.5vw,2rem)}`,
  `#page-about .lead-copy{display:flex;flex-direction:column;justify-content:flex-start;
  gap:clamp(1.4rem,2.5vw,2rem)}`);

/* ---- 3. the icons swap ---------------------------------------------------
   Both layers were painted at once on hover: the clay sat on top of a brown
   still at full opacity, and where the two exports' strokes do not coincide
   the brown showed through. The base now goes with the swap, and neither
   opacity transitions, so there is no frame with both drawings visible. */
swap('3 icon swap, no crossfade',
  `#page-home .p-icon{width:42px;height:42px;display:block;transition:transform .25s}
#page-home .p-icon-hover{position:absolute;inset:0;opacity:0;transition:opacity .25s,transform .25s}
#page-home .practice-row:hover .p-icon{transform:translateY(-1px)}
#page-home .practice-row:hover .p-icon-hover{opacity:1}`,
  `#page-home .p-icon{width:42px;height:42px;display:block;transition:transform .25s}
#page-home .p-icon-hover{position:absolute;inset:0;opacity:0}
#page-home .practice-row:hover .p-icon{transform:translateY(-1px)}
#page-home .practice-row:hover .p-icon-base{opacity:0}
#page-home .practice-row:hover .p-icon-hover{opacity:1}`);

{
  const n = (s.match(/<img class="p-icon" src="images\/icons\//g) || []).length;
  if (n !== 5) { log.push(`FAIL  3b base icons: expected 5, found ${n}`); failed++; }
  else {
    s = s.replace(/<img class="p-icon" src="images\/icons\//g,
                  '<img class="p-icon p-icon-base" src="images/icons/');
    log.push('ok    3b base icons tagged');
  }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
