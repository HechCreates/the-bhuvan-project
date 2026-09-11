/* One Escape handler, one close path.

   initHome() bound its own [data-close-modal] click listeners and its own
   Escape handler, both of which release the scroll lock unconditionally. That
   was harmless while only one modal could ever be open; the Visual Journey
   lightbox opens on top of the collage it came from, and the pair then fought:
   the home handler closed the FIRST open modal (the collage, underneath)
   while the global one closed the topmost, so a single Escape shut both and
   left the page unscrollable-or-not depending on which ran last.

   Its listeners were also document-wide -- querySelectorAll at init time picks
   up every [data-close-modal] on every page, not just the home page's -- so
   this was not containable by scope. The global delegated handlers already do
   the same job and know about stacking, so the duplicates come out and the
   openers point at the shared `memberLast` to keep focus restoration.      */

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

swap('1 drop the duplicate close listeners and Escape handler',
  `document.querySelectorAll('[data-close-modal]').forEach(function(el){el.addEventListener('click',function(){closeModal(el.closest('.modal'));});});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var o=document.querySelector('.modal:not([hidden])');if(o)closeModal(o);}});
`, '');

swap('2 the service opener remembers focus where the global handler looks',
  `function openModal(id){var m=document.querySelector('[data-service-modal="'+id+'"]');if(!m)return;lastFocused=document.activeElement;`,
  `function openModal(id){var m=document.querySelector('[data-service-modal="'+id+'"]');if(!m)return;memberLast=document.activeElement;`);

swap('3 the map opener likewise',
  `function(){if(!mapModal)return;lastFocused=document.activeElement;`,
  `function(){if(!mapModal)return;memberLast=document.activeElement;`);

swap('4 the now-dead helpers',
  `var lastFocused=null;
function openModal(id)`, `function openModal(id)`);
swap('4b closeModal has no callers left',
  `function closeModal(m){m.hidden=true;document.body.style.overflow='';if(lastFocused)lastFocused.focus();}\n`, '');

for (const dead of ['closeModal', 'lastFocused']) {
  const n = s.split(dead).length - 1;
  if (n) { log.push(`FAIL  ${dead} still appears ${n} time(s)`); failed++; }
  else log.push(`ok    ${dead} fully removed`);
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
