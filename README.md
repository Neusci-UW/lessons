# Lessons

Interactive physiology lessons for pre-med students: each is a single web page with a
simulation, its charts, theory and a calculator. They run in any browser and inside
[Newt](https://github.com/Neusci-UW/newt), which includes this repo as a git submodule
and shows the pages on its Lessons tabs.

| Page | What it covers |
|---|---|
| `index.html` | Landing page: links to the lessons in order |
| `membrane_potential.html` | Exploring the membrane potential: ions crossing a membrane one by one, Q = C·V, Nernst, chord conductance and GHK, with a GHK calculator |
| `rc_membrane.html` | Charging a membrane: the membrane as an RC circuit, then the same thing ion by ion, with an RC calculator |
| `action_potential.html` | The action potential travelling along an axon: a cell body and axon built from Hodgkin–Huxley patches joined by the cytoplasm, with a menu of real cells (motor neuron, pain fibre, frog nerve, squid giant axon), myelin, electrodes and a cable calculator |

## Running a page

Open the HTML file in a browser, or serve the folder so the lesson questions load too:

    python -m http.server 8000

then go to http://localhost:8000/ for the list of lessons.

## Files

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
