/* Square face crops for the team section, plus the full frames the popups use.

   sharp's "attention" strategy picked Nikhil's torso over his head, so the
   crops are placed by hand: a face centre and a square side, both as fractions
   of the source, with the face sitting a little above the square's middle the
   way a portrait is normally framed.                                        */
import sharp from 'sharp';
import fs from 'fs';

const OUT = 'site/images/team';
fs.mkdirSync(OUT, { recursive: true });

//                       source                    slug              fx    fy   side  (fractions of width)
const PEOPLE = [
  ['The Team/Nikhil Udupa .jpeg',   'nikhil-udupa',    0.47, 0.150, 0.74, 'lead'],
  ['The Team/Shilpa Shirish .jpeg', 'shilpa-shirish',  0.45, 0.270, 0.76, 'lead'],
  ['The Team/Aparna Pradeep.jpeg',  'aparna-pradeep',  0.52, 0.230, 0.62, 'member'],
  ['The Team/Harsha Bhat.jpeg',     'harsha-bhat',     0.50, 0.220, 0.70, 'member'],
  ['The Team/Harshita Nathan.jpeg', 'harshita-nathan', 0.55, 0.235, 0.92, 'member'],
];

const FACE_AT = 0.42;   // where the face centre sits down the square

for (const [src, slug, fx, fy, sideFrac, kind] of PEOPLE) {
  const m = await sharp(src).metadata();
  const side = Math.round(m.width * sideFrac);
  let left = Math.round(m.width * fx - side / 2);
  let top = Math.round(m.height * fy - side * FACE_AT);
  left = Math.max(0, Math.min(left, m.width - side));
  top = Math.max(0, Math.min(top, m.height - side));

  const target = kind === 'lead' ? 640 : 460;
  const sq = await sharp(src).extract({ left, top, width: side, height: side })
    .resize(target, target).webp({ quality: 82, effort: 6 }).toBuffer();
  fs.writeFileSync(`${OUT}/${slug}.webp`, sq);

  const line = [`${slug}.webp`.padEnd(24), `crop ${side}px at ${left},${top}`.padEnd(26),
    `-> ${target}px`, side < target ? `  UPSCALED ${(target / side).toFixed(1)}x` : ''].join(' ');
  console.log('  ' + line);

  if (kind === 'lead') {   // the popup shows the whole frame
    const full = await sharp(src).resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 }).toBuffer();
    fs.writeFileSync(`${OUT}/${slug}-full.webp`, full);
    console.log('  ' + `${slug}-full.webp`.padEnd(24) + `full frame ${(full.length / 1024).toFixed(0)}KB`);
  }
}
