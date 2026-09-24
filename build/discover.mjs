/* Find everything on a page that a person should be able to change.
 *
 * The first version of this listed the editable parts by hand, one regex per
 * field. That does not scale and it showed: 24% of the site's text was
 * editable and four pages had nothing at all. Naming things one at a time
 * guarantees the list is incomplete -- the only question is by how much.
 *
 * So this walks the markup instead and takes everything that qualifies:
 *
 *   TEXT   an element holding words, whose children are only inline
 *          formatting (span, em, a, br...). Its inner HTML becomes the value,
 *          so "people, place and ecology" keeps the <span> that colours it.
 *
 *   IMAGE  every <img>: the file and its alt text, separately.
 *
 * What it skips, deliberately:
 *
 *   - the header and footer, which come from content/site.yml and appear on
 *     every page; editing them here would mean fourteen copies of one value
 *   - <script>, <style> and <svg> internals
 *   - elements inside a declared list, which the list handles so that items
 *     can be added, removed and reordered rather than only edited
 *   - text that is purely punctuation or a single character: the "." after a
 *     heading is design, not content
 *
 * Paths are built from the markup's own structure -- section, then class,
 * then position among its siblings -- so they read like
 * "philo.philo-body-p.1" rather than "text.47", and stay put when something
 * elsewhere on the page changes.
 */

import { parse } from 'node-html-parser';

/* svg is NOT inline here. A button holding "Read more" plus an arrow icon
   would otherwise be captured whole, and the parser re-serialises svg
   slightly differently from the source, so the value could not be spliced
   back. Treating svg as a block sends the walker inside the button, where it
   finds the words and leaves the icon alone. */
const INLINE = new Set(['span', 'em', 'strong', 'b', 'i', 'a', 'br', 'sup', 'sub', 'small', 'abbr', 'time']);
const SKIP = new Set(['script', 'style', 'svg', 'head']);

/* Inline ALL THE WAY DOWN, not just at the top. A project card is an
   <article> whose only child is an <a> -- and an <a> is inline, so a shallow
   test called the whole card one piece of text and swallowed its photograph
   with it. An <a> wrapping a heading and an image is not inline in any sense
   that matters here. */
const isInlineish = el => {
  const tag = (el.rawTagName || '').toLowerCase();
  if (!INLINE.has(tag)) return false;
  return el.childNodes.filter(c => c.nodeType === 1).every(isInlineish);
};

/* Text worth editing. A lone "." or "&rarr;" is part of the design. */
const meaningful = t => t.replace(/&[a-z]+;/g, '').replace(/[^\p{L}\p{N}]/gu, '').length > 1;

const slug = s => String(s || '')
  .trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 40);

/* A readable, stable name for an element: its first class, else its tag. */
const nameOf = el => {
  const cls = (el.getAttribute('class') || '').trim().split(/\s+/)[0];
  return slug(cls) || el.rawTagName.toLowerCase();
};

/* The section an element sits in, for the first part of its path. */
const sectionOf = el => {
  let n = el.parentNode;
  while (n && n.rawTagName) {
    const tag = n.rawTagName.toLowerCase();
    if (tag === 'section' || tag === 'nav' || tag === 'article') {
      const id = n.getAttribute('id');
      const cls = (n.getAttribute('class') || '').trim().split(/\s+/).filter(c => c !== 'section')[0];
      const name = slug(id) || slug(cls);
      if (name) return name;
    }
    n = n.parentNode;
  }
  return 'page';
};

export function discover(html, { skipRanges = [] } = {}) {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: false } });

  /* elements covered by a declared list are handled there */
  const inSkipped = el => {
    for (const sel of skipRanges) {
      let n = el;
      while (n) {
        if (n.rawTagName && n.classList && n.classList.contains(sel)) return true;
        n = n.parentNode;
      }
    }
    return false;
  };

  /* The SITE header and footer, not any header or footer element. A
     testimonial's attribution lives in <footer class="tq-by"> and a project
     page's intro in a <header>; skipping every footer took the names and
     roles of all five testimonials out of the editor. */
  const inChrome = el => {
    let n = el;
    while (n) {
      const cls = (n.getAttribute && n.getAttribute('class')) || '';
      const tag = n.rawTagName && n.rawTagName.toLowerCase();
      if (tag === 'header' && /\bsite-header\b/.test(cls)) return true;
      if (tag === 'footer' && /(^|\s)footer(\s|$)/.test(cls)) return true;
      n = n.parentNode;
    }
    return false;
  };

  const used = new Map();       // path -> count, for de-duplication
  const found = [];
  const take = (el, kind, value, suffix) => {
    const base = `${sectionOf(el)}.${nameOf(el)}`;
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    const path = `${base}.${n}${suffix ? '.' + suffix : ''}`;
    found.push({ path, kind, value, el });
    return path;
  };

  const walk = el => {
    if (!el.rawTagName) return;
    const tag = el.rawTagName.toLowerCase();
    if (SKIP.has(tag)) return;
    if (inChrome(el) || inSkipped(el)) return;

    if (tag === 'img') {
      const base = `${sectionOf(el)}.${nameOf(el)}`;
      const n = used.get(base) ?? 0;
      used.set(base, n + 1);
      found.push({ path: `${base}.${n}.src`, kind: 'image', value: el.getAttribute('src') || '', el });
      found.push({ path: `${base}.${n}.alt`, kind: 'alt', value: el.getAttribute('alt') ?? '', el });
      return;
    }

    const children = el.childNodes.filter(c => c.nodeType === 1);
    const onlyInline = children.every(isInlineish);
    const text = el.text || '';

    if (children.length === 0 || onlyInline) {
      /* an <a> or <span> that only wraps other editable things is not itself
         a field; one holding words is */
      if (meaningful(text) && !INLINE.has(tag)) {
        take(el, 'text', el.innerHTML);
        return;                      // its inline children go with it
      }
      if (meaningful(text) && INLINE.has(tag) && children.length === 0) {
        /* a bare <span class="label">…</span> that is not inside a text
           element already taken -- rare, but real (the hero eyebrow) */
        const parentTaken = found.some(f => f.el === el.parentNode);
        if (!parentTaken) { take(el, 'text', el.innerHTML); return; }
      }
    }

    for (const c of children) walk(c);
  };

  for (const c of root.childNodes.filter(n => n.nodeType === 1)) walk(c);
  return found;
}
