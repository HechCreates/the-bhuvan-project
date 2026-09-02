import fs from 'fs';
import { ORDER, META } from './projects-content.mjs';

const s = fs.readFileSync('dist/index.html', 'utf8');
let bad = 0;
const check = (label, cond, detail = '') => {
  console.log((cond ? 'ok    ' : 'FAIL  ') + label + (detail ? '   ' + detail : ''));
  if (!cond) bad++;
};

// pages present
// exclude the router's own selector string: '[data-page="'+route+'"]'
const pages = [...s.matchAll(/data-page="([^"'+]+)"/g)].map(m => m[1]);
const unique = [...new Set(pages)];
check('pages registered', unique.length === 11, `${unique.length}: ` + unique.join(', '));

// testimonials
const soonT = (s.match(/data-soon="testimonials"/g) || []).length;
const routeT = (s.match(/data-route="testimonials"/g) || []).length;
check('nav Testimonials wired', soonT === 0 && routeT >= 30, `${routeT} routed, ${soonT} placeholders left`);
check('testimonials page present', s.includes('data-page="testimonials"'), '');
check('testimonials route in the hash map', s.includes("r==='testimonials'?'#/testimonials'"), '');
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
check('Get in Touch buttons wired', openers === 35, `${openers} (34 buttons + 1 delegated selector)`);
check('endpoint constant present and empty',
  /var CONTACT_ENDPOINT = '';/.test(s), 'paste the Apps Script /exec URL here to go live');
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

// router handles the index route
check('router maps projects route to a hash', /r==='projects'\?'#\/projects'/.test(s));

// index page contents
const i = s.indexOf('data-page="projects"');
const block = s.slice(i, s.indexOf('data-page="p-', i));
check('index has the Wendell Berry quote', /Wendell Berry/.test(block) && /The Earth is what we all have in common/.test(block));
check('index has 7 cards', (block.match(/class="pi-card"/g) || []).length === 7,
  (block.match(/class="pi-card"/g) || []).length + ' cards');

console.log('');
console.log(bad ? `${bad} check(s) failed` : 'all link wiring checks passed');
