// Trail screens are portrait; encounters are landscape. On a phone held the
// "wrong" way we show a gentle, dismissable prompt (brief §8) — never a block.
let el = null;
let wanted = 'portrait';
let dismissed = { portrait: false, landscape: false };

function isPhone() {
  return matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 600;
}

function update() {
  if (!el) return;
  const isPortrait = innerHeight > innerWidth;
  const wrong = wanted === 'landscape' ? isPortrait : !isPortrait;
  el.style.display = isPhone() && wrong && !dismissed[wanted] ? 'flex' : 'none';
  el.querySelector('.msg').textContent =
    wanted === 'landscape' ? 'Turn your phone sideways for this part.' : 'Turn your phone upright for the trail.';
}

export function initOrientation() {
  el = document.getElementById('rotate');
  el.querySelector('button').addEventListener('click', () => {
    dismissed[wanted] = true;
    update();
  });
  addEventListener('resize', update);
  addEventListener('orientationchange', update);
}

export function wantOrientation(o) {
  wanted = o;
  update();
}
