/* Responsive audit run inside the page. Paste-free: served to the browser via
   javascript_exec. Checks every route at every breakpoint for overflow,
   tap-target size, text that is too small, and the mobile drawer. */
export const AUDIT = `(async () => {
  const go = h => new Promise(r => {
    if (location.hash === h) { setTimeout(r, 120); return; }
    const on = () => { window.removeEventListener('hashchange', on); setTimeout(r, 160); };
    window.addEventListener('hashchange', on); location.hash = h;
  });
  const S = getComputedStyle;
  const ROUTES = __ROUTES__;
  const out = [];
  for (const [name, hash] of ROUTES) {
    await go(hash);
    const page = document.querySelector('[data-page].is-active');
    if (!page) { out.push({ route: name, ERROR: 'no active page' }); continue; }
    const scope = [...page.querySelectorAll('*'), ...document.querySelectorAll('.site-header *')];

    const overflow = scope.filter(e => {
      const cs = S(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return false;
      return e.getBoundingClientRect().right > innerWidth + 1;
    }).map(e => (e.tagName + '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : '')));

    const tap = scope.filter(e => {
      if (!e.matches('a[href],button')) return false;
      const cs = S(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && (b.width < 44 || b.height < 44);
    }).map(e => (typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName) + ' ' +
                Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));

    const tiny = scope.filter(e => {
      const cs = S(e); if (cs.display === 'none') return false;
      if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false;
      return parseFloat(cs.fontSize) < 11;
    }).map(e => (typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName) + ' ' + S(e).fontSize);

    // mobile drawer
    let drawer = null;
    const toggle = page.querySelector('[data-menu-toggle]') || document.querySelector('.site-header [data-menu-toggle]');
    if (toggle && S(toggle).display !== 'none') {
      const d = toggle.closest('.site-header').querySelector('[data-mobile-nav]');
      toggle.click();
      const b = d.getBoundingClientRect();
      drawer = { opens: d.hasAttribute('data-open'), pctOfViewport: +(b.height / innerHeight * 100).toFixed(0),
                 bg: S(d).backgroundColor, links: d.querySelectorAll('.mobile-link').length };
      toggle.click();
    }

    out.push({ route: name, docScrollW: document.documentElement.scrollWidth,
      overflow: [...new Set(overflow)].slice(0, 4), overflowCount: overflow.length,
      tapUnder44: [...new Set(tap)].slice(0, 4), tapCount: tap.length,
      tinyText: [...new Set(tiny)].slice(0, 3), tinyCount: tiny.length, drawer });
  }
  await go('#/');
  return JSON.stringify({ viewport: innerWidth + 'x' + innerHeight, results: out }, null, 1);
})()`;
