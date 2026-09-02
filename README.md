# The Bhu.Van Project

Site for an ecological restoration and landscape architecture studio in
Bengaluru. Static, no runtime dependencies, no database.

## Layout

```
content/      what the site says. Edited by hand or, soon, by the CMS.
  site.yml      brand, nav, CTA label, contact details, footer
  projects/     one file per project: copy, meta, card, gallery captions
  testimonials/ one file per testimonial
images/       every photograph and logo the site serves
src/
  index.html    the page shell; the build renders content into it
  assets/       originals kept for regenerating icons and the share card
static/       copied to the site root verbatim: icons, manifest, robots,
              _headers and _redirects
build/        the generators, and the checks that prove they are faithful
dist/         build output. Never edited, never committed.
```

## Commands

```
npm run build     content/ + src/ + static/ + images/  ->  dist/
npm run verify    proves the build reproduces the page and every asset resolves
npm run serve     serve dist/ at http://127.0.0.1:8777
npm run assets    regenerate favicons and the share card (needs sharp)
```

The build takes well under a second and needs only `js-yaml`. Image processing
is deliberately outside it: it needs `sharp`, it only matters when a source
image changes, and making every deploy depend on a native binary is a poor
trade. Generated images are committed.

## Hosting

Netlify is a **staging host only**, for client review. `netlify.toml` sets the
build command and publish directory, so no dashboard settings are load-bearing.

The site moves to a custom domain served entirely from GitHub once the design
is signed off. Nothing in `dist/` is Netlify-specific:

- `_redirects` is a Netlify nicety; `404.html` covers hosts without rewrites
- `_headers` sets the manifest content type, caching and `X-Robots-Tag`.
  **GitHub Pages has no equivalent**, which is why `noindex` also lives in the
  page's own `<meta name="robots">`

At launch, `node build/set-indexing.mjs on https://yourdomain.com` turns
indexing on and rewrites canonical, `og:url` and the share image URLs in one
step.

## Things that are true and easy to forget

- Routing is hash-based (`#/projects/bandipur-tiger-reserve`), so there is one
  real document and no server rewrites are required.
- Collage rows are **computed at build time** from each image's real
  dimensions, never stored. Adding or removing a photo re-justifies the rows on
  its own.
- The contact form validates and shows its confirmation, but
  `CONTACT_ENDPOINT` in `src/index.html` is empty, so **nothing is sent**.
  Paste the Google Apps Script `/exec` URL there to go live.
- Only the About page marks its current nav item, and the `is-current` rule is
  scoped to `#page-about`. The other pages have neither the markup nor the
  styling. `header(current)` takes the route, so making this consistent is a
  CSS change away.
