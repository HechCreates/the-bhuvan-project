/* The founder and co-founder popups on a phone.

   The one-column phone layout for popups (max-width:820px) was only ever
   written for #page-home. The About popups kept their two-column desktop
   grid, and the short-screen rule (max-height:820px) then fixed the photo
   column at 290px -- so on a 375px phone the panel was 335px wide holding a
   290px photo column plus a 163px text column. The photo stretched to
   290x2393 as a cropped face, the text was a sliver, and most of it ran off
   the side of the panel.

   On a phone the popup now reads like the About section itself: the same
   approved square crop at the same 175px size, then the role, the name and
   the profile in the section's type scale. Desktop keeps the full-length
   portrait -- the <source> only applies at 760px and below.

   Also fixed: "Read the full profile" inherited the section's cream link
   colour and sat cream-on-cream in the popup at every screen size, which
   made it invisible. Inside the popup it now uses the clay accent, like
   every other link on a light ground on this site.                        */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const crlf = t => t.replace(/\r?\n/g, '\r\n');
const swap = (name, find, replace, expect = 1) => {
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

/* ---- 1. the square crop on a phone, the full portrait everywhere else ---- */
for (const [slug, alt] of [
  ['nikhil-udupa', 'Nikhil Udupa, founder of The Bhu.Van Project.'],
  ['shilpa-shirish', 'Shilpa Shirish, co-founder of The Bhu.Van Project.'],
]) {
  swap(`${slug} popup photo`,
    `<div class="modal-media"><img src="images/team/${slug}-full.webp" alt="${alt}"></div>`,
    `<div class="modal-media"><picture><source media="(max-width:760px)" srcset="images/team/${slug}-sq.webp"><img src="images/team/${slug}-full.webp" width="900" height="1351" alt="${alt}"></picture></div>`);
}

/* ---- 2. the rules ---------------------------------------------------------
   Appended, so they come after the max-height blocks they have to beat; the
   selectors carry the same #page-about specificity. */
const CSS = `
/* ---------- Founder and co-founder popups ---------- */
/* the section's link is cream for its dark ground; the popup panel is cream */
#page-about .modal-body .founder-link{color:var(--clay);border-bottom-color:rgba(180,112,58,.45)}
#page-about .modal-body .founder-link:hover{color:var(--primary);border-color:var(--primary)}

/* On a phone: one column, the approved square crop at the section's 175px,
   then role, name and profile in the section's own type scale. */
@media (max-width:760px){
  #page-about .modal{padding:.75rem}
  #page-about .modal-panel{display:block;max-height:calc(100svh - 1.5rem);overflow-x:hidden;overflow-y:auto}
  #page-about .modal-media{position:static;min-height:0;width:175px;aspect-ratio:1/1;margin:1.5rem 0 0 1.5rem}
  #page-about .modal-media picture{display:block;width:100%;height:100%}
  #page-about .modal-media img{position:static;display:block;width:100%;height:100%;object-fit:cover}
  #page-about .modal-body{padding:1.25rem 1.5rem 1.75rem}
  #page-about .modal-eyebrow{font-size:.7rem;letter-spacing:.18em}
  #page-about .modal-title{font-size:1.75rem;line-height:1.1;margin-top:.4rem;max-width:none}
  #page-about .modal-para{font-size:.9375rem;line-height:1.65;margin-top:.9rem}
  #page-about .modal-body .founder-link{margin-top:1.4rem}
  #page-about .modal-close{top:.75rem;right:.75rem}
}
`;
{
  const i = s.lastIndexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + crlf(CSS) + s.slice(i); log.push('ok    popup rules appended'); }
}

if (failed) {
  console.log(log.join('\n'));
  console.log(`\n${failed} step(s) failed, ${FILE} not written`);
  process.exitCode = 1;
} else {
  fs.writeFileSync(FILE, s);
  console.log(log.join('\n'));
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
}
