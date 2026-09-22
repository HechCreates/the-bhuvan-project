/* What is editable on the Home and About pages, and what repeats.

   Everything here is an anchor into the existing markup. build/extract-page.mjs
   finds each one, lifts the captured value into content/<page>.yml, and leaves
   a token behind in the template. Nothing about the layout, classes or
   attributes is described here -- only the VALUES a person should be able to
   change.

   Each `slot` must match EXACTLY ONCE. An anchor that matches twice, or not
   at all, is a spec that has drifted from the markup, and extraction stops
   rather than guessing. That is the whole safety property: a regex that
   silently matches nothing is how the projects extractor blanked seven files
   earlier in this work.

   `lists` are the parts a person can add to, remove from and reorder. Each
   takes the markup of its items, derives an item template from the first one,
   and stores every item's fields in the content file.                      */

/* helper: an element with a known class, captured by its inner HTML */
const inner = (tag, cls) =>
  new RegExp(`<${tag} class="${cls}"[^>]*>([\\s\\S]*?)</${tag}>`);

/* The five practices on the homepage. Each is scoped by its data-practice
   key, so the anchors stay unambiguous no matter what order they sit in.
   They are slots rather than a list: adding a practice would also need its
   "read the full scope" modal, which lives in a different part of the page,
   and a list that can add an item whose modal does not exist would be a trap.
   Editing, including the photograph, works; adding a sixth is a job for
   later. */
const PRACTICES = ['ecological-restoration', 'landscape-architecture',
  'watershed-management', 'sustainable-architecture', 'academic-engagement'];

const practiceSlots = PRACTICES.flatMap(key => {
  const at = `<div class="practice" data-practice="${key}">[\\s\\S]*?`;
  return [
    [`practices.items.${key}.name`, new RegExp(at + '<span class="practice-name">([\\s\\S]*?)</span>')],
    [`practices.items.${key}.description`, new RegExp(at + '<p class="practice-desc">([\\s\\S]*?)</p>')],
    [`practices.items.${key}.image`, new RegExp(at + '<div class="practice-media"><img src="([^"]+)"[^>]*>')],
    [`practices.items.${key}.imageAlt`, new RegExp(at + '<div class="practice-media"><img src="[^"]*" alt="([^"]*)"[^>]*>')],
    [`practices.items.${key}.moreLabel`, new RegExp(at + `<button class="practice-more" data-open-service="${key}">([\\s\\S]*?)<span`)],
  ];
});

export const SPEC = {
  home: {
    slots: [
      /* hero */
      ['hero.statement', inner('h1', 'hero-statement')],
      ['hero.lede', inner('p', 'hero-lede')],
      ['hero.eyebrow', inner('span', 'label hero-eyebrow')],
      /* the closing bracket matters: the data-edit marker is added just
         before it, so an anchor that stops short of it gets no marker */
      ['hero.image.src', /<img class="hero-img" src="([^"]+)" width="\d+" height="\d+" alt="[^"]*"[^>]*>/],
      ['hero.image.alt', /<img class="hero-img" src="[^"]*" width="\d+" height="\d+" alt="([^"]*)"[^>]*>/],

      /* the Sanskrit line */
      ['meaning.text', inner('p', 'meaning-text')],

      /* about teaser */
      ['aboutTeaser.eyebrow', inner('span', 'label about-eyebrow')],
      ['aboutTeaser.statement', inner('p', 'about-statement')],
      ['aboutTeaser.linkLabel', /<a class="about-link" href="#\/about" data-route="about"><span>([\s\S]*?)<\/span>/],
      ['aboutTeaser.map.src', /<button type="button" class="map-btn" data-open-map aria-label="[^"]*">\s*<img src="([^"]+)" alt="[^"]*"[^>]*>/],
      ['aboutTeaser.map.alt', /<button type="button" class="map-btn" data-open-map aria-label="[^"]*">\s*<img src="[^"]*" alt="([^"]*)"[^>]*>/],
      ['aboutTeaser.map.caption', inner('figcaption', 'about-cap')],
      ['collaborators.heading', inner('p', 'label collab-head')],

      /* sections */
      ['practices.heading', /<section class="practices" id="what-we-do">[\s\S]*?<h2 class="sec-title">([\s\S]*?)<span class="sec-kicker">/],
      ['projects.heading', /<section class="projects" id="projects">[\s\S]*?<h2 class="sec-title">([\s\S]*?)<span class="sec-kicker">/],
      ['projects.viewAllLabel', inner('a', 'projects-view-all')],

      ...practiceSlots,
    ],

    lists: [
      {
        path: 'hero.tags',
        /* the three words under the hero */
        container: /(<div class="hero-tagpills">\s*)([\s\S]*?)(\s*<\/div>)/,
        item: /<span class="hero-tag">([\s\S]*?)<\/span>/g,
        fields: ['label'],
        template: '<span class="hero-tag" data-edit="hero.tags.{{@i}}.label">{{label}}</span>',
      },
      {
        /* the six project cards on the homepage: which projects are shown,
           in what order, with what photograph and caption */
        path: 'projects.plates',
        container: /(<div class="plate-grid">)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<\/section>)/,
        item: /\s*<article class="plate" data-reveal>\s*<a href="#\/projects\/([a-z0-9-]+)" data-route="p-[a-z0-9-]+" class="plate-link">\s*<div class="plate-media"><img src="([^"]+)" alt="([^"]*)" loading="lazy"><span class="plate-index">([^<]*)<\/span><\/div>\s*<div class="plate-foot">\s*<h3 class="plate-title">([\s\S]*?)<\/h3>\s*<p class="plate-sub">([\s\S]*?)<\/p>\s*<span class="plate-cue">([\s\S]*?)<span aria-hidden="true">&rarr;<\/span><\/span>\s*<\/div>\s*<\/a>\s*<\/article>/g,
        fields: ['slug', 'image', 'alt', 'index', 'title', 'subtitle', 'cue'],
        template: `
  <article class="plate" data-reveal>
    <a href="#/projects/{{slug}}" data-route="p-{{slug}}" class="plate-link">
      <div class="plate-media"><img src="{{image}}" alt="{{alt}}" loading="lazy" data-edit="projects.plates.{{@i}}"><span class="plate-index" data-edit="projects.plates.{{@i}}.index">{{index}}</span></div>
      <div class="plate-foot">
        <h3 class="plate-title" data-edit="projects.plates.{{@i}}.title">{{title}}</h3>
        <p class="plate-sub" data-edit="projects.plates.{{@i}}.subtitle">{{subtitle}}</p>
        <span class="plate-cue">{{cue}}<span aria-hidden="true">&rarr;</span></span>
      </div>
    </a>
  </article>`,
      },
      {
        path: 'collaborators.logos',
        /* The closing tag of the grid, not of its last item. A lookahead for
           what actually follows it -- the wrap, the about-bottom, the section
           -- is what tells them apart; without it the match stopped one item
           early and the last collaborator fell outside the container. */
        container: /(<div class="collab-grid" data-reveal>)([\s\S]*?)(<\/div>(?=\s*<\/div>\s*<\/div>\s*<\/section>))/,
        item: /<div class="collab-item"><img src="([^"]+)" alt="([^"]*)" loading="lazy"><\/div>/g,
        fields: ['image', 'alt'],
        template: '<div class="collab-item"><img src="{{image}}" alt="{{alt}}" loading="lazy" data-edit="collaborators.logos.{{@i}}"></div>',
      },
    ],
  },

  about: {
    slots: [
      ['hero.eyebrow', inner('span', 'label about-eyebrow')],
      ['hero.lede', inner('h1', 'about-lede')],

      /* Headings and labels are scoped to their own section. "sec-label"
         alone appears three times on this page, and an anchor that matches
         more than once is ambiguous, not convenient. */
      ['philosophy.heading', /<section class="section philo"[^>]*>[\s\S]*?<h2 class="sec-title">([\s\S]*?)<span class="sec-kicker">/],
      ['philosophy.label', /<section class="section philo"[^>]*>[\s\S]*?<span class="sec-label">([\s\S]*?)<\/span>/],
      ['team.heading', /<section class="section team[^"]*"[^>]*>[\s\S]*?<h2 class="sec-title">([\s\S]*?)<span class="sec-kicker">/],
      ['geography.heading', /<section class="section geo"[^>]*>[\s\S]*?<h2 class="sec-title">([\s\S]*?)<span class="sec-kicker">/],
      ['geography.label', /<section class="section geo"[^>]*>[\s\S]*?<span class="sec-label">([\s\S]*?)<\/span>/],
      ['geography.map.alt', /<figure class="geo-figure">\s*<img src="[^"]*" alt="([^"]*)"/],
      ['collaborators.heading', /<section class="section collab-sec[^"]*"[^>]*>[\s\S]*?<h2 class="sec-title">([\s\S]*?)<span class="sec-kicker">/],
      ['collaborators.label', /<section class="section collab-sec[^"]*"[^>]*>[\s\S]*?<span class="sec-label">([\s\S]*?)<\/span>/],
      ['closing.heading', /<section class="closing"[^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/],
    ],

    lists: [
      {
        /* the team below the two leads: add, remove, reorder */
        path: 'team.members',
        /* Each item carries its own leading indentation, so repeating the
           template reproduces the separators between items too. Items joined
           without it come out run together on one line -- which changes the
           file even though it renders the same. */
        container: /(<div class="team-members" data-reveal>)([\s\S]*?)(\s*<\/div>)/,
        item: /\s*<article class="member">\s*<img src="([^"]+)" width="(\d+)" height="(\d+)" loading="lazy" alt="([^"]*)">\s*<p class="member-name">([\s\S]*?)<\/p>\s*<p class="member-role">([\s\S]*?)<\/p>\s*<\/article>/g,
        fields: ['image', 'width', 'height', 'alt', 'name', 'role'],
        template: `
      <article class="member">
        <img src="{{image}}" width="{{width}}" height="{{height}}" loading="lazy" alt="{{alt}}" data-edit="team.members.{{@i}}">
        <p class="member-name" data-edit="team.members.{{@i}}.name">{{name}}</p>
        <p class="member-role" data-edit="team.members.{{@i}}.role">{{role}}</p>
      </article>`,
      },
    ],
  },
};
