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

  /* No lists yet -- everything on these is found by the walker. Adding and
     removing FAQ entries and project cards comes next; editing them works
     now. */
  faq: { lists: [] },
  contact: { lists: [] },
  projects: { lists: [] },
  testimonials: { lists: [] },
};
