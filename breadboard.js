// "Build on breadboard": inside Newt, rebuilds a simulation's circuit on the Breadboard
// simulator with real part values (Newt's lessoncircuit.py scales it). In a plain browser
// the button never appears.
//
//   NewtBreadboard.add(afterElement, () => circuit)
//
// circuit, in F, S, V, A and s (or the same per cm²):
//   { title: 'the RC circuit',
//     compartments: [{ name: 'Membrane', C: 1e-6,
//                      channels: [{ name: 'Na⁺', g: 7e-4, E: 0.060,      // conductance and its battery
//                                   vary: true, gmin: 5e-5,               // a potentiometer, down to gmin
//                                   switch: true, closed: false }],       // a switch in series
//                      stim: { I: 2e-5, dc: false } }],                   // injected current
//                    (a channel with gate: 'stim', train: { n, interval, width } is a synapse the Stimulator opens;
//                     button: true makes it a push button)
//     links: [{ from: 0, to: 1, g: 1e-3 }] }                              // axial conductances
(function () {
  window.__newtBridge = window.__newtBridge || new Promise(res => {
    if (!(window.qt?.webChannelTransport && window.QWebChannel)) return res(null);
    try { new window.QWebChannel(window.qt.webChannelTransport, ch => res(ch.objects.argusLessons || null)); } catch (e) { res(null); }
  });

  function add(after, circuit, label = 'Build on breadboard') {
    if (!after) return;
    window.__newtBridge.then(bridge => {
      if (!bridge?.toBreadboard) return;                  // a browser, or a Newt without it
      bridge.hasBreadboard(ok => {
        if (!ok) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'newt-bb';
        btn.textContent = label;
        btn.title = 'Rebuild this circuit on the Breadboard simulator, with its values scaled to real parts';
        btn.addEventListener('click', () => {
          let spec;
          try { spec = JSON.stringify(circuit()); } catch (e) { btn.title = String(e); return; }
          bridge.toBreadboard(spec, err => {
            btn.title = err ? "Couldn't build it: " + err : 'Built on the Breadboard simulator';
            btn.classList.toggle('newt-bb-err', !!err);
            if (err) alert("Couldn't build the circuit on the breadboard: " + err);
          });
        });
        after.insertAdjacentElement('afterend', btn);
      });
    });
  }

  window.NewtBreadboard = { add };
})();
