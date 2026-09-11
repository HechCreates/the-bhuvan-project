/* The crops the client drew in Figma, taken from the original photographs.

   Each supplied SVG is a rect filled with a pattern that places the whole
   photograph and lets the rect window it. The embedded JPEGs are byte-identical
   to the originals in The Team/, so the transform is read off the SVG and the
   crop is cut from the original instead of the re-encoded copy -- same framing,
   no second generation loss.                                                 */
import sharp from 'sharp';
import fs from 'fs';

const OUT = 'site/images/team';
fs.mkdirSync(OUT, { recursive: true });

//  svg                                            source                        slug             max width
const JOBS = [
  ['The Team/Member Cards/Group 2.svg',            'The Team/Harshita Nathan.jpeg', 'harshita-nathan-card', 900],
  ['The Team/Member Cards/Group 3.svg',            'The Team/Harsha Bhat.jpeg',     'harsha-bhat-card',     900],
  ['The Team/Member Cards/Group 4.svg',            'The Team/Aparna Pradeep.jpeg',  'aparna-pradeep-card',  900],
  ['The Team/Co Founders Square Cropped/Rectangle 84.svg', 'The Team/Nikhil Udupa .jpeg',   'nikhil-udupa-sq',   640],
  ['The Team/Co Founders Square Cropped/Rectangle 85.svg', 'The Team/Shilpa Shirish .jpeg', 'shilpa-shirish-sq', 640],
];

/* The pattern covers the rect, so the visible slice of the image is whatever
   falls inside 0..1 of the object bounding box. */
function cropOf(svg) {
  const s = fs.readFileSync(svg, 'utf8');
  const img = s.match(/<image id="[^"]+" width="(\d+)" height="(\d+)"/);
  const mat = s.match(/transform="matrix\(([-\d.e]+) 0 0 ([-\d.e]+) ([-\d.e]+) ([-\d.e]+)\)"/);
  const tr = s.match(/transform="translate\(([-\d.e]+) ([-\d.e]+)\) scale\(([-\d.e]+)(?: ([-\d.e]+))?\)"/);
  if (!img || (!mat && !tr)) throw new Error('no pattern transform in ' + svg);
  const [iw, ih] = [+img[1], +img[2]];
  const [sx, sy, tx, ty] = mat
    ? [+mat[1], +mat[2], +mat[3], +mat[4]]
    : [+tr[3], +(tr[4] ?? tr[3]), +tr[1], +tr[2]];

  const span = (t, sc, px) => {           // the 0..1 window, back in source pixels
    const total = px * sc;                // the image's extent in bbox units
    return [Math.round((0 - t) / total * px), Math.round((1 - t) / total * px)];
  };
  const [x0, x1] = span(tx, sx, iw);
  const [y0, y1] = span(ty, sy, ih);
  const left = Math.max(0, x0), top = Math.max(0, y0);
  return { left, top, width: Math.min(x1, iw) - left, height: Math.min(y1, ih) - top, iw, ih };
}

for (const [svg, src, slug, maxW] of JOBS) {
  const c = cropOf(svg);
  if (Math.abs(c.width - c.height) <= 2) c.width = c.height = Math.min(c.width, c.height);  // Figma rounds
  const width = Math.min(maxW, c.width);
  const buf = await sharp(src).extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, effort: 6 }).toBuffer();
  fs.writeFileSync(`${OUT}/${slug}.webp`, buf);
  const m = await sharp(buf).metadata();
  console.log(`  ${(slug + '.webp').padEnd(22)} crop ${c.width}x${c.height} at ${c.left},${c.top}` +
    ` of ${c.iw}x${c.ih}  ->  ${m.width}x${m.height}  ${(buf.length / 1024).toFixed(0)}KB` +
    `  ar=${(c.width / c.height).toFixed(4)}`);
}
