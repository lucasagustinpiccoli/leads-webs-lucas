"""Arma la carpeta lista para subir a Cloudflare Pages (o cualquier hosting estático).

Uso:  python scripts/armar_sitio.py [--sin-demos]

Resultado en output/publicar/ y output/publicar.zip:
  /                  la página madre (sitio/lumen-studio)
  /demos/{carpeta}/  cada demo de output/demos, en su propia dirección
  robots.txt, _headers   para que los buscadores NO indexen /demos/ (son demos para clientes, no páginas públicas)

La carpeta output/ no se sube a GitHub (tiene teléfonos de negocios); este script la arma localmente.
"""
import argparse
import os
import re
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output", "publicar")

ap = argparse.ArgumentParser()
ap.add_argument("--sin-demos", action="store_true", help="solo la página madre")
a = ap.parse_args()

shutil.rmtree(OUT, ignore_errors=True)
shutil.copytree(os.path.join(ROOT, "sitio", "lumen-studio"), OUT, ignore=shutil.ignore_patterns(".hallmark", "LEEME.md", "anima-center-src"))
# Propuesta de rediseño de R&RG (se enlaza desde "Proyectos"); lleva noindex. El archivo único es solo para verla sin carpeta.
shutil.copytree(os.path.join(ROOT, "redisenos", "rrg"), os.path.join(OUT, "rrg"), ignore=shutil.ignore_patterns("un-archivo.html"))
n = 0
# Demos del portfolio con marca ficticia: se publican en su propia dirección (no en /demos/)
PORTFOLIO = {"ejemplo-dentista": "brio-dental"}
if not a.sin_demos:
    demos = os.path.join(ROOT, "output", "demos")
    for d in sorted(os.listdir(demos)) if os.path.isdir(demos) else []:
        src = os.path.join(demos, d)
        if os.path.exists(os.path.join(src, "index.html")):
            destino = os.path.join(OUT, PORTFOLIO[d]) if d in PORTFOLIO else os.path.join(OUT, "demos", d)
            shutil.copytree(src, destino, ignore=shutil.ignore_patterns("datos.json"))
            n += 1

# --- Portfolio: número de Halo Studio en los WhatsApp de las demos + barra "Demo hecha por Halo Studio" ---
from urllib.parse import quote
WA_HALO = "5491178297719"
DEMOS = {  # carpeta publicada -> nombre que se ve en el mensaje
    "solana": "Solana", "saldo": "Saldo", "arce": "Arce", "oliva": "Oliva Atelier", "anima-center": "Anima Center",
    "brio-dental": "Brío Dental", "rrg": "R&RG Estudio Jurídico",
}
with open(os.path.join(ROOT, "scripts", "halo_barra.html"), encoding="utf-8") as f:
    BARRA = f.read()


def leer(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def escribir(p, t):
    with open(p, "w", encoding="utf-8") as f:
        f.write(t)


def parchar_demo(carpeta, nombre):
    base = os.path.join(OUT, carpeta)
    idx = os.path.join(base, "index.html")
    if not os.path.exists(idx):
        return
    msg = f"¡Hola! Estoy probando la demo de {nombre} y quiero una página así para mi negocio."
    link = f"https://wa.me/{WA_HALO}?text={quote(msg)}"
    prefijo = f"[Demo de {nombre}] "
    for raiz, _, archivos in os.walk(base):
        for nom in archivos:
            if not nom.endswith((".html", ".js")):
                continue
            p = os.path.join(raiz, nom)
            t = leer(p)
            o = t
            # links sin número (https://wa.me/?text=...) -> número de Halo con un mensaje que aclara el contexto
            t = re.sub(r'https://wa\.me/\?text=[^"\'`\s<>]*', link.replace("\\", "\\\\"), t)
            # variables con el número vacío y mensajes armados por la demo
            t = re.sub(r'var WA = "";[^\n]*', f'var WA = "{WA_HALO}";', t)
            t = re.sub(r'var wa = "";', f'var wa = "{WA_HALO}";', t)
            if 'wa.me/" + WA' in t or 'wa.me/" + wa' in t:
                t = t.replace('"?text=" + encodeURIComponent(', '"?text=" + encodeURIComponent("' + prefijo + '" + ', 1)
            if t != o:
                escribir(p, t)
    t = leer(idx)
    if "halo-barra" not in t:
        barra = BARRA.replace("__WA__", link).replace("__DEMO__", nombre.replace('"', ""))
        t = t.replace("</body>", barra + "\n</body>", 1) if "</body>" in t else t + barra
        escribir(idx, t)


for carpeta, nombre in DEMOS.items():
    parchar_demo(carpeta, nombre)
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write("User-agent: *\nDisallow: /demos/\n")
with open(os.path.join(OUT, "_headers"), "w") as f:
    f.write("/demos/*\n  X-Robots-Tag: noindex, nofollow\n")
# Direcciones anteriores de los proyectos del portfolio: redirigen a las nuevas
with open(os.path.join(OUT, "_redirects"), "w") as f:
    for viejo, nuevo in (("gymflow", "anima-center"), ("app", "saldo"), ("catalogo", "arce"), ("residencias", "solana"), ("demos/ejemplo-dentista", "brio-dental")):
        f.write(f"/{viejo}/ /{nuevo}/ 301\n")
zip_path = shutil.make_archive(os.path.join(ROOT, "output", "publicar"), "zip", OUT)
mb = os.path.getsize(zip_path) / 1e6
print(f"Listo: página madre + {n} demos en output/publicar/ ({mb:.1f} MB en {os.path.relpath(zip_path, ROOT)})")
