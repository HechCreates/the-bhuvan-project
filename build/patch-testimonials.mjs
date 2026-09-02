import fs from 'fs';
import { testimonialsPage, CSS } from './gen-testimonials.mjs';

const FILE = 'The-Bhu.Van-Project-Site.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
const fail = m => log.push('FAIL  ' + m);
const ok = m => log.push('ok    ' + m);

function swap(name, find, replace) {
  const n = s.split(find).length - 1;
  if (n !== 1) { fail(`${name}: expected 1 match, found ${n}`); return false; }
  s = s.replace(find, replace); ok(name); return true;
}

if (s.includes('data-page="testimonials"')) {
  console.log('testimonials page already present, nothing to do');
  process.exit(0);
}

/* ---------- 1. wire the nav / footer "Testimonials" placeholders ---------- */
{
  const re = /href="#\/"(\s*)class="(nav-link|mobile-link)" data-soon="testimonials"/g;
  const n = (s.match(re) || []).length;
  if (!n) fail('could not find the nav Testimonials placeholders');
  else { s = s.replace(re, 'href="#/testimonials"$1class="$2" data-route="testimonials"');
         ok(`nav: wired ${n} "Testimonials" link(s)`); }
  const fre = /href="#\/" data-soon="testimonials"/g;
  const fn = (s.match(fre) || []).length;
  if (fn) { s = s.replace(fre, 'href="#/testimonials" data-route="testimonials"');
            ok(`footer: wired ${fn} "Testimonials" link(s)`); }
}

/* ---------- 2. append the page CSS ---------- */
{
  const i = s.indexOf('</style>');
  if (i < 0) fail('no </style> found');
  else { s = s.slice(0, i) + CSS + '\n' + s.slice(i); ok(`appended ${CSS.length}b of CSS`); }
}

/* ---------- 3. clone header + footer out of #page-home ---------- */
const homeStart = s.indexOf('<div id="page-home"');
const homeEnd = s.indexOf('<div id="page-about"');
const home = s.slice(homeStart, homeEnd);
const header = home.slice(home.indexOf('<header class="site-header"'),
                          home.indexOf('</header>') + 9);
const fStart = home.indexOf('<footer class="footer">');
const footer = home.slice(fStart, home.indexOf('</footer>', fStart) + 9);
if (!header || !footer) fail('could not clone header/footer');
else ok(`cloned header (${header.length}b) and footer (${footer.length}b)`);

/* ---------- 4. insert the page ---------- */
{
  const page = testimonialsPage().replace('<!--HEADER-->', header).replace('<!--FOOTER-->', footer);
  const i = s.lastIndexOf('<script>');
  s = s.slice(0, i) + page + '\n' + s.slice(i);
  ok('inserted the testimonials page');
}

/* ---------- 5. router: give data-route="testimonials" a real hash ---------- */
swap('router: testimonials hash',
  `var nh = r==='about'?'#/about':(r==='projects'?'#/projects':(r.indexOf('p-')===0?('#/projects/'+r.slice(2)):'#/'));`,
  `var nh = r==='about'?'#/about':(r==='projects'?'#/projects':(r==='testimonials'?'#/testimonials':(r.indexOf('p-')===0?('#/projects/'+r.slice(2)):'#/')));`);

/* The document title falls back to the home title for a page with no
   .proj-title; give the testimonials route its own. */
swap('router: testimonials document title',
  `document.title = pt ? (pt.textContent.trim()+', The Bhu.Van Project') : (route==='about' ? 'About, The Bhu.Van Project' : 'The Bhu.Van Project');`,
  `document.title = pt ? (pt.textContent.trim()+', The Bhu.Van Project')
      : (route==='about' ? 'About, The Bhu.Van Project'
      : route==='testimonials' ? 'Testimonials, The Bhu.Van Project'
      : route==='projects' ? 'Projects, The Bhu.Van Project' : 'The Bhu.Van Project');`);

/* ---------- 6. the expand/collapse behaviour ----------------------------------
   Delegated, like the mobile drawer, so it survives the router swapping pages
   in and out. A card only gets its control once we have measured that the
   clamp is actually hiding something. */
{
  const JS = `
  /* ---- testimonial cards: three lines, then an ellipsis and a chevron ---- */
  function tqMeasure(){
    document.querySelectorAll('.tq-card').forEach(function(card){
      if(card.classList.contains('is-open')) return;   // nothing to measure while open
      var body=card.querySelector('.tq-body'); if(!body) return;
      var lede=body.querySelector('.tq-lede'); if(!lede) return;
      card.classList.toggle('has-more', (lede.scrollHeight - lede.clientHeight) > 1);
    });
  }
  function tqToggle(card){
    var open=card.classList.toggle('is-open');
    var btn=card.querySelector('.tq-more');
    if(btn) btn.setAttribute('aria-expanded', open?'true':'false');
    if(!open) tqMeasure();
  }
  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    var btn=e.target.closest('.tq-more');
    if(btn){ tqToggle(btn.closest('.tq-card')); return; }
    var body=e.target.closest('.tq-card.has-more:not(.is-open) .tq-body');
    if(body){ tqToggle(body.closest('.tq-card')); }
  });
  var tqT; window.addEventListener('resize', function(){ clearTimeout(tqT); tqT=setTimeout(tqMeasure,150); });
  window.addEventListener('hashchange', function(){ setTimeout(tqMeasure,60); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(tqMeasure);
  setTimeout(tqMeasure,0);
`;
  const anchor = `  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeDrawers(); });`;
  if (!s.includes(anchor)) fail('could not find the drawer keydown anchor for the card script');
  else { s = s.replace(anchor, anchor + '\n' + JS); ok('added the expand/collapse handler'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} bytes (+${s.length - before})`);
if (log.some(l => l.startsWith('FAIL'))) process.exitCode = 1;
