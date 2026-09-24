import fs from 'fs';
import { load } from 'js-yaml';
import { ORDER, META } from './projects-content.mjs';

/* Reads the SOURCE, not the build. src/index.html is where all twelve pages
   still live in one document and where the links are still authored as "#/"
   routes; build/build.mjs is what turns them into twelve files with real
   paths. That the paths then resolve is build/verify-build.mjs's job -- this
   file checks that the wiring is there to be rewritten in the first place. */
const s = fs.readFileSync('src/index.html', 'utf8');
let bad = 0;
const check = (label, cond, detail = '') => {
  console.log((cond ? 'ok    ' : 'FAIL  ') + label + (detail ? '   ' + detail : ''));
  if (!cond) bad++;
};

// pages present
// exclude the router's own selector string: '[data-page="'+route+'"]'
const pages = [...s.matchAll(/data-page="([^"'+]+)"/g)].map(m => m[1]);
const unique = [...new Set(pages)];
check('pages registered', unique.length === 14, `${unique.length}: ` + unique.join(', '));

// testimonials
const soonT = (s.match(/data-soon="testimonials"/g) || []).length;
const routeT = (s.match(/data-route="testimonials"/g) || []).length;
check('nav Testimonials wired', soonT === 0 && routeT >= 30, `${routeT} routed, ${soonT} placeholders left`);
check('testimonials page present', s.includes('data-page="testimonials"'), '');
check('testimonials has a nav entry that resolves', /data-route="testimonials"/.test(s), '');
/* Counted against each other, not against a number written here.
   Testimonials can now be added and removed from /admin/, and a check that
   insisted on five would stop the site deploying the first time someone
   added a sixth -- with nothing on screen to say why. What must stay true is
   that every card still carries its attribution. */
const tCards = (s.match(/class="tq-card"/g) || []).length;
check('testimonial cards present', tCards >= 1, `${tCards} cards`);
const tNames = (s.match(/class="tq-name"/g) || []).length;
const tRoles = (s.match(/class="tq-role"/g) || []).length;
check('every card keeps its attribution', tNames === tCards && tRoles === tCards,
  `${tCards} cards, ${tNames} names, ${tRoles} roles`);
check('expand handler present', s.includes('function tqMeasure()') && s.includes('function tqToggle('), '');

// nav "Projects" no longer a dead placeholder
const soonProjects = (s.match(/data-soon="projects"/g) || []).length;
const routeProjects = (s.match(/data-route="projects"/g) || []).length;
check('no dead Projects placeholders left', soonProjects === 0, `data-soon="projects" x${soonProjects}`);
check('Projects links wired', routeProjects >= 8, `data-route="projects" x${routeProjects}`);

// remaining placeholders are only the two pages genuinely not built
const soon = [...s.matchAll(/data-soon="([^"]+)"/g)].map(m => m[1]);
// contact modal
const cfModals = (s.match(/<div class="cf-overlay" data-contact-modal hidden>/g) || []).length;
check('one contact modal, once', cfModals === 1, `${cfModals} instance(s)`);
check('modal sits outside every [data-page]',
  s.indexOf('data-contact-modal') > s.lastIndexOf('<div data-page='), '');
const mailto = (s.match(/window.location.href='mailto/g) || []).length;
check('no per-page mailto bindings left', mailto === 0, `${mailto} left`);
const openers = (s.match(/data-open-contact/g) || []).length;
check('Get in Touch buttons wired', openers === 46, `${openers} (45 buttons + 1 delegated selector)`);
{ /* it was empty while the backend did not exist; now it must be a real
     deployment URL, and /dev instead of /exec is the classic slip */
  const m = s.match(/var CONTACT_ENDPOINT = '([^']*)';/);
  const url = m && m[1];
  check('contact endpoint wired',
    !!url && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url),
    url ? url.slice(0, 58) + String.fromCharCode(8230) : 'empty');
}
check('CTA radius overridden to --radius',
  s.includes("#page-home .cta,#page-about .cta,.project-page .cta{border-radius:var(--radius)}"), '');
for (const id of ['cf-name','cf-email','cf-message'])
  check('field ' + id + ' has a real label', new RegExp('for="' + id + '"').test(s) && new RegExp('id="' + id + '"').test(s), '');
check('modal has dialog semantics', s.includes('role="dialog" aria-modal="true"'), '');

check('only gallery still a placeholder',
  [...new Set(soon)].every(x => x === 'testimonials' || x === 'gallery'),
  [...new Set(soon)].join(', ') || 'none');

/* Links from the cards, checked in the direction that can break the site.
 *
 * A card pointing at a project page that does not exist is a dead link and
 * fails. A project page with no card pointing at it is an orphan -- worth
 * saying out loud, because nothing will find it, but it is a choice someone
 * may have made in /admin/ and not a reason to stop the site deploying. The
 * check used to be the other way round, which would have frozen every
 * deploy the moment a project was taken off the index. */
{
  const linked = new Set([...s.matchAll(/data-route="p-([a-z0-9-]+)"/g)].map(m => m[1]));
  const known = new Set(ORDER);
  const dead = [...linked].filter(slug => !known.has(slug));
  check('every project link points at a project that exists', dead.length === 0,
    dead.length ? 'no page for: ' + dead.join(', ') : `${linked.size} linked`);
  const orphans = ORDER.filter(slug => !linked.has(slug));
  if (orphans.length) console.log(`  NOTE  nothing links to: ${orphans.join(', ')} `
    + '-- the page is published but no card points at it');
}

// back links point at the index, not home
const backHome = (s.match(/class="proj-back" href="#\/" data-route="home"/g) || []).length;
const backIndex = (s.match(/class="proj-back" href="#\/projects" data-route="projects"/g) || []).length;
check('back links go to the index', backHome === 0 && backIndex === ORDER.length, `index:${backIndex} home:${backHome}`);

// homepage view-all
check('homepage "All projects" wired',
  /class="projects-view-all" href="#\/projects" data-route="projects"/.test(s));

// card images exist
const cardRefs = [...s.matchAll(/src="(images\/cards\/[^"]+)"/g)].map(m => m[1]);
const missingCards = cardRefs.filter(r => !fs.existsSync(r));
check('card images resolve', missingCards.length === 0, `${cardRefs.length} refs, ${missingCards.length} missing`);

// every project key in the source has a published URL, and no two share one
{
  const { pages } = load(fs.readFileSync('content/pages.yml', 'utf8'));
  const urls = new Map(pages.map(p => [p.key, p.url]));
  const missing = ORDER.filter(slug => !urls.has('p-' + slug));
  check('every project has a published URL', missing.length === 0,
    missing.length ? 'no URL for: ' + missing.join(', ') : `${ORDER.length} mapped`);
  const all = pages.map(p => p.url);
  check('no two pages share a URL', new Set(all).size === all.length,
    `${new Set(all).size} distinct of ${all.length}`);
}

// index page contents
const i = s.indexOf('data-page="projects"');
const block = s.slice(i, s.indexOf('data-page="p-', i));
/* The quote and the number of cards are both content now: the quote can be
   rewritten and cards added or removed from /admin/. What is checked is that
   the page still HAS its opening quote and still has cards, each one whole. */
check('index opens with a quote', /<blockquote[^>]*>[\s\S]{40,}?<\/blockquote>/.test(block));
const piCards = (block.match(/class="pi-card"/g) || []).length;
const piLinks = (block.match(/class="pi-link"/g) || []).length;
const piTitles = (block.match(/class="pi-title"/g) || []).length;
check('index has cards', piCards >= 1, `${piCards} cards`);
check('every card has a link and a title', piLinks === piCards && piTitles === piCards,
  `${piCards} cards, ${piLinks} links, ${piTitles} titles`);

console.log('');
console.log(bad ? `${bad} check(s) failed` : 'all link wiring checks passed');
