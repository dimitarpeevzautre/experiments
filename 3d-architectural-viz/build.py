#!/usr/bin/env python3
"""Assemble the self-contained visualization.

Inlines Three.js and the scene source into src/page.html, producing:
  index.html      — full standalone document (open directly in a browser)
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
THREE = sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "vendor" / "three.min.js")

page = (ROOT / "src" / "page.html").read_text()
three = pathlib.Path(THREE).read_text()
scene = (ROOT / "src" / "scene.js").read_text()
project = (ROOT / "src" / "project.js").read_text()

# the UMD build's deprecation warning is noise in a deliberately pinned vendor copy
three = three.replace(
    "console.warn('Scripts \"build/three.js\" and \"build/three.min.js\" are deprecated with r150+, and will be removed with r160. Please use ES Modules or alternatives: https://threejs.org/docs/index.html#manual/en/introduction/Installation'),",
    "0,",
    1,
)

body = page.replace("{{THREE}}", three).replace("{{SCENE}}", scene).replace("{{PROJECT}}", project)

full = (
    "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
    "</head>\n<body>\n" + body + "\n</body>\n</html>\n"
)
(ROOT / "index.html").write_text(full)
print(f"index.html: {len(full)/1024:.0f} KB")
