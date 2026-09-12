/* Two things that only go wrong on a phone.

   1. The map leaves its frame. At <=820px the figure carries max-height:300px
      and the image carries none, but max-height on a flex container does not
      bind its flex item: the image laid out at its full 305px and straddled
      the box, top and bottom, swallowing the whole 1.5rem of padding so the
      drawing sat flush against -- and just past -- the brown edge. The height
      belongs on the image; the frame then follows it and keeps its padding.

   2. The silhouettes are not there. I hid them below 760px because a 335px
      card has no room beside its attribution -- Muthuraman's role line alone
      is 267px of the 292px available -- and the per-card left floors, which
      are absolute pixels calibrated for a desktop card, collapse the clamp at
      that width anyway. So they come back below the words rather than beside
      them: the card grows a bottom band the height of a figure, and each one
      stands on the card's own bottom edge with the text clear above it.      */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

/* src/index.html is CRLF and these template literals are LF */
const crlf = t => t.replace(/\r?\n/g, '\r\n');

const swap = (name, find, replace, expect = 1) => {
  find = crlf(find); replace = crlf(replace);
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

/* the hide goes rather than being overridden: leaving a display:none for a
   later rule to undo is how the next person reads the file wrong */
swap('the old hide comes out',
  `/* Below this a card is too narrow for a figure and its attribution to share a
   line; the silhouette is decoration, the words are not. */
@media (max-width:760px){ .testimonials-page img.tq-sil{display:none} }`,
  `/* Below 760px a card is too narrow for a figure and its attribution to share
   a line, so the figure goes below the words instead -- see the phone rules at
   the end of this stylesheet. */`);

/* the inline style on each card sets --sil-min, and an inline custom property
   beats any stylesheet rule, so the phone position overrides `left` whole
   rather than trying to zero the floor. --sil-h is not inline, so it is free. */
const CSS = `
/* ---------- Phone: the map inside its frame, the silhouettes under the words ---------- */
@media (max-width:820px){
  #page-home .map-panel-figure{max-height:none}
  /* 300px of frame less its padding and border, and a share of a short screen */
  #page-home .map-panel-figure img{max-height:min(250px,40svh)}
}
@media (max-width:760px){
  /* the band the figure stands in, above the card's own bottom padding */
  .testimonials-page .tq-card{--sil-band:68px;padding-bottom:calc(1.6rem + var(--sil-band))}
  .testimonials-page img.tq-sil{--sil-h:var(--sil-band,68px);
    /* nothing shares the line now, so there is no floor to clear -- and the
       per-card --sil-min is desktop pixels, which would collapse the clamp */
    left:clamp(0px, var(--sil-x,50%),
               calc(100% - (var(--sil-h) * var(--sil-ar,1)) - 16px))}
}
`;
{
  const i = s.lastIndexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + crlf(CSS) + s.slice(i); log.push('ok    phone rules appended'); }
}

if (failed) { console.log(log.join('\n')); console.log(`\n${failed} step(s) failed, not written`); process.exitCode = 1; }
else {
  fs.writeFileSync(FILE, s);
  console.log(log.join('\n'));
  console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
}
