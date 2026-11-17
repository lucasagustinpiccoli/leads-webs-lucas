"""Arma la carpeta lista para subir a Cloudflare Pages (o cualquier hosting estático).

Uso:  python scripts/armar_sitio.py [--sin-demos]

Resultado en output/publicar/ y output/publicar.zip:
  /                  la página madre (sitio/lp-design)
  /demos/{carpeta}/  cada demo de output/demos, en su propia dirección
  robots.txt, _headers   para que los buscadores NO indexen /demos/ (son demos para clientes, no páginas públicas)

La carpeta output/ no se sube a GitHub (tiene teléfonos de negocios); este script la arma localmente.
"""
import argparse
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "publicar")

ap = argparse.ArgumentParser()
ap.add_argument("--sin-demos", action="store_true", help="solo la página madre")
a = ap.parse_args()

shutil.rmtree(OUT, ignore_errors=True)
shutil.copytree(os.path.join(ROOT, "sitio", "lp-design"), OUT)
n = 0
if not a.sin_demos:
    demos = os.path.join(ROOT, "output", "demos")
    for d in sorted(os.listdir(demos)) if os.path.isdir(demos) else []:
        src = os.path.join(demos, d)
        if os.path.exists(os.path.join(src, "index.html")):
            shutil.copytree(src, os.path.join(OUT, "demos", d), ignore=shutil.ignore_patterns("datos.json"))
            n += 1
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write("User-agent: *\nDisallow: /demos/\n")
with open(os.path.join(OUT, "_headers"), "w") as f:
    f.write("/demos/*\n  X-Robots-Tag: noindex, nofollow\n")
zip_path = shutil.make_archive(os.path.join(ROOT, "output", "publicar"), "zip", OUT)
mb = os.path.getsize(zip_path) / 1e6
print(f"Listo: página madre + {n} demos en output/publicar/ ({mb:.1f} MB en {os.path.relpath(zip_path, ROOT)})")
