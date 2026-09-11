/* Visual Journey: the stylesheet, the route and the popup opener. */

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

/* ---- 1. the route -------------------------------------------------------- */
swap('1a route -> #/journey',
  `var nh = r==='about'?'#/about':(r==='projects'?'#/projects':(r==='testimonials'?'#/testimonials':(r.indexOf('p-')===0?('#/projects/'+r.slice(2)):'#/')));`,
  `var nh = r==='about'?'#/about':(r==='projects'?'#/projects':(r==='testimonials'?'#/testimonials':(r==='journey'?'#/journey':(r.indexOf('p-')===0?('#/projects/'+r.slice(2)):'#/'))));`);

swap('1b document title',
  `      : (route==='about' ? 'About, The Bhu.Van Project'`,
  `      : (route==='journey' ? 'Visual Journey, The Bhu.Van Project'
      : route==='about' ? 'About, The Bhu.Van Project'`);

/* ---- 2. the popup opener ------------------------------------------------
   Close and Escape are already global to .modal; only the opener knew about
   one kind of modal. */
swap('2 opener also takes data-open-journey',
  `    var open=e.target.closest('[data-open-member]');
    if(open){
      var m=document.querySelector('[data-member-modal="'+open.getAttribute('data-open-member')+'"]');
      if(!m) return;`,
  `    var open=e.target.closest('[data-open-member],[data-open-journey]');
    if(open){
      var mk=open.getAttribute('data-open-member');
      var m=document.querySelector(mk ? '[data-member-modal="'+mk+'"]'
        : '[data-journey-modal="'+open.getAttribute('data-open-journey')+'"]');
      if(!m) return;`);

/* ---- 3. the stylesheet ---------------------------------------------------
   Ground #CAC7BF, the View More tile's #372807 and the mosaic's proportions
   are measured off the supplied PDF: a 4-column, 2-row grid on a 1.47% gap,
   the first photograph spanning 2x2, the tile in the bottom-right corner. */
const CSS = `
/* ---------- Visual Journey ---------- */
.journey-page{background:#CAC7BF;color:var(--primary)}
.journey-page .footer{background:#CAC7BF}

.vj-open{padding-block:clamp(7rem,15vh,10rem) clamp(2rem,4vw,3rem)}
.vj-h1{font-family:var(--fd);font-weight:700;letter-spacing:-.02em;line-height:1.05;
  font-size:clamp(2.1rem,5vw,3.6rem);color:var(--primary);margin:0 0 clamp(1.5rem,3vw,2.4rem)}
.journey-page .sec-kicker{color:var(--clay)}
/* two columns so the copy fills the layout without running past a readable
   measure; one column once there is no room for two */
.vj-lede{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,3vw,2.75rem);
  max-width:none}
.vj-lede p{margin:0;font-size:clamp(.98rem,1.08vw,1.06rem);line-height:1.75;
  color:rgba(55,40,7,.88);max-width:68ch}

.vj-grid-sec{padding-block:0 clamp(4rem,9vw,7rem)}
.vj-grid{--vj-gap:clamp(2rem,9vw,7rem);
  display:grid;grid-template-columns:1fr 1fr;
  column-gap:var(--vj-gap);row-gap:clamp(2.75rem,5.5vw,4.5rem)}
/* five categories in a two-column grid: the last one is centred on its own row */
.vj-grid .vj-block:last-child{grid-column:1/-1;
  max-width:calc((100% - var(--vj-gap))/2);margin-inline:auto;width:100%}
.vj-block{margin:0}
.vj-title{font-family:var(--fd);font-weight:700;letter-spacing:-.01em;line-height:1.15;
  font-size:clamp(1.15rem,1.95vw,1.6rem);color:var(--primary);
  margin:0 0 clamp(.7rem,1.3vw,1.05rem)}

.vj-mosaic{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(4px,1.47%,9px)}
.vj-cell{overflow:hidden;aspect-ratio:1;background:#b9b5ac}
.vj-cell img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .6s cubic-bezier(.22,.61,.36,1)}
.vj-cell:hover img{transform:scale(1.05)}
.vj-cell-1{grid-column:span 2;grid-row:span 2}

.vj-more{aspect-ratio:1;background:var(--primary);color:var(--light);border:0;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;
  padding:.4rem;text-align:center;font-family:var(--fb);transition:background .25s}
.vj-more>span:first-child{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.vj-count{font-size:.6875rem;font-weight:500;letter-spacing:.04em;color:rgba(243,239,230,.72)}
.vj-more:hover{background:var(--clay)}
.vj-more:focus-visible{outline:2px solid var(--primary);outline-offset:3px}

/* ---------- Visual Journey popup ----------
   Self-contained: the site's other modal rules are scoped to #page-home and
   #page-about, and widening thirteen of them again to reach a third page is a
   worse trade than the dozen lines here. */
.vj-modal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;
  padding:clamp(.75rem,2vw,1.5rem)}
.vj-modal[hidden]{display:none}
.vj-modal .modal-backdrop{position:absolute;inset:0;background:rgba(20,15,4,.72);backdrop-filter:blur(4px)}
.vj-panel{position:relative;display:flex;flex-direction:column;background:var(--bg);color:var(--primary);
  border-radius:5px;width:100%;max-width:1180px;max-height:92vh;overflow:hidden;
  box-shadow:0 40px 90px -30px rgba(20,15,4,.75);animation:mIn .3s ease}
.vj-panel-head{position:relative;flex:none;padding:clamp(1.1rem,2.2vw,1.6rem) clamp(1.1rem,2.4vw,1.9rem);
  padding-right:3.4rem;border-bottom:1px solid rgba(55,40,7,.16)}
.vj-panel-title{font-family:var(--fd);font-weight:700;letter-spacing:-.01em;line-height:1.15;
  font-size:clamp(1.25rem,2.4vw,1.8rem);color:var(--primary);margin:0}
.vj-panel-count{margin:.3rem 0 0;font-family:var(--fb);font-size:.6875rem;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;color:rgba(55,40,7,.66)}
.vj-modal .modal-close{position:absolute;top:50%;right:clamp(.9rem,2vw,1.5rem);transform:translateY(-50%);
  width:38px;height:38px;border:0;border-radius:50%;background:rgba(55,40,7,.08);color:var(--primary);
  font-size:1.5rem;line-height:1;cursor:pointer;transition:background .2s}
.vj-modal .modal-close:hover{background:rgba(55,40,7,.18)}

.vj-collage{overflow:auto;-webkit-overflow-scrolling:touch;
  padding:clamp(1rem,2.4vw,1.9rem);
  display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));
  gap:clamp(.8rem,1.6vw,1.3rem)}
.vj-shot{margin:0}
.vj-shot img{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#d8d3c4;
  border-radius:2px}
.vj-shot figcaption{margin-top:.45rem;font-family:var(--fb);font-size:.6875rem;line-height:1.4;
  color:rgba(55,40,7,.72);text-wrap:pretty}

@media (max-width:900px){
  .vj-lede{grid-template-columns:1fr}
  .vj-grid{grid-template-columns:1fr;--vj-gap:0px;row-gap:clamp(2.5rem,6vw,3.5rem)}
  .vj-grid .vj-block:last-child{max-width:none}
}
@media (max-width:560px){
  .vj-collage{grid-template-columns:repeat(auto-fill,minmax(118px,1fr))}
  .vj-more>span:first-child{font-size:.6875rem;letter-spacing:.02em}
  .vj-count{display:none}
}
`;
{
  const i = s.indexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + CSS + s.slice(i); log.push('ok    3 stylesheet'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
