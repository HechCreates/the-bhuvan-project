import fs from 'fs';
import path from 'path';
import { META, ORDER, copyParagraphs, packRows, PACK } from './projects-content.mjs';

const imgs = JSON.parse(fs.readFileSync('build/projects-images.json', 'utf8'));
const OUT = path.join('build', 'out');
fs.mkdirSync(OUT, { recursive: true });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" class="arrow"><path d="M7 17 L17 7 M9 7 L17 7 L17 15" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function pageFor(slug) {
  const proj = imgs.find(p => p.slug === slug);
  const meta = META[slug];
  const paras = copyParagraphs(slug);
  const rows = packRows(proj.items);

  const collage = rows.map(r => {
    const figs = r.items.map(it => {
      const cap = it.caption
        ? `\n          <figcaption class="ccap">${esc(it.caption)}</figcaption>`
        : '';
      const alt = it.caption ? esc(it.caption) : esc(meta.title + ', photograph ' + it.n);
      return `        <figure class="cfig" style="flex:${it.ratio} 1 0">
          <img src="${it.src}" width="${it.w}" height="${it.h}" style="aspect-ratio:${it.ratio}"
               loading="lazy" decoding="async" alt="${alt}">${cap}
        </figure>`;
    }).join('\n');
    const spacer = r.spacer > 0.02
      ? `\n        <span class="cspace" style="flex:${r.spacer} 1 0" aria-hidden="true"></span>` : '';
    return `      <div class="crow${r.isPano ? ' crow--pano' : ''}">\n${figs}${spacer}\n      </div>`;
  }).join('\n');

  const link = meta.link
    ? `\n        <a class="proj-link" href="${meta.link.href}" target="_blank" rel="noopener"><span>${esc(meta.link.label)}</span>${ARROW}</a>`
    : '';

  // sub on the left, location/status on the right, together spanning the width
  const facts = [
    meta.location ? `<div class="proj-fact"><dt>Location</dt><dd>${esc(meta.location)}</dd></div>` : '',
    meta.status ? `<div class="proj-fact"><dt>Status</dt><dd>${esc(meta.status)}</dd></div>` : '',
  ].filter(Boolean).join('\n          ');
  const metaParts = [
    meta.sub ? `        <p class="proj-sub">${esc(meta.sub)}</p>` : '',
    facts ? `        <dl class="proj-facts">\n          ${facts}\n        </dl>` : '',
  ].filter(Boolean).join('\n');
  const metaRow = metaParts ? `      <div class="proj-meta">\n${metaParts}\n      </div>\n` : '';

  const i = ORDER.indexOf(slug);
  const prev = i > 0 ? ORDER[i - 1] : null;
  const next = i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null;
  const navLink = (target, dir) => {
    if (!target) return '<span></span>';
    const label = META[target].header;
    return `<a class="proj-step proj-step--${dir}" href="#/projects/${target}" data-route="p-${target}">
          <span class="proj-step-dir">${dir === 'prev' ? '&larr; Previous project' : 'Next project &rarr;'}</span>
          <span class="proj-step-name">${esc(label)}</span>
        </a>`;
  };

  return `<div data-page="p-${slug}" class="project-page">
<!--HEADER-->
  <section class="proj-intro">
    <div class="wrap">
      <a class="proj-back" href="#/projects" data-route="projects"><span aria-hidden="true">&larr;</span> <span>All projects</span></a>
      <h1 class="proj-title">${esc(meta.header)}</h1>
${metaRow}      <div class="proj-copy">
${paras.map(p => '        <p>' + esc(p) + '</p>').join('\n')}
      </div>${link}
    </div>
  </section>
  <section class="proj-collage" aria-label="${esc(meta.header)}, photographs">
${collage}
  </section>
  <nav class="proj-steps" aria-label="Other projects">
    <div class="wrap proj-steps-inner">
      ${navLink(prev, 'prev')}
      ${navLink(next, 'next')}
    </div>
  </nav>
<!--FOOTER-->
</div>`;
}

export const CSS = `
/* ---------- Project pages ---------- */
.project-page{background:var(--soil)}
.proj-intro{background:#F3EFE6;color:#2A1F08;padding-block:clamp(7rem,15vh,10.5rem) clamp(2.5rem,5vw,4rem)}
.proj-back{display:inline-flex;align-items:center;gap:.45rem;min-height:44px;margin-bottom:1.75rem;
  font-family:var(--fb);font-size:.6875rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:#7F4B23;text-decoration:none;transition:color .25s ease}
.proj-back:hover{color:#2A1F08}
/* Header and copy run the full width. Sub sits beside the location/status
   block, the pair spanning the same width. */
/* Title, sub and stats stack, each full width. Spacing opens as it descends:
   title -> sub tight, sub -> stats looser, then the rule and a clear break. */
/* scoped: the derived ".project-page h1/p" rules outrank a single class and
   would otherwise swallow these margins */
.project-page .proj-title{font-family:var(--fd);font-weight:700;font-size:clamp(1.75rem,3.6vw,2.9rem);
  line-height:1.14;letter-spacing:-.02em;color:#2A1F08;max-width:none;text-wrap:balance;
  margin:0 0 clamp(.9rem,1.6vw,1.35rem)}
.proj-meta{display:block;padding-bottom:clamp(1.4rem,2.6vw,2rem);
  margin-bottom:clamp(1.9rem,3.6vw,3rem);border-bottom:1px solid rgba(42,31,8,.16)}
/* Floor is 1.2rem so the sub always clears WCAG's 18.66px bold threshold for
   large text, which is what lets true --clay (3.44:1 on off-white) pass AA. */
.project-page .proj-sub{font-family:var(--fd);font-size:clamp(1.2rem,1.7vw,1.45rem);font-weight:700;
  line-height:1.3;letter-spacing:-.01em;color:var(--clay);max-width:56ch;text-wrap:pretty;
  margin:0 0 clamp(1.5rem,2.8vw,2.25rem)}
.project-page .proj-sub:last-child{margin-bottom:0}
.proj-facts{display:flex;gap:clamp(2.5rem,5vw,5rem);margin:0;flex-wrap:wrap}
.proj-fact dt{font-family:var(--fb);font-size:.6875rem;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:#5B5845;margin-bottom:.4rem}
.proj-fact dd{margin:0;font-family:var(--fb);font-size:.9375rem;font-weight:600;color:#2A1F08;line-height:1.4}
/* Header, sub, stats and copy all run the full width. */
.proj-copy{max-width:none}
.project-page .proj-copy p{margin:0 0 1.15rem;font-size:1.0625rem;line-height:1.68;
  color:#2A1F08;max-width:none}
.project-page .proj-copy p:last-child{margin-bottom:0}
.proj-link{display:inline-flex;align-items:center;gap:.5rem;min-height:44px;margin-top:1.75rem;
  font-family:var(--fb);font-size:.75rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:#7F4B23;text-decoration:none}
.proj-link .arrow{width:1em;height:1em;transition:transform .3s ease}
.proj-link:hover{color:#2A1F08}
.proj-link:hover .arrow{transform:translate(.18em,-.18em)}

/* Collage: rows are justified by flex-grow set to each image's aspect ratio,
   so every image keeps its ratio and the row fills the width exactly. A
   .cspace with the leftover grow is where deliberate empty space comes from. */
.proj-collage{--cgap:8px;background:var(--soil);
  padding:var(--cgap) var(--cgap) clamp(3rem,6vw,5rem);
  max-width:2000px;margin-inline:auto}
.crow{display:flex;gap:var(--cgap);align-items:flex-start;margin-bottom:var(--cgap)}
.cfig{margin:0;display:flex;flex-direction:column;min-width:0}
.cfig img{display:block;width:100%;height:auto;background:#1B1305}
.ccap{padding:.6rem .2rem 0;font-family:var(--fb);font-size:.8125rem;line-height:1.45;
  color:#F3EFE6;opacity:.76;text-wrap:pretty}
.cspace{align-self:stretch}
.crow--pano{margin-bottom:calc(var(--cgap) * 2)}

/* Previous / next, mirroring the "All projects" arrow link. */
.proj-steps{background:var(--soil);padding-block:0 clamp(2.5rem,5vw,4rem)}
.proj-steps-inner{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem}
.proj-step{display:flex;flex-direction:column;gap:.35rem;max-width:34ch;text-decoration:none;
  color:#F3EFE6;transition:color .25s ease}
.proj-step--next{text-align:right;align-items:flex-end}
/* True --clay is only 4.1:1 on soil, which fails AA at this size. This lighter
   clay is the same hue at 6.7:1. */
.proj-step-dir{font-family:var(--fb);font-size:.6875rem;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:#D99A63}
.proj-step-name{font-family:var(--fd);font-size:1.0625rem;font-weight:700;line-height:1.25;
  letter-spacing:-.01em;color:#F3EFE6;opacity:.85}
.proj-step:hover .proj-step-name{opacity:1}
.proj-step:hover .proj-step-dir{color:#F3EFE6}

@media (max-width:760px){
  .proj-meta{flex-direction:column;gap:1.25rem}
  .proj-facts{gap:2rem}
  .proj-steps-inner{flex-direction:column;gap:1.75rem}
  .proj-step--next{text-align:left;align-items:flex-start}
  .proj-step{max-width:none}
  .crow{flex-direction:column;gap:1.25rem;margin-bottom:1.25rem}
  .cfig{flex:none !important;width:100%}
  .cspace{display:none}
  .ccap{font-size:.875rem;opacity:.85}
}`;

if (process.argv[2]) {
  const slug = process.argv[2];
  fs.writeFileSync(path.join(OUT, `page-${slug}.html`), pageFor(slug));
  fs.writeFileSync(path.join(OUT, 'projects.css'), CSS);
  const rows = packRows(imgs.find(p => p.slug === slug).items);
  console.log(`wrote build/out/page-${slug}.html`);
  console.log(`  ${rows.length} rows, ${imgs.find(p => p.slug === slug).items.length} images`);
  console.log(`  copy paragraphs: ${copyParagraphs(slug).length}`);
  console.log(`  captions: ${imgs.find(p => p.slug === slug).items.filter(i => i.caption).length}`);
}
