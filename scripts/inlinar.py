#!/usr/bin/env python3
"""Arma un solo archivo HTML con todo adentro (estilos, fuentes, imágenes y scripts de una carpeta de proyecto).
Uso: python scripts/inlinar.py sitio/lumen-studio/loteo output/proyecto-loteo.html
Así el archivo abre completo aunque se descargue solo, sin carpeta ni internet."""
import base64, mimetypes, os, re, sys

carpeta, destino = sys.argv[1], sys.argv[2]


def leer(ruta, modo="r"):
    with open(os.path.join(carpeta, ruta), modo, **({} if "b" in modo else {"encoding": "utf-8"})) as f:
        return f.read()


def datauri(ruta):
    tipo = mimetypes.guess_type(ruta)[0] or ("font/woff2" if ruta.endswith(".woff2") else "application/octet-stream")
    return f"data:{tipo};base64," + base64.b64encode(leer(ruta, "rb")).decode()


html = leer("index.html")
# hojas de estilo locales, con sus fuentes
def hoja(m):
    css = leer(m.group(1))
    css = re.sub(r'url\("([^"]+)"\)', lambda u: f'url("{datauri(u.group(1))}")' if not u.group(1).startswith(("http", "data:")) else u.group(0), css)
    return f"<style>{css}</style>"
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', hoja, html)
html = re.sub(r'<link rel="preload"[^>]*>\n?', "", html)
html = re.sub(r'<script src="([^"]+)"></script>', lambda m: "<script>" + leer(m.group(1)) + "</script>", html)
# imágenes: srcset se descarta, queda la grande
html = re.sub(r'\s(?:srcset|imagesrcset)="[^"]*"', "", html)
html = re.sub(r'src="(img/[^"]+)"', lambda m: f'src="{datauri(m.group(1))}"', html)
with open(destino, "w", encoding="utf-8") as f:
    f.write(html)
print(destino, len(html) // 1024, "KB")
