/* A project page, rendered from content/projects/<slug>.yml.

   This is the first half of making the site editable. Today the seven project
   pages are hand-written markup inside src/index.html, so "edit a project"
   means editing HTML. Once this template reproduces them exactly, the content
   file becomes the thing that is true and the markup becomes output -- which
   is the only way an admin interface can exist at all.

   The rule this is built to: EXTRACTION MUST BE LOSSLESS. The generated
   markup has to match what is on the site today, normalised for whitespace
   and entities, before it is allowed to replace anything.
   build/verify-projects.mjs is what proves that, page by page.

   Every element that comes from the content file carries a data-edit path
   naming the field it was rendered from -- "gallery.rows.2.figures.0.caption"
   and so on. That attribute is how the in-place editor will know which line
   of which YAML file a paragraph on the screen belongs to. It is inert for
   visitors: no styling hangs off it, and the editor is the only thing that
   reads it.                                                                */

export const esc = s => String(s ?? '')
  .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* the collage: rows of figures, each figure's flex growth equal to its aspect
   ratio, so every figure in a row shares one height. The trailing spacer is
   what stops two portraits being stretched to fill a whole row. */
const figure = (f, path) => `        <figure class="cfig" style="flex:${f.ratio} 1 0">
          <span class="czoom"><img src="${esc(f.image)}" width="${f.width}" height="${f.height}" style="aspect-ratio:${f.ratio}"
               loading="lazy" decoding="async" alt="${esc(f.alt)}" data-edit="${path}.alt"></span>
${f.caption ? `          <figcaption class="ccap" data-edit="${path}.caption">${f.caption}</figcaption>\n` : ''}        </figure>
`;

const row = (r, i) => `      <div class="crow">
${(r.figures || []).map((f, j) => figure(f, `gallery.rows.${i}.figures.${j}`)).join('')}${
  r.spacer ? `        <span class="cspace" style="flex:${r.spacer} 1 0" aria-hidden="true"></span>\n` : ''}      </div>
`;

/* The first project has no previous and the last has no next. An empty span
   takes the missing one's place so the remaining link still sits at its own
   end of the row rather than sliding to the middle. */
const step = (p, dir) => p ? `      <a class="proj-step proj-step--${dir}" href="#/projects/${p.slug}" data-route="p-${p.slug}">
          <span class="proj-step-dir">${dir === 'prev' ? '&larr; Previous project' : 'Next project &rarr;'}</span>
          <span class="proj-step-name">${p.title}</span>
        </a>
` : '      <span></span>\n';

/* The chrome is passed in rather than built here. build.mjs renders the real
   header and footer from content/site.yml into every page; these defaults are
   the markers it looks for, so the template works standalone too. */
export function projectPage(p, { prev, next, header, footer } = {}) {
  header = header ?? '<header class="site-header" data-header></header>';
  footer = footer ?? '<footer class="footer"></footer>';
  return `<div data-page="p-${p.slug}" class="project-page">
${header}
  <section class="proj-intro">
    <div class="wrap">
      <a class="proj-back" href="#/projects" data-route="projects"><span aria-hidden="true">&larr;</span> <span>All projects</span></a>
      <h1 class="proj-title" data-edit="title">${p.title}</h1>
${p.subtitle || (p.facts || []).length ? `      <div class="proj-meta">
${p.subtitle ? `        <p class="proj-sub" data-edit="subtitle">${p.subtitle}</p>\n` : ''}        <dl class="proj-facts">
${(p.facts || []).map((f, i) => `          <div class="proj-fact"><dt data-edit="facts.${i}.label">${f.label}</dt><dd data-edit="facts.${i}.value">${f.value}</dd></div>`).join('\n')}
        </dl>
      </div>
` : ''}      <div class="proj-copy">
${(p.body || []).map((t, i) => `        <p data-edit="body.${i}">${t}</p>`).join('\n')}
      </div>
${p.link ? `        <a class="proj-link" href="${esc(p.link.url)}" target="_blank" rel="noopener"><span data-edit="link.label">${p.link.label}</span><svg viewBox="0 0 24 24" aria-hidden="true" class="arrow"><path d="M7 17 L17 7 M9 7 L17 7 L17 15" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>\n` : ''}    </div>
  </section>
  <section class="proj-collage" aria-label="${esc(p.title)}, photographs">
${(p.gallery?.rows || []).map(row).join('')}  </section>
  <nav class="proj-steps" aria-label="Other projects">
    <div class="wrap proj-steps-inner">
${step(prev, 'prev')}${step(next, 'next')}    </div>
  </nav>
${footer}
</div>
`;
}
