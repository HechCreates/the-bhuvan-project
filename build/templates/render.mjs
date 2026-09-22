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
     {{#each list}}…{{/each}}     repeat for each item; inside, {{field}} is
                                  the item's own field and {{@i}} its index

   Values are inserted raw. They were captured from the markup already
   escaped, so escaping again would double it -- and the round-trip check
   would catch that immediately.                                           */

/* hyphens are allowed in a path: the practice keys are slugs
   ("practices.items.ecological-restoration.name") */
const EACH = /\{\{#each ([\w.-]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
const TOKEN = /\{\{([@\w.-]+)\}\}/g;

const dig = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

const fill = (tpl, scope, missing) => tpl.replace(TOKEN, (m, path) => {
  const v = dig(scope, path);
  if (v === undefined || v === null) { missing.push(path); return m; }
  return String(v);
});

export function render(tpl, data) {
  const missing = [];

  const out = tpl.replace(EACH, (m, listPath, itemTpl) => {
    const list = dig(data, listPath);
    if (!Array.isArray(list)) { missing.push(listPath + ' (not a list)'); return m; }
    return list.map((item, i) => fill(itemTpl, { ...item, '@i': i }, missing)).join('');
  });

  const filled = fill(out, data, missing);

  if (missing.length) {
    throw new Error('template has values with nothing to fill them:\n  ' + [...new Set(missing)].join('\n  '));
  }
  return filled;
}
