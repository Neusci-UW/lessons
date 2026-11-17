# Lessons

Interactive physiology lessons for pre-med students: each is a single web page with a
simulation, its charts, theory and a calculator. They run in any browser and inside
[Newt](https://github.com/Neusci-UW/newt), which includes this repo as a git submodule
and shows the pages on its Lessons tabs.

| Page | What it covers |
|---|---|
| `index.html` | Landing page: links to the lessons in order |
| `membrane_potential.html` | Exploring the membrane potential: ions crossing a membrane one by one, Q = C·V, Nernst, chord conductance and GHK, with a GHK calculator |
| `rc_membrane.html` | Passive properties: time. Charging a membrane: the membrane as an RC circuit, then the same thing ion by ion, with an RC calculator |
| `passive_space.html` | Passive properties: space. Lesson 2's RC patches in a row (a cable), in lesson 2's four circuits, with each patch's membrane currents over time: the length constant λ and the time constant τ together, with a cable calculator |
| `action_potential.html` | The action potential travelling along an axon: a cell body and axon built from Hodgkin–Huxley patches joined by the cytoplasm, with a menu of real cells (motor neuron, pain fibre, frog nerve, squid giant axon), myelin, electrodes and a conduction-velocity calculator |
| `synapse.html` | The chemical synapse: a presynaptic terminal, cleft and spine vesicle by vesicle (Ca²⁺ entry, chance release, facilitation and depression, receptors), then the synapse as a conductance with its own battery in current and voltage clamp, with a synaptic current calculator |
| `summation.html` | Summation and the spike trigger zone: the membrane as a capacitor adding inputs up, a neuron from dendrite to axon initial segment, and a summation calculator |
| `plasticity.html` | Spines and plasticity: the EPSP at the spine head, dendrite and soma, Ca²⁺ through NMDA receptors as a coincidence detector, and LTP and LTD from a tetanus, 1 Hz or pairing, read out with a test pulse and a time-lapse of the spine, with a calculator for the NMDA I–V curve and LTP vs LTD by frequency |
| `hodgkin_huxley.html` | The Hodgkin–Huxley model: lesson 2's circuit in three steps (Na⁺ on a switch, voltage-gated Na⁺, complete active membrane), with a threshold calculator and a voltage-clamp calculator |

## Running a page

Open the HTML file in a browser, or serve the folder so the lesson questions load too:

    python -m http.server 8000

then go to http://localhost:8000/ for the list of lessons.

## Files

- `breadboard.js`: inside Newt, a "Build on breadboard" button beside a simulation that rebuilds its circuit on the Breadboard simulator with the cell's own values (mV, µF, ms), or, with `scale: 'breadboard'` (the RC circuit), scaled to parts you could buy and volts (Newt's `lessoncircuit.py`). A page loads it in `<head>` and calls `NewtBreadboard.add(element, () => circuit)`, the circuit as compartments (a capacitor and up to four conductance-plus-battery branches each), axial links, injected currents and synapses the Stimulator opens; the file's header gives the format. Voltage-gated channels become potentiometers set to how open they are at that moment. In a plain browser the button doesn't appear.
- `floatbar.js`: a bar of the main controls (run, pause, speed) that floats in the corner while the page scrolls. Its buttons and slider are copies of the page's own, named with `data-copy`.
- `frames.js`: caps every requestAnimationFrame loop at 30 frames a second, and stops them while all the page's simulations are paused and nobody is touching the page. Each page loads it first (in `<head>`) and registers each simulation with `Frames.sim(() => running, 'playButtonId')`. Simulations start paused and pause themselves after 60 s without a click, key, slider move or scroll.
- `membrane.js`: a slice of membrane drawn as a cartoon (`MemSlice.draw`), to sit under a page's circuit with each channel under its branch: gates are the pore narrowing, ions pass through each pore at the rate of its current, and the bilayer carries the capacitor's charge. Used by the Hodgkin–Huxley, synapse, passive space and plasticity pages.
- `sliders.js`: fill-in boxes for every slider: click a slider's readout and type a value. Each page loads it last.
- `lesson.js`: the lesson system. A page that sets `window.LESSON_ADAPTER` and loads it
  can show questions, and lock or hide parts of the page until they are answered.
- `questions/`: lesson question files, one per lesson (`ArgusLesson.define({...})`). Write
  them with the editor: open a page with `?edit`, or press Edit lesson in Newt, which
  saves here.
- `tools/fetch_mathjax.py`: downloads MathJax into `vendor/` so equations render without
  internet. `vendor/` is not committed.

## Working on the lessons from Newt

In a Newt checkout this folder is `src/neusci_daq/lessons`. Commit and push changes here
(in the submodule) first, then commit the new submodule pointer in Newt.
