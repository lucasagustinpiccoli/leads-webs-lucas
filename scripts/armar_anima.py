#!/usr/bin/env python3
"""Junta la demo de Anima Center (sitio/lumen-studio/anima-center-src/) en un solo archivo: sitio/lumen-studio/anima-center/index.html.
Editá los archivos de anima-center-src/ y volvé a correr este script. No usa librerías."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "sitio", "lumen-studio", "anima-center-src")
OUT = os.path.join(ROOT, "sitio", "lumen-studio", "anima-center", "index.html")


def leer(n):
    with open(os.path.join(SRC, n), encoding="utf-8") as f:
        return f.read()


html = leer("index.html")
html = html.replace('<link rel="stylesheet" href="style.css" />', "<style>\n" + leer("style.css") + "\n</style>")
for n in ("demo-backend.js", "app.js"):
    tag = f'<script src="{n}"></script>'
    assert tag in html, tag
    html = html.replace(tag, "<script>\n" + leer(n).replace("</script", "<\\/script") + "\n</script>")
if 'name="robots"' not in html:
    html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1" />',
                        '<meta name="viewport" content="width=device-width, initial-scale=1" />\n<meta name="robots" content="noindex, nofollow" />', 1)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)
print("Anima Center ->", os.path.relpath(OUT, ROOT), f"({len(html) // 1024} KB)")
