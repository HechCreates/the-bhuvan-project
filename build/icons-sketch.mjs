/* Hand-drawn replacements for the nine geometric icons.

   The sketch feel comes from breaking the geometry, not from a filter: control
   points are nudged off true, strokes overshoot their corners slightly, a few
   shapes are retraced with a second lighter pass the way a pen doubles back,
   and nothing closes perfectly. Stroke widths vary between 1.3 and 1.9 within
   an icon so the line reads as drawn rather than plotted.                    */

/* --- What we do: five practices, 32x32 ------------------------------------ */
export const PRACTICE = {
  // a seedling breaking ground: two leaves off a leaning stem, roots below
  'ecological-restoration': `
    <path d="M16.3 26.6 C15.7 22.6 15.8 19.4 16.05 15.4" stroke-width="1.7"/>
    <path d="M16.1 17.4 C14.6 13.4 11.3 11.5 7.4 11.4 C7.2 15.6 10.4 18.7 15.8 17.6" stroke-width="1.5"/>
    <path d="M16.4 20.9 C17.6 17.8 20.6 16 24.4 16.3 C24.5 19.8 21.4 22.3 16.6 21.4" stroke-width="1.5"/>
    <path d="M10.9 26.8 C13.6 26.2 18.7 26.1 21.6 26.9" stroke-width="1.7"/>
    <path d="M15.4 27 C14.3 28.9 12.7 29.8 11 30" stroke-width="1.3"/>
    <path d="M17 27.1 C18 29 19.6 29.9 21.3 29.9" stroke-width="1.3"/>`,

  // terrain read as contours, with a tree standing on it
  'landscape-architecture': `
    <path d="M2.9 24.4 C8.2 20.6 14.4 19.4 20.6 21.2 C24.2 22.3 27.1 23.9 29.4 25.6" stroke-width="1.7"/>
    <path d="M4.4 28.9 C10.2 25.9 16.9 25.4 22.9 27.2 C25.6 28 27.6 28.9 29.2 29.9" stroke-width="1.4"/>
    <path d="M7.6 19.4 C11.4 16.9 15.6 16.2 19.4 17.1" stroke-width="1.2"/>
    <path d="M11.4 21.9 C11.2 17.6 11.3 13.9 11.6 10.4" stroke-width="1.6"/>
    <path d="M11.5 14.4 C8.4 13.4 6.4 10.9 6.4 7.6 C10.2 7.4 12.2 9.6 11.7 13.6" stroke-width="1.4"/>
    <path d="M11.7 11.9 C14.6 10.6 16.6 7.9 16.4 4.6 C12.9 5.2 11.2 7.6 11.5 11.4" stroke-width="1.4"/>
    <path d="M23.4 22.6 C23.2 19.4 23.4 17.2 23.6 14.9" stroke-width="1.3"/>
    <path d="M23.6 17.4 C21.9 16.4 20.9 14.6 21.2 12.4 C23.4 12.9 24.2 14.6 23.8 16.9" stroke-width="1.1"/>`,

  // a drop over ripples: water held, then spreading
  'watershed-management': `
    <path d="M16.1 4.6 C16.1 4.6 9.4 12.4 9.6 17.2 C9.8 21.4 12.9 23.8 16.2 23.7 C19.5 23.6 22.5 21 22.5 16.9 C22.5 12.3 16.1 4.6 16.1 4.6 Z" stroke-width="1.7"/>
    <path d="M12.9 15.4 C13.2 18.4 14.4 20.2 16.6 20.8" stroke-width="1.2"/>
    <path d="M4.6 26.2 C8.2 24.6 11.4 24.6 14.8 26 C18.4 27.5 21.8 27.4 25.4 25.8" stroke-width="1.5"/>
    <path d="M6.2 29.6 C9.2 28.4 11.9 28.5 14.8 29.6 C17.6 30.6 20.4 30.5 23.2 29.4" stroke-width="1.3"/>`,

  // a built form with a leaf growing off the ridge
  'sustainable-architecture': `
    <path d="M5.9 28.4 C5.7 23.6 5.8 19.4 6.1 15.4 L16.1 7.4 L26.2 15.2 C26.4 19.4 26.4 23.9 26.1 28.4 Z" stroke-width="1.7"/>
    <path d="M6.2 28.6 C12.4 29.1 20.2 29.1 26.2 28.5" stroke-width="1.4"/>
    <path d="M13.2 28.4 C13 25.4 13.1 23.2 13.4 20.9 C15.2 20.6 17.1 20.6 18.9 20.9 C19.1 23.4 19.1 25.6 18.9 28.4" stroke-width="1.4"/>
    <path d="M16.1 18.9 C16 17.2 16.1 16.1 16.3 14.9" stroke-width="1.2"/>
    <path d="M16.2 16.6 C14.4 16.2 13.1 14.9 12.9 12.9 C15 12.5 16.4 13.6 16.5 15.9" stroke-width="1.1"/>
    <path d="M16.3 17.4 C18.2 16.9 19.5 15.4 19.5 13.4 C17.4 13.2 16.1 14.4 16.2 16.6" stroke-width="1.1"/>`,

  // an open book with a shoot rising from the gutter
  'academic-engagement': `
    <path d="M3.6 9.4 C7.4 8.2 11.4 8.6 15.9 10.9 C20.4 8.5 24.4 8.2 28.4 9.5" stroke-width="1.6"/>
    <path d="M3.6 9.6 C3.3 14.4 3.4 19.2 3.7 24.1 C7.6 22.9 11.6 23.3 15.9 25.6 C20.3 23.2 24.3 22.9 28.3 24.2 C28.6 19.3 28.6 14.4 28.4 9.6" stroke-width="1.6"/>
    <path d="M15.9 11.1 C15.7 16.2 15.7 20.6 15.9 25.4" stroke-width="1.4"/>
    <path d="M16 10.9 C16 8.6 16.1 7.2 16.3 5.6" stroke-width="1.3"/>
    <path d="M16.1 7.4 C14.6 7 13.4 5.9 13.2 4.2 C15 3.8 16.3 4.6 16.4 6.4" stroke-width="1.2"/>
    <path d="M16.2 8 C17.7 7.5 18.8 6.2 18.8 4.6 C17.1 4.4 15.9 5.4 16 7.2" stroke-width="1.2"/>`,
};

/* --- Map popup: four features, 40x40 -------------------------------------- */
export const MAPFEAT = {
  // ranges receding: two peaks, a lower ridge, a valley floor
  'diverse-geographies': `
    <path d="M3.8 28.6 C8.4 22.4 12.2 17.2 15.4 12.4 C18.9 17.4 22.4 22.6 26.4 28.4" stroke-width="1.7"/>
    <path d="M11.4 19.6 C13 18.4 14.2 17.4 15.5 16.2 C16.9 17.6 18.2 18.8 19.6 20" stroke-width="1.2"/>
    <path d="M19.6 28.6 C22.4 24.4 25 20.9 27.4 17.6 C30.2 21.4 32.9 25 36.2 28.5" stroke-width="1.5"/>
    <path d="M3.4 31.9 C11.6 30.6 20.4 30.5 28.6 31.4 C31.6 31.8 34.2 32.2 36.6 32.6" stroke-width="1.4"/>`,

  // a leaf with its veins, and the roots that feed it
  'living-systems': `
    <path d="M20.4 6.4 C12.6 8.4 7.4 14.4 7.9 21.4 C8.3 26.6 12.4 29.6 17.6 29 C25.4 28.1 30.6 21.6 30.4 13.2 C30.3 9.6 29.4 7.4 28.4 5.6 C25.8 5.6 22.9 5.8 20.4 6.4 Z" stroke-width="1.6"/>
    <path d="M27.6 7.4 C22.6 13.4 17.2 19.4 11.4 25.9" stroke-width="1.4"/>
    <path d="M24.4 12.4 C22.4 12.9 20.4 13.9 18.6 15.4" stroke-width="1.1"/>
    <path d="M20.9 16.9 C19.2 17.6 17.6 18.9 16.2 20.4" stroke-width="1.1"/>
    <path d="M22.4 11.4 C22 9.4 21.4 7.9 20.9 6.6" stroke-width="1.1"/>
    <path d="M11.4 26.2 C10.4 29.4 9.4 32.4 8.6 35.4" stroke-width="1.4"/>
    <path d="M10.2 30.4 C8.2 31.4 6.4 32.9 5.2 34.9" stroke-width="1.1"/>
    <path d="M9.6 32.4 C11.4 33.2 13 34.6 14 36.4" stroke-width="1.1"/>`,

  // three fields of knowledge overlapping: the plainest reading of "integrated"
  'integrated-approach': `
    <path d="M15.6 7.4 C20.6 7.2 24.4 11.2 24.2 16.2 C24 21.1 20.2 24.8 15.3 24.6 C10.4 24.4 6.8 20.4 7 15.6 C7.2 11 10.8 7.6 16.1 7.5" stroke-width="1.6"/>
    <path d="M24.4 7.6 C29.4 7.4 33.2 11.4 33 16.4 C32.8 21.2 29 24.9 24.1 24.7 C19.2 24.5 15.6 20.6 15.8 15.8 C16 11.2 19.6 7.8 24.9 7.7" stroke-width="1.6"/>
    <path d="M20 16.9 C25 16.7 28.8 20.7 28.6 25.7 C28.4 30.6 24.6 34.3 19.7 34.1 C14.8 33.9 11.2 29.9 11.4 25.1 C11.6 20.5 15.2 17.1 20.5 17" stroke-width="1.6"/>`,

  // a cycle that comes back greener: open arc, arrowhead, shoot inside
  'regenerative-outcomes': `
    <path d="M30.4 13.4 C27.6 9.2 22.9 6.6 17.9 7.2 C10.9 8 6.2 14.2 6.9 21.4 C7.6 28.4 13.6 33.2 20.6 32.6 C25.6 32.2 29.6 29 31.4 24.6" stroke-width="1.7"/>
    <path d="M24.4 13.9 C27.2 13.6 29.4 13.4 31.4 13.2 C31.2 11 30.9 8.9 30.6 6.6" stroke-width="1.4"/>
    <path d="M19.4 26.4 C19 23.4 19.1 21.2 19.4 18.6" stroke-width="1.4"/>
    <path d="M19.4 20.9 C17.9 18.2 15.4 16.9 12.6 16.9 C12.6 20.2 15 22.4 19.2 21.6" stroke-width="1.2"/>
    <path d="M19.6 23.4 C20.9 21.2 23.2 20 25.9 20.2 C25.9 23 23.6 24.9 19.8 24.2" stroke-width="1.2"/>`,
};

/* Each path is stroked twice: once cleanly, once nudged and faded, the way a
   pen retraces a line. The offset is derived from the path text, so it is
   stable across builds -- no random, no diff churn. */
const nudge = d => {
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  const dx = ((h % 7) - 3) / 7, dy = (((h >> 3) % 7) - 3) / 7, rot = (((h >> 6) % 9) - 4) / 9;
  return { dx: +dx.toFixed(2), dy: +dy.toFixed(2), rot: +rot.toFixed(2) };
};

const wrap = (box, d) => {
  const paths = [...d.matchAll(/<path d="([^"]+)" stroke-width="([\d.]+)"\/>/g)];
  const pass1 = paths.map(([, p, w]) => `<path d="${p}" stroke-width="${w}"/>`).join('');
  const pass2 = paths.map(([, p, w]) => {
    const n = nudge(p);
    return `<path d="${p}" stroke-width="${(+w * 0.72).toFixed(2)}" opacity=".5"`
      + ` transform="rotate(${n.rot} ${box / 2} ${box / 2}) translate(${n.dx} ${n.dy})"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${box} ${box}" aria-hidden="true" fill="none" stroke="currentColor"`
    + ` stroke-linecap="round" stroke-linejoin="round">${pass1}${pass2}</svg>`;
};

export const practiceIcon = k => wrap(32, PRACTICE[k]);
export const mapIcon = k => wrap(40, MAPFEAT[k]);

/* proof sheet, so the drawings can actually be looked at */
if (process.argv[1]?.endsWith('icons-sketch.mjs')) {
  const fs = await import('fs');
  const sharp = (await import('sharp')).default;
  const cell = 150, cols = 5;
  const all = [...Object.entries(PRACTICE).map(([k, d]) => [k, 32, d]),
               ...Object.entries(MAPFEAT).map(([k, d]) => [k, 40, d])];
  const rows = Math.ceil(all.length / cols);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell}" height="${rows * cell}">`
    + `<rect width="100%" height="100%" fill="#E9E5D9"/>`;
  all.forEach(([k, box, d], i) => {
    const x = (i % cols) * cell + 30, y = Math.floor(i / cols) * cell + 24;
    const inner = wrap(box, d).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    svg += `<g transform="translate(${x},${y}) scale(${90 / box})" fill="none" stroke="#B4703A"`
        + ` stroke-linecap="round" stroke-linejoin="round">${inner}</g>`
        + `<text x="${(i % cols) * cell + 75}" y="${Math.floor(i / cols) * cell + 132}"`
        + ` font-family="sans-serif" font-size="9" fill="#372807" text-anchor="middle">${k}</text>`;
  });
  svg += '</svg>';
  fs.mkdirSync('build/out', { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile('build/out/icons-proof.png');
  console.log(`proof: build/out/icons-proof.png  (${all.length} icons)`);
}
