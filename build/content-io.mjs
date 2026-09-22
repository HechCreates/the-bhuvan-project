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

/* Which file a data-edit path belongs to. The editor sends paths that are
   already scoped by page, e.g. "home:hero.statement" or
   "projects/mysuru-rail-museum:body.0". */
export function fileFor(scope) {
  if (scope.startsWith('projects/')) return `content/${scope}.yml`;
  if (['home', 'about', 'journey'].includes(scope)) return `content/${scope}.yml`;
  throw new Error(`not an editable scope: ${scope}`);
}
