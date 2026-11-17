// Lesson pages redraw in requestAnimationFrame loops. Redrawing every canvas 60 times a
// second costs CPU and lets the browser's drawing memory pile up (Newt's lesson tabs
// reached ~1 GB), even while nothing moves. This wraps requestAnimationFrame so:
//  - frames run at most 30 times a second;
//  - they stop while every simulation on the page is paused and nobody is touching the
//    page (any input, resize or theme change wakes them; Frames.poke() from code);
//  - every simulation starts paused, and pauses itself after IDLE_PAUSE_MS without a
//    change (a click, key, slider or scroll; just moving the mouse doesn't count).
// Each page registers each simulation with Frames.sim(() => running, 'playButtonId',
// ['stimulusButtonId', ...]); pressing one of those stimulus buttons while the simulation
// is paused starts it, so a stimulus never lands in a frozen simulation.
// and loads this file first, in <head>. Pausing clicks the page's own Play/Pause button,
// so its label and the floating bar's copy stay in step.
(() => {
  const native = window.requestAnimationFrame.bind(window);
  const FRAME_MS = 1000 / 30, AWAKE_MS = 1500, IDLE_PAUSE_MS = 60000;
  const sims = [];                    // { isPlaying, button }
  let queue = [], lastRun = -Infinity, lastPoke = performance.now(), lastChange = performance.now(), scheduled = false;

  const playingOf = s => { try { return !!s.isPlaying(); } catch (e) { return false; } };
  const anyPlaying = () => sims.some(playingOf);
  const pauseAll = () => sims.forEach(s => { if (playingOf(s)) document.getElementById(s.button)?.click(); });
  const awake = now => sims.length === 0 || now - lastPoke < AWAKE_MS || anyPlaying();

  function tick(now) {
    scheduled = false;
    if (now - lastChange > IDLE_PAUSE_MS && anyPlaying()) pauseAll();
    if (!awake(now)) return;          // asleep: the queued loops wait for poke()
    if (now - lastRun >= FRAME_MS - 2) {
      lastRun = now;
      const q = queue; queue = [];
      q.forEach(cb => cb(now));
    }
    if (queue.length) schedule();
  }
  function schedule() { if (!scheduled) { scheduled = true; native(tick); } }
  function poke() { lastPoke = performance.now(); if (queue.length) schedule(); }
  function changed() { lastChange = performance.now(); poke(); }

  window.requestAnimationFrame = cb => { queue.push(cb); schedule(); return 0; };
  function sim(isPlaying, button, triggers = []) {
    const s = { isPlaying, button };
    sims.push(s);
    for (const id of triggers)
      document.getElementById(id)?.addEventListener('click', () => {
        if (!playingOf(s)) document.getElementById(button)?.click();
      });
  }
  // Chromium can throw away a canvas's drawing and hand the canvas back blank ('contextlost', then
  // 'contextrestored' on each canvas), e.g. when its GPU process restarts (after sleep or a display change); Qt
  // WebEngine without a screen (QT_QPA_PLATFORM=offscreen) does it every half second. The loops repaint on their
  // next frame, but a chart drawn only when a control moves (a calculator's) would stay blank until someone touched it. So right after a burst of restores
  // (every canvas's, in one go), redraw everything: the page's readColors() (which reruns its colorHooks, and they
  // redraw every canvas) and whatever the page registered with Frames.onRestore(fn); then wake the loops. Without
  // delay: a context can be lost again soon after it comes back.
  const restorers = [];
  let restoreTimer = 0;
  function restored() {
    restoreTimer = 0;
    const fns = (typeof readColors === 'function' ? [readColors] : []).concat(restorers);
    for (const f of fns) { try { f(); } catch (e) { console.error(e); } }
    poke();
  }
  window.addEventListener('contextrestored', () => { clearTimeout(restoreTimer); restoreTimer = setTimeout(restored, 0); }, true);
  window.Frames = { sim, poke, pauseAll, onRestore: fn => { restorers.push(fn); } };

  for (const ev of ['pointerdown', 'wheel', 'keydown', 'input', 'change', 'click', 'scroll'])
    window.addEventListener(ev, changed, { capture: true, passive: true });
  for (const ev of ['pointermove', 'resize', 'focus'])
    window.addEventListener(ev, poke, { capture: true, passive: true });
  document.addEventListener('visibilitychange', poke);
  new MutationObserver(poke).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
  // every simulation starts paused, once the page has set itself up
  window.addEventListener('load', () => { pauseAll(); changed(); });
})();
