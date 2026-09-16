/* Two new pages: /faq/ and /contact/.

   WHY AN FAQ. Nothing on this site is phrased as a question, so nothing can
   win a featured snippet, a People Also Ask box or an AI answer -- those are
   all extraction problems, and there is nothing shaped to be extracted. Ten
   questions, each answered in 40-60 words directly under the question, is the
   format those systems actually lift from.

   Every answer here is built from copy already on the site -- the practice
   descriptions on the homepage, the philosophy and geography paragraphs on
   About, Nikhil's bio, and the line about what Bhuvan means. Nothing is
   invented, because an FAQ is the page most likely to be read back as fact by
   a machine, and a studio cannot correct an AI that learned something wrong.
   It still wants Nikhil's eye before launch: it is his voice, not mine.

   WHY A CONTACT PAGE. The old Squarespace site has /contact and this one had
   only a pop-up, so there was no URL to rank for "contact the bhu.van
   project" and nowhere for a local search to land. The pop-up is untouched
   and still the way to send a message everywhere else on the site; this is an
   additional landing page, and the clean 301 target for the old URL.

   Neither page joins the main navigation -- that would make the approved
   five-item header a six- or seven-item one. They are linked from the footer
   and listed in the sitemap, which is enough for both people and crawlers. */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const crlf = t => t.replace(/\r?\n/g, '\r\n');

/* the build swaps these markers for the chrome rendered from content/site.yml,
   exactly as it does for the twelve pages that already exist */
const HEADER = '<header class="site-header" data-header></header>';
const FOOTER = '<footer class="footer"></footer>';

const FAQ = [
  ['What does &ldquo;Bhu.Van&rdquo; mean?',
   'The name is rooted in the Sanskrit word <em>Bhuvan</em>, meaning the world &mdash; the realm between sky and earth. The studio takes its scope from that idea: designing with land, water and the living systems between them, rather than treating a site as a surface to be decorated.'],

  ['What is ecological restoration?',
   'Ecological restoration is the practice of assisting the recovery of a degraded ecosystem &mdash; rebuilding its hydrology, biodiversity and soil health until it can sustain itself again. At The Bhu.Van Project it means weaving restoration science together with design, on degraded landscapes across South India.'],

  ['What does The Bhu.Van Project do?',
   'The Bhu.Van Project is an ecological restoration and landscape architecture studio based in Bengaluru. It works on habitat restoration, watershed management, regenerative farm landscapes and context-responsive architecture, helping places regain strength through thoughtful planning and field-based experience.'],

  ['Where is the studio based, and where does it work?',
   'The studio is based in Bengaluru, Karnataka, and works across India. Projects have run from the high-altitude valleys of Ladakh to the tea gardens of the Nilgiris, and from the remote forests of Arunachal Pradesh to the urban landscapes of Ahmedabad.'],

  ['Who founded The Bhu.Van Project?',
   'Nikhil Udupa, a landscape architect and ecological restoration practitioner with over fourteen years of experience in research-based spatial planning and sustainable design. His expertise covers nature-based solutions, watershed and natural resource management, wildlife habitat design, master planning and disaster-resilient regional planning.'],

  ['What services does the studio offer?',
   'Five practices: ecological restoration, landscape architecture, resilient watershed management and land master planning, sustainable architecture, and academic engagement. Most projects draw on several at once, because a degraded landscape rarely has only one thing wrong with it.'],

  ['What is the difference between landscape architecture and ecological restoration?',
   'Landscape architecture designs how a place is used and experienced &mdash; biodiverse, barrier-free and regenerative spaces rooted in local material, water and culture. Ecological restoration repairs how a place <em>functions</em>, rebuilding hydrology, soil and habitat. The studio treats them as one continuous practice rather than two services.'],

  ['What kinds of sites does the studio work on?',
   'Fragile ecosystems and protected areas, productive estates and farms, institutional campuses, community commons and urban developments. Scales run from a few acres to entire watersheds &mdash; from a 60-acre farm landscape in Rayalaseema to 1,500 acres of forest in the Bandipur Tiger Reserve buffer.'],

  ['How does the studio approach a project?',
   'Every site is treated as a living system with its own memory and potential. The approach is guided by rootedness, resilience and renewal, integrating scientific research, local knowledge and participatory processes to arrive at design that is specific to the place rather than applied to it.'],

  ['How do I start a project with The Bhu.Van Project?',
   'Use the Get in Touch form anywhere on this site, or write to <a class="faq-mail" href="mailto:nikhiludupa4@gmail.com">nikhiludupa4@gmail.com</a>. It helps to include where the site is, roughly how large it is, and what you have noticed going wrong with it &mdash; erosion, water loss, invasive species, or simply land that no longer holds life.'],
];

const faqPage = `
<div data-page="faq" class="project-page faq-page">
${HEADER}
  <section class="proj-intro">
    <div class="wrap">
      <a class="proj-back" href="#/"><span aria-hidden="true">&larr;</span> <span>Home</span></a>
      <h1 class="proj-title">Questions, answered</h1>
      <div class="proj-copy">
        <p>What the studio does, how it works, and what the words mean &mdash; for anyone deciding whether their land is the kind of place we can help.</p>
      </div>
    </div>
  </section>
  <section class="faq-list" aria-label="Frequently asked questions">
    <div class="wrap">
${FAQ.map(([q, a]) => `      <article class="faq-item">
        <h2 class="faq-q">${q}</h2>
        <p class="faq-a">${a}</p>
      </article>`).join('\n')}
      <p class="faq-foot">Still unsure whether a site is a candidate? <button type="button" class="faq-cta" data-open-contact>Get in touch</button> and describe it.</p>
    </div>
  </section>
${FOOTER}
</div>
`;

const contactPage = `
<div data-page="contact" class="project-page contact-page">
${HEADER}
  <section class="proj-intro">
    <div class="wrap">
      <a class="proj-back" href="#/"><span aria-hidden="true">&larr;</span> <span>Home</span></a>
      <h1 class="proj-title">Get in touch</h1>
      <div class="proj-meta">
        <dl class="proj-facts">
          <div class="proj-fact"><dt>Studio</dt><dd>Bengaluru, Karnataka, India</dd></div>
          <div class="proj-fact"><dt>Email</dt><dd><a class="faq-mail" href="mailto:nikhiludupa4@gmail.com">nikhiludupa4@gmail.com</a></dd></div>
          <div class="proj-fact"><dt>Working across</dt><dd>India</dd></div>
        </dl>
      </div>
      <div class="proj-copy">
        <p>The Bhu.Van Project works with landowners, farms and estates, institutions, trusts and public bodies on landscapes that need repairing as much as designing. Projects have ranged from a single terrace garden to fifteen hundred acres of forest.</p>
        <p>Tell us where the site is, roughly how large it is, and what you have noticed going wrong with it &mdash; erosion, water that no longer stays, invasive species, or land that has simply stopped holding life. That is enough to start a conversation.</p>
      </div>
      <p class="contact-actions">
        <button type="button" class="cta" data-open-contact>Send a message</button>
        <a class="faq-mail contact-alt" href="mailto:nikhiludupa4@gmail.com">or email directly</a>
      </p>
    </div>
  </section>
${FOOTER}
</div>
`;

/* ---- insert both, after the last existing page and before the script ---- */
{
  const anchor = s.lastIndexOf('<script>');
  if (anchor < 0) { log.push('FAIL  no <script> to insert before'); failed++; }
  else {
    s = s.slice(0, anchor) + crlf(faqPage + contactPage) + s.slice(anchor);
    log.push('ok    /faq/ and /contact/ page markup inserted');
  }
}

/* ---- the only new CSS, for the two new pages ----------------------------
   Everything else reuses .proj-intro, .proj-title, .proj-copy and .proj-facts,
   which are generic .project-page components, so the new pages inherit the
   approved type scale and spacing rather than inventing a second one. */
const CSS = `
/* ---------- FAQ and Contact ----------
   Answers are always visible, never behind an accordion: a featured snippet
   and an AI answer are both extraction problems, and hidden text is a weaker
   candidate for both. The measure is held near 68 characters, which is where
   a long answer stays readable. */
.faq-list{background:var(--bg);padding-block:clamp(2rem,4vw,3.5rem) clamp(4rem,9vw,7rem)}
.faq-item{max-width:68ch;padding-block:clamp(1.6rem,3vw,2.2rem);border-top:1px solid rgba(55,40,7,.16)}
.faq-item:first-child{border-top:0;padding-top:0}
.faq-page .faq-q{font-family:var(--fd);font-weight:700;color:var(--primary);
  font-size:clamp(1.15rem,1.9vw,1.45rem);line-height:1.2;margin:0 0 .7rem}
.faq-page .faq-a{font-family:var(--fb);font-size:1.0625rem;line-height:1.68;
  color:var(--secondary);margin:0}
.faq-page .faq-a em{font-style:italic}
.faq-mail{color:var(--clay);text-decoration:underline;text-underline-offset:3px;
  text-decoration-color:rgba(180,112,58,.5);transition:color .25s ease}
.faq-mail:hover{color:var(--primary)}
.faq-foot{max-width:68ch;margin:clamp(2.2rem,4vw,3rem) 0 0;padding-top:clamp(1.6rem,3vw,2.2rem);
  border-top:1px solid rgba(55,40,7,.16);font-family:var(--fb);font-size:1.0625rem;
  line-height:1.68;color:var(--secondary)}
.faq-cta{font:inherit;color:var(--clay);background:none;border:0;padding:0;cursor:pointer;
  text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(180,112,58,.5)}
.faq-cta:hover{color:var(--primary)}
.faq-cta:focus-visible{outline:2px solid var(--clay);outline-offset:3px}
.contact-actions{display:flex;flex-wrap:wrap;align-items:center;gap:1.25rem;margin:clamp(2rem,4vw,2.75rem) 0 0}
.contact-page .contact-alt{font-family:var(--fb);font-size:.9375rem}
`;
{
  const i = s.lastIndexOf('</style>');
  if (i < 0) { log.push('FAIL  no </style>'); failed++; }
  else { s = s.slice(0, i) + crlf(CSS) + s.slice(i); log.push('ok    FAQ and Contact rules appended'); }
}

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
