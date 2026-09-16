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
const tCards = (s.match(/class="tq-card"/g) || []).length;
check('testimonial cards', tCards === 5, `${tCards} cards`);
const tNames = (s.match(/class="tq-name"/g) || []).length;
const tRoles = (s.match(/class="tq-role"/g) || []).length;
check('every card keeps its attribution', tNames === 5 && tRoles === 5, `${tNames} names, ${tRoles} roles`);
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
check('Get in Touch buttons wired', openers === 40, `${openers} (39 buttons + 1 delegated selector)`);
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

// every project has a card on the index pointing at it
for (const slug of ORDER) {
  const n = (s.match(new RegExp(`data-route="p-${slug}"`, 'g')) || []).length;
  check(`link -> p-${slug}`, n >= 1, `${n} link(s)`);
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
check('index has the Wendell Berry quote', /Wendell Berry/.test(block) && /The Earth is what we all have in common/.test(block));
check('index has 7 cards', (block.match(/class="pi-card"/g) || []).length === 7,
  (block.match(/class="pi-card"/g) || []).length + ' cards');

console.log('');
console.log(bad ? `${bad} check(s) failed` : 'all link wiring checks passed');
