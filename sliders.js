/* Fill-in boxes for the sliders on the lesson pages.

Each slider's readout (its <output>) becomes a box you can type into: click it (or Tab to it and press
Enter), type a number, with or without its unit ("12", "12 µm", "0.5 mm"), and press Enter; Escape cancels.

The pages show slider values in many ways: straight, on a log scale, inverted, or with units that change as
the slider moves (µm, mm, m). Rather than each slider saying how, this finds the slider position whose readout
is closest to what was typed, by trying positions (a binary search) and reading the page's own readout. So it
works for any slider whose readout rises or falls steadily as the slider moves. A page loads it with
<script src="sliders.js"></script> after its own scripts. */
(() => {
  const PREFIX = { p: 1e-12, n: 1e-9, 'µ': 1e-6, 'μ': 1e-6, u: 1e-6, m: 1e-3, k: 1e3 };
  // "−12.5 µm" → { value: -12.5e-6 (in m), unit: 'µm' }; the unit's prefix is folded in so µm and mm compare
  function parse(text, fallbackUnit) {
    const t = String(text).replace(/[−–]/g, '-').replace(/,/g, '').replace(/≈/g, '').trim();
    const m = /(-?\+?\d*\.?\d+(?:e-?\d+)?)\s*(.*)$/i.exec(t.replace('+', ''));
    if (!m) return null;
    let unit = (m[2] || '').trim();
    if (!unit && fallbackUnit) unit = fallbackUnit;
    const f = unit.length > 1 && PREFIX[unit[0]] && /^[A-Za-zΩ°]/.test(unit.slice(1)) ? PREFIX[unit[0]] : 1;
    return { value: parseFloat(m[1]) * f, unit };
  }
  const unitOf = text => { const p = parse(text); return p ? p.unit : ''; };

  const css = document.createElement('style');
  css.textContent = `
    output.fillbox{cursor:text;border:1px solid var(--line);border-radius:5px;padding:1px 5px;background:var(--surface);display:inline-block;box-sizing:border-box;white-space:nowrap;max-width:100%}
    output.fillbox:hover,output.fillbox:focus-visible{border-color:var(--accent);outline:none}
    input.fillin{font-family:var(--font-mono);font-size:12.5px;color:var(--ink);background:var(--surface);border:1px solid var(--accent);border-radius:5px;padding:1px 6px;box-sizing:border-box;text-align:right;min-width:0}
    input.fillin:focus{outline:2px solid var(--accent);outline-offset:1px}`;
  document.head.appendChild(css);

  function attach(range) {
    const out = document.querySelector(`output[for="${range.id}"]`) || document.getElementById(range.id + 'o');
    if (!out || out.dataset.fillbox) return;
    out.dataset.fillbox = '1'; out.classList.add('fillbox'); out.tabIndex = 0;
    out.title = 'Click to type a value';
    out.setAttribute('aria-label', (range.labels && range.labels[0] ? range.labels[0].textContent.trim() + ': ' : '') + 'type a value');

    const lo = parseFloat(range.min || 0), hi = parseFloat(range.max || 100);
    const st = range.step === 'any' ? (hi - lo) / 1000 : parseFloat(range.step || 1);
    const K = Math.round((hi - lo) / st);
    const at = k => +(lo + k * st).toFixed(10);
    const set = v => { range.value = v; range.dispatchEvent(new Event('input', { bubbles: true })); };
    const shown = () => { const p = parse(out.textContent); return p ? p.value : NaN; };

    // Some readouts are words at an end of the slider ("off", "none"). Find the first position from each end
    // that reads as a number, trying 0, 1, 2, 4, 8 … steps in.
    function numericEnd(from, dir) {
      for (let d = 0; d <= K; d = d ? d * 2 : 1) { const k = clamp(from + dir * d); set(at(k)); const v = shown(); if (isFinite(v)) return { k, v }; }
      return null;
    }
    const clamp = k => Math.max(0, Math.min(K, k));
    function apply(text) {
      const start = range.value, word = text.trim().toLowerCase();
      // a word the slider shows at one end ("off"), or 0 where that end shows a word, picks that end
      for (const k of [0, K]) {
        set(at(k)); const t = out.textContent.trim().toLowerCase();
        if (!isFinite(shown()) && (word === t || parseFloat(word) === 0)) return;
      }
      const target = parse(text, unitOf(out.textContent));
      if (!target || !isFinite(target.value)) { set(start); return; }
      const A = numericEnd(0, 1), B = numericEnd(K, -1);
      if (!A || !B || A.v === B.v) { set(start); return; }
      const up = B.v > A.v, x = target.value;
      // smallest k whose readout has reached the target, then the nearer of it and the one before
      let l = A.k, h = B.k;
      while (l < h) { const mid = (l + h) >> 1; set(at(mid)); const v = shown(); if (isFinite(v) && (up ? v >= x : v <= x)) h = mid; else l = mid + 1; }
      set(at(l)); const vl = shown();
      if (l > A.k) { set(at(l - 1)); const vp = shown(); if (Math.abs(vp - x) <= Math.abs(vl - x)) return; set(at(l)); }
    }

    function edit() {
      if (out.hidden) return;
      const box = document.createElement('input');
      box.type = 'text'; box.className = 'fillin'; box.value = out.textContent.trim();
      box.setAttribute('aria-label', out.getAttribute('aria-label'));
      box.style.width = Math.max(out.offsetWidth, 72) + 'px';
      out.hidden = true; out.after(box); box.focus(); box.select();
      let done = false;
      const finish = keep => {
        if (done) return; done = true;
        const text = box.value; box.remove(); out.hidden = false;
        if (keep && text.trim() && text.trim() !== out.textContent.trim()) apply(text);
        out.focus();
      };
      box.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      });
      box.addEventListener('blur', () => finish(true));
    }
    out.addEventListener('click', edit);
    out.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); edit(); } });
  }

  const all = () => document.querySelectorAll('input[type=range]').forEach(attach);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})();
