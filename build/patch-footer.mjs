/* The footer, rebuilt to the supplied design.

   Structure from the design: the nav spread across the top, then the brand
   against the place and the button, then the base line under a hairline.
   Sizes, colours and spacing come from the site's own system.

   The three page scopes carried three identical copies of the footer rules.
   They collapse into one :is() block, which keeps the same specificity as the
   `#page-home .footer-x` selectors it replaces.                            */

import fs from 'fs';
import { footer } from './templates/chrome.mjs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const cut = (name, find, expect = 1) => {
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join('');
  log.push(`ok    ${name}`);
};

/* ---- 1. the old rules ----------------------------------------------------
   `#page-home /* footer *​/` is a dangling selector prefix: the .footer line
   below it is part of that selector. The pair has to go together, or the
   prefix would attach itself to whatever line came next. */
for (const p of ['#page-home', '#page-about']) {
  cut(`1 ${p} scope marker + .footer`,
    `${p} /* footer */\n.footer{background:var(--bg);color:var(--primary);padding-block:clamp(3.5rem,7vw,5rem) 2rem;position:relative;overflow:hidden}\n`);
}
cut('1 .project-page .footer',
  `.project-page .footer{background:var(--bg);color:var(--primary);padding-block:clamp(3.5rem,7vw,5rem) 2rem;position:relative;overflow:hidden}\n`);

for (const p of ['#page-home ', '#page-about ', '.project-page ']) {
  cut(`1 ${p}560 break`,
    `@media(max-width:560px){${p}.footer-inner{flex-direction:column}${p}.footer-cols{width:100%}}`);
}

/* everything else is one rule per line */
{
  const keep = [], dropped = [];
  for (const line of s.split('\n')) {
    if (/^(#page-home |#page-about |\.project-page )\.footer[-{]/.test(line)) dropped.push(line);
    else keep.push(line);
  }
  s = keep.join('\n');
  log.push(`ok    1 removed ${dropped.length} scoped footer rules`);
  if (dropped.length !== 42) { log.push(`FAIL  expected 42, got ${dropped.length}`); failed++; }
}

if (/\.footer[-{]/.test(s.slice(0, s.indexOf('</style>')))) {
  log.push('FAIL  footer rules still present in the stylesheet'); failed++;
}

/* ---- 2. the new rules ---------------------------------------------------- */
const P = ':is(#page-home,#page-about,.project-page)';
const CSS = `
/* ---------- Footer ----------
   Nav spread across the top, the brand against the place and the button, the
   base line under a hairline. One block for all three page scopes; :is() takes
   its specificity from the id, so these land exactly where the three copies
   they replace did. */
${P} .footer{background:var(--bg);color:var(--primary);
  padding-block:clamp(3rem,6vw,4.5rem) 2rem}

${P} .footer-nav{display:flex;justify-content:space-between;gap:1rem 2rem;flex-wrap:wrap;
  margin-bottom:clamp(2.5rem,5vw,3.75rem)}
${P} .footer-nav a{font-family:var(--fb);font-size:.75rem;font-weight:600;letter-spacing:.16em;
  text-transform:uppercase;color:rgba(55,40,7,.72);transition:color .25s}
${P} .footer-nav a:hover{color:var(--clay)}

${P} .footer-inner{display:flex;flex-wrap:wrap;gap:2rem 2.5rem;
  justify-content:space-between;align-items:center}
${P} .footer-brand{display:flex;align-items:center;gap:clamp(1rem,1.8vw,1.6rem)}
${P} .footer-logo{width:clamp(74px,7vw,100px);height:clamp(74px,7vw,100px);
  border-radius:50%;object-fit:contain;flex:none}
${P} .footer-name{display:block;font-family:var(--fd);font-weight:700;
  font-size:clamp(1.3rem,1.9vw,1.6rem);line-height:1.1}
${P} .footer-tag{margin:.55rem 0 0;font-family:var(--fb);font-size:.75rem;font-weight:600;
  letter-spacing:.18em;text-transform:uppercase;color:var(--secondary)}

${P} .footer-contact{display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;
  text-align:right}
${P} .footer-place{margin:0;font-size:.95rem;color:rgba(55,40,7,.8)}
/* The design has no line for the address, but it is the only mailto on the
   site, so it sits under the place, a step quieter. */
${P} .footer-mail{font-size:.8rem;color:rgba(55,40,7,.72);transition:color .25s}
${P} .footer-mail:hover{color:var(--clay)}
${P} .footer-cta{margin-top:.6rem;background:var(--secondary);color:var(--light);
  border-radius:var(--radius);padding:.85rem 1.9rem;font-size:.72rem;letter-spacing:.14em;
  font-weight:700}
${P} .footer-cta:hover{background:var(--clay)}

${P} .footer-base{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem;
  margin-top:clamp(2.5rem,5vw,3.5rem);padding-top:1.5rem;
  border-top:1px solid rgba(55,40,7,.16);font-family:var(--fb);font-size:.72rem;
  font-weight:500;letter-spacing:.06em;color:rgba(55,40,7,.72)}

/* Spread across the full width needs width to spread into: below this the nav
   runs from the left and the two halves stack. */
@media(max-width:720px){
  ${P} .footer-nav{justify-content:flex-start;gap:.85rem 1.6rem}
  ${P} .footer-inner{flex-direction:column;align-items:flex-start}
  ${P} .footer-contact{align-items:flex-start;text-align:left}
}
`;
{
  const i = s.indexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + CSS + s.slice(i); log.push('ok    2 new footer rules'); }
}

/* ---- 3. the markup, straight from the template --------------------------- */
{
  const re = /<footer class="footer">[\s\S]*?<\/footer>/g;
  const n = (s.match(re) || []).length;
  if (n !== 11) { log.push(`FAIL  3 footers: expected 11, found ${n}`); failed++; }
  else { s = s.replace(re, () => footer()); log.push(`ok    3 rewrote ${n} footers from the template`); }
}

if (failed) { console.log(log.join('\n')); console.log(`\n${failed} step(s) failed, not written`); process.exitCode = 1; }
else {
  fs.writeFileSync(FILE, s);
  console.log(log.join('\n'));
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
}
