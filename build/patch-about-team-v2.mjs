/* About page, second pass on The Team, the quote and the map.

   - co-founders stack, each one the full layout width: photo + name beside the
     write-up, and the photo runs at the source's own 2:3 so nothing is cut
   - the three collaborators become cream cards filling the layout width
   - the quote sits in a soil container, centred
   - the map becomes the one the homepage popup uses                        */

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

/* ---- 1. the quote, centred in a soil container ---------------------------
   It came off the soil hero, so soil puts its own colours back and the two
   overrides that re-tinted it for the cream ground come out.              */
swap('1 quote -> centred soil container',
  `#page-about .geo-quote{margin:0 0 clamp(2.5rem,5vw,4rem);padding-bottom:clamp(1.6rem,3vw,2.4rem);
  border-bottom:1px solid rgba(55,40,7,.16)}
#page-about .geo-quote .quote{color:var(--primary)}
#page-about .geo-quote .quote-attr{color:rgba(55,40,7,.6)}`,
  `#page-about .geo-quote{margin:0 0 clamp(3rem,5vw,4.5rem);background:var(--soil);
  border-radius:var(--radius);padding:clamp(2.5rem,5.5vw,4.5rem) clamp(1.5rem,4vw,3rem);
  text-align:center}
#page-about .geo-quote .quote{color:var(--light);max-width:24ch;margin-inline:auto}
#page-about .geo-quote .quote-attr{color:rgba(243,239,230,.72)}`);

/* ---- 2. co-founders stack, full layout width ----------------------------- */
swap('2a leads stack, photo column beside the copy, photo at its own ratio',
  `#page-about .team-leads{display:grid;grid-template-columns:1fr 1fr;
  gap:clamp(2rem,4vw,3.5rem) clamp(2rem,5vw,4.5rem)}
#page-about .lead{margin:0}
#page-about .lead-row{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,2vw,1.6rem);
  align-items:start}
#page-about .lead-media{display:block;width:100%;aspect-ratio:1;padding:0;border:0;
  background:none;cursor:pointer;overflow:hidden;border-radius:var(--radius)}
#page-about .lead-media img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .5s cubic-bezier(.22,1,.36,1)}`,
  `#page-about .team-leads{display:block}
#page-about .lead{margin:0}
#page-about .lead + .lead{margin-top:clamp(2.5rem,5vw,4rem);padding-top:clamp(2.5rem,5vw,4rem);
  border-top:1px solid rgba(243,239,230,.18)}
#page-about .lead-row{display:grid;grid-template-columns:clamp(190px,23vw,290px) minmax(0,1fr);
  gap:clamp(1.5rem,4vw,3.5rem);align-items:stretch}
/* No aspect-ratio: the frame takes the photograph's own 2:3, so the whole
   picture shows and nothing is cropped to fit. */
#page-about .lead-media{display:block;width:100%;padding:0;border:0;
  background:none;cursor:pointer;overflow:hidden;border-radius:var(--radius)}
#page-about .lead-media img{width:100%;height:auto;display:block;
  transition:transform .5s cubic-bezier(.22,1,.36,1)}`);

swap('2b copy sits on the section ground, centred against the photo',
  `/* the copy block matches the photo square exactly */
#page-about .lead-copy{aspect-ratio:1;display:flex;flex-direction:column;justify-content:space-between;
  background:rgba(243,239,230,.07);border-radius:var(--radius);padding:clamp(1rem,1.8vw,1.5rem)}
#page-about .lead-copy p{margin:0;font-size:clamp(.9rem,1.05vw,1rem);line-height:1.6;
  color:rgba(243,239,230,.92);max-width:none}`,
  `#page-about .lead-copy{display:flex;flex-direction:column;justify-content:center;
  gap:clamp(1.4rem,2.5vw,2rem)}
#page-about .lead-copy p{margin:0;font-size:clamp(1rem,1.2vw,1.15rem);line-height:1.7;
  color:rgba(243,239,230,.92);max-width:66ch}`);

swap('2c the section photo is the full frame, the one the popup already loads',
  `<img src="images/team/nikhil-udupa.webp" width="640" height="640" loading="lazy"`,
  `<img src="images/team/nikhil-udupa-full.webp" width="900" height="1351" loading="lazy"`);
swap('2d same for Shilpa',
  `<img src="images/team/shilpa-shirish.webp" width="640" height="640" loading="lazy"`,
  `<img src="images/team/shilpa-shirish-full.webp" width="900" height="1351" loading="lazy"`);

/* ---- 3. the collaborators become cream cards ----------------------------- */
swap('3 member cards on cream, three across the layout',
  `#page-about .team-members{display:grid;grid-template-columns:repeat(3,minmax(0,190px));
  gap:clamp(1.2rem,2.5vw,2rem);margin-top:clamp(2.5rem,5vw,4rem);
  padding-top:clamp(2rem,4vw,3rem);border-top:1px solid rgba(243,239,230,.22)}
#page-about .member{margin:0}
#page-about .member img{width:100%;aspect-ratio:1;object-fit:cover;display:block;
  border-radius:var(--radius)}
#page-about .member-name{font-family:var(--fd);font-weight:700;font-size:1.02rem;
  margin:.7rem 0 .12rem;color:var(--light)}
#page-about .member-role{font-family:var(--fb);font-weight:600;font-size:.6875rem;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(243,239,230,.7);margin:0;line-height:1.35}`,
  `#page-about .team-members{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:clamp(1.2rem,2.5vw,2rem);margin-top:clamp(2.5rem,5vw,4rem);
  padding-top:clamp(2rem,4vw,3rem);border-top:1px solid rgba(243,239,230,.22)}
#page-about .member{margin:0;background:var(--light);border-radius:var(--radius);
  padding:clamp(.8rem,1.4vw,1.1rem)}
#page-about .member img{width:100%;aspect-ratio:1;object-fit:cover;display:block;
  border-radius:calc(var(--radius) - 1px)}
#page-about .member-name{font-family:var(--fd);font-weight:700;font-size:1.02rem;
  margin:.8rem 0 .12rem;color:var(--primary)}
#page-about .member-role{font-family:var(--fb);font-weight:600;font-size:.6875rem;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(55,40,7,.68);margin:0;line-height:1.35}`);

swap('3b the 900px break no longer has a two-column lead grid to undo',
  `@media (max-width:900px){
  #page-about .team-leads{grid-template-columns:1fr}
}
`, '');

swap('3c stacked, the copy loses the square it no longer has',
  `  #page-about .lead-copy{aspect-ratio:auto;gap:1rem}
`, '');

swap('3d the photo column caps so it does not swallow a narrow screen',
  `  #page-about .lead-row{grid-template-columns:1fr;gap:1rem}`,
  `  #page-about .lead-row{grid-template-columns:1fr;gap:1.2rem}
  #page-about .lead-media{max-width:260px}
  #page-about .member{padding:.5rem}`);

/* ---- 4. the map the homepage popup uses ---------------------------------- */
swap('4 map -> the recoloured drawing',
  `images/about/dotted-map-india.webp`, `images/home/about-map.png`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
