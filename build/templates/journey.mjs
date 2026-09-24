/* The Visual Journey page, rendered from content/journey.yml.

   214 photographs in five categories, each category showing four picks on the
   page and the whole set in a popup. The data for this has existed in
   content/journey.yml since the page was built -- including which category
   every photograph belongs to and its caption -- but nothing read it. This
   template is what makes that file the thing that is true.

   Two rules are derived rather than stored, because storing them would let
   them fall out of step with the photographs themselves:

     the count      "44 photographs" is however many photographs there are
     the alt text   a photograph with a caption uses it; one without falls
                    back to "Geographical — photograph from the Visual
                    Journey", built from the category title

   An empty caption is therefore meaningful: it means this photograph has no
   caption to show, and 121 of the 214 are in that state. Give one a caption
   in the content file and a <figcaption> appears under it and its alt text
   improves at the same time.                                               */

export const esc = s => String(s ?? '')
  .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const IMG = 'images/journey/';

/* "Geographical Diversity" -> "Geographical" */
const shortName = title => title.replace(/\s+Diversity$/, '');
/* a literal em dash, as the page has always had: the entity renders the same
   but would show up as a difference against every one of these attributes */
const genericAlt = cat => `${shortName(cat.title)} — photograph from the Visual Journey`;

const captionOf = (cat, file) => {
  const p = cat.photos.find(x => x.file === file);
  return p && p.caption ? p.caption : '';
};
const altOf = (cat, file) => captionOf(cat, file) || genericAlt(cat);

const cell = (cat, file, n) =>
  `        <div class="vj-cell vj-cell-${n}"><img src="${IMG}${esc(file)}" loading="lazy" decoding="async" alt="${altOf(cat, file)}" data-edit-src="categories.${cat.i}.picks.${n - 1}"></div>`;

const block = cat => `      <article class="vj-block" data-reveal>
        <h2 class="vj-title" data-edit="categories.${cat.i}.title">${cat.title}</h2>
        <div class="vj-mosaic">
${cat.picks.map((f, n) => cell(cat, f, n + 1)).join('\n')}
          <button type="button" class="vj-more" data-open-journey="${esc(cat.key)}">
            <span data-edit="page.moreLabel">${cat.moreLabel}</span>
            <span class="vj-count">${cat.photos.length} photographs</span>
          </button>
        </div>
      </article>
`;

const shot = (cat, p, i) => {
  const src = `${IMG}${esc(p.file)}`;
  return `      <figure class="vj-shot"><button type="button" class="vj-zoom" data-open-shot="${src}"><img src="${src}" loading="lazy" decoding="async" alt="${altOf(cat, p.file)}" data-edit-src="categories.${cat.i}.photos.${i}.file"></button>
        ${p.caption ? `<figcaption data-edit="categories.${cat.i}.photos.${i}.caption">${p.caption}</figcaption>` : ''}
      </figure>
`;
};

const modal = cat => `<div class="modal vj-modal" data-journey-modal="${esc(cat.key)}" role="dialog" aria-modal="true" aria-label="${esc(cat.title)}" hidden>
  <div class="modal-backdrop" data-close-modal></div>
  <div class="modal-panel vj-panel">
    <div class="vj-panel-head">
      <h2 class="vj-panel-title" data-edit="categories.${cat.i}.title">${cat.title}</h2>
      <p class="vj-panel-count">${cat.photos.length} photographs</p>
      <button type="button" class="modal-close" data-close-modal aria-label="Close">&times;</button>
    </div>
    <div class="vj-collage">
${cat.photos.map((p, i) => shot(cat, p, i)).join('')}    </div>
  </div>
</div>
`;

/* The lightbox is one fixed element shared by every category -- the script
   fills its image and caption from whichever photograph was clicked. Nothing
   in it is content, so it is literal here. */
const LIGHTBOX = `<div class="modal vj-light" data-shot-modal role="dialog" aria-modal="true" aria-label="Photograph" hidden>
  <div class="modal-backdrop" data-shot-back></div>
  <button type="button" class="vj-back" data-shot-back>
    <span class="vj-back-arrow" aria-hidden="true">&larr;</span>
    <span>Back to <span class="vj-back-cat">the collection</span></span>
  </button>
  <button type="button" class="vj-nav vj-nav-prev" data-shot-step="-1" aria-label="Previous photograph">
    <span aria-hidden="true">&lsaquo;</span>
  </button>
  <button type="button" class="vj-nav vj-nav-next" data-shot-step="1" aria-label="Next photograph">
    <span aria-hidden="true">&rsaquo;</span>
  </button>
  <div class="vj-light-inner">
    <img src="" alt="">
    <p class="vj-light-cap" hidden></p>
  </div>
</div>`;

export function journeyPage(j, { header, footer } = {}) {
  header = header ?? '<header class="site-header" data-header></header>';
  footer = footer ?? '<footer class="footer"></footer>';

  /* index and the shared label travel with each category so the templates
     above can build their data-edit paths without a second argument */
  const cats = j.categories.map((c, i) => ({ ...c, i, moreLabel: j.page.moreLabel }));

  return `<div data-page="journey" class="project-page journey-page">
${header}
<section class="vj-open">
  <div class="wrap">
    <h1 class="vj-h1" data-edit="page.title">${j.page.title}</h1>
    <div class="vj-lede">
${j.page.lede.map((p, i) => `      <p data-edit="page.lede.${i}">${p}</p>`).join('\n')}
    </div>
  </div>
</section>

<section class="vj-grid-sec">
  <div class="wrap">
    <div class="vj-grid">
${cats.map(block).join('')}    </div>
  </div>
</section>

${footer}
${cats.map(modal).join('')}${LIGHTBOX}
</div>
`;
}
