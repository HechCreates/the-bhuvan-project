/* Turn a password into the hash the service stores.
 *
 *     cd site
 *     node service/hash-password.mjs
 *
 * It asks for the password twice, prints two lines to paste into Deno Deploy,
 * and forgets it.
 *
 * The plain password is never written to a file, never committed, and never
 * sent anywhere. What gets stored is PBKDF2-SHA256 over a random salt at
 * 210,000 iterations, which is what OWASP currently recommends for this
 * algorithm: someone who steals the stored value still has to guess the
 * password, and every guess costs them the work it cost to make.
 *
 * Input is read from the terminal directly rather than through readline.
 * readline with two prompts in a row hangs on Windows -- the second question
 * waits forever on input the first already swallowed -- and its masking trick
 * relies on overriding an underscore-prefixed internal. Reading the keys is
 * more code and behaves the same everywhere.
 */

import crypto from 'crypto';

const ITERATIONS = 210000;
const MIN_LENGTH = 12;

/* ---- a real terminal: read keys, echo nothing ---- */
function askTTY(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let typed = '';
    const onData = chunk => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.removeListener('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stdout.write('\n');
          resolve(typed);
          return;
        }
        if (ch === '') {               // Ctrl-C
          stdin.setRawMode(false);
          process.stdout.write('\n');
          process.exit(130);
        }
        if (ch === '' || ch === '\b') { typed = typed.slice(0, -1); continue; }
        if (ch >= ' ') typed += ch;          // ignore other control keys
      }
    };
    stdin.on('data', onData);
  });
}

/* ---- piped input: used by the tests, and by anyone scripting it ---- */
let pipedLines = null;
let pipedAt = 0;
async function askPiped(question) {
  if (pipedLines === null) {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    pipedLines = Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
    console.log('NOTE: input is not a terminal, so nothing was hidden as it was read.');
  }
  process.stdout.write(question + '\n');
  return pipedLines[pipedAt++] ?? '';
}

const ask = process.stdin.isTTY ? askTTY : askPiped;

const password = await ask('Password for the admin interface: ');
const again = await ask('Type it again: ');

if (password !== again) {
  console.error('\nThose did not match. Nothing was produced; run it again.');
  process.exit(1);
}
if (password.length < MIN_LENGTH) {
  console.error(`\nThat is ${password.length} characters. Use at least ${MIN_LENGTH} -- it is the only`);
  console.error("thing standing between the internet and the studio's website.");
  console.error('A phrase of four or five unrelated words works well.');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');

console.log('\nPaste this into Deno Deploy as the value of ADMIN_PASSWORD:\n');
console.log('  ' + `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`);
console.log('\nAnd this as the value of SESSION_SECRET:\n');
console.log('  ' + crypto.randomBytes(32).toString('base64'));
console.log('\nNeither is stored on this machine. Close the terminal when you are done.');
process.exit(0);
