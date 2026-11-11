"""Baja fotos de Pexels por número de foto, arma una hoja de contacto para elegir, y guarda las elegidas en el repo.

Uso:
  python pexels.py ver 19569865 2306281 17022991 --dir /ruta/scratch/pexels
      -> baja cada foto (1600 px) y escribe hoja.jpg con todas numeradas, para mirarla con Read.
  python pexels.py guardar --rubro dentista --dir /ruta/scratch/pexels 2306281:sillon-consultorio 17022991:sala-espera
      -> copia las elegidas (redimensionadas, optimizadas) a templates/assets/{rubro}/{nombre}.jpg
         y suma cada una a templates/assets/{rubro}/CREDITOS.json.

El número de foto sale de la URL de Pexels: pexels.com/photo/titulo-de-la-foto-19569865/ -> 19569865.
Necesita el host images.pexels.com habilitado en la red y Pillow (pip install pillow).
"""
import argparse
import json
import os
import sys
import urllib.request

from PIL import Image, ImageDraw

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
URL = "https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1600"
LICENCIA = ("Fotos de Pexels (https://www.pexels.com/license/): uso libre, sin atribución obligatoria. "
            "Son imágenes de referencia para demos; al vender, reemplazar por fotos reales del cliente.")


def ver(ids, carpeta):
    os.makedirs(carpeta, exist_ok=True)
    ok = []
    for i in ids:
        dst = os.path.join(carpeta, f"{i}.jpg")
        if not os.path.exists(dst):
            try:
                req = urllib.request.Request(URL.format(id=i), headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as r, open(dst, "wb") as f:
                    f.write(r.read())
            except Exception as e:  # una foto que falla no frena el resto
                print(f"  {i}: no se pudo bajar ({e})")
                continue
        if os.path.getsize(dst) < 20000:
            print(f"  {i}: archivo demasiado chico, probablemente no es una foto")
            continue
        ok.append(i)
    if not ok:
        sys.exit("No se bajó ninguna foto. ¿Está habilitado images.pexels.com?")
    cols, W, H = 4, 370, 290
    hoja = Image.new("RGB", (cols * W, ((len(ok) + cols - 1) // cols) * H), "white")
    dib = ImageDraw.Draw(hoja)
    for n, i in enumerate(ok):
        im = Image.open(os.path.join(carpeta, f"{i}.jpg")).convert("RGB")
        im.thumbnail((360, 260))
        x, y = (n % cols) * W, (n // cols) * H
        hoja.paste(im, (x, y))
        dib.text((x + 4, y + 266), f"{i}  {im.width}x{im.height}", fill="black")
    out = os.path.join(carpeta, "hoja.jpg")
    hoja.save(out, quality=82)
    print(f"{len(ok)} fotos. Mirá la hoja con Read: {out}")


def guardar(rubro, carpeta, pares):
    dst = os.path.join(REPO, "templates", "assets", rubro)
    os.makedirs(dst, exist_ok=True)
    cred_path = os.path.join(dst, "CREDITOS.json")
    cred = json.load(open(cred_path, encoding="utf-8")) if os.path.exists(cred_path) else {"_licencia": LICENCIA, "fotos": []}
    for par in pares:
        i, nombre = par.split(":", 1)
        im = Image.open(os.path.join(carpeta, f"{i}.jpg")).convert("RGB")
        im.thumbnail((1600, 1600))
        im.save(os.path.join(dst, f"{nombre}.jpg"), quality=78, optimize=True, progressive=True)
        cred["fotos"] = [c for c in cred["fotos"] if c["archivo"] != f"{nombre}.jpg"]
        cred["fotos"].append({"archivo": f"{nombre}.jpg", "pexels": f"https://www.pexels.com/photo/{i}/",
                              "ancho": im.width, "alto": im.height})
        print(f"  {nombre}.jpg ({im.width}x{im.height}, {'vertical' if im.height > im.width else 'horizontal'})")
    json.dump(cred, open(cred_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    total = sum(os.path.getsize(os.path.join(dst, f)) for f in os.listdir(dst)) // 1024
    print(f"Guardadas en {os.path.relpath(dst, REPO)} ({total} KB en total)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("ver")
    v.add_argument("ids", nargs="+")
    v.add_argument("--dir", required=True)
    g = sub.add_parser("guardar")
    g.add_argument("--rubro", required=True)
    g.add_argument("--dir", required=True)
    g.add_argument("pares", nargs="+", help="numero:nombre-del-archivo")
    a = ap.parse_args()
    ver(a.ids, a.dir) if a.cmd == "ver" else guardar(a.rubro, a.dir, a.pares)
