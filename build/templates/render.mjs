/* A very small template engine, for the pages that are one-off layouts.

   The project pages are seven copies of one structure, so a hand-written
   template earns its keep there. Home and About are not: they are bespoke
   arrangements used once each. Hand-writing templates for them would mean
   re-typing hundreds of lines of approved markup and hoping it comes out the
   same.

   So instead the markup itself becomes the template. build/extract-page.mjs
   takes the page as it stands and swaps each editable VALUE for a token,
   leaving every tag, class and attribute untouched. Losslessness is then true
   by construction rather than by inspection: render the template with the
   values that came out of it and you get the original bytes back.

   Two forms, and deliberately no more:

     {{path.to.value}}            substitute a value
     {{#each list}}…{{/each}}     repeat for each item

   Inside a loop: {{field}} is the item's own field, {{@i}} its index from
   zero and {{@n}} from one (the testimonial cards' id="tq-body-3" and the
   aria-controls that points at it), {{@value}} the item itself when it is a
   plain string rather than an object, and {{@parent}} the index of the loop
   one level out. The enclosing scope is still visible, so an absolute path
   resolves inside a loop as well.

   Loops NEST. A testimonial is an item in a list whose own body is a list of
   paragraphs -- one card has three, the next has one -- and without nesting
   the cards could not be a list at all, which is what add and remove need.

   Values are inserted raw. They were captured from the markup already
   escaped, so escaping again would double it -- and the round-trip check
   would catch that immediately.                                           */

/* hyphens are allowed in a path: the practice keys are slugs
   ("practices.items.ecological-restoration.name") */
const OPEN = /\{\{#each ([\w.-]+)\}\}/g;
const EITHER = /\{\{#each [\w.-]+\}\}|\{\{\/each\}\}/g;
const TOKEN = /\{\{([@\w.-]+)\}\}/g;

const dig = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

/* The {{/each}} that closes the block whose body starts at `from`, counting
   the ones that open and close in between. A non-greedy regex would stop at
   the first {{/each}} and hand the inner loop's closing tag to the outer. */
function closeOf(tpl, from) {
  const step = new RegExp(EITHER.source, 'g');
  step.lastIndex = from;
  let depth = 1, m;
  while ((m = step.exec(tpl))) {
    depth += m[0] === '{{/each}}' ? -1 : 1;
    if (!depth) return { start: m.index, end: step.lastIndex };
  }
  return null;
}

function scopeFor(outer, item, i) {
  const own = item && typeof item === 'object' && !Array.isArray(item) ? item : { '@value': item };
  return { ...outer, ...own, '@i': i, '@n': i + 1, '@parent': outer['@i'] };
}

function expand(tpl, scope, missing) {
  const open = new RegExp(OPEN.source, 'g');
  let out = '', at = 0, m;
  while ((m = open.exec(tpl))) {
    const bodyAt = m.index + m[0].length;
    const close = closeOf(tpl, bodyAt);
    if (!close) break;                       // unbalanced; left alone and reported below
    out += tpl.slice(at, m.index);
    const list = dig(scope, m[1]);
    if (!Array.isArray(list)) {
      missing.push(m[1] + ' (not a list)');
      out += tpl.slice(m.index, close.end);
    } else {
      const body = tpl.slice(bodyAt, close.start);
      out += list.map((item, i) => expand(body, scopeFor(scope, item, i), missing)).join('');
    }
    at = close.end;
    open.lastIndex = close.end;
  }
  out += tpl.slice(at);

  return out.replace(TOKEN, (whole, path) => {
    const v = dig(scope, path);
    if (v === undefined || v === null) { missing.push(path); return whole; }
    return String(v);
  });
}

export function render(tpl, data) {
  const missing = [];
  const filled = expand(tpl, data, missing);
  if (missing.length) {
    throw new Error('template has values with nothing to fill them:\n  ' + [...new Set(missing)].join('\n  '));
  }
  return filled;
}
