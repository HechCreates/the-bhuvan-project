(() => {
  const R = e => e.getBoundingClientRect(), S = getComputedStyle;
  const st = document.querySelector('.hero-statement'), le = document.querySelector('.hero-lede');
  const hdr = document.querySelector('#page-home .site-header');
  const H = innerHeight, W = innerWidth, drawnH = Math.max(H, W / 1.4995);
  const y = f => 0.72 * H - drawnH * (0.72 - f);
  const tree = y(0.503), water = y(0.576);
  return JSON.stringify({
    vp: W + 'x' + H,
    statementTop: Math.round(R(st).top),
    clearsHeader: R(st).top > R(hdr).bottom,
    headerGap: Math.round(R(st).top - R(hdr).bottom),
    ledeBottom: Math.round(R(le).bottom),
    treeline: Math.round(tree), water: Math.round(water),
    onWater: R(le).bottom > tree && R(le).bottom < water,
    stFs: S(st).fontSize, keyFs: S(document.querySelector('.hero-key')).fontSize,
    overflowX: [...document.querySelector('[data-page].is-active').querySelectorAll('*')]
      .filter(e => { const c = S(e); return c.display !== 'none' && c.position !== 'fixed' && R(e).right > W + 1; }).length,
  });
})()
