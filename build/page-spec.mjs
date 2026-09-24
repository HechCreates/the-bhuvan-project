/* Which pages are generated from a template, and which parts of them repeat.
 *
 * This file used to name every editable element, one regex each. It does not
 * any more: build/discover.mjs walks each page and takes every text element
 * and every image, so nothing depends on my remembering to list it. Hand
 * listing left 24% of the site's text editable and four pages with none.
 *
 * What is left here is only the LISTS -- the parts a person can add to,
 * remove from and reorder, rather than merely edit in place. A list needs
 * three things the walker cannot infer: where it begins and ends, what one
 * item looks like, and which of the item's values are fields.
 *
 * `skipClass` keeps the walker out of the list's items, so each value belongs
 * to the list and not to two owners at once.
 */

export const SPEC = {
  home: {
    lists: [
      {
        path: 'hero.tags',
        skipClass: 'hero-tagpills',
        container: /(<div class="hero-tagpills">\s*)([\s\S]*?)(\s*<\/div>)/,
        item: /<span class="hero-tag"[^>]*>([\s\S]*?)<\/span>/g,
        fields: ['label'],
        template: '<span class="hero-tag" data-edit="hero.tags.{{@i}}.label">{{label}}</span>',
      },
      {
        /* the six project cards on the homepage: which projects are shown,
           in what order, with what photograph and caption */
        path: 'projects.plates',
        skipClass: 'plate-grid',
        container: /(<div class="plate-grid">)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<\/section>)/,
        /* [^>]* on every opening tag: the item template adds data-edit and
           data-item attributes, and this has to keep matching its own output
           or a second extraction silently finds no items at all */
        item: /\s*<article class="plate" data-reveal[^>]*>\s*<a href="#\/projects\/([a-z0-9-]+)" data-route="p-[a-z0-9-]+" class="plate-link">\s*<div class="plate-media"><img src="([^"]+)" alt="([^"]*)" loading="lazy"[^>]*><span class="plate-index"[^>]*>([^<]*)<\/span><\/div>\s*<div class="plate-foot">\s*<h3 class="plate-title"[^>]*>([\s\S]*?)<\/h3>\s*<p class="plate-sub"[^>]*>([\s\S]*?)<\/p>\s*<span class="plate-cue">([\s\S]*?)<span aria-hidden="true">&rarr;<\/span><\/span>\s*<\/div>\s*<\/a>\s*<\/article>/g,
        fields: ['slug', 'image', 'alt', 'index', 'title', 'subtitle', 'cue'],
        template: `
  <article class="plate" data-reveal data-item="projects.plates.{{@i}}">
    <a href="#/projects/{{slug}}" data-route="p-{{slug}}" class="plate-link">
      <div class="plate-media"><img src="{{image}}" alt="{{alt}}" loading="lazy" data-edit-src="projects.plates.{{@i}}.image" data-edit-alt="projects.plates.{{@i}}.alt"><span class="plate-index" data-edit="projects.plates.{{@i}}.index">{{index}}</span></div>
      <div class="plate-foot">
        <h3 class="plate-title" data-edit="projects.plates.{{@i}}.title">{{title}}</h3>
        <p class="plate-sub" data-edit="projects.plates.{{@i}}.subtitle">{{subtitle}}</p>
        <span class="plate-cue">{{cue}}<span aria-hidden="true">&rarr;</span></span>
      </div>
    </a>
  </article>`,
      },
      {
        /* The closing tag of the grid, not of its last item. A lookahead for
           what actually follows it is what tells them apart; without it the
           match stopped one item early and the last collaborator fell
           outside the container. */
        path: 'collaborators.logos',
        skipClass: 'collab-grid',
        container: /(<div class="collab-grid" data-reveal>)([\s\S]*?)(<\/div>(?=\s*<\/div>\s*<\/div>\s*<\/section>))/,
        item: /<div class="collab-item"[^>]*><img src="([^"]+)" alt="([^"]*)" loading="lazy"[^>]*><\/div>/g,
        fields: ['image', 'alt'],
        template: '<div class="collab-item" data-item="collaborators.logos.{{@i}}"><img src="{{image}}" alt="{{alt}}" loading="lazy" data-edit-src="collaborators.logos.{{@i}}.image" data-edit-alt="collaborators.logos.{{@i}}.alt"></div>',
      },
    ],
  },

  about: {
    lists: [
      {
        /* Each item carries its own leading indentation, so repeating the
           template reproduces the separators between items too. */
        path: 'team.members',
        skipClass: 'team-members',
        container: /(<div class="team-members" data-reveal>)([\s\S]*?)(\s*<\/div>)/,
        item: /\s*<article class="member"[^>]*>\s*<img src="([^"]+)" width="(\d+)" height="(\d+)" loading="lazy" alt="([^"]*)"[^>]*>\s*<p class="member-name"[^>]*>([\s\S]*?)<\/p>\s*<p class="member-role"[^>]*>([\s\S]*?)<\/p>\s*<\/article>/g,
        fields: ['image', 'width', 'height', 'alt', 'name', 'role'],
        template: `
      <article class="member" data-item="team.members.{{@i}}">
        <img src="{{image}}" width="{{width}}" height="{{height}}" loading="lazy" alt="{{alt}}" data-edit-src="team.members.{{@i}}.image" data-edit-alt="team.members.{{@i}}.alt">
        <p class="member-name" data-edit="team.members.{{@i}}.name">{{name}}</p>
        <p class="member-role" data-edit="team.members.{{@i}}.role">{{role}}</p>
      </article>`,
      },
    ],
  },

  faq: {
    lists: [
      {
        /* The container ends at the "Still unsure…" line, not at the wrap's
           closing tag: that paragraph sits among the entries but is not one,
           and a container that swallowed it would repeat it once per
           question. */
        path: 'faq.items',
        skipClass: 'faq-item',
        container: /(<section class="faq-list"[^>]*>\s*<div class="wrap">)([\s\S]*?)(\s*<p class="faq-foot">)/,
        item: /\s*<article class="faq-item"[^>]*>\s*<h2 class="faq-q"[^>]*>([\s\S]*?)<\/h2>\s*<p class="faq-a"[^>]*>([\s\S]*?)<\/p>\s*<\/article>/g,
        fields: ['q', 'a'],
        template: `
      <article class="faq-item" data-item="faq.items.{{@i}}">
        <h2 class="faq-q" data-edit="faq.items.{{@i}}.q">{{q}}</h2>
        <p class="faq-a" data-edit="faq.items.{{@i}}.a">{{a}}</p>
      </article>`,
      },
    ],
  },

  contact: { lists: [] },

  projects: {
    lists: [
      {
        /* The cards on the projects index. The route is derived from the
           slug rather than stored beside it: two copies of the same fact is
           how a card comes to link at one project and be labelled another. */
        path: 'work.cards',
        skipClass: 'pi-card',
        container: /(<div class="pi-grid">)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<\/section>)/,
        item: /\s*<article class="pi-card"[^>]*>\s*<a class="pi-link" href="#\/projects\/([a-z0-9-]+)" data-route="p-[a-z0-9-]+">\s*<span class="pi-index"[^>]*>([^<]*)<\/span>\s*<div class="pi-media">\s*<img src="([^"]+)" width="(\d+)" height="(\d+)" loading="lazy" decoding="async"\s*alt="([^"]*)"[^>]*>\s*<\/div>\s*<h2 class="pi-title"[^>]*>([\s\S]*?)<\/h2>\s*<p class="pi-sub"[^>]*>([\s\S]*?)<\/p>\s*<span class="pi-cue">([\s\S]*?)<span aria-hidden="true">&rarr;<\/span><\/span>\s*<\/a>\s*<\/article>/g,
        fields: ['slug', 'index', 'image', 'width', 'height', 'alt', 'title', 'subtitle', 'cue'],
        template: `
      <article class="pi-card" data-item="work.cards.{{@i}}">
        <a class="pi-link" href="#/projects/{{slug}}" data-route="p-{{slug}}">
          <span class="pi-index" data-edit="work.cards.{{@i}}.index">{{index}}</span>
          <div class="pi-media">
            <img src="{{image}}" width="{{width}}" height="{{height}}" loading="lazy" decoding="async"
                 alt="{{alt}}" data-edit-src="work.cards.{{@i}}.image" data-edit-alt="work.cards.{{@i}}.alt">
          </div>
          <h2 class="pi-title" data-edit="work.cards.{{@i}}.title">{{title}}</h2>
          <p class="pi-sub" data-edit="work.cards.{{@i}}.subtitle">{{subtitle}}</p>
          <span class="pi-cue">{{cue}}<span aria-hidden="true">&rarr;</span></span>
        </a>
      </article>`,
      },
    ],
  },

  testimonials: {
    lists: [
      {
        /* The only list whose items contain a list of their own: one
           testimonial runs to three paragraphs, the next to one. `map`
           exists for that -- the body is captured as markup and split, so
           the paragraphs stay separately editable and can themselves be
           added to.

           The silhouette's width, height and --sil-* custom properties are
           stored with the photograph because they were measured FROM it:
           they frame that particular cut-out. Copying a card copies its
           framing, which is right until the photograph is replaced. */
        path: 'tst.cards',
        skipClass: 'tq-card',
        container: /(<div class="wrap tst-stack">)([\s\S]*?)(\s*<\/div>\s*<\/section>)/,
        item: /\s*<article class="tq-card"[^>]*>\s*<span class="tq-mark" aria-hidden="true">&ldquo;<\/span>\s*<div class="tq-body" id="tq-body-\d+">\s*<p class="tq-lede" aria-hidden="true"[^>]*>([\s\S]*?)<\/p>\s*<div class="tq-full">([\s\S]*?)<\/div>\s*<\/div>\s*<button class="tq-more" type="button" aria-expanded="false" aria-controls="tq-body-\d+">\s*<span class="tq-more-text"[^>]*>([\s\S]*?)<\/span><svg class="tq-chev"[\s\S]*?<\/svg>\s*<\/button>\s*<img class="tq-sil" width="(\d+)" height="(\d+)" src="([^"]+)" style="([^"]*)" alt="([^"]*)" loading="lazy" decoding="async"[^>]*>\s*<footer class="tq-by">\s*<p class="tq-name"[^>]*>([\s\S]*?)<\/p>\s*<p class="tq-role"[^>]*>([\s\S]*?)<\/p>\s*<\/footer>\s*<\/article>/g,
        map: m => ({
          lede: m[1],
          body: [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(p => p[1]),
          more: m[3],
          silWidth: m[4], silHeight: m[5], silImage: m[6], silStyle: m[7], silAlt: m[8],
          name: m[9], role: m[10],
        }),
        template: `
      <article class="tq-card" data-item="tst.cards.{{@i}}">
        <span class="tq-mark" aria-hidden="true">&ldquo;</span>
        <div class="tq-body" id="tq-body-{{@n}}">
          <p class="tq-lede" aria-hidden="true" data-edit="tst.cards.{{@i}}.lede">{{lede}}</p>
          <div class="tq-full">{{#each body}}
            <p data-edit="tst.cards.{{@parent}}.body.{{@i}}">{{@value}}</p>{{/each}}
          </div>
        </div>
        <button class="tq-more" type="button" aria-expanded="false" aria-controls="tq-body-{{@n}}">
          <span class="tq-more-text" data-edit="tst.cards.{{@i}}.more">{{more}}</span><svg class="tq-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9.5 L12 15.5 L18 9.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <img class="tq-sil" width="{{silWidth}}" height="{{silHeight}}" src="{{silImage}}" style="{{silStyle}}" alt="{{silAlt}}" loading="lazy" decoding="async" data-edit-src="tst.cards.{{@i}}.silImage" data-edit-alt="tst.cards.{{@i}}.silAlt">
        <footer class="tq-by">
          <p class="tq-name" data-edit="tst.cards.{{@i}}.name">{{name}}</p>
          <p class="tq-role" data-edit="tst.cards.{{@i}}.role">{{role}}</p>
        </footer>
      </article>`,
      },
    ],
  },
};
