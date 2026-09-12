/**
 * The Bhu.Van Project - contact form backend.
 *
 * Receives the Get in Touch form and emails it to Nikhil. Paste this whole
 * file into a Google Apps Script project, deploy it as a web app, and put the
 * /exec URL into CONTACT_ENDPOINT in src/index.html. Setup steps are at the
 * bottom of this file.
 *
 * The site posts JSON as text/plain on purpose. A POST with an
 * application/json content type triggers a CORS preflight, and an Apps Script
 * web app cannot answer an OPTIONS request -- the form would fail in the
 * browser with nothing useful in the console. text/plain is a "simple
 * request", so no preflight is sent. Do not change it to application/json.
 */

/** Where the enquiries go. */
var TO = 'nikhiludupa4@gmail.com';

/** A site this quiet should never see a real burst; anything more is a flood. */
var MAX_PER_HOUR = 20;

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return reply(400, 'No body');

    var d;
    try { d = JSON.parse(e.postData.contents); }
    catch (err) { return reply(400, 'Body was not JSON'); }

    var name = String(d.name || '').trim();
    var email = String(d.email || '').trim();
    var message = String(d.message || '').trim();

    if (!name || !email || !message) return reply(400, 'Missing a required field');
    if (name.length > 120 || email.length > 200 || message.length > 5000)
      return reply(400, 'Too long');
    // deliberately loose: the point is to catch typos, not to police addresses
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) return reply(400, 'That email looks wrong');
    // a header injected into the Reply-To would let someone redirect replies
    if (/[\r\n]/.test(name) || /[\r\n]/.test(email)) return reply(400, 'Bad characters');

    if (overRate_()) return reply(429, 'Too many just now, please try again shortly');

    var page = String(d.page || '').trim().slice(0, 200);
    var sent = String(d.sent || '').trim().slice(0, 40);

    MailApp.sendEmail({
      to: TO,
      replyTo: email,                       // so a reply goes straight back to them
      subject: 'Website enquiry from ' + name,
      body: [
        'Name:    ' + name,
        'Email:   ' + email,
        'Page:    ' + (page || '(not recorded)'),
        'Sent:    ' + (sent || new Date().toISOString()),
        '',
        '--------------------------------------------------',
        message,
        '--------------------------------------------------',
        '',
        'Sent from the Get in Touch form on thebhuvanproject.'
      ].join('\n')
    });

    return reply(200, 'ok');
  } catch (err) {
    // the message still reaches the log even when the mail quota is spent
    console.error(err);
    return reply(500, 'Could not send');
  }
}

/** A GET is someone opening the URL in a browser; say so rather than erroring. */
function doGet() {
  return ContentService
    .createTextOutput('This endpoint accepts POST from the contact form.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function reply(status, msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: status, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** A blunt global cap. Apps Script cannot see the caller's IP, so this counts
 *  everything; it is a flood stop, not per-person throttling. */
function overRate_() {
  var cache = CacheService.getScriptCache();
  var key = 'cf-' + Math.floor(Date.now() / 3600000);   // one bucket an hour
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 3700);
  return n > MAX_PER_HOUR;
}

/* ---------------------------------------------------------------------------
 * SETUP, once
 *
 * 1. Go to https://script.google.com while signed in as the account that
 *    should SEND the mail. It will send as that account, so sign in as
 *    nikhiludupa4@gmail.com unless you want the mail coming from elsewhere.
 *
 * 2. New project. Delete whatever is in Code.gs and paste this whole file in.
 *    Rename the project something like "Bhu.Van contact form".
 *
 * 3. Deploy -> New deployment -> gear icon -> Web app.
 *      Description:   contact form
 *      Execute as:    Me
 *      Who has access: Anyone            <- must be "Anyone", not "Anyone with
 *                                           a Google account", or visitors who
 *                                           are not signed in get a 401.
 *    Deploy. Authorise when asked; the "unverified app" warning is expected
 *    for your own script -- Advanced -> Go to (project name).
 *
 * 4. Copy the Web app URL. It ends in /exec, not /dev.
 *
 * 5. In site/src/index.html find:
 *        var CONTACT_ENDPOINT = '';
 *    and put the URL between the quotes. Then `npm run build`, commit, push.
 *
 * 6. Send yourself a test through the live form.
 *
 * CHANGING IT LATER
 *   Editing the code is not enough. Deploy -> Manage deployments -> pencil ->
 *   Version: New version -> Deploy. The /exec URL stays the same.
 *
 * WORTH KNOWING
 *   - The /exec URL sits in the page source, so it is public. That is normal
 *     for this pattern and it holds no secret, but it does mean a bot can post
 *     to it. MAX_PER_HOUR above is the flood stop. If spam starts arriving,
 *     the next step is a honeypot field in the form -- ask and I will add it.
 *   - A free Gmail account can send about 100 mails a day this way. Far more
 *     than this form will ever need, but that is the ceiling.
 *   - If mail ever stops arriving, check the Executions tab in the Apps Script
 *     editor. Failures are logged there with the reason.
 * ------------------------------------------------------------------------- */
