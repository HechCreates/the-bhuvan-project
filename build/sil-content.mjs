/* Record each silhouette's placement alongside its testimonial.

   x is where the artwork stands the figure, as a share of the card width.
   ar is the trimmed drawing's aspect, which the ceiling needs to know how wide
   the figure will be at the current height. min is the floor that keeps it
   clear of that card's own attribution as the card narrows.                */
import fs from 'fs';

const POS = {
  'mcd-berls':                [80.5, 0.305, 251],
  'raja-bhat':                [17.0, 0.686, 205],
  'punarchith':               [43.3, 0.712, 166],
  'monash-molding-solutions': [90.8, 0.714, 304],
  'muthuraman-r':             [52.3, 1.974, 449],
};

for (const [slug, [x, ar, min]] of Object.entries(POS)) {
  const p = `content/testimonials/${slug}.yml`;
  let s = fs.readFileSync(p, 'utf8');
  if (/^  x: /m.test(s)) { console.log(`already there: ${slug}`); continue; }
  const add = `  x: ${x}\n  ar: ${ar}\n  min: ${min}\n`;
  const before = s;
  s = s.replace(/(silhouette:\n(?:  [a-z]+: .*\n)+)/, m => m + add);
  if (s === before) { console.log(`FAIL  no silhouette block in ${slug}`); process.exitCode = 1; continue; }
  fs.writeFileSync(p, s);
  console.log(`ok    ${p}`);
}
