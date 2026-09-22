/* Turn a password into the hash the service stores.
 *
 *     node service/hash-password.mjs
 *
 * It asks for the password, prints one line, and forgets it. Paste that line
 * into Deno Deploy as ADMIN_PASSWORD.
 *
 * The plain password is never written to a file, never committed, and never
 * sent anywhere. What gets stored is PBKDF2-SHA256 over a random salt at
 * 210,000 iterations, which is what OWASP currently recommends for this
 * algorithm: someone who steals the stored value still has to guess the
 * password, and each guess costs them the same work it cost to make.
 *
 * The typed password is hidden as you type. If your terminal cannot hide it,
 * the script says so rather than echoing it.
 */

import crypto from 'crypto';
import readline from 'readline';

const ITERATIONS = 210000;

const askHidden = question => new Promise(resolve => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const canHide = Boolean(process.stdin.isTTY);
  if (!canHide) {
    console.log('NOTE: this terminal cannot hide what you type, so the password will be visible.');
  }
  rl.question(question, answer => { rl.close(); if (canHide) process.stdout.write('\n'); resolve(answer); });
  if (canHide) {
    rl._writeToOutput = function (s) {
      if (s.includes(question)) rl.output.write(question);
      // otherwise write nothing: the characters are swallowed
    };
  }
});

const password = await askHidden('Password for the admin interface: ');
const again = await askHidden('Type it again: ');

if (password !== again) {
  console.error('\nThose did not match. Nothing was produced; run it again.');
  process.exit(1);
}
if (password.length < 12) {
  console.error(`\nThat is ${password.length} characters. Use at least 12 -- this is the only`);
  console.error('thing standing between the internet and the studio\'s website.');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const stored = `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;

console.log('\nPaste this into Deno Deploy as the value of ADMIN_PASSWORD:\n');
console.log('  ' + stored);
console.log('\nAnd while you are there, SESSION_SECRET can be this:\n');
console.log('  ' + crypto.randomBytes(32).toString('base64'));
console.log('\nNeither of these is stored on this machine. Close the terminal when done.');
