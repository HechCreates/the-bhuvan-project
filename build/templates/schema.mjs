/* The schema.org graph, built per page.

   This is the part of the site an AI answer engine can actually parse as
   fact rather than infer from prose. Perplexity, ChatGPT Search and Google's
   AI Overviews all synthesise from sources they can read confidently, and a
   studio that states "we are an ecological restoration practice in Bengaluru,
   founded by Nikhil Udupa, and here are seven projects with their locations"
   in machine-readable form is a far safer thing to cite than one that leaves
   it to be guessed from paragraphs.

   One @graph per page rather than separate blocks, so the nodes can reference
   each other by @id: the Organization is declared once and every page's
   WebPage node points at it as publisher. That is what tells an engine these
   twelve URLs are one entity rather than twelve unrelated documents.

   Everything here is derived -- from content/site.yml, content/pages.yml, and
   the page markup itself. Nothing is hand-typed twice, so nothing can drift
   out of agreement with what the page actually says. Where a fact is not
   known (a street address, a founding date, social profiles) the property is
   left out entirely: an absent property costs nothing, a wrong one is a
   trust problem.                                                           */

import { site } from './chrome.mjs';

const org = site.organization;

/* Read the facts a project page already states in its own <dl>, rather than
   keeping a second copy of them somewhere that can fall out of step. */
export const projectFacts = html => {
  const facts = {};
  for (const m of html.matchAll(/<dt>([^<]+)<\/dt><dd>([\s\S]*?)<\/dd>/g)) {
    facts[m[1].trim().toLowerCase()] = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  /* AFTER the header: the chrome is rendered in before the schema is built, so
     the first <img> in the document is the brand logo on every single page --
     which is how every project came to claim the logo as its photograph. */
  const afterHeader = html.slice(html.indexOf('</header>') + 1);
  const img = (afterHeader.match(/<img[^>]+src="([^"]+)"/) || [])[1];
  return { ...facts, name: h1 && h1.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(), img };
};

/* Absolute URLs throughout: a crawler may read the JSON-LD far from the page
   it came off, and a relative path is meaningless by then. */
const abs = (origin, p) => p ? `${origin}/${String(p).replace(/^(\.\.\/)+/, '')}` : undefined;

const drop = o => {
  for (const k of Object.keys(o)) {
    if (o[k] === undefined || o[k] === null || (Array.isArray(o[k]) && !o[k].length)) delete o[k];
  }
  return o;
};

export function organizationNode(origin) {
  return drop({
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${origin}/#organization`,
    name: site.brand.name,
    legalName: org.legalName,
    url: `${origin}/`,
    description: org.description,
    slogan: site.footer.motto.replace(/\s*&middot;\s*|\s*·\s*/g, ' · '),
    logo: drop({
      '@type': 'ImageObject',
      '@id': `${origin}/#logo`,
      url: abs(origin, site.brand.logo),
      caption: site.brand.logoAlt,
    }),
    image: { '@id': `${origin}/#logo` },
    email: site.contact.email,
    founder: { '@id': `${origin}/#nikhil-udupa` },
    address: drop({
      '@type': 'PostalAddress',
      addressLocality: org.address.locality,
      addressRegion: org.address.region,
      addressCountry: org.address.country,
    }),
    areaServed: { '@type': 'Country', name: org.areaServed },
    knowsAbout: org.knowsAbout,
    sameAs: org.sameAs,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: org.services.map(s => ({
        '@type': 'Offer', itemOffered: { '@type': 'Service', name: s },
      })),
    },
  });
}

/* Nikhil is declared on every page, not just About: he is the founder node the
   Organization points at, and a dangling @id reference is worse than none. */
function founderNode(origin) {
  return drop({
    '@type': 'Person',
    '@id': `${origin}/#nikhil-udupa`,
    name: org.founder,
    jobTitle: 'Founder',
    worksFor: { '@id': `${origin}/#organization` },
    url: `${origin}/about/`,
    knowsAbout: org.knowsAbout,
    sameAs: site.people && site.people.nikhilSameAs,
  });
}

function breadcrumbs(origin, page) {
  if (!page.url) return null;
  const parts = page.url.split('/');
  const items = [{ name: 'Home', url: `${origin}/` }];
  if (parts.length === 2 && parts[0] === 'projects') {
    items.push({ name: 'Projects', url: `${origin}/projects/` });
  }
  items.push({ name: page.crumb || page.title.split(/\s+[—|]\s+/)[0], url: `${origin}/${page.url}/` });
  return {
    '@type': 'BreadcrumbList',
    '@id': `${origin}/${page.url}/#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: it.url,
    })),
  };
}

/* The page node itself. A project page is also a CreativeWork describing the
   work -- its location and status are the facts most worth being able to
   answer a question with ("who restored habitat in Bandipur?"). */
function pageNode(origin, page, html) {
  const url = `${origin}/${page.url ? page.url + '/' : ''}`;
  const base = drop({
    '@type': page.type === 'CreativeWork' ? 'WebPage' : page.type,
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.desc,
    isPartOf: { '@id': `${origin}/#website` },
    about: { '@id': `${origin}/#organization` },
    publisher: { '@id': `${origin}/#organization` },
    inLanguage: 'en-IN',
    breadcrumb: page.url ? { '@id': `${url}#breadcrumb` } : undefined,
  });

  /* An FAQPage is only worth anything to Google or an answer engine if it
     carries the questions. They are read out of the rendered markup, so the
     schema cannot answer a question the page does not visibly ask. */
  if (page.type === 'FAQPage') {
    const items = [...html.matchAll(/<h2 class="faq-q">([\s\S]*?)<\/h2>\s*<p class="faq-a">([\s\S]*?)<\/p>/g)];
    base.mainEntity = items.map(m => ({
      '@type': 'Question',
      name: text(m[1]),
      acceptedAnswer: { '@type': 'Answer', text: text(m[2]) },
    }));
    return [base];
  }

  if (page.type !== 'CreativeWork') return [base];

  const f = projectFacts(html);
  return [base, drop({
    '@type': 'CreativeWork',
    '@id': `${url}#project`,
    name: f.name || page.title,
    description: page.desc,
    url,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    creator: { '@id': `${origin}/#organization` },
    locationCreated: f.location ? { '@type': 'Place', name: f.location } : undefined,
    creativeWorkStatus: f.status,
    image: abs(origin, f.img),
    inLanguage: 'en-IN',
  })];
}

/* ---- per-page extras ------------------------------------------------------
   Three pages carry facts worth declaring that no generic WebPage node can
   hold: who the team are, what clients said, and which projects exist. All
   three are read out of the markup, so the schema cannot claim a fifth
   testimonial or a team member the page does not show.                     */

const text = h => h.replace(/<[^>]*>/g, ' ').replace(/&([a-z]+);/g,
  (m, n) => ({ amp: '&', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', nbsp: ' ' }[n] ?? m))
  .replace(/\s+/g, ' ')
  // stripping an inline tag leaves "Bhuvan , meaning"; this is text an answer
  // engine may quote verbatim, so it should read like a sentence
  .replace(/\s+([,.;:!?])/g, '$1').trim();

const extras = {
  /* The team, as Person nodes. Nikhil already exists as the founder node, so
     he is extended there rather than declared twice under a second @id. */
  about(origin, html) {
    const out = [];
    const leads = [...html.matchAll(/<p class="lead-name">([^<]+)<\/p>\s*<p class="lead-role">([^<]+)<\/p>/g)];
    for (const [, name, role] of leads) {
      if (name.trim() === org.founder) continue;   // already the founder node
      out.push(drop({
        '@type': 'Person',
        '@id': `${origin}/about/#${name.trim().toLowerCase().replace(/[^a-z]+/g, '-')}`,
        name: text(name), jobTitle: text(role),
        worksFor: { '@id': `${origin}/#organization` },
      }));
    }
    for (const m of html.matchAll(/<p class="member-name">([^<]+)<\/p>\s*<p class="member-role">([^<]+)<\/p>/g)) {
      out.push(drop({
        '@type': 'Person',
        '@id': `${origin}/about/#${m[1].trim().toLowerCase().replace(/[^a-z]+/g, '-')}`,
        name: text(m[1]), jobTitle: text(m[2]),
        worksFor: { '@id': `${origin}/#organization` },
      }));
    }
    if (out.length) out.push({ '@type': 'Organization', '@id': `${origin}/#organization`, employee: out.map(p => ({ '@id': p['@id'] })) });
    return out;
  },

  /* Reviews. Deliberately no reviewRating and no aggregateRating: there are no
     ratings to report, and inventing them would be a lie that also breaks
     Google's self-serving-review rule. These will not draw stars in a search
     result -- reviews of your own organisation never do -- but they are
     exactly the kind of attributed, quotable evidence an AI answer cites. */
  testimonials(origin, html) {
    const cards = html.split('<article class="tq-card"').slice(1);
    return cards.map(card => {
      const name = (card.match(/<p class="tq-name">([^<]+)<\/p>/) || [])[1];
      const role = (card.match(/<p class="tq-role">([\s\S]*?)<\/p>/) || [])[1];
      const full = (card.match(/<div class="tq-full">([\s\S]*?)<\/div>/) || [])[1];
      if (!name || !full) return null;
      return drop({
        '@type': 'Review',
        '@id': `${origin}/testimonials/#${name.trim().toLowerCase().replace(/[^a-z]+/g, '-')}`,
        itemReviewed: { '@id': `${origin}/#organization` },
        author: drop({ '@type': 'Person', name: name.trim(), jobTitle: role && text(role) }),
        reviewBody: text(full),
        inLanguage: 'en-IN',
      });
    }).filter(Boolean);
  },

  /* The projects index as an ordered list pointing at the seven project
     pages, which is how a crawler learns they are siblings and not strays. */
  projects(origin, html) {
    const items = [...html.matchAll(/<a class="pi-link" href="([^"]+)"[\s\S]*?<h2 class="pi-title">([\s\S]*?)<\/h2>/g)];
    if (!items.length) return [];
    return [{
      '@type': 'ItemList',
      '@id': `${origin}/projects/#list`,
      numberOfItems: items.length,
      itemListElement: items.map((m, i) => ({
        '@type': 'ListItem', position: i + 1, name: text(m[2]),
        url: `${origin}/${m[1].replace(/^(\.\.\/)+/, '')}`,
      })),
    }];
  },
};

export function schemaFor(origin, page, html) {
  const graph = [
    organizationNode(origin),
    founderNode(origin),
    drop({
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      url: `${origin}/`,
      name: site.brand.name,
      description: org.description,
      publisher: { '@id': `${origin}/#organization` },
      inLanguage: 'en-IN',
    }),
    ...pageNode(origin, page, html),
  ];
  const bc = breadcrumbs(origin, page);
  if (bc) graph.push(bc);
  if (extras[page.key]) graph.push(...extras[page.key](origin, html));

  return '<script type="application/ld+json">'
    + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
    + '</script>';
}
