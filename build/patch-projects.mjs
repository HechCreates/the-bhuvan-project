import fs from 'fs';
import path from 'path';
import { pageFor, CSS as PROJECT_CSS } from './gen-project.mjs';
import { indexPage, INDEX_CSS } from './gen-index.mjs';
import { ORDER } from './projects-content.mjs';

const FILE = 'The-Bhu.Van-Project-Site.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
const fail = m => { log.push('FAIL  ' + m); };
const ok = m => { log.push('ok    ' + m); };

function swap(name, find, replace) {
  const n = s.split(find).length - 1;
  if (n !== 1) { fail(`${name}: expected 1 match, found ${n}`); return false; }
  s = s.replace(find, replace); ok(name); return true;
}

/* ---------- parse the stylesheet into top-level rules ---------- */
const styleStart = s.indexOf('<style>') + 7;
const styleEnd = s.indexOf('</style>');
const style = s.slice(styleStart, styleEnd);

function splitRules(css) {
  const out = []; let depth = 0, buf = '';
  for (const ch of css) {
    buf += ch;
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { out.push(buf); buf = ''; } }
  }
  if (buf.trim()) out.push(buf);
  return out;
}
const stripComments = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ');
const selOf = r => stripComments(r.slice(0, r.indexOf('{'))).replace(/\s+/g, ' ').trim();
const bodyOf = r => r.slice(r.indexOf('{') + 1, r.lastIndexOf('}'));

const rules = splitRules(style);

/* ---------- 1. hoist the design tokens to :root ---------- */
const tokenRule = rules.find(r => selOf(r) === '#page-home' && /--soil\s*:/.test(r));
if (!tokenRule) fail('could not find the #page-home token block');
else {
  const tokens = bodyOf(tokenRule).trim();
  const rootBlock = `\n/* Tokens hoisted so pages other than home/about can use them. The original\n   per-page declarations still win on specificity, so nothing else changes. */\n:root{${tokens}}\n`;
  if (s.includes(':root{--soil')) ok('tokens already hoisted, skipped');
  else { s = s.slice(0, styleStart) + rootBlock + s.slice(styleStart); ok('hoisted design tokens to :root'); }
}

/* ---------- 2. derive the shared chrome rules for .project-page ---------- */
const CHROME = ['.wrap', '.label', '.site-header', '.header-inner', '.brand', '.brand-logo',
  '.brand-name', '.nav', '.nav-link', '.cta', '.menu-toggle', '.mobile-nav', '.mobile-link',
  '.footer', '.footer-inner', '.footer-brand', '.footer-logo', '.footer-name', '.footer-tag',
  '.footer-cols', '.footer-nav', '.footer-contact', '.footer-cta', '.footer-base'];

function rewriteSelector(sel) {
  const parts = sel.split(',').map(p => p.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (!p.startsWith('#page-home')) continue;
    const rest = p.slice('#page-home'.length).trim();
    // the page container rule itself: carries colour, font and the tokens
    if (!rest) { out.push('.project-page'); continue; }
    const head = rest.split(/[\s>+~]/)[0];
    // element and universal resets (*, a, img, button, h1...) apply to every
    // page. Missing "*" here is what left the project page on content-box.
    const isElement = /^[a-z*]/i.test(head);
    const cls = head.split(/[.:\[]/).filter(Boolean)[0];
    if (!isElement && !CHROME.includes('.' + cls)) continue;
    out.push('.project-page ' + rest);
  }
  return out.join(',');
}

const derived = [];
for (const r of rules) {
  const sel = selOf(r);
  if (sel.startsWith('@media')) {
    const inner = splitRules(bodyOf(r));
    const kept = [];
    for (const ir of inner) {
      const ns = rewriteSelector(selOf(ir));
      if (ns) kept.push(ns + '{' + bodyOf(ir) + '}');
    }
    if (kept.length) derived.push(sel + '{' + kept.join('') + '}');
    continue;
  }
  if (sel.startsWith('@')) continue;
  const ns = rewriteSelector(sel);
  if (ns) derived.push(ns + '{' + bodyOf(r) + '}');
}
ok(`derived ${derived.length} chrome rules for .project-page`);

/* ---------- 3. append derived chrome + project page CSS ---------- */
const newStyleEnd = s.indexOf('</style>');
const cssBlock = '\n/* ---------- Project pages: chrome derived from the #page-home rules ---------- */\n'
  + derived.join('\n') + '\n' + PROJECT_CSS + '\n' + INDEX_CSS + '\n';
s = s.slice(0, newStyleEnd) + cssBlock + s.slice(newStyleEnd);
ok('appended project-page and index stylesheets');

/* ---------- 3a. mobile nav: one dropdown design for every page ---------------
   The original rules are scoped per page id, so overriding them needs the same
   specificity. Emitting the new rules under all three scopes, after the
   originals, means the later declaration wins. */
{
  const SCOPES = ['#page-home', '#page-about', '.project-page'];
  const rule = (sel, decls) => SCOPES.map(p => `${p} ${sel}`).join(',') + '{' + decls + '}';
  const navCss = `
/* ---------- Mobile navigation: half-height off-white dropdown ---------- */
${rule('.mobile-nav', `display:none;position:fixed;top:var(--nav-top,4.5rem);left:0;right:0;
  height:50svh;max-height:50svh;overflow-y:auto;z-index:50;
  background:var(--light);color:var(--primary);
  flex-direction:column;justify-content:space-evenly;gap:0;
  padding:.5rem var(--gutter) 1rem;
  box-shadow:0 16px 34px -16px rgba(42,31,8,.55);
  border-bottom:1px solid rgba(55,40,7,.16)`)}
${rule('.mobile-nav[data-open]', 'display:flex')}
${rule('.mobile-link', `display:flex;align-items:center;min-height:44px;
  font-family:var(--fb);font-weight:600;font-size:.9375rem;letter-spacing:.02em;
  line-height:1.2;color:var(--primary);text-decoration:none;
  padding:.2rem 0;border-bottom:1px solid rgba(55,40,7,.12)`)}
${rule('.mobile-link:last-of-type', 'border-bottom:0')}
${rule('.mobile-nav .cta', `align-self:flex-start;min-height:44px;
  background:var(--soil);color:var(--light)`)}
/* the header sits above the dropdown so the close control stays reachable */
${rule('.site-header', 'z-index:60')}
/* the original turned the bars soil-dark when open, for a full-screen cream
   drawer that covered the header. The header now stays dark and visible, so
   dark bars would disappear into it: keep them light. */
${rule('.menu-toggle[aria-expanded="true"] span', 'background:var(--light)')}
/* the toggle measured 38x28, under the 44px touch target; it is the only
   navigation control on a phone so it earns the full size */
${rule('.menu-toggle', `width:44px;height:44px;align-items:center;justify-content:center;padding:0`)}
/* On a very short screen five 44px links plus the button do not fit in half
   the viewport and the CTA fell outside the panel. Keep the half-height and
   tighten the rows instead, so the panel still holds everything. */
@media (max-height:640px){
${rule('.mobile-nav', 'padding-block:.25rem .5rem')}
${rule('.mobile-link', 'min-height:38px;font-size:.875rem')}
${rule('.mobile-nav .cta', 'min-height:38px')}
}
`;
  const i = s.indexOf('</style>');
  s = s.slice(0, i) + navCss + s.slice(i);
  ok('appended the mobile dropdown stylesheet');
}

/* ---------- 3b. make the nav "Projects" a real route -------------------------
   Done before the header is cloned so every project page inherits the fix. */
{
  const re = /href="#\/"(\s*)class="(nav-link|mobile-link)" data-soon="projects"/g;
  const n = (s.match(re) || []).length;
  if (!n) fail('could not find the nav Projects placeholders');
  else {
    s = s.replace(re, 'href="#/projects"$1class="$2" data-route="projects"');
    ok(`nav: wired ${n} "Projects" link(s) to the index`);
  }
  // the footer nav uses a bare data-soon too
  const fre = /href="#\/" data-soon="projects"/g;
  const fn = (s.match(fre) || []).length;
  if (fn) { s = s.replace(fre, 'href="#/projects" data-route="projects"'); ok(`footer: wired ${fn} "Projects" link(s)`); }
}

/* ---------- 4. clone header + footer out of #page-home ---------- */
const homeStart = s.indexOf('<div id="page-home"');
const homeEnd = s.indexOf('<div id="page-about"');
const home = s.slice(homeStart, homeEnd);
const hStart = home.indexOf('<header class="site-header"');
const hEnd = home.indexOf('</header>') + '</header>'.length;
const header = home.slice(hStart, hEnd);
const fStart = home.indexOf('<footer class="footer">');
const fEnd = home.indexOf('</footer>', fStart) + '</footer>'.length;
const footer = home.slice(fStart, fEnd);
if (!header || !footer) fail('could not clone header/footer from #page-home');
else ok(`cloned header (${header.length}b) and footer (${footer.length}b)`);

/* ---------- 5. insert the project page ---------- */
const SLUGS = process.argv[2] ? [process.argv[2]] : ORDER;
const pages = [];
for (const slug of SLUGS) {
  let page = pageFor(slug);
  if (!page.includes('<!--HEADER-->') || !page.includes('<!--FOOTER-->')) {
    fail(`${slug}: template missing header/footer placeholders`); continue;
  }
  page = page.replace('<!--HEADER-->', header).replace('<!--FOOTER-->', footer);
  if (s.includes(`data-page="p-${slug}"`)) { fail(`p-${slug} already present`); continue; }
  pages.push(page);
}
// the projects index, same shell treatment
if (!s.includes('data-page="projects"')) {
  let idx = indexPage();
  if (!idx.includes('<!--HEADER-->') || !idx.includes('<!--FOOTER-->')) fail('index template missing placeholders');
  pages.unshift(idx.replace('<!--HEADER-->', header).replace('<!--FOOTER-->', footer));
  ok('built the projects index page');
} else fail('projects index already present');

if (pages.length) {
  const i = s.lastIndexOf('<script>');
  s = s.slice(0, i) + pages.join('\n') + '\n' + s.slice(i);
  ok(`inserted ${pages.length} page(s)`);
}

/* ---------- 6. generalise the router ---------- */
swap('router: inited map',
  `var inited={home:false,about:false};`,
  `var inited={};`);

swap('router: accept any registered page',
  `    route = (route==='about')?'about':'home';`,
  `    if(!document.querySelector('[data-page="'+route+'"]')) route='home';`);

swap('router: init per page type',
  `    if(!inited[route]){ try{ route==='about'?initAbout():initHome(); }catch(e){console.error(e);} inited[route]=true; }`,
  `    if(!inited[route]){ try{ if(route==='about'){initAbout();}else if(route==='home'){initHome();}else{initProject();} }catch(e){console.error(e);} inited[route]=true; }`);

swap('router: document title',
  `    document.title = route==='about' ? 'About — The Bhu.Van Project' : 'The Bhu.Van Project';`,
  `    var pt=document.querySelector('[data-page="'+route+'"] .proj-title');
    document.title = pt ? (pt.textContent.trim()+', The Bhu.Van Project') : (route==='about' ? 'About, The Bhu.Van Project' : 'The Bhu.Van Project');`);

swap('router: parse project hashes',
  `    var h=(location.hash||'').replace(/^#\\/?/,'');
    show(h==='about'?'about':'home');`,
  `    var h=(location.hash||'').replace(/^#\\/?/,'').replace(/\\/$/,'');
    if(h.indexOf('projects/')===0){h='p-'+h.slice(9);}
    show(h||'home');`);

swap('router: build hash from data-route',
  `    if(a){ e.preventDefault(); var r=a.getAttribute('data-route'); location.hash = r==='about'?'#/about':'#/'; }`,
  `    if(a){ if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0)return; e.preventDefault(); var r=a.getAttribute('data-route');
      var nh = r==='about'?'#/about':(r==='projects'?'#/projects':(r.indexOf('p-')===0?('#/projects/'+r.slice(2)):'#/'));
      if(location.hash===nh){show(r);}else{location.hash=nh;} }`);

/* ---------- 6b. mobile drawer: delegate instead of binding per page ---------
   initHome and initAbout both did document.querySelector('[data-menu-toggle]'),
   which always returns the FIRST header in the document, so every page except
   home wired its hamburger to the homepage's hidden drawer and did nothing.
   Neutralising those lookups and handling the toggle by delegation fixes every
   page at once, including the ones added later. */
{
  const dead = `var toggle=document.querySelector('[data-menu-toggle]'),drawer=document.querySelector('[data-mobile-nav]');`;
  const n = s.split(dead).length - 1;
  if (n !== 2) fail(`drawer binding: expected 2 occurrences, found ${n}`);
  else { s = s.split(dead).join('var toggle=null,drawer=null;'); ok('disabled 2 per-page drawer bindings'); }

  const deadP = `var t=page.querySelector('[data-menu-toggle]'),d=page.querySelector('[data-mobile-nav]');`;
  if (s.includes(deadP)) { s = s.replace(deadP, 'var t=null,d=null;'); ok('disabled the project-page drawer binding'); }
}

swap('nav: one delegated drawer handler',
  `  var inited={};`,
  `  function closeDrawers(){
    document.querySelectorAll('[data-mobile-nav][data-open]').forEach(function(d){d.removeAttribute('data-open');});
    document.querySelectorAll('[data-menu-toggle]').forEach(function(t){t.setAttribute('aria-expanded','false');});
    document.body.style.overflow='';
  }
  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('[data-menu-toggle]');
    if(t){
      var hdr=t.closest('.site-header');
      var d=hdr&&hdr.querySelector('[data-mobile-nav]');
      if(!d)return;
      var wasOpen=d.hasAttribute('data-open');
      closeDrawers();
      if(!wasOpen){d.setAttribute('data-open','');t.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';}
      return;
    }
    if(e.target.closest&&e.target.closest('[data-mobile-nav] a,[data-mobile-nav] button')) closeDrawers();
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeDrawers(); });
  window.addEventListener('hashchange',closeDrawers);
  var inited={};`);

swap('router: initProject',
  `  var inited={};`,
  `  function initProject(){
    var page=document.querySelector('.project-page.is-active');
    if(!page)return;
    page.querySelectorAll('[data-open-contact]').forEach(function(b){b.addEventListener('click',function(){window.location.href='mailto:nikhiludupa4@gmail.com';});});
    /* the mobile drawer is handled by the delegated listener above, binding it
       again here would toggle it twice and appear to do nothing */
    var hdr=page.querySelector('[data-header]');
    if(hdr){hdr.classList.add('stuck');}
  }
  var inited={};`);

/* ---------- 7. wire the homepage cards to their project pages ---------- */
const CARD_TO_SLUG = {
  'bandipur-tiger-reserve': 'bandipur-tiger-reserve',
  'wildlife-habitat-restoration': 'ecological-restoration',
  'mysuru-rail-museum': 'mysuru-rail-museum',
  'nilgiris-biosphere-reserve': 'nilgiris-biosphere-reserve',
  'chairmans-bungalow': 'chairmans-bungalow',
  'karavulapalli-farm': 'karavulapalli-farm',
};
for (const [cardId, slug] of Object.entries(CARD_TO_SLUG)) {
  if (!SLUGS.includes(slug)) continue;
  swap(`home card -> ${slug}`,
    `<a href="/projects#${cardId}" class="plate-link">`,
    `<a href="#/projects/${slug}" data-route="p-${slug}" class="plate-link">`);
}

/* the homepage "All projects" link now has a real destination */
swap('home: All projects -> index',
  `<a class="projects-view-all" href="/projects">All projects &rarr;</a>`,
  `<a class="projects-view-all" href="#/projects" data-route="projects">All projects &rarr;</a>`);

/* ---------- report ---------- */
console.log('');
for (const l of log) console.log(l);
if (log.some(l => l.startsWith('FAIL'))) { console.log('\nABORTED, nothing written'); process.exit(1); }
fs.writeFileSync(FILE, s);
console.log('');
console.log(`wrote ${FILE}   ${(before / 1048576).toFixed(2)} MB -> ${(s.length / 1048576).toFixed(2)} MB`);
