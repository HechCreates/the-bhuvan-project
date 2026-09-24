/* Reading and writing content files without losing their comments.

   Every file in content/ opens with a block of comments explaining what it is
   and which rules are derived rather than stored. js-yaml throws all of that
   away on dump, so saving from the admin interface would quietly strip the
   explanation from the file it just edited -- and the next person to open it
   would have no idea what an empty caption means.

   The comments in these files are all at the top, because the extractors put
   them there. So the header is kept verbatim and the body is re-dumped. Any
   file with comments BETWEEN its values would lose them, which is why
   writeYaml refuses to touch one: content/site.yml is annotated throughout
   and is not editable this way.

   `set` walks a dotted path -- "categories.0.photos.7.caption" -- the same
   path the data-edit attributes carry, so a value from the page maps onto a
   value in a file with nothing in between to get wrong.                    */

import fs from 'fs';
import { load, dump } from 'js-yaml';

/* the leading run of comment and blank lines */
const splitHeader = text => {
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && (lines[i].startsWith('#') || lines[i].trim() === '')) i++;
  return { header: lines.slice(0, i).join('\n'), body: lines.slice(i).join('\n') };
};

export function readYaml(file) {
  const text = fs.readFileSync(file, 'utf8');
  const { header, body } = splitHeader(text);
  return { header, data: load(body) ?? {}, text };
}

export function writeYaml(file, data) {
  const { header, body } = splitHeader(fs.readFileSync(file, 'utf8'));
  if (/^\s*#/m.test(body)) {
    throw new Error(`${file} has comments among its values; writing it would lose them`);
  }
  const out = (header ? header.replace(/\s*$/, '') + '\n\n' : '')
    + dump(data, { lineWidth: 100, noRefs: true });
  fs.writeFileSync(file, out);
  return out;
}

/* set a value at a dotted path; refuses to create a path that is not there,
   because a typo in a path would otherwise write a new field nothing reads */
export function set(data, path, value) {
  const keys = path.split('.');
  let o = data;
  for (const k of keys.slice(0, -1)) {
    if (o == null || !(k in o)) throw new Error(`no such path: ${path} (stopped at "${k}")`);
    o = o[k];
  }
  const last = keys[keys.length - 1];
  if (o == null || !(last in o)) throw new Error(`no such path: ${path} (no "${last}")`);
  o[last] = value;
  return data;
}

export function get(data, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), data);
}

/* Adding to and removing from a list.
 *
 * The path names the ITEM pressed -- "faq.items.3" -- so the list is its
 * prefix and the position its last segment, exactly as the data-item
 * attribute on the page reads.
 *
 * An insert copies the item it was pressed on and puts the copy after it.
 * Copying rather than inventing a blank item matters: a testimonial carries
 * the width, height and --sil-* framing measured from its own silhouette,
 * and a project card carries a photograph. A blank one would render a hole
 * or fail to render at all. `values` then overwrites the fields the editor
 * knows about, which is how a copy made after an unsaved edit still shows
 * what the screen showed.
 *
 * A list cannot be emptied from here. Removing the last item would leave a
 * section with nothing in it and no way to add the first one back. */
export function splice(data, path, op, values) {
  const keys = path.split('.');
  const at = Number(keys[keys.length - 1]);
  const listPath = keys.slice(0, -1).join('.');
  const list = get(data, listPath);

  if (!Array.isArray(list)) throw new Error(`not a list: ${listPath}`);
  if (!Number.isInteger(at) || at < 0 || at >= list.length) {
    throw new Error(`no item ${keys[keys.length - 1]} in ${listPath} (${list.length} items)`);
  }

  if (op === 'remove') {
    if (list.length <= 1) throw new Error(`${listPath} has one item left; removing it would empty the section`);
    list.splice(at, 1);
    return data;
  }

  const copy = structuredClone(list[at]);
  for (const [field, value] of Object.entries(values || {})) set(copy, field, value);
  list.splice(at + 1, 0, copy);
  return data;
}

/* One change from the editor, whatever kind it is. */
export function apply(data, c) {
  if (c.op === 'insert' || c.op === 'remove') return splice(data, c.path, c.op, c.values);
  return set(data, c.path, c.value);
}

/* Which file a data-edit path belongs to. The editor sends paths that are
   already scoped by page, e.g. "home:hero.statement" or
   "projects/mysuru-rail-museum:body.0".
 *
 * Every page generated from a template belongs here. Four of them were
 * missing -- faq, contact, projects and testimonials -- so those pages could
 * be edited on screen and then refused at the moment of saving, which is the
 * worst place to find out. content/site.yml is still absent on purpose: it
 * carries comments among its values and writeYaml would drop them. */
const PAGES = ['home', 'about', 'journey', 'faq', 'contact', 'projects', 'testimonials'];

export function fileFor(scope) {
  if (/^projects\/[a-z0-9-]+$/.test(scope)) return `content/${scope}.yml`;
  if (PAGES.includes(scope)) return `content/${scope}.yml`;
  throw new Error(`not an editable scope: ${scope}`);
}
