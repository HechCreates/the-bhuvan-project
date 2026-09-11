import fs from 'fs';
import { readAll } from './testimonials-content.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CHEV = '<svg class="tq-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
  + '<path d="M6 9.5 L12 15.5 L18 9.5" fill="none" stroke="currentColor" stroke-width="2" '
  + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function testimonialsPage() {
  const cards = readAll().map((t, i) => {
    const id = 'tq-body-' + (i + 1);
    /* Two renderings of the same quote. The collapsed preview is one run of
       text so the three-line clamp always fills all three lines, whatever the
       paragraphing; it is aria-hidden because the full version, which carries
       the paragraph breaks, stays in the accessibility tree either way. */
    const lede = esc(t.paras.join(' '));
    const paras = t.paras.map(p => '            <p>' + esc(p) + '</p>').join('\n');
    const role = t.link
      ? `<a class="tq-site" href="${t.link.href}" target="_blank" rel="noopener">${esc(t.role)}</a>`
      : esc(t.role);
    return `      <article class="tq-card">
        <span class="tq-mark" aria-hidden="true">&ldquo;</span>
        <div class="tq-body" id="${id}">
          <p class="tq-lede" aria-hidden="true">${lede}</p>
          <div class="tq-full">
${paras}
          </div>
        </div>
        <button class="tq-more" type="button" aria-expanded="false" aria-controls="${id}">
          <span class="tq-more-text">Read the full testimonial from ${esc(t.name)}</span>${CHEV}
        </button>
        ${t.silhouette ? `<img class="tq-sil" width="${t.silhouette.w||300}" height="420" src="images/testimonials/${t.silhouette.file}" alt="${esc(t.silhouette.alt)}" loading="lazy" decoding="async">
        ` : ''}<footer class="tq-by">
          <p class="tq-name">${esc(t.name)}</p>
          <p class="tq-role">${role}</p>
        </footer>
      </article>`;
  }).join('\n');

  return `<div data-page="testimonials" class="project-page testimonials-page">
<!--HEADER-->
  <section class="tst-intro">
    <div class="wrap">
      <span class="label tst-eyebrow">In their words</span>
      <h1 class="tst-title">Testimonials<span class="tst-kicker">.</span></h1>
    </div>
  </section>
  <section class="tst-list" aria-label="Testimonials">
    <div class="wrap tst-stack">
${cards}
    </div>
  </section>
<!--FOOTER-->
</div>`;
}

/* ---------------------------------------------------------------------------
   Card built to the supplied reference (testimonials/Testimonial Card Example.png),
   measured with sharp rather than eyeballed:
     ground      #372807  = var(--primary)
     quote mark  #B46F3A  = var(--clay)
     text        off-white
   Proportions are the reference's own, resolved against the 1205px card the
   1320px wrap yields: side padding 62.8px, top 41.1px, bottom 42.1px,
   mark ink 24.6px, mark -> quote 31.4px, name -> role 12.1px. Body 19.4px,
   name 20px, role 15.4px. Line breaks in the first card reproduce the
   reference's exactly.
   One departure: the reference's leading measures 1.15, tight enough to hurt a
   clamped block, so the quote runs at 1.4.
--------------------------------------------------------------------------- */
export const CSS = `
/* ---------- Testimonials ---------- */
.project-page.testimonials-page{background:var(--light);color:#2A1F08}

.tst-intro{padding-block:clamp(7rem,15vh,10.5rem) clamp(1.75rem,3.5vw,2.75rem)}
.testimonials-page .tst-eyebrow{display:block;font-family:var(--fb);font-weight:600;font-size:.7rem;
  letter-spacing:.24em;text-transform:uppercase;color:#7F4B23;margin-bottom:clamp(.9rem,1.6vw,1.25rem)}
.testimonials-page .tst-title{font-family:var(--fd);font-weight:700;letter-spacing:-.02em;
  font-size:clamp(2.2rem,5.5vw,4rem);line-height:1.05;color:#2A1F08;margin:0}
.tst-kicker{color:var(--clay)}

.tst-list{padding-block:0 clamp(4rem,9vw,7rem)}
.tst-stack{display:flex;flex-direction:column;gap:clamp(1.1rem,2vw,1.75rem)}

/* Cards span the full content width, one per row, as in the reference. */
.tq-card{margin:0;background:var(--primary);color:#F3EFE6;
  padding:clamp(1.75rem,3.4vw,2.6rem) clamp(1.5rem,5.4vw,4rem)}
/* line-height:1 makes the box the em box; the negative margins are the em
   offsets that land the glyph's ink where the reference has it: 41px below the
   card's top edge and 31px above the first line of the quote. */
.tq-mark{display:block;font-family:var(--fb);font-weight:800;
  font-size:clamp(1.7rem,6.1vw,5.5rem);line-height:1;color:var(--clay);
  margin:-.151em 0 -.292em}
.testimonials-page .tq-lede,
.testimonials-page .tq-full p{margin:0;max-width:none;
  font-family:var(--fb);font-size:clamp(1.0625rem,1.35vw,1.1875rem);line-height:1.4;color:#F3EFE6}
.testimonials-page .tq-full p + p{margin-top:1.05rem}

/* Collapsed: three lines of the quote and the browser's own ellipsis. */
.tq-lede{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}
.tq-card:not(.is-open) .tq-full{position:absolute;width:1px;height:1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap}
.tq-card.is-open .tq-lede{display:none}
.tq-card.has-more:not(.is-open) .tq-body{cursor:pointer}

/* The control appears only once JS has measured that the clamp hides something. */
.tq-more{display:none;align-items:center;justify-content:center;
  width:44px;height:44px;margin:-.45rem 0 -.65rem -.7rem;padding:0;
  background:none;border:0;color:var(--clay);cursor:pointer;transition:color .25s ease}
.tq-card.has-more .tq-more{display:inline-flex}
.tq-more:hover{color:#F3EFE6}
.tq-more:focus-visible{outline:2px solid var(--clay);outline-offset:2px}
.tq-chev{width:22px;height:22px;transition:transform .3s cubic-bezier(.22,1,.36,1)}
.tq-card.is-open .tq-chev{transform:rotate(180deg)}
/* label kept for screen readers only: the reference shows just the icon */
.tq-more-text{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* Attribution is always on the card, clamped or not. */
.tq-by{margin-top:clamp(1.1rem,2.4vw,1.75rem)}
/* the chevron already separates the quote from the attribution */
.tq-card.has-more .tq-by{margin-top:.5rem}
.testimonials-page .tq-name{margin:0;font-family:var(--fd);font-weight:700;
  font-size:clamp(1.125rem,1.55vw,1.25rem);line-height:1.25;color:#F3EFE6}
.testimonials-page .tq-role{margin:.05rem 0 0;font-family:var(--fb);font-weight:400;
  font-size:clamp(.875rem,1.15vw,.9625rem);line-height:1.4;color:rgba(243,239,230,.86)}
.tq-site{color:inherit;text-decoration:underline;text-decoration-color:rgba(180,112,58,.75);
  text-underline-offset:3px;transition:color .25s ease}
.tq-site:hover{color:var(--clay)}

@media (max-width:620px){
  .tq-card{padding:1.5rem 1.35rem 1.6rem}
  .testimonials-page .tq-lede,
  .testimonials-page .tq-full p{line-height:1.5}
  .tq-more{margin-left:-.6rem}
}`;

if (process.argv[1] && process.argv[1].endsWith('gen-testimonials.mjs')) {
  fs.mkdirSync('build/out', { recursive: true });
  fs.writeFileSync('build/out/page-testimonials.html', testimonialsPage());
  console.log('wrote build/out/page-testimonials.html');
}
