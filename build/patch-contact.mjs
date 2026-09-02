import fs from 'fs';
import { HTML, CSS, JS } from './gen-contact.mjs';

const FILE = 'The-Bhu.Van-Project-Site.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
const fail = m => log.push('FAIL  ' + m);
const ok = m => log.push('ok    ' + m);

if (s.includes('data-contact-modal')) {
  console.log('contact modal already present, nothing to do');
  process.exit(0);
}

/* ---------- 1. CTA radius --------------------------------------------------
   The homepage About section's button (.about-link) is border-radius:3px,
   which is the site's own --radius. The Get in Touch buttons are pills at
   100px; this brings them onto the same corner. Appended as one override
   rather than editing the three scoped .cta rules, so it is easy to revert. */
const RADIUS_CSS = `
/* ---------- Get in Touch buttons: the About-section corner, not a pill ----- */
#page-home .cta,#page-about .cta,.project-page .cta{border-radius:var(--radius)}
`;

/* ---------- 2. append CSS ---------- */
{
  const i = s.indexOf('</style>');
  if (i < 0) fail('no </style> found');
  else {
    s = s.slice(0, i) + RADIUS_CSS + CSS + '\n' + s.slice(i);
    ok(`appended ${(RADIUS_CSS + CSS).length}b of CSS`);
  }
}

/* ---------- 3. the modal markup, once, outside every [data-page] ---------- */
{
  const anchor = '\n</body>';
  const n = s.split(anchor).length - 1;
  if (n !== 1) fail(`expected 1 </body>, found ${n}`);
  else { s = s.replace(anchor, '\n' + HTML + '\n</body>'); ok('inserted the modal markup before </body>'); }
}

/* ---------- 4. retire the three mailto handlers -----------------------------
   initHome, initAbout and initProject each bound every [data-open-contact] to
   a mailto: jump. A delegated opener replaces all three. */
{
  const dead = `page.querySelectorAll('[data-open-contact]').forEach(function(b){b.addEventListener('click',function(){window.location.href='mailto:nikhiludupa4@gmail.com';});});`;
  const deadDoc = `document.querySelectorAll('[data-open-contact]').forEach(function(b){b.addEventListener('click',function(){window.location.href='mailto:nikhiludupa4@gmail.com';});});`;
  let n = 0;
  for (const d of [dead, deadDoc]) {
    const c = s.split(d).length - 1;
    if (c) { s = s.split(d).join('/* contact: handled by the delegated opener below */'); n += c; }
  }
  if (n !== 3) fail(`expected 3 mailto bindings, neutralised ${n}`);
  else ok('neutralised 3 per-page mailto bindings');
}

/* ---------- 5. the modal script, beside the drawer's delegated handlers --- */
{
  const anchor = `  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeDrawers(); });`;
  if (!s.includes(anchor)) fail('could not find the drawer keydown anchor');
  else { s = s.replace(anchor, anchor + '\n' + JS); ok('added the contact modal script'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} bytes (+${s.length - before})`);
if (log.some(l => l.startsWith('FAIL'))) process.exitCode = 1;
