/* 1. the Terrace Garden watermark at 75%
   2. previous / next through an enlarged Visual Journey photograph
   3. the map text on the right element this time                          */

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

/* ---- 1. the watermark ---------------------------------------------------
   The alpha on the colour rather than opacity on the element: opacity would
   fade the gradient behind the words too, and that scrim is what keeps them
   readable over a pale photograph. */
swap('1 watermark text to 75%',
  `color:rgba(243,239,230,.96);opacity:1;font-weight:600;font-size:.75rem;letter-spacing:.01em;`,
  `color:rgba(243,239,230,.75);opacity:1;font-weight:600;font-size:.75rem;letter-spacing:.01em;`);

/* ---- 3. the map text ----------------------------------------------------- */
swap('3a the teaser caption takes the new line',
  `<figcaption class="about-cap">Every mark is a place we have worked. Tap the map to see how far the work reaches.</figcaption>`,
  `<figcaption class="about-cap">Our geographic footprint, mapping projects across India’s diverse landscapes, communities, and ecology</figcaption>`);

swap('3b the popup description goes back',
  `<p class="map-lead">Our geographic footprint, mapping projects across India’s diverse landscapes, communities, and ecology</p>`,
  `<p class="map-lead">From the high-altitude Himalayas to the southern forests, from river basins to city edges, our work spans India&rsquo;s diverse geographies. Each place is an opportunity to understand its living systems, its communities and its ecological context &mdash; and to design with them rather than against them.</p>`);

/* ---- 2. prev / next ------------------------------------------------------ */
swap('2a the two arrows',
  `  <div class="vj-light-inner">
    <img src="" alt="">
    <p class="vj-light-cap" hidden></p>
  </div>
</div>`,
  `  <button type="button" class="vj-nav vj-nav-prev" data-shot-step="-1" aria-label="Previous photograph">
    <span aria-hidden="true">&lsaquo;</span>
  </button>
  <button type="button" class="vj-nav vj-nav-next" data-shot-step="1" aria-label="Next photograph">
    <span aria-hidden="true">&rsaquo;</span>
  </button>
  <div class="vj-light-inner">
    <img src="" alt="">
    <p class="vj-light-cap" hidden></p>
  </div>
</div>`);

/* the opener becomes "show this one", so stepping can reuse it */
swap('2b showShot, and the list to step through',
  `  /* which collage a photograph was opened from, so Back can restore it */
  var shotFrom=null;`,
  `  /* which collage a photograph was opened from, so Back can restore it,
     and the run of photographs in it that the arrows step through */
  var shotFrom=null, shotList=[], shotIndex=-1;
  function showShot(btn){
    var lb=document.querySelector('[data-shot-modal]');
    var img=lb.querySelector('img');
    var cap=btn.closest('.vj-shot').querySelector('figcaption');
    img.src=btn.getAttribute('data-open-shot');
    img.alt=btn.querySelector('img').alt;
    var lc=lb.querySelector('.vj-light-cap');
    lc.textContent=cap?cap.textContent:''; lc.hidden=!cap;
  }
  /* wraps, so the end of a collection runs back to its start rather than
     dead-ending on a button that does nothing */
  function shotStep(d){
    if(shotList.length<2) return;
    shotIndex=(shotIndex+d+shotList.length)%shotList.length;
    showShot(shotList[shotIndex]);
  }`);

swap('2c the opener records where it is in the run',
  `      var lb=document.querySelector('[data-shot-modal]');
      var img=lb.querySelector('img');
      var cap=shot.closest('.vj-shot').querySelector('figcaption');
      img.src=shot.getAttribute('data-open-shot');
      img.alt=shot.querySelector('img').alt;
      var lc=lb.querySelector('.vj-light-cap');
      lc.textContent=cap?cap.textContent:''; lc.hidden=!cap;
      /* the photograph replaces the collage; Back puts it again */
      shotFrom=shot.closest('.vj-modal');
      if(shotFrom){`,
  `      var lb=document.querySelector('[data-shot-modal]');
      /* the photograph replaces the collage; Back puts it again */
      shotFrom=shot.closest('.vj-modal');
      shotList=shotFrom?[].slice.call(shotFrom.querySelectorAll('[data-open-shot]')):[shot];
      shotIndex=shotList.indexOf(shot);
      showShot(shot);
      lb.querySelector('.vj-nav-prev').hidden=shotList.length<2;
      lb.querySelector('.vj-nav-next').hidden=shotList.length<2;
      if(shotFrom){`);

swap('2d the arrows are clickable',
  `    var back=e.target.closest('[data-shot-back]');
    if(back){ shotBack(); return; }`,
  `    var step=e.target.closest('[data-shot-step]');
    if(step){ shotStep(Number(step.getAttribute('data-shot-step'))); return; }
    var back=e.target.closest('[data-shot-back]');
    if(back){ shotBack(); return; }`);

swap('2e and the arrow keys',
  `    if(e.key!=='Escape') return;
    if(shotBack()) return;`,
  `    var lbOpen=document.querySelector('[data-shot-modal]:not([hidden])');
    if(lbOpen && (e.key==='ArrowLeft' || e.key==='ArrowRight')){
      e.preventDefault(); shotStep(e.key==='ArrowLeft'?-1:1); return;
    }
    if(e.key!=='Escape') return;
    if(shotBack()) return;`);

swap('2f stepping stops when the view closes',
  `    lb.hidden=true;
    if(shotFrom){`,
  `    lb.hidden=true;
    shotList=[]; shotIndex=-1;
    if(shotFrom){`);

const CSS = `
/* ---------- Visual Journey: stepping through a collection ----------
   Vertically centred, so they never meet the Back button in the top-left.
   Sized as real targets rather than bare glyphs. */
.vj-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:2;
  width:52px;height:52px;border:1px solid rgba(243,239,230,.28);border-radius:50%;
  background:rgba(243,239,230,.1);color:var(--light);cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  font-size:2rem;line-height:1;padding:0 0 .18em;
  transition:background .2s,border-color .2s}
.vj-nav[hidden]{display:none}
.vj-nav-prev{left:clamp(.5rem,2vw,1.6rem)}
.vj-nav-next{right:clamp(.5rem,2vw,1.6rem)}
.vj-nav:hover{background:rgba(243,239,230,.22);border-color:rgba(243,239,230,.5)}
.vj-nav:focus-visible{outline:2px solid var(--light);outline-offset:3px}
@media (max-width:560px){
  .vj-nav{width:44px;height:44px;font-size:1.6rem}
  /* the photograph gives up the width the arrows need: 44px of button and
     8px of inset each side, plus room so they do not graze the edge */
  .vj-light-inner img{max-width:68vw}
}
`;
{
  const i = s.indexOf('</style>');
  if (i < 0) { log.push('FAIL  2g no </style>'); failed++; }
  else { s = s.slice(0, i) + CSS + s.slice(i); log.push('ok    2g arrow rules'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
