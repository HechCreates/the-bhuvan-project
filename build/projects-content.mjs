import fs from 'fs';
import path from 'path';

/* Title / subheader assigned by hand: the PDFs are not consistent about which
   comes first, so this cannot be parsed mechanically.
   skip = how many leading lines of the extracted text are heading, not copy. */
/* Order drives the previous/next links and matches the homepage card order,
   with Context-Responsive Design appended. */
export const ORDER = [
  'bandipur-tiger-reserve',
  'ecological-restoration',
  'mysuru-rail-museum',
  'nilgiris-biosphere-reserve',
  'chairmans-bungalow',
  'karavulapalli-farm',
  'context-responsive-design',
];

/* header / sub as supplied. location and status are read out of the PDF copy;
   where the copy does not state one it is left blank rather than invented. */
export const META = {
  'bandipur-tiger-reserve': {
    txt: 'Bandipur_Tiger_Reserve__Karnataka',
    header: 'Hydro-Ecological Restoration in collaboration with Junglescapes Charitable Trust',
    sub: 'Bandipur Tiger Reserve, Karnataka',
    location: 'Bandipur Tiger Reserve, Karnataka',
    status: 'Ongoing',                       // PDF: "this ongoing initiative"
    skip: 2,
    link: { href: 'https://www.junglescapes.org/communitymc.html', label: 'Junglescapes' },
  },
  'ecological-restoration': {
    txt: 'Ecological_Restoration_of_Degraded_Wildlife_Habitat',
    header: 'Ecological Restoration of Degraded Wildlife Habitat',
    sub: 'In collaboration with Rewilding Earth Foundation, Bandipur Landscape (On Going)',
    location: 'Bandipur Landscape, Karnataka',
    status: 'On-going',                      // PDF states "(On-going)"
    skip: 3,
    link: null,
  },
  'mysuru-rail-museum': {
    txt: 'Mysuru_Rail_Museum',
    header: 'Mysuru Rail Museum',
    sub: '',
    location: 'Mysuru, Karnataka',
    status: 'Completed',                     // PDF: commissioned 2019, open to visitors today
    skip: 1,
    link: { href: 'https://mysururailmuseum.com/virtual-tour/', label: 'Virtual tour' },
  },
  'nilgiris-biosphere-reserve': {
    txt: 'Nilgiris_Biospehere_Reserve',
    header: 'Watershed management and ecological restoration of a tea estate, Nilgiris',
    sub: '',                                 // confirmed: this project has no subheader
    location: 'Nilgiris',
    status: 'Ongoing',                       // PDF: "this ongoing initiative"
    skip: 2,
    link: null,
  },
  'chairmans-bungalow': {
    txt: 'Chairman_s_Bungalow_Landscape',
    header: "Chairman's Bungalow Landscape",
    sub: 'Nilgiris',
    location: 'Nilgiris',
    status: 'Completed',
    skip: 2,
    link: null,
  },
  'karavulapalli-farm': {
    txt: 'Regenerative_Farm_Landscapes__Karavulapalli',
    header: 'Regenerative Farm Landscapes, Karavulapalli',
    sub: '',                                 // confirmed: this project has no subheader
    location: 'Karavulapalli, Rayalaseema',
    status: 'Completed',
    skip: 1,
    link: { href: 'https://staging.biomefarms.com/', label: 'Biome Farms' },
  },
  'context-responsive-design': {
    txt: 'Context_Responsive_Design',
    header: 'Context-Responsive Design',
    sub: '',
    location: '',
    status: '',
    skip: 1,
    link: null,
  },
};

/* Typos in the source PDFs and filenames, corrected on the way out. */
const FIXES = [
  [/Rewiliding/g, 'Rewilding'],
  [/ecological understating/g, 'ecological understanding'],
  [/Managment/g, 'Management'],
  [/graasing/g, 'grazing'],
  [/harbivores/g, 'herbivores'],
  [/hetrogeneous/g, 'heterogeneous'],
  [/—/g, ','],          // house style: em dashes become commas
  [/\s+-(?=[a-z])/g, ', '],  // "breathe -where" -> "breathe, where"
];
export const fix = s => FIXES.reduce((a, [re, to]) => a.replace(re, to), s);

export function copyParagraphs(slug) {
  const meta = META[slug];
  const raw = fs.readFileSync(path.join('build', 'pdftext', meta.txt + '.txt'), 'utf8');
  const lines = raw.split('\n').map(l => l.trim())
    .filter(l => l && !/^-- \d+ of \d+ --$/.test(l));
  const body = lines.slice(meta.skip).filter(l => !/^https?:\/\//.test(l));
  // rejoin wrapped lines into paragraphs: a blank line in the source separated them,
  // but trimming lost that, so re-split on sentence-final lines that are short
  const text = body.join(' ').replace(/\s+/g, ' ').trim();
  const paras = raw.split(/\n\s*\n/).map(s => s.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(s => s && !/^-- \d+ of \d+ --$/.test(s) && !/^https?:\/\//.test(s));
  const dropped = paras.slice(0).filter(p => {
    const head = lines.slice(0, meta.skip).join(' ');
    return !head.includes(p) && p !== meta.header && p !== meta.sub;
  });
  const out = (dropped.length ? dropped : [text]).map(fix);
  // first paragraph often still carries the heading lines, strip them
  return out.map(p => {
    let q = p;
    for (const h of lines.slice(0, meta.skip)) q = q.replace(h, '').trim();
    return q;
  }).filter(Boolean);
}

/* ---- justified row packing -------------------------------------------------
   Images keep their ratio. A row's height is (containerWidth - gaps) / sumRatio,
   so packing is really a matter of choosing how much ratio goes in each row.
   Reference container 1440px, target row height ~340px -> sumRatio ~4.2.
   Rows short of that get a flex spacer, which is where the deliberate empty
   space comes from rather than stretching images to fill.                    */
export const PACK = {
  refWidth: 1440,
  targetHeight: 340,
  minImageWidth: 210,   // nothing narrower than this at reference width
  /* Panoramas used to take a full-bleed row of their own. At 1425px wide a
     1500px source is being asked to cover a retina viewport, so they lost
     clarity, and three of them in one project dominated the page. They now
     pack into rows like everything else; wideSlack lets a row made only of
     wide frames hold more ratio so two panoramas can sit side by side. */
  panoRatio: 99,        // effectively disabled, kept so the logic still reads
  wideSlack: 1.62,      // extra packing allowance for rows of only wide images
  wideRatio: 2.0,       // a row whose narrowest frame is this wide counts as wide
  maxHeight: 640,       // ceiling for a sparse row, keeps it from ballooning
  /* The supplied photographs are small: most are 500-750px wide, a few 300px.
     Shown wider than that they visibly soften, so a row packs densely enough
     that no frame is displayed beyond its own source width. minSharpWidth is
     the floor at which we stop chasing sharpness and accept mild upscaling. */
  minSharpWidth: 150,
};

export const MAX_EMPTY = 0.34;   // a row is never more than a third empty

export function packRows(items) {
  const targetSum = PACK.refWidth / PACK.targetHeight;   // ~4.24
  const rows = [];
  let row = [];
  const pending = [];          // panoramas deferred so they don't cut a row short
  const sum = r => r.reduce((s, i) => s + i.ratio, 0);
  const isPano = r => r.length === 1 && r[0].ratio >= PACK.panoRatio;
  // sumRatio at which no frame in the row exceeds its own source width
  const sharpSum = r => Math.max(...r.map(i => (PACK.refWidth * i.ratio) / i.w));
  // absolute densest packing allowed before frames get too small to read
  const denseLimit = r => (PACK.refWidth * Math.min(...r.map(i => i.ratio))) / PACK.minSharpWidth;

  const capFor = r => {
    const minR = Math.min(...r.map(i => i.ratio));
    // a row of only wide frames may pack denser, which is what lets two
    // panoramas pair off instead of each taking the full width
    const slack = minR >= PACK.wideRatio ? PACK.wideSlack : 1.28;
    const base = Math.min(targetSum * slack, (PACK.refWidth * minR) / PACK.minImageWidth);
    // allow a denser row than usual when that is what keeps the images sharp
    return Math.min(Math.max(base, sharpSum(r)), denseLimit(r));
  };
  // a row is not finished until it is both tall enough and sharp enough
  const closeAt = r => Math.min(Math.max(targetSum, sharpSum(r)), denseLimit(r));
  const flush = () => { while (pending.length) rows.push([pending.shift()]); };

  for (const item of items) {
    if (item.ratio >= PACK.panoRatio) {
      // Only break for a panorama once the open row has earned its keep,
      // otherwise hold it back and let the row finish first.
      if (row.length && sum(row) < targetSum * 0.62) { pending.push(item); continue; }
      if (row.length) { rows.push(row); row = []; }
      rows.push([item]);
      flush();
      continue;
    }
    const trial = [...row, item];
    if (row.length && sum(trial) > capFor(trial)) { rows.push(row); row = []; flush(); row = [item]; continue; }
    row = trial;
    if (sum(row) >= closeAt(row)) { rows.push(row); row = []; flush(); }
  }
  if (row.length) rows.push(row);
  flush();

  // A lone leftover image reads as a mistake. Borrow one from the row above so
  // the essay never closes on a single frame.
  if (rows.length > 1) {
    const last = rows[rows.length - 1], prev = rows[rows.length - 2];
    if (!isPano(last) && !isPano(prev) && last.length === 1 && prev.length >= 3) {
      last.unshift(prev.pop());
    }
  }
  // Fold a thin last row back only when the result still respects the
  // minimum image width, otherwise it just makes everything too small.
  if (rows.length > 1) {
    const last = rows[rows.length - 1], prev = rows[rows.length - 2];
    const merged = [...prev, ...last];
    if (!isPano(last) && !isPano(prev) && sum(last) < targetSum * 0.55
        && sum(merged) <= capFor(merged)) {
      prev.push(...last);
      rows.pop();
    }
  }

  return rows.map(r => {
    const s = sum(r);
    const pano = isPano(r);
    // filling with a spacer shrinks the frames, which helps sharpness too
    let spacer = pano ? 0 : Math.max(0, Math.min(capFor(r), Math.max(targetSum, sharpSum(r))) - s);
    // cap the gap so "some breathing room" never becomes "a mostly empty row"
    spacer = Math.min(spacer, (s * MAX_EMPTY) / (1 - MAX_EMPTY));
    // ...but a very sparse row would otherwise become enormously tall, so a
    // height ceiling wins over the emptiness cap in that rare case.
    if (!pano) spacer = Math.max(spacer, PACK.refWidth / PACK.maxHeight - s);
    spacer = +Math.max(0, spacer).toFixed(3);
    return { items: r, sumRatio: +s.toFixed(3), spacer, isPano: pano,
             heightAtRef: Math.round(PACK.refWidth / (s + spacer)) };
  });
}
