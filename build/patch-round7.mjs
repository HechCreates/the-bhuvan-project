/* 1. Visual Journey hero: stacked, full layout width
   2. collage photographs zoom, and open enlarged in a lightbox
   3. Visual Journey on the site's off-white
   4. the new map of India, on #372807 everywhere it appears
   5. the supplied map-popup icons                                          */

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

/* ---- 1 + 3. the hero, and the page ground ------------------------------- */
swap('1 hero stacks and fills the layout',
  `/* two columns so the copy fills the layout without running past a readable
   measure; one column once there is no room for two */
.vj-lede{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,3vw,2.75rem);
  max-width:none}
.vj-lede p{margin:0;font-size:clamp(.98rem,1.08vw,1.06rem);line-height:1.75;
  color:rgba(55,40,7,.88);max-width:68ch}`,
  `.vj-lede{display:flex;flex-direction:column;gap:clamp(1.1rem,2vw,1.6rem);max-width:none}
.vj-lede p{margin:0;font-size:clamp(.98rem,1.08vw,1.06rem);line-height:1.75;
  color:rgba(55,40,7,.88);max-width:none}`);

swap('3 page ground -> the site off-white',
  `.journey-page{background:#CAC7BF;color:var(--primary)}
.journey-page .footer{background:#CAC7BF}`,
  `.journey-page{background:var(--light);color:var(--primary)}
.journey-page .footer{background:var(--light)}`);

/* the mosaic's own placeholder came off the old ground */
swap('3b tile placeholder follows the ground',
  `.vj-cell{overflow:hidden;aspect-ratio:1;background:#b9b5ac}`,
  `.vj-cell{overflow:hidden;aspect-ratio:1;background:#ddd8ca}`);

swap('3c the 900 break no longer needs the two-column lede',
  `  .vj-lede{grid-template-columns:1fr}\n`, '');

/* ---- 4. the new map, on soil -------------------------------------------- */
swap('4a new map file', `images/home/about-map.png`, `images/home/india-map.png`, 3);

swap('4b homepage teaser ground',
  `#page-home .map-btn img{background:var(--light);padding:14px}`,
  `#page-home .map-btn img{background:#372807;padding:14px}`);
swap('4c map panel ground',
  `#page-home .map-panel-figure{background:var(--light);border:1px solid rgba(55,40,7,.14)}`,
  `#page-home .map-panel-figure{background:#372807;border:1px solid rgba(55,40,7,.14)}`);
swap('4d About page ground',
  `#page-about .geo-figure{background:var(--light);border-radius:var(--radius);padding:1.5rem}`,
  `#page-about .geo-figure{background:#372807;border-radius:var(--radius);padding:1.5rem}`);

/* ---- 5. the supplied map-popup icons ------------------------------------ */
{
  const slugs = ['diverse-geographies', 'living-systems', 'integrated-approach', 'regenerative-outcomes'];
  const alt = { 'diverse-geographies': 'Diverse geographies', 'living-systems': 'Living systems',
    'integrated-approach': 'Integrated approach', 'regenerative-outcomes': 'Regenerative outcomes' };
  let n = 0;
  s = s.replace(/<svg viewBox="0 0 40 40"[\s\S]*?<\/svg>/g, () => {
    const k = slugs[n++];
    return k ? `<img class="map-feat-icon" src="images/icons/map-${k}.webp" width="152" height="152" loading="lazy" alt="${alt[k]}">` : '';
  });
  if (n !== 4) { log.push(`FAIL  5 map icons: expected 4, replaced ${n}`); failed++; }
  else log.push(`ok    5 replaced ${n} map-popup icons`);
}
swap('5b icon rule follows the image',
  `#page-home .map-feat svg{width:38px;height:38px;color:var(--clay)}`,
  `#page-home .map-feat-icon{width:38px;height:38px;display:block}`);
swap('5c short-screen sizes', `#page-home .map-feat svg{width:32px;height:32px}`,
  `#page-home .map-feat-icon{width:32px;height:32px}`);
swap('5d shorter-screen sizes', `#page-home .map-feat svg{width:28px;height:28px}`,
  `#page-home .map-feat-icon{width:28px;height:28px}`);

/* ---- 2. the collage: zoom, and a lightbox --------------------------------
   One lightbox for all 214, its src set on click -- 214 modals would be
   absurd. It sits above the collage panel, so Escape has to close the
   topmost rather than the first in the document. */
{
  const re = /<figure class="vj-shot">\s*<img src="images\/journey\/([^"]+)"([^>]*)>/g;
  const n = (s.match(re) || []).length;
  if (n !== 214) { log.push(`FAIL  2a shots: expected 214, found ${n}`); failed++; }
  else {
    s = s.replace(re, (m, file, rest) =>
      `<figure class="vj-shot"><button type="button" class="vj-zoom" data-open-shot="images/journey/${file}"><img src="images/journey/${file}"${rest}></button>`);
    log.push(`ok    2a wrapped ${n} collage photographs`);
  }
}

swap('2b close the topmost modal, not the first',
  `    var o=document.querySelector('.modal:not([hidden])');
    if(o){ o.hidden=true; document.body.style.overflow=''; if(memberLast&&memberLast.focus) memberLast.focus(); }`,
  `    var all=document.querySelectorAll('.modal:not([hidden])');
    var o=all[all.length-1];
    if(o){ o.hidden=true;
      if(!document.querySelector('.modal:not([hidden])')){ document.body.style.overflow='';
        if(memberLast&&memberLast.focus) memberLast.focus(); } }`);

swap('2c closing a stacked modal keeps the scroll lock',
  `      mm.hidden=true; document.body.style.overflow='';
      if(memberLast&&memberLast.focus) memberLast.focus();`,
  `      mm.hidden=true;
      if(document.querySelector('.modal:not([hidden])')) return;
      document.body.style.overflow='';
      if(memberLast&&memberLast.focus) memberLast.focus();`);

swap('2d the lightbox opener',
  `    var close=e.target.closest('[data-close-modal]');`,
  `    var shot=e.target.closest('[data-open-shot]');
    if(shot){
      var lb=document.querySelector('[data-shot-modal]');
      var img=lb.querySelector('img');
      var cap=shot.closest('.vj-shot').querySelector('figcaption');
      img.src=shot.getAttribute('data-open-shot');
      img.alt=shot.querySelector('img').alt;
      var lc=lb.querySelector('.vj-light-cap');
      lc.textContent=cap?cap.textContent:''; lc.hidden=!cap;
      lb.hidden=false; document.body.style.overflow='hidden';
      var lx=lb.querySelector('.modal-close'); if(lx) lx.focus();
      return;
    }
    var close=e.target.closest('[data-close-modal]');`);

/* the single lightbox, at the end of the journey page */
swap('2e the lightbox element',
  `\n</div>\n<div data-page="testimonials"`,
  `
<div class="modal vj-light" data-shot-modal role="dialog" aria-modal="true" aria-label="Photograph" hidden>
  <div class="modal-backdrop" data-close-modal></div>
  <div class="vj-light-inner">
    <img src="" alt="">
    <p class="vj-light-cap" hidden></p>
  </div>
  <button type="button" class="modal-close" data-close-modal aria-label="Close">&times;</button>
</div>
</div>
<div data-page="testimonials"`);

const CSS = `
/* ---------- Visual Journey: collage zoom and lightbox ----------
   The button is the clipping box so a scaled photograph cannot grow over the
   caption beneath it. */
.vj-zoom{display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in;
  overflow:hidden;border-radius:2px;line-height:0}
.vj-zoom img{transition:transform .6s cubic-bezier(.22,.61,.36,1)}
.vj-zoom:hover img{transform:scale(1.06)}
.vj-zoom:focus-visible{outline:2px solid var(--clay);outline-offset:3px}

/* Above the collage panel it opens from. The photograph renders at its own
   size, only shrunk to fit -- the sources are 400-1000px on the long edge and
   upscaling them would just be soft. */
.vj-light{z-index:90;cursor:zoom-out}
.vj-light .modal-backdrop{background:rgba(20,15,4,.88)}
.vj-light-inner{position:relative;display:flex;flex-direction:column;align-items:center;gap:.9rem;
  max-width:94vw;max-height:92vh;animation:mIn .28s ease}
.vj-light-inner img{display:block;max-width:94vw;max-height:82vh;width:auto;height:auto;
  border-radius:3px;box-shadow:0 30px 70px -20px rgba(0,0,0,.7)}
.vj-light-cap{margin:0;font-family:var(--fb);font-size:.8rem;line-height:1.5;text-align:center;
  color:rgba(243,239,230,.86);max-width:56ch}
.vj-light .modal-close{position:absolute;top:clamp(.6rem,2vw,1.4rem);right:clamp(.6rem,2vw,1.4rem);
  width:42px;height:42px;border:0;border-radius:50%;background:rgba(243,239,230,.14);color:var(--light);
  font-size:1.6rem;line-height:1;cursor:pointer;transition:background .2s;z-index:2}
.vj-light .modal-close:hover{background:rgba(243,239,230,.28)}
`;
{
  const i = s.indexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + CSS + s.slice(i); log.push('ok    2f lightbox stylesheet'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
