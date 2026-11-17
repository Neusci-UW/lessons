/*
membrane.js: a slice of membrane drawn as a cartoon, to sit under a page's circuit with each channel under its branch.
Outside is above, inside below; the lipid bilayer is the capacitor, with its charge on either face.

Gates are drawn as the channel's own walls narrowing the pore (not a ball and chain): the activation gate (act) closes
the inner mouth, inactivation (inact) pinches the pore partway down. Ions move through each pore in a column whose
offset the page advances by that branch's current (MemSlice.step).

  MemSlice.draw(ctx, W, H, C, {
    where: 'axon',                   // the strip drawn at the top, with the slice highlighted
    slice: [f0, f1],                 // optional: a long stretch of the strip is shown (fractions of it), not a thin slice
    cap: { x, q } or [{ x, q, w, label }],   // the capacitor: where its charge is drawn, the charge in signs (+: inside positive)
    labels: [{ x, t, col, y }],      // extra labels, under the slice by default
    flows: [{ x0, x1, y, ion, o }],  // ions moving along, outside or in the cytoplasm
    channels: [{ x, kind: 'leak' | 'gated' | 'ligand' | 'electrode', col, ion: 'na' | 'k' | 'cl' | 'pos' | ...,
                 act, inact, open, o, label, sub, block, ligand, plug, active }],
    ions,                            // from MemSlice.ions(W): the loose ions drawn around the membrane
  })
Needs the page's fillSub(c, text, x, y) and mixc(a, b, t).
*/
(function () {
  const SP = 22, MT = 146, MB = 194, WT = 134, WB = 206;

  // the loose ions: Na⁺ and Cl⁻ mostly outside, K⁺ mostly inside
  function ions(W) {
    const out = [], n = Math.round(W / 14);
    for (let i = 0; i < n; i++) { const u = Math.random(); out.push({ x: 20 + Math.random() * (W - 40), y: 74 + Math.random() * 46, ion: u < 0.68 ? 'na' : u < 0.92 ? 'cl' : 'k' }); }
    for (let i = 0; i < n * 0.85; i++) { const u = Math.random(); out.push({ x: 20 + Math.random() * (W - 40), y: 220 + Math.random() * 50, ion: u < 0.82 ? 'k' : u < 0.94 ? 'na' : 'cl' }); }
    return out;
  }

  // move a column's offset by a current: px per frame, the biggest move capped at maxStep
  function step(offsets, moves, maxStep = 6) {
    const big = Math.max(0, ...moves.map(Math.abs)), k = big > maxStep ? maxStep / big : 1;
    return offsets.map((o, i) => ((o + moves[i] * k) % SP + SP) % SP);
  }

  function draw(m, W, H, C, o) {
    const PY0 = 100, PY1 = 240, xs = o.channels.map(ch => ch.x);
    const ml = (t, x, y, col, align = 'center', font = '600 12.5px "IBM Plex Sans", sans-serif') => { m.font = font; m.fillStyle = col || C.ink; m.textAlign = align; fillSub(m, t, x, y); };
    const near = (x, d) => xs.some(g => Math.abs(x - g) < d);
    m.fillStyle = C.surface; m.fillRect(0, 0, W, H);
    // the strip the slice comes from
    const sx = W / 2;
    m.fillStyle = C.cyto; m.strokeStyle = C.memdark; m.lineWidth = 3;
    m.beginPath(); m.roundRect(60, 10, W - 120, 34, 17); m.fill(); m.stroke();
    const [s0, s1] = o.slice ? o.slice.map(f => 60 + f * (W - 120)) : [sx - 8, sx + 8];
    m.fillStyle = C.accent; m.globalAlpha = 0.35; m.fillRect(s0, 10, s1 - s0, 34); m.globalAlpha = 1;
    m.strokeStyle = C.accent; m.lineWidth = 1.5; m.strokeRect(s0, 10, s1 - s0, 34);
    ml(o.where || 'axon', 80, 32, C.muted, 'left');
    m.setLineDash([3, 4]); m.lineWidth = 1; m.beginPath(); m.moveTo(s0, 44); m.lineTo(8, 62); m.moveTo(s1, 44); m.lineTo(W - 8, 62); m.stroke(); m.setLineDash([]);
    // outside, inside and the bilayer, with gaps for the channels
    m.fillStyle = C.bath; m.fillRect(8, 62, W - 16, MT - 62);
    m.fillStyle = C.cyto; m.fillRect(8, MB, W - 16, H - 4 - MB);
    ml('outside', W - 16, 80, C.muted, 'right', '600 12px "IBM Plex Sans", sans-serif');
    ml('inside', W - 16, H - 14, C.muted, 'right', '600 12px "IBM Plex Sans", sans-serif');
    m.fillStyle = C.mem; m.fillRect(8, MT, W - 16, MB - MT);
    m.strokeStyle = C.memdark; m.lineWidth = 1.2; m.beginPath();
    for (let x = 14; x < W - 10; x += 12) {
      if (near(x, 24)) continue;
      for (const d of [-2, 2]) { m.moveTo(x + d, MT + 6); m.lineTo(x + d, MT + 22); m.moveTo(x + d, MB - 6); m.lineTo(x + d, MB - 22); }
    }
    m.stroke();
    m.fillStyle = C.memdark; m.beginPath();
    for (let x = 14; x < W - 10; x += 12) { if (near(x, 24)) continue; m.moveTo(x + 5, MT + 2); m.arc(x, MT + 2, 5, 0, 6.283); m.moveTo(x + 5, MB - 2); m.arc(x, MB - 2, 5, 0, 6.283); }
    m.fill();
    // the loose ions
    for (const b of o.ions || []) {
      if (near(b.x, 30) || [].concat(o.cap || []).some(cp => Math.abs(b.x - cp.x) < (cp.w || 54) + 16) || (b.x > W - 90 && (b.y < 90 || b.y > 290))) continue;
      m.fillStyle = C[b.ion]; m.globalAlpha = 0.45; m.beginPath(); m.arc(b.x, b.y, 3.5, 0, 6.283); m.fill();
    }
    m.globalAlpha = 1;
    // the bilayer is the capacitor: one sign per unit of charge on each face (cap: one or several, each { x, q, w, label })
    const caps = !o.cap ? [] : Array.isArray(o.cap) ? o.cap : [{ label: 'bilayer = capacitor', ...o.cap }];
    for (const cp of caps) {
      const { x, q } = cp, w = cp.w || 54, per = Math.max(3, Math.floor(2 * w / 12) + 1), n = Math.min(3 * per, Math.round(Math.abs(q)));
      const top = q >= 0 ? C.neg : C.pos, bot = q >= 0 ? C.pos : C.neg;
      m.font = '700 12px "IBM Plex Mono", monospace'; m.textAlign = 'center'; m.textBaseline = 'middle';
      for (let k = 0; k < n; k++) {
        const row = Math.floor(k / per), xx = x - w + (k % per) * 12;
        m.fillStyle = top; m.fillText(q >= 0 ? '−' : '+', xx, MT - 10 - row * 11);
        m.fillStyle = bot; m.fillText(q >= 0 ? '+' : '−', xx, MB + 11 + row * 11);
      }
      m.textBaseline = 'alphabetic';
      if (cp.label) ml(cp.label, x, H - 14, C.ink);
    }
    for (const l of o.labels || []) ml(l.t, l.x, l.y ?? H - 14, l.col || C.muted, 'center', l.font);
    // a column of ions through a pore; open: how visible they are inside the membrane
    const column = (x, ion, off, open, y0 = PY0, y1 = PY1) => {
      m.fillStyle = C[ion] || ion;
      for (let y = y0 + off; y < y1; y += SP) {
        const edge = Math.min(1, (y - y0) / 16, (y1 - y) / 16), inMem = y > WT - 4 && y < WB + 4;
        m.globalAlpha = Math.max(0, edge) * (inMem ? open : 1);
        if (m.globalAlpha < 0.02) continue;
        m.beginPath(); m.arc(x, y, 4.5, 0, 6.283); m.fill();
      }
      m.globalAlpha = 1;
    };
    const tag = (x, y, t) => {
      m.fillStyle = C.ink; m.beginPath(); m.roundRect(x - 16, y - 8, 32, 16, 4); m.fill();
      ml(t, x, y + 4, C.surface, 'center', '700 10.5px "IBM Plex Sans", sans-serif');
    };
    // ions moving along, outside or in the cytoplasm (flows: [{ x0, x1, y, ion, o }]): o moves them toward x1
    for (const f of o.flows || []) {
      const L = f.x1 - f.x0, dir = Math.sign(L) || 1;
      m.fillStyle = C[f.ion] || f.ion;
      for (let d = f.o; d < Math.abs(L); d += SP) {
        m.globalAlpha = Math.max(0, Math.min(1, d / 14, (Math.abs(L) - d) / 14)) * (f.alpha ?? 1);
        m.beginPath(); m.arc(f.x0 + dir * d, f.y, 4, 0, 6.283); m.fill();
      }
      m.globalAlpha = 1;
    }
    for (const ch of o.channels) {
      const x = ch.x, col = ch.col;
      if (ch.kind === 'electrode') {   // a glass pipette through the membrane, its tip inside the cell
        m.fillStyle = C.surface; m.strokeStyle = ch.active ? C.accent : C.muted; m.lineWidth = 2;
        m.beginPath(); m.moveTo(x - 13, 62); m.lineTo(x - 3, 232); m.lineTo(x + 3, 232); m.lineTo(x + 13, 62); m.fill(); m.stroke();
        column(x, ch.ion, ch.o, 1, 70, 244);
        ml(ch.label, x, H - 14, ch.active ? C.accent : C.ink);
        continue;
      }
      column(x, ch.ion, ch.o, Math.min(1, ch.open ?? 1));
      // two walls of protein; the gates are the walls narrowing the pore
      const act = ch.act ?? 1, inact = ch.inact ?? 1;
      const gBot = 0.5 + 7.5 * act, gMid = 1.5 + 6.5 * inact, YM = (WT + WB) / 2 + 6;
      m.fillStyle = mixc(col, C.surface, 0.35); m.strokeStyle = col; m.lineWidth = 1.5; m.lineJoin = 'round';
      for (const sd of [-1, 1]) {
        m.beginPath(); m.moveTo(x + sd * 21, WT); m.lineTo(x + sd * 8, WT);
        m.quadraticCurveTo(x + sd * 8, YM - 14, x + sd * gMid, YM);
        m.quadraticCurveTo(x + sd * Math.min(gMid, gBot + 3), YM + 14, x + sd * gBot, WB);
        m.lineTo(x + sd * 21, WB); m.closePath(); m.fill(); m.stroke();
      }
      // transmitter bound at the outer face of a ligand-gated channel
      if (ch.ligand > 0.02) {
        m.fillStyle = C.ea; m.globalAlpha = Math.min(1, ch.ligand);
        for (const sd of [-1, 1]) { const cx = x + sd * 15, cy = WT - 6; m.beginPath(); m.moveTo(cx, cy - 6); m.lineTo(cx + 5, cy); m.lineTo(cx, cy + 6); m.lineTo(cx - 5, cy); m.fill(); }
        m.globalAlpha = 1;
      }
      // an ion lodged in the pore (plug: how much of the time it is there, as Mg²⁺ in the NMDA receptor): it sits
      // in the pore when blocking, and is pushed out into the cell as the block lifts
      if (ch.plug != null) {
        const py = YM + (1 - ch.plug) * 44;
        m.globalAlpha = 0.25 + 0.75 * ch.plug; m.fillStyle = C.ink; m.beginPath(); m.arc(x, py, 6, 0, 6.283); m.fill(); m.globalAlpha = 1;
        ml('Mg²⁺', x + 26, py + 4, C.ink, 'left', '600 11px "IBM Plex Sans", sans-serif');
      }
      if (ch.block) tag(x, WT - 12, ch.block);
      ml(ch.label, x, H - 14, col);
      if (ch.sub) ml(ch.sub, x, H - 30, col, 'center', '500 11px "IBM Plex Mono", monospace');
    }
  }

  window.MemSlice = { draw, ions, step, SP };
})();
