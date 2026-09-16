# Launching on thebhuvanproject.com

The site is built and staged with search indexing switched **off**. This is
the checklist for moving `www.thebhuvanproject.com` from Squarespace to this
site without losing what Google already knows about the old one.

Do it in order. Steps 1–2 are safe to do any time; step 4 is the moment the
old site stops being served.

---

## 1. Before launch: fill the gaps only you can fill

These are facts I could not find anywhere and would not invent. Each one is a
real ranking or trust signal. Edit `content/site.yml`:

| What | Where | Why it matters |
|---|---|---|
| Instagram / LinkedIn / other profile URLs | `organization.sameAs` | The strongest signal that ties this site to the studio as one entity. Right now AI engines have no independent link to confirm who the studio is. |
| Google Business Profile URL | `organization.sameAs` | See step 6. Once it exists, add its link here. |
| Phone number | not yet wired — tell Claude | Local search and the "call" action in Google Maps. |
| Street address (if you want it public) | `organization.address` | Only needed for map-pack ranking; locality alone is fine otherwise. |

And have Nikhil read **/faq/** and **/contact/**. Every answer was built from
copy already on the site, but it is his voice.

## 2. Check the build locally

```bash
npm run build
```

```bash
npm run verify
```

Both must end in "passed".

## 3. Switch indexing on and point everything at the real domain

One command rewrites every canonical, `og:url`, the sitemap, every redirect
stub, robots.txt, the cache headers, and writes the `CNAME` file:

```bash
node build/set-indexing.mjs on https://www.thebhuvanproject.com
```

```bash
npm run build && npm run verify
```

Commit and push. GitHub Actions deploys it.

## 4. Move the domain (this is the cutover)

**In GitHub:** repo → Settings → Pages → Custom domain → `www.thebhuvanproject.com`
→ Save. Tick **Enforce HTTPS** once it becomes available (can take up to an hour).

**At the domain registrar** (wherever the domain was bought — or in
Squarespace → Domains if it was bought there):

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `hechcreates.github.io` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Delete the old Squarespace DNS records for `www` and `@` first. **Do not
cancel the Squarespace plan until step 5 passes** — keep it as a fallback for
a week.

## 5. Verify the migration is working

Once DNS has propagated (minutes to a few hours), each of these old URLs must
land on its new page:

- `thebhuvanproject.com/home` → `/`
- `thebhuvanproject.com/portfolio-1` → `/projects/`
- `thebhuvanproject.com/portfolio-1/project-three-sng7y-kb7hl` → `/projects/mysuru-rail-museum/`
- `thebhuvanproject.com/about` → `/about/`
- `thebhuvanproject.com/contact` → `/contact/`

The full map of all 15 is in `content/redirects.yml`.

## 6. Tell the search engines

**Google Search Console** — https://search.google.com/search-console
1. Add property → Domain → `thebhuvanproject.com`, verify via DNS TXT record.
2. Sitemaps → submit `https://www.thebhuvanproject.com/sitemap.xml`.
3. URL Inspection → request indexing for `/`, `/about/`, `/projects/`, `/faq/`.
4. Check "Pages" after a week: the old Squarespace URLs should move to
   "Page with redirect" or "Alternate page with proper canonical".

**Bing Webmaster Tools** — https://www.bing.com/webmasters
Import from Search Console in one click. This also feeds ChatGPT Search and
DuckDuckGo, which use Bing's index.

**Google Business Profile** — https://business.google.com
Create or claim "The Bhu.Van Project", category *Landscape architect*, add the
website link. For "landscape architect Bengaluru" searches this matters more
than anything on the site itself. Add its link to `organization.sameAs`.

**Rich result check** — https://search.google.com/test/rich-results
Test `/faq/` (FAQ) and `/projects/mysuru-rail-museum/` (breadcrumbs).

## 7. The honest limit of GitHub Pages

GitHub Pages cannot send a true HTTP 301. The old URLs are answered by small
redirect pages (canonical + instant refresh), which Google follows and
credits, but more slowly than a real 301.

If you ever want real 301s for free: put the domain behind **Cloudflare** (free
plan) or host on **Cloudflare Pages**. The build already generates a
`_redirects` file with every rule as a real 301; Cloudflare Pages reads it with
no further work.

---

### What not to do after launch

- Don't change a URL in `content/pages.yml` without adding the old one to
  `content/redirects.yml`.
- Don't run `set-indexing.mjs off` on the live site — it will remove the site
  from Google.
- Don't add `Disallow` lines to robots.txt to "hide" a page; use a `noindex`
  meta tag instead.
