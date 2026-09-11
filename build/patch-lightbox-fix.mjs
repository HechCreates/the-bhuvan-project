/* The single-photograph view: make it visible, and make it replace the
   collage rather than sit on top of it.

   THE BUG: the element carries class="modal vj-light", but every positioning
   rule was written for .vj-modal, which it does not have. So it had no
   position, no inset and no flex centring -- it opened as a static block at
   the bottom of the page while the scroll lock engaged, which reads exactly as
   "the page freezes and no image appears". The earlier check asserted the
   element was open and its image had decoded; it never asserted the thing was
   inside the viewport, which is the assertion that would have caught it.

   THE CHANGE: opening a photograph now hides the collage it came from and a
   Back button returns to it, rather than the two stacking.                 */

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

/* ---- 1. the markup: a Back button instead of a close ---- */
swap('1 lightbox markup',
  `<div class="modal vj-light" data-shot-modal role="dialog" aria-modal="true" aria-label="Photograph" hidden>
  <div class="modal-backdrop" data-close-modal></div>
  <div class="vj-light-inner">
    <img src="" alt="">
    <p class="vj-light-cap" hidden></p>
  </div>
  <button type="button" class="modal-close" data-close-modal aria-label="Close">&times;</button>
</div>`,
  `<div class="modal vj-light" data-shot-modal role="dialog" aria-modal="true" aria-label="Photograph" hidden>
  <div class="modal-backdrop" data-shot-back></div>
  <button type="button" class="vj-back" data-shot-back>
    <span class="vj-back-arrow" aria-hidden="true">&larr;</span>
    <span>Back to <span class="vj-back-cat">the collection</span></span>
  </button>
  <div class="vj-light-inner">
    <img src="" alt="">
    <p class="vj-light-cap" hidden></p>
  </div>
</div>`);

/* ---- 2. the opener: replace the collage, remember where to return ---- */
swap('2 opener hides the collage it came from',
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
    }`,
  `    var shot=e.target.closest('[data-open-shot]');
    if(shot){
      var lb=document.querySelector('[data-shot-modal]');
      var img=lb.querySelector('img');
      var cap=shot.closest('.vj-shot').querySelector('figcaption');
      img.src=shot.getAttribute('data-open-shot');
      img.alt=shot.querySelector('img').alt;
      var lc=lb.querySelector('.vj-light-cap');
      lc.textContent=cap?cap.textContent:''; lc.hidden=!cap;
      /* the photograph replaces the collage; Back puts it again */
      shotFrom=shot.closest('.vj-modal');
      if(shotFrom){
        shotFrom.hidden=true;
        var t=shotFrom.querySelector('.vj-panel-title');
        lb.querySelector('.vj-back-cat').textContent=t?t.textContent:'the collection';
      }
      lb.hidden=false; document.body.style.overflow='hidden';
      var bk=lb.querySelector('.vj-back'); if(bk) bk.focus();
      return;
    }
    var back=e.target.closest('[data-shot-back]');
    if(back){ shotBack(); return; }`);

/* ---- 3. Back, and Escape using it ---- */
swap('3a the back step',
  `  var memberLast=null;`,
  `  var memberLast=null;
  /* which collage a photograph was opened from, so Back can restore it */
  var shotFrom=null;
  function shotBack(){
    var lb=document.querySelector('[data-shot-modal]');
    if(!lb || lb.hidden) return false;
    lb.hidden=true;
    if(shotFrom){
      shotFrom.hidden=false;
      var c=shotFrom.querySelector('.modal-close'); if(c) c.focus();
      shotFrom=null;
      return true;
    }
    document.body.style.overflow='';
    return true;
  }`);

swap('3b Escape steps back before it closes',
  `    if(e.key!=='Escape') return;
    var all=document.querySelectorAll('.modal:not([hidden])');`,
  `    if(e.key!=='Escape') return;
    if(shotBack()) return;
    var all=document.querySelectorAll('.modal:not([hidden])');`);

/* ---- 4. the stylesheet ---- */
swap('4 the rules the element never had',
  `.vj-light{z-index:90;cursor:zoom-out}
.vj-light .modal-backdrop{background:rgba(20,15,4,.88)}`,
  `/* This element is .modal .vj-light, not .vj-modal, so it needs its own
   positioning -- without it the overlay laid out in normal flow at the bottom
   of the page and the viewport just locked. */
.vj-light{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;
  padding:clamp(3.6rem,8vh,5.5rem) clamp(.75rem,2vw,1.5rem) clamp(1rem,3vh,2rem)}
.vj-light[hidden]{display:none}
.vj-light .modal-backdrop{position:absolute;inset:0;background:rgba(20,15,4,.9);
  backdrop-filter:blur(4px);cursor:zoom-out}`);

swap('4b the Back button',
  `.vj-light .modal-close{position:absolute;top:clamp(.6rem,2vw,1.4rem);right:clamp(.6rem,2vw,1.4rem);
  width:42px;height:42px;border:0;border-radius:50%;background:rgba(243,239,230,.14);color:var(--light);
  font-size:1.6rem;line-height:1;cursor:pointer;transition:background .2s;z-index:2}
.vj-light .modal-close:hover{background:rgba(243,239,230,.28)}`,
  `.vj-back{position:absolute;top:clamp(.9rem,2.5vh,1.6rem);left:clamp(.9rem,2vw,1.6rem);z-index:2;
  display:inline-flex;align-items:center;gap:.55rem;min-height:44px;padding:.6rem 1.15rem;
  border:1px solid rgba(243,239,230,.28);border-radius:100px;background:rgba(243,239,230,.1);
  color:var(--light);cursor:pointer;font-family:var(--fb);font-size:.75rem;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;transition:background .2s,border-color .2s}
.vj-back:hover{background:rgba(243,239,230,.2);border-color:rgba(243,239,230,.5)}
.vj-back:focus-visible{outline:2px solid var(--light);outline-offset:3px}
.vj-back-arrow{font-size:1rem;line-height:1;transition:transform .2s}
.vj-back:hover .vj-back-arrow{transform:translateX(-3px)}
@media (max-width:560px){
  .vj-back{font-size:.6875rem;padding:.55rem .9rem;letter-spacing:.06em}
}`);

swap('4c the photograph sits below the button',
  `.vj-light-inner img{display:block;max-width:94vw;max-height:82vh;width:auto;height:auto;`,
  `.vj-light-inner img{display:block;max-width:94vw;max-height:74vh;width:auto;height:auto;`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
