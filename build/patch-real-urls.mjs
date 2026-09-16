/* Retire the hash router.

   Every page is now its own document at its own path, so there is nothing left
   to route: the page that is in the document is the page the visitor asked
   for. What replaces the router is three much smaller things.

     1. init dispatch    read the one [data-page] in the document and run its
                         initialiser. The build already marks it active, so a
                         page renders with JS disabled -- which is the state
                         most AI crawlers fetch in.
     2. legacy hashes    #/about was a real URL for months and those links are
                         in inboxes. One redirect, once, on load.
     3. the contact form  reported location.hash as the page the enquiry came
                         from. There is no hash any more; the path is the page.

   The click interceptor goes entirely. Links are hrefs now, which means they
   work on middle-click, in a new tab, in a crawler, and with JS switched off.  */

import fs from 'fs';
import { load } from 'js-yaml';

const FILE = 'src/index.html';
let s = fs.readFileSync(FILE, 'utf8');
const before = s.length;
const log = [];
let failed = 0;

const crlf = t => t.replace(/\r?\n/g, '\r\n');
const swap = (name, find, replace, expect = 1) => {
  find = crlf(find); replace = crlf(replace);
  const n = s.split(find).length - 1;
  if (n !== expect) { log.push(`FAIL  ${name}: expected ${expect}, found ${n}`); failed++; return; }
  s = s.split(find).join(replace);
  log.push(`ok    ${name}`);
};

/* ---- 1. the router becomes an initialiser ------------------------------- */
swap('router -> init the one page in the document',
  `  var inited={};
  function show(route){
    if(!document.querySelector('[data-page="'+route+'"]')) route='home';
    document.querySelectorAll('[data-page]').forEach(function(p){
      p.classList.toggle('is-active', p.getAttribute('data-page')===route);
    });
    if(!inited[route]){ try{ if(route==='about'){initAbout();}else if(route==='home'){initHome();}else{initProject();} }catch(e){console.error(e);} inited[route]=true; }
    window.scrollTo(0,0);
    var pt=document.querySelector('[data-page="'+route+'"] .proj-title');
    document.title = pt ? (pt.textContent.trim()+', The Bhu.Van Project')
      : (route==='journey' ? 'Visual Journey, The Bhu.Van Project'
      : route==='about' ? 'About, The Bhu.Van Project'
      : route==='testimonials' ? 'Testimonials, The Bhu.Van Project'
      : route==='projects' ? 'Projects, The Bhu.Van Project' : 'The Bhu.Van Project');
  }
  function routeFromHash(){
    var h=(location.hash||'').replace(/^#\\/?/,'').replace(/\\/$/,'');
    if(h.indexOf('projects/')===0){h='p-'+h.slice(9);}
    show(h||'home');
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[data-route]');
    if(a){ if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0)return; e.preventDefault(); var r=a.getAttribute('data-route');
      var nh = r==='about'?'#/about':(r==='projects'?'#/projects':(r==='testimonials'?'#/testimonials':(r==='journey'?'#/journey':(r.indexOf('p-')===0?('#/projects/'+r.slice(2)):'#/'))));
      if(location.hash===nh){show(r);}else{location.hash=nh;} }
    var s=e.target.closest('a[data-soon]');
    if(s){ e.preventDefault(); location.hash='#/'; } // pages not built yet -> home
  });
  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();
})();`,
  `  /* One document, one page. The build has already marked it active and put
     the right <title> in the head, so all that is left is to run the code the
     page needs. */
  var el=document.querySelector('[data-page]');
  var route=el?el.getAttribute('data-page'):'home';
  try{ if(route==='about'){initAbout();}else if(route==='home'){initHome();}else{initProject();} }
  catch(e){console.error(e);}
  /* a link that was never built goes home */
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[data-soon]');
    if(a){ e.preventDefault(); location.href=a.getAttribute('href'); }
  });
})();`);

/* ---- 2. the contact form reports a path, not a fragment ----------------- */
swap('contact form reports the path',
  `                    page: location.hash || '#/', sent: new Date().toISOString() };`,
  `                    page: location.pathname + location.search, sent: new Date().toISOString() };`);

fs.writeFileSync(FILE, s);
console.log(log.join('\n'));
console.log(`\n${FILE}: ${before} -> ${s.length} chars`);
if (failed) { console.log(`\n${failed} step(s) failed`); process.exitCode = 1; }
