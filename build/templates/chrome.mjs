/* The header and footer, rendered from content/site.yml.

   These were previously duplicated into all 11 pages. Everything the client can
   change -- brand name, nav labels, the CTA wording, the contact details, the
   footer lines -- comes from the content file; the markup and class names are
   fixed, so the approved design cannot drift.

   Nav entries carry either `route` (a page that exists) or `soon` (a page that
   does not yet), which is what the router uses to decide where a click goes. */

import fs from 'fs';
import { load } from 'js-yaml';

export const site = load(fs.readFileSync('content/site.yml', 'utf8'));

// content values are authored with HTML entities already in them (&middot;,
// &copy;), so they pass through; only raw angle brackets and quotes are escaped
export const esc = s => String(s ?? '')
  .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const href = n => n.route === 'home' ? '#/' : n.soon ? '#/' : `#/${n.route}`;
const target = n => n.soon ? `data-soon="${esc(n.soon)}"` : `data-route="${esc(n.route)}"`;

/* `current` marks the nav item for the page being rendered. Today only the
   About page does this, and its .is-current rule is scoped to #page-about, so
   the other pages have neither the markup nor the styling. Threading the route
   through keeps that reproducible while leaving the door open to making it
   consistent across the site. */
const navLinks = (cls, current) => site.nav
  .map(n => {
    const on = current && n.route === current;
    return `<a href="${href(n)}" class="${cls}${on ? ' is-current' : ''}" ${target(n)}>${esc(n.label)}</a>`;
  })
  .join('\n');

export function header(current) {
  const b = site.brand;
  return `<header class="site-header" data-header>
  <div class="wrap header-inner">
    <a class="brand" href="#/" data-route="home" aria-label="${esc(b.name)} home">
      <img class="brand-logo" src="${esc(b.logo)}" alt="${esc(b.logoAlt)}">
      <span class="brand-name">${esc(b.name)}</span>
    </a>
    <nav class="nav" aria-label="Primary">${navLinks('nav-link', current)}
      <button type="button" class="cta" data-open-contact>${esc(site.cta.label)}</button>
    </nav>
    <button type="button" class="menu-toggle" aria-label="Open menu" aria-expanded="false" data-menu-toggle><span></span><span></span><span></span></button>
  </div>
  <div class="mobile-nav" data-mobile-nav>${navLinks('mobile-link', '')}
    <button type="button" class="cta mobile-cta" data-open-contact>${esc(site.cta.label)}</button>
  </div>
</header>`;
}

export function footer() {
  const b = site.brand, c = site.contact, f = site.footer;
  const links = site.nav
    .map(n => `<a href="${href(n)}" ${target(n)}>${esc(n.label)}</a>`).join('\n');
  return `<footer class="footer">
  <nav class="wrap footer-nav" aria-label="Footer">${links}</nav>
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <img class="footer-logo" src="${esc(b.logo)}" alt="${esc(b.logoAlt)}">
      <div><span class="footer-name">${esc(b.name)}</span><p class="footer-tag">${esc(b.tagline)}</p></div>
    </div>
    <div class="footer-contact">
      <p class="footer-place">${esc(c.location)}</p>
      <a class="footer-mail" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
      <button type="button" class="cta footer-cta" data-open-contact>${esc(site.cta.label)}</button>
    </div>
  </div>
  <div class="wrap footer-base"><span>${esc(f.copyright)}</span><span>${esc(f.motto)}</span></div>
</footer>`;
}
