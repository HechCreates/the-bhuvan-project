/* The mobile footer, to the supplied design.

   "Mobile Footer.png" is 1368px wide and its divider is inset 72px each side
   -- 5.3%, which is the site's own gutter at a 390px viewport. So the mock is
   390px at 3.508x, and every spacing below is a measured band from it divided
   by that, not a guess:

     nav, baseline to baseline   124 -> 35px
     last nav item to the logo    86 -> 30px  (uses the disc, not the glyphs)
     logo to the name             30 -> 10px
     name to the tagline          21 ->  6px
     tagline to the place        121 -> 34px
     place to the email           36 -> 10px
     email to the button          42 -> 12px
     button to the rule          138 -> 39px
     rule to the copyright        76 -> 22px
     copyright to the motto       56 -> 16px

   Everything centres, the nav runs one item per line, and the logo sits above
   the brand name rather than beside it.                                    */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const P = ':is(#page-home,#page-about,.project-page)';

const OLD = `/* Spread across the full width needs width to spread into: below this the nav
   runs from the left and the two halves stack. */
@media(max-width:720px){
  ${P} .footer-nav{justify-content:flex-start;gap:.85rem 1.6rem}
  ${P} .footer-inner{flex-direction:column;align-items:flex-start}
  ${P} .footer-contact{align-items:flex-start;text-align:left}
}`;

const NEW = `/* ---------- Footer on a phone ----------
   Spread across the full width needs width to spread into. Below this the
   footer becomes one centred column, to "Mobile Footer.png": the nav one item
   per line, the logo above the brand name rather than beside it, and the base
   line stacked instead of pushed to the two edges. The spacing is that mock's
   measured bands at its own scale -- 390px at 3.508x. */
@media(max-width:720px){
  ${P} .footer-nav{flex-direction:column;align-items:center;justify-content:center;
    gap:.25rem;margin-bottom:1.85rem}
  /* padding rather than gap carries most of the 35px rhythm, so each link is a
     31px target instead of a 15px one; 44px cannot fit that rhythm */
  ${P} .footer-nav a{display:block;padding-block:.5rem;font-size:.72rem;letter-spacing:.18em}

  ${P} .footer-inner{flex-direction:column;align-items:center;text-align:center;gap:2.1rem}
  ${P} .footer-brand{flex-direction:column;align-items:center;gap:.62rem}
  ${P} .footer-logo{width:71px;height:71px}
  ${P} .footer-name{font-size:1.125rem}
  /* the mock solves to 9.6px here; held at the 11px floor used site-wide, so
     this line runs about 14% wider than the drawing */
  ${P} .footer-tag{margin-top:.35rem;font-size:.6875rem;letter-spacing:.14em}

  ${P} .footer-contact{align-items:center;text-align:center;gap:.6rem}
  ${P} .footer-place{font-size:.76rem}
  ${P} .footer-mail{font-size:.735rem}
  ${P} .footer-cta{margin-top:.15rem;padding:.85rem 1rem}

  ${P} .footer-base{flex-direction:column;align-items:center;text-align:center;
    gap:1rem;margin-top:2.4rem;padding-top:1.4rem;font-size:.79rem}
}`;

{
  const n = s.split(OLD).length - 1;
  if (n !== 1) { log.push(`FAIL  the 720 block: expected 1, found ${n}`); failed++; }
  else { s = s.split(OLD).join(NEW); log.push('ok    the 720 block is now the mobile design'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
