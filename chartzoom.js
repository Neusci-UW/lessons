// Zoom arrows for the charts: a pair of small buttons beside each axis, which stretch or squeeze that axis.
// A chart's drawing code asks for its range through ChartZoom.x / ChartZoom.y, and the first ask puts the buttons
// on that canvas. The zoom keeps the middle of the range where it is, except on an axis that is pinned to one end
// (a chart starting at 0, or a time chart that scrolls with the newest point at the right): there the pinned end
// stays put and the other end moves.
//
//   [x0, x1] = ChartZoom.x(canvas, x0, x1, pin)   pin: 'left' | 'right' | 'mid'; by default 'left' when x0 is 0
//   [y0, y1] = ChartZoom.y(canvas, y0, y1, pin)   pin: 'bottom' | 'top' | 'mid'; by default 'bottom' when y0 is 0
//   step = ChartZoom.step(canvas, 'x' | 'y', step)  a tick step scaled to the zoom
//   ChartZoom.bind(canvas, redraw)                 what to call to redraw the chart after a click
(function () {
  const STEP = 1.5, IN = 6, OUT = 3;   // each click is 1.5×; at most 1.5⁶ ≈ 11× in and 1.5³ ≈ 3.4× out
  const states = new WeakMap();

  const style = document.createElement('style');
  style.textContent = `
.czoom{position:absolute;display:flex;gap:2px;z-index:2}
.czoom button{all:unset;box-sizing:border-box;width:22px;height:18px;display:flex;align-items:center;justify-content:center;
  font:11px/1 "IBM Plex Sans",sans-serif;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:5px;cursor:pointer}
.czoom button:hover{color:var(--ink);border-color:var(--muted)}
.czoom button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.czoom .rot{display:inline-block;transform:rotate(90deg)}`;
  document.head.appendChild(style);

  function state(cv) {
    let s = states.get(cv);
    if (s) return s;
    s = { x: 0, y: 0, redraw: null, ux: null, uy: null };
    states.set(cv, s);
    const par = cv.parentElement;
    if (!par) return s;
    if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
    const group = (ax, inner, outer, word) => {
      const d = document.createElement('div');
      d.className = 'czoom';
      d.innerHTML = `<button type="button" data-d="1" title="Zoom in on the ${word} axis" aria-label="Zoom in on the ${word} axis">${inner}</button>`
        + `<button type="button" data-d="-1" title="Zoom out on the ${word} axis" aria-label="Zoom out on the ${word} axis">${outer}</button>`;
      d.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        s[ax] = Math.max(-OUT, Math.min(IN, s[ax] + +b.dataset.d));
        if (s.redraw) s.redraw();
      }));
      par.appendChild(d);
      return d;
    };
    s.uy = group('y', '↕', '<span class="rot">⇥⇤</span>', 'vertical');
    s.ux = group('x', '↔', '⇥⇤', 'horizontal');
    // a chart drawn while its tab was hidden has no size yet: place its arrows again once it is shown
    if (window.ResizeObserver) new ResizeObserver(() => place(cv, s)).observe(cv);
    return s;
  }

  // the vertical axis's arrows sit in the chart's bottom-left corner, the horizontal axis's in the bottom-right
  function place(cv, s) {
    if (!s.ux || !cv.offsetWidth) return;
    const l = cv.offsetLeft, t = cv.offsetTop, w = cv.offsetWidth, h = cv.offsetHeight;
    s.uy.style.left = l + 3 + 'px'; s.uy.style.top = t + h - 21 + 'px';
    s.ux.style.left = l + w - 49 + 'px'; s.ux.style.top = t + h - 21 + 'px';
  }

  function range(cv, ax, lo, hi, pin) {
    const s = state(cv);
    place(cv, s);
    const f = Math.pow(STEP, s[ax]);
    if (s[ax] === 0) return [lo, hi];
    const span = (hi - lo) / f;
    if (pin == null) pin = lo === 0 ? 'lo' : 'mid';
    if (pin === 'left' || pin === 'bottom' || pin === 'lo') return [lo, lo + span];
    if (pin === 'right' || pin === 'top' || pin === 'hi') return [hi - span, hi];
    const m = (lo + hi) / 2;
    return [m - span / 2, m + span / 2];
  }

  function nice(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  window.ChartZoom = {
    x: (cv, lo, hi, pin) => range(cv, 'x', lo, hi, pin),
    y: (cv, lo, hi, pin) => range(cv, 'y', lo, hi, pin),
    step(cv, ax, step) { const n = state(cv)[ax]; return n ? nice(step / Math.pow(STEP, n)) : step; },
    bind(cv, redraw) { state(cv).redraw = redraw; },
  };
})();
