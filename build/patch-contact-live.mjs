/* Wire the contact form to its Apps Script deployment, and stop trusting
   the HTTP status.

   Apps Script's ContentService cannot set a response code -- every reply comes
   back 200, including the ones that refused the message. Verified against the
   live deployment: an empty form and a malformed address both returned
   HTTP 200 with {"status":400,...} in the body. The client checked r.ok, so a
   refused message would have shown the visitor a confirmation. The real status
   is in the body, so that is what gets read.                               */

import fs from 'fs';

const FILE = 'src/index.html';
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzSYdjCt0Ss7WW5ACNIa8_INITgMezIAzzKqklaD3knFOtbJqo5JgBfK96iMfskpbRo/exec';

let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const swap = (name, find, replace, expect = 1) => {
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

swap('1 endpoint', `  var CONTACT_ENDPOINT = '';`, `  var CONTACT_ENDPOINT = '${ENDPOINT}';`);

swap('2 read the status out of the body, not the response code',
  `      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(){ ok(); })`,
  `      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(text){
        /* Apps Script always answers 200, even when it refused the message,
           so the status that matters is the one in the body. */
        var res = null;
        try { res = JSON.parse(text); } catch (e) {}
        if(!res || res.status !== 200) throw new Error((res && res.message) || 'Not accepted');
        ok();
      })`);

swap('3 tell the visitor what was wrong when the server says',
  `        if(fe){ fe.textContent = 'That did not send. Please try again, or email nikhiludupa4@gmail.com directly.';
                fe.hidden = false; }`,
  `        if(fe){ fe.textContent = (err && err.message && err.message !== 'Not accepted')
                  ? (err.message + '. Please try again, or email nikhiludupa4@gmail.com directly.')
                  : 'That did not send. Please try again, or email nikhiludupa4@gmail.com directly.';
                fe.hidden = false; }`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
