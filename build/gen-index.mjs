import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ORDER } from './projects-content.mjs';

const ROOT = process.cwd();
const CARDS_OUT = path.join(ROOT, 'images', 'cards');
fs.mkdirSync(CARDS_OUT, { recursive: true });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Card copy is the homepage card copy, verbatim. Context-Responsive Design has
   no homepage card, so it takes its project header and has no subhead yet. */
export const CARDS = {
  'bandipur-tiger-reserve': {
    n: '01', occurrence: 26,
    title: 'Bandipur Tiger Reserve, Karnataka',
    sub: 'Hydro-ecological restoration with Junglescapes Charitable Trust',
    alt: 'A restored waterhole holding water within the degraded forest landscape at Bandipur.',
  },
  'ecological-restoration': {
    n: '02', occurrence: 27,
    title: 'Ecological Restoration of Degraded Wildlife Habitat',
    sub: 'Reviving dry deciduous forest and savanna, with Rewilding Earth Foundation',
    alt: 'A hand-drawn restoration masterplan showing wetlands, groves and grassland zones.',
  },
  'mysuru-rail-museum': {
    n: '03', occurrence: 28,
    title: 'Mysuru Rail Museum',
    sub: 'Reimagining a heritage railway museum as a biodiverse public space',
    alt: 'The landscape masterplan drawing for the Mysuru Rail Museum revitalisation.',
  },
  'nilgiris-biosphere-reserve': {
    n: '04', occurrence: 29,
    title: 'Nilgiris Biosphere Reserve',
    sub: 'Watershed management and ecological restoration of a tea estate',
    alt: 'An Indian gaur emerging from dense tea-estate vegetation at night in the Nilgiris.',
  },
  'chairmans-bungalow': {
    n: '05', occurrence: 30,
    title: "Chairman's Bungalow Landscape",
    sub: 'A sustainable, ecologically sensitive bungalow landscape in the Nilgiris',
    alt: "A lit stone water feature at dusk in the Chairman's Bungalow garden.",
  },
  'karavulapalli-farm': {
    n: '06', occurrence: 31,
    title: 'Regenerative Farm Landscapes, Karavulapalli',
    sub: 'A biodiverse, regenerative community farm with Biome Farms',
    alt: 'A restored stone-lined stream running through a regenerating semi-arid farm landscape.',
  },
  'context-responsive-design': {
    n: '07', occurrence: null,          // no homepage card, image taken from its own folder
    title: 'Context-Responsive Design',
    sub: 'Journey through our design process grounded in minimalism, rootedness and sensory engagement.',
    alt: 'Context-Responsive Design, project photograph.',
  },
};

export async function buildCardImages() {
  const manifest = JSON.parse(fs.readFileSync('build/assets-manifest.json', 'utf8'));
  const projImgs = JSON.parse(fs.readFileSync('build/projects-images.json', 'utf8'));
  const report = [];

  for (const slug of ORDER) {
    const card = CARDS[slug];
    const dest = path.join(CARDS_OUT, slug + '.webp');
    let src, note;

    if (card.occurrence) {
      // the homepage card image, already extracted and optimised earlier
      const sha = manifest.occurrences[card.occurrence - 1].sha;
      src = path.join(ROOT, 'build', 'assets-opt', sha + '.webp');
      note = 'homepage card';
    } else {
      // first portrait frame from the project's own folder, closest to the 3:4 card
      const proj = projImgs.find(p => p.slug === slug);
      const portrait = proj.items.filter(i => i.ratio < 0.87)
        .sort((a, b) => Math.abs(a.ratio - 0.75) - Math.abs(b.ratio - 0.75))[0] || proj.items[0];
      src = path.join(ROOT, portrait.src);
      note = 'from folder: ' + portrait.file + ' (ratio ' + portrait.ratio + ')';
    }

    // 0.945 is the image ratio measured off the supplied reference card
    const buf = await sharp(src).resize({ width: 560, height: 593, fit: 'cover', position: 'centre' })
      .webp({ quality: 76, effort: 6 }).toBuffer();
    fs.writeFileSync(dest, buf);
    report.push({ slug, note, kb: (buf.length / 1024).toFixed(0) });
  }
  return report;
}

export function indexPage() {
  const cards = ORDER.map(slug => {
    const c = CARDS[slug];
    const sub = c.sub ? `\n          <p class="pi-sub">${esc(c.sub)}</p>` : '';
    return `      <article class="pi-card">
        <a class="pi-link" href="#/projects/${slug}" data-route="p-${slug}">
          <span class="pi-index">${c.n}</span>
          <div class="pi-media">
            <img src="images/cards/${slug}.webp" width="560" height="593" loading="lazy" decoding="async"
                 alt="${esc(c.alt)}">
          </div>
          <h2 class="pi-title">${esc(c.title)}</h2>${sub}
          <span class="pi-cue">View project <span aria-hidden="true">&rarr;</span></span>
        </a>
      </article>`;
  }).join('\n');

  return `<div data-page="projects" class="project-page projects-index">
<!--HEADER-->
  <section class="pi-open">
    <div class="wrap">
      <figure class="pi-quote">
        <blockquote><span class="mark">&ldquo;</span>The Earth is what we all have in common.<span class="mark">&rdquo;</span></blockquote>
        <figcaption>Wendell Berry</figcaption>
      </figure>
    </div>
  </section>
  <section class="pi-work" aria-label="Projects">
    <div class="wrap">
      <div class="sec-head pi-head">
        <h1 class="sec-title">Projects<span class="sec-kicker">.</span></h1>
      </div>
      <div class="pi-grid">
${cards}
      </div>
    </div>
  </section>
<!--FOOTER-->
</div>`;
}

export const INDEX_CSS = `
/* ---------- Projects index ----------
   Values taken from the site's own system rather than invented:
   section rhythm clamp(4rem,9vw,7rem) as on every About section; the quote at
   the same size as the About hero quote; labels at .7rem/.24em; card type at
   the homepage plate sizes (.9rem title, .72rem sub) and the plate grid gap. */
.projects-index{background:var(--soil);color:#F3EFE6}

.pi-open{padding-block:clamp(9rem,16vh,12rem) clamp(4rem,9vw,7rem)}
.pi-quote{margin:0;text-align:center}
/* Full width, no measure cap: it is the page's opening statement and should
   run edge to edge the way the About hero quote does. */
.pi-quote blockquote{margin:0;font-family:var(--fd);font-weight:700;
  font-size:clamp(1.9rem,4.6vw,3.6rem);line-height:1.06;letter-spacing:-.02em;
  color:#F3EFE6;text-wrap:balance}
.pi-quote .mark{color:#D99A63}
.pi-quote figcaption{margin-top:clamp(1rem,2vw,1.5rem);font-family:var(--fb);font-size:.8rem;
  font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#D99A63}

.pi-work{padding-block:0 clamp(4rem,9vw,7rem)}
.projects-index .sec-head{display:flex;align-items:baseline;justify-content:space-between;
  gap:1rem 2rem;flex-wrap:wrap;border-bottom:1px solid rgba(243,239,230,.22);
  padding-bottom:clamp(.9rem,1.6vw,1.25rem);margin-bottom:clamp(2.5rem,5vw,4rem)}
/* Held below the quote so the opening statement still leads the page. */
.projects-index .sec-title{font-family:var(--fd);font-weight:700;letter-spacing:-.02em;
  font-size:clamp(1.7rem,3.4vw,2.6rem);line-height:1.1;color:#F3EFE6;margin:0}
.projects-index .sec-kicker{color:#D99A63}
.projects-index .sec-label{font-family:var(--fb);font-weight:600;font-size:.7rem;
  letter-spacing:.24em;text-transform:uppercase;color:var(--tertiary);white-space:nowrap}

/* Cards keep their size; the row spreads them so the first sits flush left and
   the last flush right, spanning the full width. */
.pi-grid{display:grid;grid-template-columns:repeat(3,19rem);
  justify-content:space-between;row-gap:clamp(2.5rem,4vw,3.5rem)}
.pi-card{margin:0}

/* Cream card on the soil page, built to the supplied reference. Ground #E8E4D9
   is the site's own --bg; the image outline is --primary. Padding and gaps are
   the reference's proportions resolved against a 19rem card: side 7.25% of the
   content width, top 4.7%, number->image 3.3%, image->title 4.8%,
   title->sub 2.0%, bottom 9.2%. */
.pi-link{display:flex;flex-direction:column;height:100%;text-decoration:none;
  background:var(--bg);color:var(--primary);
  padding:.78rem 1.2rem 1.5rem;
  transition:background .3s ease}
/* Abhaya Libre, matching the homepage card index numbers. */
.pi-index{display:block;font-family:var(--fd);font-size:1.35rem;font-weight:700;
  line-height:1;letter-spacing:.01em;color:var(--primary);margin-bottom:.5rem}
.pi-media{position:relative;overflow:hidden;background:#d8d3c4;
  border:1px solid var(--primary)}
.pi-media img{display:block;width:100%;aspect-ratio:.945;object-fit:cover;
  transition:transform .7s cubic-bezier(.22,1,.36,1)}
.pi-link:hover .pi-media img{transform:scale(1.04)}
/* Abhaya Libre, matching the homepage project cards. */
.projects-index .pi-title{font-family:var(--fd);font-size:1.0625rem;font-weight:700;line-height:1.2;
  letter-spacing:-.01em;color:var(--primary);margin:.8rem 0 .33rem;text-wrap:balance}
/* the reference works out to 10.6px here; held at 11.2px as a legibility floor */
.pi-sub{margin:0 0 .7rem;font-family:var(--fb);font-size:.7rem;font-weight:400;line-height:1.45;
  color:rgba(55,40,7,.86)}
/* "View project" cue, as on the homepage cards. Clay-ink rather than clay:
   #7F4B23 is 5.7:1 on the cream card, true clay would be 3.1:1 at this size. */
.pi-cue{display:block;margin-top:auto;font-family:var(--fb);font-size:.7rem;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;color:#7F4B23;
  transition:color .25s ease,transform .25s ease}
.pi-link:hover .pi-cue{color:var(--primary)}
.pi-link:hover{background:#F3EFE6}

@media (max-width:1100px){
  .pi-grid{grid-template-columns:repeat(2,minmax(0,19rem));justify-content:space-between}
}
@media (max-width:620px){
  .pi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:2rem .8rem;justify-content:stretch}
  .pi-link{padding:.7rem .9rem 1.2rem}
  .pi-index{font-size:1.05rem}
  .projects-index .pi-title{font-size:1rem}
  .pi-sub{font-size:.72rem}
}`;

if (process.argv[1] && process.argv[1].endsWith('gen-index.mjs')) {
  const rep = await buildCardImages();
  for (const r of rep) console.log(`${r.slug.padEnd(28)} ${r.kb.padStart(4)} KB   ${r.note}`);
  fs.mkdirSync('build/out', { recursive: true });
  fs.writeFileSync('build/out/page-projects-index.html', indexPage());
  console.log('\nwrote build/out/page-projects-index.html');
}
