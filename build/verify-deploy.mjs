import fs from 'fs';
import path from 'path';

const DIR = 'deploy';
const s = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
const refs = [...new Set([...s.matchAll(/src="(images\/[^"]+)"/g)].map(m => m[1]))];
const missing = refs.filter(r => !fs.existsSync(path.join(DIR, r)));

const onDisk = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else onDisk.push(path.relative(DIR, p).split(path.sep).join('/'));
  }
})(path.join(DIR, 'images'));
const unused = onDisk.filter(f => !refs.includes(f));

const bytes = onDisk.reduce((n, f) => n + fs.statSync(path.join(DIR, f)).size, 0)
            + fs.statSync(path.join(DIR, 'index.html')).size;

const line = (k, v) => console.log('  ' + k.padEnd(34) + v);
console.log('deploy/ bundle');
line('image references in index.html', refs.length);
line('resolved inside deploy/', refs.length - missing.length);
line('MISSING', missing.length ? '\n    ' + missing.join('\n    ') : 'none');
line('files present but unreferenced', unused.length ? unused.length + ' (' + unused.slice(0, 3).join(', ') + ')' : 'none');
line('files total', onDisk.length + 2);
line('total size', (bytes / 1048576).toFixed(1) + ' MB');
line('absolute internal links', (s.match(/<a[^>]*href="\/[^"]/g) || []).length);
line('root-relative asset paths', (s.match(/(?:src|href)="\/(?!\/)/g) || []).length);
line('routes registered', [...new Set([...s.matchAll(/data-page="([^"'+]+)"/g)].map(m => m[1]))].length);
process.exitCode = missing.length ? 1 : 0;
