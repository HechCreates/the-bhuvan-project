/* Put each silhouette where the artwork puts it.

   Measured off the mocks at the live card scale, as a share of the card width:

     Mahesh Basavanna  80.5%      Rammohan MN  90.8%
     Raja Bhat         17.0%      Muthuraman R 52.3%
     A.R Vasavi        43.3%

   Those are hand-placed and two of them sit close to something. Raja Bhat's
   farmer lands 3px past "Organic farm owner", and that gap closes as the card
   narrows because the text does not shrink with it; Rammohan's pair sits 28px
   from the card's right edge and would leave it. So the position is a clamp,
   not a flat percentage:

     left: clamp(<clears the attribution>, <artwork>, <stays in the card>)

   The floor is that card's own attribution width plus 16px, measured at the
   widest the card gets. The ceiling keeps the whole figure inside, using its
   aspect ratio against the current height. At full width four of the five land
   exactly on the artwork and Raja Bhat's moves 13px right, which is the least
   that clears his own role line.                                           */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

//  slug            x%     aspect  floor px  (floor = attribution width at 1440 + 16)
const POS = {
  'mcd-berls':  [80.5, 0.305, 251],
  'raja-bhat':  [17.0, 0.686, 205],
  'punarchith': [43.3, 0.712, 166],
  'monash':     [90.8, 0.714, 304],
  'muthuraman': [52.3, 1.974, 449],
};

/* ---- 1. the per-card numbers onto the element ---------------------------- */
{
  let n = 0;
  for (const [slug, [x, ar, min]] of Object.entries(POS)) {
    const find = `<img class="tq-sil" width=`;
    const re = new RegExp(`(<img class="tq-sil" width="\\d+" height="\\d+" src="images/testimonials/${slug}\\.webp")`);
    if (!re.test(s)) { log.push(`FAIL  1 ${slug} not found`); failed++; continue; }
    s = s.replace(re, `$1 style="--sil-x:${x}%;--sil-ar:${ar};--sil-min:${min}px"`);
    n++;
  }
  if (n === 5) log.push('ok    1 artwork position on all five');
}

/* ---- 2. the rule -------------------------------------------------------- */
const OLD = `.testimonials-page img.tq-sil{position:absolute;right:clamp(1.35rem,5.4vw,4rem);bottom:0;
  height:clamp(80px,9vw,116px);width:auto;max-width:none;pointer-events:none;user-select:none}`;
const NEW = `.testimonials-page img.tq-sil{--sil-h:clamp(80px,9vw,116px);
  position:absolute;bottom:0;height:var(--sil-h);width:auto;max-width:none;
  /* the artwork's x, floored so it clears that card's attribution and ceilinged
     so the whole figure stays on the card */
  left:clamp(var(--sil-min,0px), var(--sil-x,50%),
             calc(100% - (var(--sil-h) * var(--sil-ar,1)) - 16px));
  pointer-events:none;user-select:none}`;
{
  const n = s.split(OLD).length - 1;
  if (n !== 1) { log.push(`FAIL  2 rule: expected 1, found ${n}`); failed++; }
  else { s = s.split(OLD).join(NEW); log.push('ok    2 rule'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
