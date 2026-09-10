/* About page: shorter hero, the quote moved to Where we work, and The Team. */

import fs from 'fs';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;
const swap = (name, find, rep, exp = 1) => {
  const n = s.split(find).length - 1;
  if (n !== exp) { log.push(`FAIL  ${name}: expected ${exp}, found ${n}`); failed++; return; }
  s = s.split(find).join(rep); log.push('ok    ' + name);
};
const addCss = (name, css) => {
  const i = s.indexOf('</style>');
  s = s.slice(0, i) + css + '\n' + s.slice(i);
  log.push('ok    ' + name);
};

/* ---- 1. the modal styling already exists; widen it to the About page ------
   Thirteen rules, all written for #page-home. Duplicating them would leave two
   copies to keep in step, so each selector simply gains its About twin. */
{
  const style = s.slice(s.indexOf('<style>'), s.indexOf('</style>'));
  const rules = []; let d = 0, b = '';
  for (const ch of style) { b += ch; if (ch === '{') d++; else if (ch === '}') { d--; if (!d) { rules.push(b); b = ''; } } }
  let n = 0, out = style;
  for (const r of rules) {
    const head = r.slice(0, r.indexOf('{'));
    const sel = head.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim();
    if (!/^#page-home .*\.modal/.test(sel)) continue;
    const twin = sel + ',' + sel.replace('#page-home', '#page-about');
    out = out.replace(r, twin + r.slice(r.indexOf('{')));
    n++;
  }
  if (n !== 13) { log.push(`FAIL  1 modal selectors: widened ${n}, expected 13`); failed++; }
  else { s = s.replace(style, out); log.push(`ok    1 widened ${n} modal rules to the About page`); }
}

/* ---- 2. hero loses the quote and some height ----------------------------- */
swap('2a quote out of the hero',
  `    <blockquote class="quote"><span class="mark">&ldquo;</span>When we heal the land, we heal ourselves<span class="mark">&rdquo;</span></blockquote>
    <p class="quote-attr">&mdash; Sir David Attenborough</p>\n`, '');

swap('2b hero height comes down',
  `#page-about .about-hero{position:relative;background:var(--soil);color:var(--light);padding-top:clamp(9rem,16vh,12rem);padding-bottom:clamp(4rem,9vw,7rem);overflow:hidden}`,
  `#page-about .about-hero{position:relative;background:var(--soil);color:var(--light);padding-top:clamp(7rem,11vh,8.5rem);padding-bottom:clamp(2.25rem,4vw,3.25rem);overflow:hidden}`);

/* ---- 3. the quote opens Where we work ------------------------------------ */
swap('3 quote moves to the top of Where we work',
  `<section class="section geo" data-reveal>
  <div class="wrap">
    <div class="sec-head">`,
  `<section class="section geo" data-reveal>
  <div class="wrap">
    <figure class="geo-quote">
      <blockquote class="quote"><span class="mark">&ldquo;</span>When we heal the land, we heal ourselves<span class="mark">&rdquo;</span></blockquote>
      <figcaption class="quote-attr">&mdash; Sir David Attenborough</figcaption>
    </figure>
    <div class="sec-head">`);

/* ---- 4. The Team --------------------------------------------------------- */
const LEADS = [
  { slug: 'nikhil-udupa', name: 'Nikhil Udupa', role: 'Co-founder',
    alt: 'Nikhil Udupa, co-founder of The Bhu.Van Project.',
    teaser: 'A landscape architect and ecological restoration practitioner with 13+ years in '
      + 'research-based spatial planning. His work spans landscapes across India, joining '
      + 'ecological thinking to cultural sensitivity.',
    link: { href: 'https://era-india.org/community/nikhil-udupa/', label: 'Read the full profile' },
    full: [
      'A Landscape Architect and ecological restoration practitioner with 13+ years of experience in research-based spatial planning and sustainable design. His work spans a wide range of landscapes across India, integrating ecological thinking with cultural sensitivity to design resilient and inclusive spaces.',
      'His core expertise includes nature-based solutions, watershed and natural resource management, ecological restoration, wildlife habitat design, spatial design, master planning and disaster-resilient regional planning. He has collaborated with communities, government bodies, institutions, NGOs, and interdisciplinary teams to implement regenerative, context-sensitive design strategies.',
      'As a visiting faculty at leading institutions, Nikhil actively contributes to academic discourse and knowledge sharing. His passion for nature, community engagement, and hands-on implementation drives his commitment to preserving ecological and cultural heritage through landscape architecture. Outside of work, he is a naturalist and avid traveller, with interests in birding, photography, trekking, yoga, boxing and collecting minerals and fossils.',
    ] },
  { slug: 'shilpa-shirish', name: 'Shilpa Shirish', role: 'Co-founder',
    alt: 'Shilpa Shirish, co-founder of The Bhu.Van Project.',
    teaser: 'An architect and educator working on climate change and its impacts on ecosystems, '
      + 'settlements and the built environment, from climate-resilient settlements to inclusive '
      + 'spatial planning.',
    link: { href: 'https://share.google/7ZnQBpAaHcInWMPJz', label: 'Profile at IIHS' },
    full: [
      'An architect and educator currently working on questions around climate change, with a particular interest in understanding its impacts on different ecosystems and on settlements, communities, and the built environment. Her areas of interest include climate-resilient settlements, migration and climate change, informal settlements, urban adaptation, and inclusive spatial planning.',
      'With a background in sustainable architecture, she is also interested in vernacular architecture, heritage documentation, building materials, and energy-efficient design. Her work brings together an interest in climate-responsive design, local building practices, and the ways in which people and places adapt to changing environmental conditions.',
    ] },
];
const MEMBERS = [
  { slug: 'harshita-nathan', name: 'Harshita Nathan', role: 'Intern' },
  { slug: 'aparna-pradeep', name: 'Aparna Pradeep', role: 'Research Consultant' },
  { slug: 'harsha-bhat', name: 'Harsha Bhat', role: 'Web Design &amp; Development Consultant' },
];

const leadCard = p => `      <article class="lead">
        <div class="lead-row">
          <div class="lead-id">
            <button class="lead-media" type="button" data-open-member="${p.slug}"
                    aria-label="Read more about ${p.name}">
              <img src="images/team/${p.slug}.webp" width="640" height="640" loading="lazy" alt="${p.alt}">
            </button>
            <p class="lead-name">${p.name}</p>
            <p class="lead-role">${p.role}</p>
          </div>
          <div class="lead-copy">
            <p>${p.teaser}</p>
            <button class="lead-more" type="button" data-open-member="${p.slug}">Read more <span aria-hidden="true">&rarr;</span></button>
          </div>
        </div>
      </article>`;

const memberCard = p => `      <article class="member">
        <img src="images/team/${p.slug}.webp" width="460" height="460" loading="lazy" alt="${p.name}, ${p.role.replace(/&amp;/g, 'and')}.">
        <p class="member-name">${p.name}</p>
        <p class="member-role">${p.role}</p>
      </article>`;

const teamSection = `<section class="section team on-dark">
  <div class="wrap">
    <div class="sec-head">
      <h2 class="sec-title">The team<span class="sec-kicker">.</span></h2>
    </div>
    <div class="team-leads" data-reveal>
${LEADS.map(leadCard).join('\n')}
    </div>
    <div class="team-members" data-reveal>
${MEMBERS.map(memberCard).join('\n')}
    </div>
  </div>
</section>`;

/* the old founder section, start to end */
{
  const a = s.indexOf('<section class="section founder on-dark">');
  if (a < 0) { log.push('FAIL  4a founder section not found'); failed++; }
  else {
    const end = s.indexOf('</section>', s.indexOf('</div>\n  </div>', a)) + '</section>'.length;
    s = s.slice(0, a) + teamSection + s.slice(end);
    log.push('ok    4a founder section -> The Team');
  }
}

/* ---- 5. one modal per co-founder, inside #page-about --------------------- */
{
  const modals = LEADS.map(p => `
<div class="modal" data-member-modal="${p.slug}" hidden>
  <div class="modal-backdrop" data-close-modal></div>
  <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="mm-${p.slug}">
    <button class="modal-close" data-close-modal aria-label="Close">&times;</button>
    <div class="modal-media"><img src="images/team/${p.slug}-full.webp" alt="${p.alt}"></div>
    <div class="modal-body">
      <span class="modal-eyebrow">${p.role}</span>
      <h3 id="mm-${p.slug}" class="modal-title">${p.name}</h3>
${p.full.map(t => `      <p class="modal-para">${t}</p>`).join('\n')}
      <a class="founder-link" href="${p.link.href}" target="_blank" rel="noopener">${p.link.label} <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</div>`).join('\n');

  // the About page closes just before the projects index page begins
  const marker = '\n<div data-page="projects"';
  if (!s.includes(marker)) { log.push('FAIL  5 could not find the end of the About page'); failed++; }
  else {
    const at = s.indexOf(marker);
    const closeAt = s.lastIndexOf('</div>', at);          // #page-about's own closing tag
    s = s.slice(0, closeAt) + modals + '\n' + s.slice(closeAt);
    log.push(`ok    5 added ${LEADS.length} co-founder modals inside #page-about`);
  }
}

/* ---- 6. open them from any page ------------------------------------------
   The existing modal wiring lives inside initHome(), so a visitor landing
   straight on #/about would have had no handler at all. This one is delegated
   and page-agnostic, and closing is handled here too so it works the same. */
{
  const anchor = `  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeDrawers(); });`;
  const js = `
  /* ---- team member modals, delegated so they work on any route ---- */
  var memberLast=null;
  document.addEventListener('click',function(e){
    if(!e.target.closest) return;
    var open=e.target.closest('[data-open-member]');
    if(open){
      var m=document.querySelector('[data-member-modal="'+open.getAttribute('data-open-member')+'"]');
      if(!m) return;
      memberLast=document.activeElement; m.hidden=false; document.body.style.overflow='hidden';
      var c=m.querySelector('.modal-close'); if(c) c.focus();
      return;
    }
    var close=e.target.closest('[data-close-modal]');
    if(close){
      var mm=close.closest('.modal'); if(!mm) return;
      mm.hidden=true; document.body.style.overflow='';
      if(memberLast&&memberLast.focus) memberLast.focus();
    }
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Escape') return;
    var o=document.querySelector('.modal:not([hidden])');
    if(o){ o.hidden=true; document.body.style.overflow=''; if(memberLast&&memberLast.focus) memberLast.focus(); }
  });
`;
  if (!s.includes(anchor)) { log.push('FAIL  6 anchor for the member-modal script not found'); failed++; }
  else { s = s.replace(anchor, anchor + '\n' + js); log.push('ok    6 delegated member-modal handler'); }
}

/* ---- 7. styling ---------------------------------------------------------- */
addCss('7 team section styling', `
/* ---------- About: the quote now opens Where we work ---------- */
#page-about .geo-quote{margin:0 0 clamp(2.5rem,5vw,4rem);padding-bottom:clamp(1.6rem,3vw,2.4rem);
  border-bottom:1px solid rgba(55,40,7,.16)}
#page-about .geo-quote .quote{color:var(--primary)}
#page-about .geo-quote .quote-attr{color:rgba(55,40,7,.6)}

/* ---------- About: The Team ----------
   Each co-founder is a photo square and a copy block of the same dimensions
   side by side, with the name directly under the photo. The square comes from
   aspect-ratio, so the two columns stay equal at every width. */
#page-about .team{background:var(--secondary);color:var(--light)}
#page-about .team .sec-head{border-color:rgba(243,239,230,.22)}
#page-about .team .sec-title{color:var(--light)}

#page-about .team-leads{display:grid;grid-template-columns:1fr 1fr;
  gap:clamp(2rem,4vw,3.5rem) clamp(2rem,5vw,4.5rem)}
#page-about .lead{margin:0}
#page-about .lead-row{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,2vw,1.6rem);
  align-items:start}
#page-about .lead-media{display:block;width:100%;aspect-ratio:1;padding:0;border:0;
  background:none;cursor:pointer;overflow:hidden;border-radius:var(--radius)}
#page-about .lead-media img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .5s cubic-bezier(.22,1,.36,1)}
#page-about .lead-media:hover img{transform:scale(1.04)}
#page-about .lead-media:focus-visible{outline:2px solid var(--light);outline-offset:3px}
#page-about .lead-name{font-family:var(--fd);font-weight:700;font-size:1.25rem;
  margin:.85rem 0 .15rem;color:var(--light)}
#page-about .lead-role{font-family:var(--fb);font-weight:600;font-size:.68rem;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(243,239,230,.75);margin:0}
/* the copy block matches the photo square exactly */
#page-about .lead-copy{aspect-ratio:1;display:flex;flex-direction:column;justify-content:space-between;
  background:rgba(243,239,230,.07);border-radius:var(--radius);padding:clamp(1rem,1.8vw,1.5rem)}
#page-about .lead-copy p{margin:0;font-size:clamp(.9rem,1.05vw,1rem);line-height:1.6;
  color:rgba(243,239,230,.92);max-width:none}
#page-about .lead-more{align-self:flex-start;background:none;border:0;padding:0;cursor:pointer;
  font-family:var(--fb);font-weight:700;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--light);border-bottom:1px solid rgba(243,239,230,.45);transition:color .25s,border-color .25s}
#page-about .lead-more:hover{color:#fff;border-color:#fff}

/* the three collaborators: image, name, role, nothing more */
#page-about .team-members{display:grid;grid-template-columns:repeat(3,minmax(0,190px));
  gap:clamp(1.2rem,2.5vw,2rem);margin-top:clamp(2.5rem,5vw,4rem);
  padding-top:clamp(2rem,4vw,3rem);border-top:1px solid rgba(243,239,230,.22)}
#page-about .member{margin:0}
#page-about .member img{width:100%;aspect-ratio:1;object-fit:cover;display:block;
  border-radius:var(--radius)}
#page-about .member-name{font-family:var(--fd);font-weight:700;font-size:1.02rem;
  margin:.7rem 0 .12rem;color:var(--light)}
#page-about .member-role{font-family:var(--fb);font-weight:600;font-size:.64rem;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(243,239,230,.7);margin:0;line-height:1.35}

@media (max-width:900px){
  #page-about .team-leads{grid-template-columns:1fr}
}
@media (max-width:620px){
  #page-about .lead-row{grid-template-columns:1fr;gap:1rem}
  #page-about .lead-copy{aspect-ratio:auto;gap:1rem}
  #page-about .team-members{grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem}
  #page-about .member-name{font-size:.9rem}
  #page-about .member-role{font-size:.58rem}
}`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
const body = s.slice(s.indexOf('</style>') + 8);
let d = 0; for (const m of body.matchAll(/<div\b[^>]*>|<\/div>/g)) d += m[0] === '</div>' ? -1 : 1;
console.log(`\ndiv balance: ${d}${d === 0 ? ' (balanced)' : ' (BROKEN)'}`);
if (d !== 0) failed++;
console.log(`${FILE}: ${before} -> ${s.length} chars`);
if (failed) process.exitCode = 1;
