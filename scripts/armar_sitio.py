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

# --- Portfolio: número de Halo Studio en los WhatsApp de las demos ---
from urllib.parse import quote
WA_HALO = "5491178297719"
DEMOS = {  # carpeta publicada -> nombre que se ve en el mensaje
    "solana": "Solana", "saldo": "Saldo", "arce": "Arce", "oliva": "Oliva Atelier", "anima-center": "Anima Center",
    "brio-dental": "Brío Dental", "rrg": "R&RG Estudio Jurídico",
}


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


for carpeta, nombre in DEMOS.items():
    parchar_demo(carpeta, nombre)
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write("User-agent: *\nDisallow: /demos/\n")
with open(os.path.join(OUT, "_headers"), "w") as f:
    f.write("""# Seguridad para todo el sitio. HSTS se activa solo con dominio propio (en workers.dev ya lo maneja Cloudflare).
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

# Archivos que casi no cambian: el navegador los guarda 30 días (las fuentes, 1 año)
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/*/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/img/*
  Cache-Control: public, max-age=2592000
/*/img/*
  Cache-Control: public, max-age=2592000
/logo/*
  Cache-Control: public, max-age=2592000
/demos/*/img/*
  Cache-Control: public, max-age=2592000

# Las demos para negocios no se indexan
/demos/*
  X-Robots-Tag: noindex, nofollow
""")
# Direcciones anteriores de los proyectos del portfolio: redirigen a las nuevas
with open(os.path.join(OUT, "_redirects"), "w") as f:
    for viejo, nuevo in (("gymflow", "anima-center"), ("app", "saldo"), ("catalogo", "arce"), ("residencias", "solana"), ("demos/ejemplo-dentista", "brio-dental")):
        f.write(f"/{viejo}/ /{nuevo}/ 301\n")

# --- Favicon: las páginas de demo sin ícono reciben uno con la inicial del título; Oliva apuntaba a archivos que no existen ---
import html as _html
for _raiz, _, _arch in os.walk(OUT):
    if "index.html" not in _arch or os.path.abspath(_raiz) in (os.path.abspath(OUT), os.path.join(os.path.abspath(OUT), "privacidad"), os.path.join(os.path.abspath(OUT), "aviso-legal")):
        continue
    _p = os.path.join(_raiz, "index.html")
    _t = open(_p, encoding="utf-8", errors="ignore").read()
    _t2 = re.sub(r'<link rel="(?:icon|apple-touch-icon)"[^>]*href="\./(?:favicon-32\.png|apple-touch-icon\.png)"[^>]*>\s*', "", _t)
    if not re.search(r'<link rel="(?:shortcut )?icon"', _t2):
        _m = re.search(r"<title>\s*(.*?)\s*</title>", _t2, re.S)
        _l = (re.sub(r"[^A-Za-zÁÉÍÓÚÑ0-9]", "", _html.unescape(_m.group(1)))[:1] or "H").upper() if _m else "H"
        _svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111"/>'
                f'<text x="32" y="45" font-family="Georgia,serif" font-size="38" text-anchor="middle" fill="#f4f1e8">{_l}</text></svg>')
        _t2 = _t2.replace("</head>", '<link rel="icon" href="data:image/svg+xml;base64,' + __import__("base64").b64encode(_svg.encode()).decode() + '">\n</head>', 1)
    if _t2 != _t:
        open(_p, "w", encoding="utf-8").write(_t2)
zip_path = shutil.make_archive(os.path.join(ROOT, "output", "publicar"), "zip", OUT)
mb = os.path.getsize(zip_path) / 1e6
print(f"Listo: página madre + {n} demos en output/publicar/ ({mb:.1f} MB en {os.path.relpath(zip_path, ROOT)})")
