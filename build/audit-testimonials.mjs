/* Audit run inside the page via javascript_exec. */
export const ROUTES = [['home','#/'],['about','#/about'],['projects','#/projects'],
  ['testimonials','#/testimonials'],['bandipur','#/projects/bandipur-tiger-reserve'],
  ['chairmans','#/projects/chairmans-bungalow']];

export const AUDIT = `(async () => {
  const go = h => new Promise(r => {
    if (location.hash === h) { setTimeout(r, 150); return; }
    const on = () => { window.removeEventListener('hashchange', on); setTimeout(r, 200); };
    window.addEventListener('hashchange', on); location.hash = h;
  });
  const S = getComputedStyle;
  const out = [];
  for (const [name, hash] of __ROUTES__) {
    await go(hash);
    const page = document.querySelector('[data-page].is-active');
    if (!page) { out.push({ route: name, ERROR: 'no active page' }); continue; }
    const scope = [...page.querySelectorAll('*'), ...document.querySelectorAll('.site-header *')];
    const overflow = scope.filter(e => {
      const cs = S(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') return false;
      return e.getBoundingClientRect().right > innerWidth + 1;
    }).map(e => e.tagName + '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : ''));
    const tap = scope.filter(e => {
      if (!e.matches('a[href],button')) return false;
      const cs = S(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0 && (b.width < 44 || b.height < 44);
    }).map(e => (typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName) +
        ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
    const tiny = scope.filter(e => {
      const cs = S(e); if (cs.display === 'none') return false;
      if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false;
      return parseFloat(cs.fontSize) < 11;
    }).map(e => (typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName) + ' ' + S(e).fontSize);
    let drawer = null;
    const toggle = document.querySelector('[data-page].is-active [data-menu-toggle]');
    if (toggle && S(toggle).display !== 'none') {
      const d = toggle.closest('.site-header').querySelector('[data-mobile-nav]');
      toggle.click();
      const b = d.getBoundingClientRect();
      drawer = { opens: d.hasAttribute('data-open'), pct: +(b.height / innerHeight * 100).toFixed(0),
                 bg: S(d).backgroundColor, links: d.querySelectorAll('.mobile-link').length };
      toggle.click();
    }
    let cards = null;
    if (name === 'testimonials') {
      const cs = [...page.querySelectorAll('.tq-card')];
      cards = cs.map(c => {
        const p = c.querySelector('.tq-lede');
        const lines = Math.round(p.clientHeight / parseFloat(S(p).lineHeight));
        const full = c.querySelector('.tq-full');
        return { lines, hasMore: c.classList.contains('has-more'), full: !!full,
                 name: !!c.querySelector('.tq-name').textContent.trim(),
                 role: !!c.querySelector('.tq-role').textContent.trim(),
                 w: Math.round(c.getBoundingClientRect().width) };
      });
    }
    out.push({ route: name, scrollW: document.documentElement.scrollWidth,
      overflow: [...new Set(overflow)].slice(0, 4), overflowCount: overflow.length,
      tapUnder44: [...new Set(tap)].slice(0, 4), tapCount: tap.length,
      tiny: [...new Set(tiny)].slice(0, 3), tinyCount: tiny.length, drawer, cards });
  }
  await go('#/testimonials');
  return JSON.stringify({ viewport: innerWidth + 'x' + innerHeight, results: out });
})()`;
