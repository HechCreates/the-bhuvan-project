/* Contact modal, built to "Contact Us.svg".

   The SVG is a 649x898 artboard; every number below is measured off it with
   sharp (build/measure-contact.mjs, build/measure-contact2.mjs) and then scaled
   to a 640px panel (k = 640/649 = 0.9861):

     ground          #372807  = var(--primary)
     field fill      #DDDEFE @ 20%  -> rgba(221,222,254,.2)
     submit          #B46F3A  = var(--clay)
     text            white; the footnote alone is #C3BFB5, which is the
                     off-white at 76%
     side padding    46u -> 45px          field radius   22u -> 22px
     field height    59u -> 58px          field gap      61u -> 60px
     textarea        164u -> 162px        submit         319x62u, r17u
     title           26.8u -> 26.5px      lede           18.9u -> 18.6px
     placeholder     19.0u -> 18.7px      footnote       14.7u -> 14.5px

   Type sizes come from matching the artboard's rendered string widths against
   Manrope rather than from guessing at cap ratios.

   Two departures, both noted back to the client:
     - the lede runs at 1.4 leading; the artboard measures 1.33, which is tight
       for four lines of prose
     - the artboard has no close control, so a quiet one is added top-right;
       Escape and a backdrop click also close
*/

const LEDE = 'We’d love to hear from you, whether you’re planning a project, '
  + 'exploring collaboration or simply curious about our work. Write to us, and '
  + 'let’s begin a conversation grounded in ecology, design and shared purpose.';

export const HTML = `
<div class="cf-overlay" data-contact-modal hidden>
  <div class="cf-backdrop" data-contact-close></div>
  <div class="cf-panel" role="dialog" aria-modal="true" aria-labelledby="cf-title" tabindex="-1">
    <button class="cf-close" type="button" data-contact-close aria-label="Close contact form">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6 L18 18 M18 6 L6 18"
        stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>

    <div class="cf-main" data-contact-main>
      <h2 class="cf-title" id="cf-title">Contact Us</h2>
      <p class="cf-lede">${LEDE}</p>
      <form class="cf-form" data-contact-form novalidate>
        <div class="cf-field">
          <label class="cf-vh" for="cf-name">Name</label>
          <input class="cf-input" id="cf-name" name="name" type="text" placeholder="Name"
                 autocomplete="name" required maxlength="120" aria-describedby="cf-name-err">
          <p class="cf-err" id="cf-name-err" hidden></p>
        </div>
        <div class="cf-field">
          <label class="cf-vh" for="cf-email">Email</label>
          <input class="cf-input" id="cf-email" name="email" type="email" placeholder="Email"
                 autocomplete="email" required maxlength="180" aria-describedby="cf-email-err">
          <p class="cf-err" id="cf-email-err" hidden></p>
        </div>
        <div class="cf-field">
          <label class="cf-vh" for="cf-message">Message</label>
          <textarea class="cf-input cf-textarea" id="cf-message" name="message" placeholder="Message"
                    required maxlength="4000" aria-describedby="cf-message-err"></textarea>
          <p class="cf-err" id="cf-message-err" hidden></p>
        </div>
        <button class="cf-send" type="submit" data-contact-send>Send Message</button>
        <p class="cf-note">Sent directly to Nikhil, usually replies within a few days.</p>
        <p class="cf-formerr" role="alert" hidden></p>
      </form>
    </div>

    <div class="cf-done" data-contact-done hidden>
      <span class="cf-tick" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" stroke="currentColor"
          stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <h2 class="cf-title">Thank you</h2>
      <p class="cf-lede">Your message is on its way to Nikhil. You can expect a reply within a few days.</p>
      <button class="cf-send" type="button" data-contact-close>Close</button>
    </div>
  </div>
</div>`;

export const CSS = `
/* ---------- Contact modal ----------
   The panel is drawn in multiples of the artboard's own unit, so the
   reference's proportions survive at every size: 649u wide, 46u side padding,
   59u fields, 61u gaps, a 319x62u submit, 26.83u title, 18.9u lede, straight
   off the SVG. Two units do the scaling:

     --u   elements and type. Ceiling .88px, deliberately under the artboard's
           nominal 1px so the form reads as a modal rather than a full-height
           sheet, and so it clears a 900px viewport with room to spare.
     --ug  the vertical gaps only. Identical to --u whenever the design fits;
           on a short viewport it keeps shrinking after --u has hit its floor,
           so the rhythm tightens instead of the type going unreadable.

   The artboard's 898u of height splits into 502u of content (type and
   controls) and 400u of gap, which is what the --ug formula solves against.
   Small text and tap targets carry px floors via max(); they only bind below
   roughly a 720px viewport. */
.cf-overlay,.cf-overlay *{box-sizing:border-box}
.cf-overlay[hidden]{display:none}
.cf-overlay{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;
  padding:24px clamp(1rem,4vw,2rem)}
.cf-backdrop{position:absolute;inset:0;background:rgba(20,14,3,.72);
  backdrop-filter:blur(3px);opacity:0;transition:opacity .3s ease}
.cf-overlay.is-open .cf-backdrop{opacity:1}

.cf-panel{--u:clamp(.72px,min((100vh - 48px)/908,94vw/649),.88px);
  --u:clamp(.72px,min((100svh - 48px)/908,94vw/649),.88px);
  --ug:clamp(.38px,min(var(--u),(100vh - 48px - var(--u)*508)/400),.88px);
  --ug:clamp(.38px,min(var(--u),(100svh - 48px - var(--u)*508)/400),.88px);
  position:relative;width:min(calc(var(--u)*649),100%);max-height:100%;overflow-y:auto;
  background:var(--primary);color:#F3EFE6;font-family:var(--fb);
  padding:calc(var(--ug)*76) calc(var(--u)*46) calc(var(--ug)*58);
  box-shadow:0 40px 90px -30px rgba(0,0,0,.7);
  opacity:0;transform:translateY(14px);transition:opacity .32s ease,transform .32s cubic-bezier(.22,1,.36,1)}
.cf-overlay.is-open .cf-panel{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){
  .cf-panel,.cf-backdrop{transition:none}
  .cf-panel{transform:none}
}

/* the artboard has no close control; this is the added one. Held at a real
   44px target while its inset follows the scale. */
.cf-close{position:absolute;top:max(6px,calc(var(--ug)*12));right:max(6px,calc(var(--u)*12));
  width:44px;height:44px;display:flex;align-items:center;justify-content:center;
  padding:0;border:0;background:none;
  color:rgba(243,239,230,.62);cursor:pointer;transition:color .25s ease}
.cf-close svg{width:max(15px,calc(var(--u)*22));height:max(15px,calc(var(--u)*22))}
.cf-close:hover{color:#F3EFE6}

.cf-title{margin:0;font-family:var(--fb);font-weight:800;
  font-size:max(18px,calc(var(--u)*26.83));line-height:1.15;
  letter-spacing:-.01em;color:#F3EFE6}
.cf-lede{margin:calc(var(--ug)*23.3) 0 0;font-size:max(13px,calc(var(--u)*18.9));
  line-height:1.4;color:#F3EFE6;max-width:none}
.cf-form{margin:calc(var(--ug)*42.6) 0 0}

.cf-field{position:relative}
.cf-field + .cf-field{margin-top:calc(var(--ug)*61)}
.cf-input{display:block;width:100%;height:max(44px,calc(var(--u)*59));
  padding:0 calc(var(--u)*20.3);
  background:rgba(221,222,254,.2);border:0;border-radius:calc(var(--u)*22);
  font-family:var(--fb);font-size:max(14px,calc(var(--u)*19));font-weight:400;line-height:1.4;
  color:#F3EFE6;transition:box-shadow .2s ease,background .2s ease}
.cf-input::placeholder{color:#F3EFE6;opacity:1}
/* Where the 44px tap-target floor lifts the single-line fields above their
   proportional height, the textarea follows so the artboard's 164:59 ratio
   between them survives. Only binds on phones. */
.cf-textarea{height:max(calc(max(44px,var(--u)*59)*2.78),calc(var(--u)*164));
  padding:calc(var(--u)*18.3) calc(var(--u)*20.3);resize:vertical}
.cf-input[aria-invalid="true"]{box-shadow:inset 0 0 0 2px #E39A66}
/* after the invalid rule so a focused invalid field still shows the ring.
   The inset hairline separates the clay ring from the field fill, which is
   only 1.7:1 against it; clay against the panel is 3.6:1. */
.cf-input:focus{outline:none;background:rgba(221,222,254,.26);
  box-shadow:inset 0 0 0 1px rgba(243,239,230,.85),0 0 0 2px var(--clay)}
/* Errors sit in the gap below their field rather than in the flow, so a
   failed submit never makes the panel taller than the viewport it was just
   fitted to. The tightest gap the scale allows is 23px on desktop and 16px on
   a phone; the message needs 20px and 15.5px. */
.cf-err{position:absolute;top:100%;left:calc(var(--u)*20.3);right:0;
  margin:max(3px,calc(var(--ug)*6)) 0 0;
  font-size:max(11.5px,calc(var(--u)*14));line-height:1.3;color:#E39A66}
.cf-err[hidden]{display:none}

.cf-send{display:block;width:calc(var(--u)*319);max-width:100%;
  height:max(44px,calc(var(--u)*62));margin:calc(var(--ug)*57.8) auto 0;
  padding:0 1.25rem;border:0;border-radius:calc(var(--u)*17);background:var(--clay);color:#FFF;
  font-family:var(--fb);font-size:max(14px,calc(var(--u)*19.2));font-weight:700;letter-spacing:0;
  cursor:pointer;transition:background .25s ease,transform .25s ease}
.cf-send:hover{background:#C57F45;transform:translateY(-1px)}
.cf-send:disabled{opacity:.6;cursor:default;transform:none}
.cf-send:focus-visible,.cf-close:focus-visible{outline:2px solid var(--clay);outline-offset:3px}
.cf-note{margin:calc(var(--ug)*20.3) 0 0;text-align:center;
  font-size:max(11px,calc(var(--u)*14.7));line-height:1.4;color:rgba(243,239,230,.76)}
.cf-formerr{margin:calc(var(--ug)*14) 0 0;text-align:center;
  font-size:max(11.5px,calc(var(--u)*14));color:#E39A66}
.cf-formerr[hidden]{display:none}

.cf-done[hidden]{display:none}
.cf-done{text-align:center}
.cf-tick{display:inline-flex;align-items:center;justify-content:center;
  width:calc(var(--u)*62);height:calc(var(--u)*62);
  margin-bottom:calc(var(--ug)*28);border-radius:50%;background:rgba(180,112,58,.22);color:var(--clay)}
.cf-tick svg{width:calc(var(--u)*31);height:calc(var(--u)*31)}
.cf-done .cf-lede{margin-top:calc(var(--ug)*20)}
.cf-done .cf-send{margin-top:calc(var(--ug)*46)}

/* visually hidden labels: the artboard names the fields with placeholders
   alone, which vanish on typing and are skipped by some assistive tech */
.cf-vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* Phones: width is the binding constraint, not height, and scaling the type
   off a 375px width would land it at 11px. The scale is re-based on the
   viewport width, type carries higher floors, and the submit goes full width.
   16px on the inputs is the threshold below which iOS zooms on focus. */
@media (max-width:620px){
  .cf-overlay{padding:14px 12px}
  .cf-panel{--u:clamp(.5px,min((100svh - 28px)/908,92vw/649),.72px);
    /* on a phone the px floors, not --u, set the content height, so the gap
       solver works against a measured ~450px of content over 390u of gap */
    --ug:clamp(.26px,min(var(--u),(100svh - 28px - 450px)/390),.72px);
    padding:calc(var(--ug)*70) calc(var(--u)*46) calc(var(--ug)*54)}
  .cf-title{font-size:max(20px,calc(var(--u)*30))}
  .cf-lede{font-size:max(14.5px,calc(var(--u)*21))}
  .cf-input{font-size:max(16px,calc(var(--u)*21));border-radius:calc(var(--u)*26);
    padding-inline:calc(var(--u)*24)}
  .cf-textarea{padding-inline:calc(var(--u)*24)}
  .cf-send{width:100%;font-size:max(16px,calc(var(--u)*21));border-radius:calc(var(--u)*20)}
  .cf-note{font-size:max(11px,calc(var(--u)*16))}
  /* On a phone the gap is too shallow to hold a message that wraps, and
     there is headroom below the panel, so errors go back into the flow. */
  .cf-err{position:static;margin:max(4px,calc(var(--ug)*8)) 0 0 calc(var(--u)*24)}
}`;

/* The endpoint is intentionally empty: the Apps Script deployment does not
   exist yet. Pasting the /exec URL between the quotes is the whole wiring job.
   text/plain keeps it a "simple" request, so the browser sends no preflight,
   which Apps Script web apps cannot answer. */
export const JS = `
  /* ---- contact modal --------------------------------------------------- */
  /* PASTE THE GOOGLE APPS SCRIPT WEB APP /exec URL HERE TO GO LIVE.
     While it is empty the form validates and shows its confirmation, but
     nothing is sent anywhere. */
  var CONTACT_ENDPOINT = '';

  var cfLastFocus = null;
  function cfEls(){
    return { overlay: document.querySelector('[data-contact-modal]'),
             panel: document.querySelector('.cf-panel'),
             form: document.querySelector('[data-contact-form]'),
             main: document.querySelector('[data-contact-main]'),
             done: document.querySelector('[data-contact-done]') };
  }
  function cfOpen(){
    var e = cfEls(); if(!e.overlay) return;
    cfLastFocus = document.activeElement;
    cfReset();
    e.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function(){ e.overlay.classList.add('is-open'); });
    var first = e.form && e.form.querySelector('.cf-input');
    if(first) setTimeout(function(){ first.focus(); }, 60);
  }
  function cfClose(){
    var e = cfEls(); if(!e.overlay || e.overlay.hidden) return;
    e.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function(){ e.overlay.hidden = true; }, 260);
    if(cfLastFocus && cfLastFocus.focus) cfLastFocus.focus();
  }
  function cfReset(){
    var e = cfEls(); if(!e.form) return;
    e.form.reset();
    e.main.hidden = false; e.done.hidden = true;
    e.form.querySelectorAll('.cf-input').forEach(function(i){ i.removeAttribute('aria-invalid'); });
    e.form.querySelectorAll('.cf-err').forEach(function(p){ p.hidden = true; p.textContent = ''; });
    var fe = e.form.querySelector('.cf-formerr'); if(fe){ fe.hidden = true; fe.textContent = ''; }
    var b = e.form.querySelector('[data-contact-send]');
    if(b){ b.disabled = false; b.textContent = 'Send Message'; }
  }
  function cfFail(input, msg){
    input.setAttribute('aria-invalid','true');
    var p = document.getElementById(input.id + '-err');
    if(p){ p.textContent = msg; p.hidden = false; }
  }
  function cfClear(input){
    input.removeAttribute('aria-invalid');
    var p = document.getElementById(input.id + '-err');
    if(p){ p.hidden = true; p.textContent = ''; }
  }
  function cfValidate(form){
    var bad = null;
    var name = form.querySelector('#cf-name'),
        mail = form.querySelector('#cf-email'),
        msg  = form.querySelector('#cf-message');
    [name, mail, msg].forEach(cfClear);
    if(!name.value.trim()){ cfFail(name,'Please tell us your name.'); bad = bad || name; }
    var v = mail.value.trim();
    if(!v){ cfFail(mail,'Please add an email address so Nikhil can reply.'); bad = bad || mail; }
    else if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v)){ cfFail(mail,'That email address does not look right.'); bad = bad || mail; }
    if(!msg.value.trim()){ cfFail(msg,'Please write a short message.'); bad = bad || msg; }
    return bad;
  }

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    if(e.target.closest('[data-open-contact]')){ e.preventDefault(); cfOpen(); return; }
    if(e.target.closest('[data-contact-close]')){ e.preventDefault(); cfClose(); }
  });
  document.addEventListener('keydown', function(e){
    var o = document.querySelector('[data-contact-modal]');
    if(!o || o.hidden) return;
    if(e.key === 'Escape'){ e.preventDefault(); cfClose(); return; }
    if(e.key !== 'Tab') return;
    var f = o.querySelectorAll('button:not([disabled]),input,textarea,a[href]');
    var vis = []; for(var i=0;i<f.length;i++){ if(f[i].offsetParent !== null) vis.push(f[i]); }
    if(!vis.length) return;
    var first = vis[0], last = vis[vis.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });

  document.addEventListener('submit', function(e){
    var form = e.target.closest && e.target.closest('[data-contact-form]');
    if(!form) return;
    e.preventDefault();
    var bad = cfValidate(form);
    if(bad){ bad.focus(); return; }
    var btn = form.querySelector('[data-contact-send]');
    var fe = form.querySelector('.cf-formerr');
    var payload = { name: form.querySelector('#cf-name').value.trim(),
                    email: form.querySelector('#cf-email').value.trim(),
                    message: form.querySelector('#cf-message').value.trim(),
                    page: location.hash || '#/', sent: new Date().toISOString() };
    function ok(){ var el = cfEls(); el.main.hidden = true; el.done.hidden = false; el.panel.scrollTop = 0;
                   var c = el.done.querySelector('.cf-send'); if(c) c.focus(); }
    if(!CONTACT_ENDPOINT){
      console.warn('[contact] CONTACT_ENDPOINT is empty, so this message was NOT sent. ' +
                   'Paste the Apps Script /exec URL into CONTACT_ENDPOINT to go live.', payload);
      ok(); return;
    }
    btn.disabled = true; btn.textContent = 'Sending\\u2026';
    if(fe){ fe.hidden = true; }
    fetch(CONTACT_ENDPOINT, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
                              body: JSON.stringify(payload) })
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(){ ok(); })
      .catch(function(err){
        console.error('[contact]', err);
        btn.disabled = false; btn.textContent = 'Send Message';
        if(fe){ fe.textContent = 'That did not send. Please try again, or email nikhiludupa4@gmail.com directly.';
                fe.hidden = false; }
      });
  });
`;
