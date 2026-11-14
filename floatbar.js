/* A floating bar of a lesson's main controls, which stays in the corner while the page scrolls.

The bar holds copies of controls that are already on the page, each naming its original with data-copy:
  <div class="floatbar" role="group" aria-label="Simulation">
    <button type="button" data-copy="reset" class="primary"></button>
    <label for="speedFloat" class="runlab">Speed</label>
    <input type="range" id="speedFloat" data-copy="speed"><output for="speedFloat"></output>
  </div>
A copied button clicks its original and shows the same label and on/off state (aria-pressed or aria-checked,
and the colour in its --on property). A copied slider moves its original and follows it back, readout and all.
data-copy can name several originals, separated by spaces, to work two simulations at once: the bar shows the
first, and the others are brought into the same state (on or off, playing or paused) or the same slider position.
A page can point a button at different originals later by changing its data-copy (list every original it may
stand for in data-copy-also, so they are watched and hidden from the start).
The originals are hidden (with their labels and readouts), so each control appears once, in the bar; they stay
in the page, so the page's own code needs nothing new. A page loads it with <script src="floatbar.js"></script>
after its own scripts. */
(() => {
  const css = document.createElement('style');
  css.textContent = `
    .floatbar{position:fixed;right:20px;bottom:20px;z-index:50;display:flex;align-items:center;gap:8px 10px;padding:8px 12px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.22);font-size:13px}
    .floatbar input[type=range]{width:130px}
    .floatbar output{font-family:var(--font-mono);font-size:12.5px;min-width:86px;font-variant-numeric:tabular-nums}
    .floatbar button[aria-pressed=true]{background:var(--on,var(--accent));border-color:var(--on,var(--accent));color:var(--surface)}
    @media print{.floatbar{display:none}}
    [hidden]{display:none !important}   /* the hidden originals, even where a page's own CSS sets display */`;
  document.head.appendChild(css);

  // hide an original, its label and readout, and a control row left with nothing else in it
  function hideOriginal(src) {
    const parts = [src, document.querySelector(`label[for="${src.id}"]`), document.querySelector(`output[for="${src.id}"]`) || document.getElementById(src.id + 'o')];
    parts.forEach(p => { if (p && !p.closest('.floatbar')) p.hidden = true; });
    for (let wrap = src.parentElement; wrap && (wrap.classList.contains('ctl') || wrap.classList.contains('runbar')); wrap = wrap.parentElement)
      if ([...wrap.children].every(c => c.hidden)) wrap.hidden = true;
  }
  const watch = (node, f) => new MutationObserver(f).observe(node, { attributes: true, childList: true, characterData: true, subtree: true });
  // on or off, playing or paused: what a button shows
  const stateOf = b => b.getAttribute('aria-pressed') ?? b.getAttribute('aria-checked') ?? b.textContent.trim();
  document.querySelectorAll('.floatbar [data-copy]').forEach(el => {
    const all = el.dataset.copy.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean);
    const src = all[0];
    if (!src) return;
    if (el.matches('input[type=range]')) {
      const out = document.querySelector(`output[for="${el.id}"]`);
      const srcOut = document.querySelector(`output[for="${src.id}"]`) || document.getElementById(src.id + 'o');
      const pull = () => {
        el.min = src.min; el.max = src.max; el.step = src.step; el.value = src.value;
        if (out && srcOut) out.textContent = srcOut.textContent;
      };
      el.addEventListener('input', () => {
        all.forEach(s => { s.value = el.value; s.dispatchEvent(new Event('input', { bubbles: true })); });
        pull();
      });
      src.addEventListener('input', pull);
      if (srcOut) watch(srcOut, pull);
      pull();
    } else {
      const sources = () => el.dataset.copy.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean);
      const pull = () => {
        const src = sources()[0]; if (!src) return;
        const lab = src.querySelector('[id$="Lab"]');   // a button with a separate label span shows just that
        el.textContent = (lab ? lab.textContent : src.getAttribute('aria-label') || src.textContent).trim();
        const state = src.getAttribute('aria-pressed') ?? src.getAttribute('aria-checked');
        if (state !== null) el.setAttribute('aria-pressed', state); else el.removeAttribute('aria-pressed');
        el.style.setProperty('--on', src.style.getPropertyValue('--on'));
        el.disabled = src.disabled;
      };
      el.addEventListener('click', () => {
        const [first, ...rest] = sources(); if (!first) return;
        first.click();
        rest.forEach(o => { if (stateOf(o) !== stateOf(first)) o.click(); });
      });
      const ids = new Set(`${el.dataset.copy} ${el.dataset.copyAlso || ''}`.split(/\s+/).filter(Boolean));
      ids.forEach(id => { const n = document.getElementById(id); if (n) { watch(n, pull); all.includes(n) || all.push(n); } });
      new MutationObserver(pull).observe(el, { attributes: true, attributeFilter: ['data-copy'] });
      pull();
    }
    all.forEach(hideOriginal);
  });
})();
