"""Download MathJax next to the lesson pages, so their equations render on computers
without internet. Run once from the lessons folder (needs internet this one time):

    python tools/fetch_mathjax.py

It writes vendor/mathjax/tex-svg.js (about 2 MB). The pages use that copy when it exists
and the online copy otherwise. In Newt, where this folder is the src/neusci_daq/lessons
submodule, reinstall afterwards (pip install -e ".[web]") if you installed without -e, so
the file is packaged.
"""
from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

VERSION = "3.2.2"
URL = f"https://cdn.jsdelivr.net/npm/mathjax@{VERSION}/es5/tex-svg.js"
DEST = Path(__file__).resolve().parents[1] / "vendor" / "mathjax" / "tex-svg.js"


def main() -> int:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading MathJax {VERSION}…")
    with urllib.request.urlopen(URL, timeout=60) as r:
        data = r.read()
    if len(data) < 500_000 or b"MathJax" not in data:
        print("That download doesn't look like MathJax; nothing written.", file=sys.stderr)
        return 1
    DEST.write_bytes(data)
    print(f"Wrote {DEST} ({len(data) / 1e6:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
