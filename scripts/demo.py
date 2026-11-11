"""Genera la demo (landing) de un prospecto a partir de una fila de la tanda.

Uso:
  python scripts/demo.py --ranking 4                      -> demo del puesto 4 de la última tanda
  python scripts/demo.py --demos --rubro salon_eventos    -> todas las marcadas "Sí" de ese rubro
  python scripts/demo.py --render output/demos/04-lu-pa-eventos/datos.json   -> regenera tras editar el JSON
  (--tanda output/tanda-01-....csv para elegir otra tanda)

Cada demo queda en output/demos/{ranking}-{negocio}/ con:
  datos.json  todo lo que muestra la página: datos reales del negocio + textos base del rubro. Editable.
  index.html  la landing lista para abrir o subir.

Para agregar fotos reales: poné URLs o rutas en "fotos" dentro de datos.json y corré --render.
Textos base por rubro: config/landing/{rubro}.json (hoy: salon_eventos).
"""
import argparse
import csv
import glob
import hashlib
import html
import json
import os
import re
import shutil
import sys
from urllib.parse import quote, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from buscar import cargar, slug  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
TEMPLATE = os.path.join(ROOT, "templates", "landing.html")

ICONOS = {
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
}

e = html.escape


def rubro_clave(nombre_rubro):
    for k, v in cargar("rubros.json").items():
        if v["nombre"] == nombre_rubro or k == nombre_rubro:
            return k
    sys.exit(f"Rubro desconocido: {nombre_rubro}")


def ultima_tanda():
    t = sorted(glob.glob(os.path.join(OUT, "tanda-*.csv")))
    if not t:
        sys.exit("No hay tandas en output/. Corré scripts/rankear.py primero.")
    return t[-1]


def fmt_rating(r):
    try:
        return f"{float(r):.1f}".replace(".", ",")
    except (TypeError, ValueError):
        return ""


def direccion_corta(d):
    """'Av. Mitre 4371, B1678AVG Caseros, Provincia de Buenos Aires, Argentina' -> 'Av. Mitre 4371, Caseros'."""
    d = re.sub(r",?\s*Argentina$", "", d or "")
    d = re.sub(r",?\s*Provincia de Buenos Aires", "", d)
    return re.sub(r"\b[A-Z]\d{4}[A-Z]{0,3}\s*", "", d).strip(" ,")


def _hash(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


def armar_datos(fila):
    """Fila de la tanda + textos base del rubro -> datos.json (todo resuelto, listo para editar)."""
    clave = rubro_clave(fila["rubro"])
    path = os.path.join(ROOT, "config", "landing", f"{clave}.json")
    if not os.path.exists(path):
        sys.exit(f"Todavía no hay plantilla para {fila['rubro']}: falta config/landing/{clave}.json")
    with open(path, encoding="utf-8") as f:
        base = json.load(f)
    neg, loc = fila["negocio"].strip(), fila["localidad"]
    sub = lambda s: s.replace("{negocio}", neg).replace("{localidad}", loc)  # noqa: E731
    # Tema, foto principal y galería rotan según el puesto en la tanda (así las demos de un mismo lote no se repiten)
    # y el nombre desempata. Quedan guardados en datos.json, así que no cambian al regenerar.
    n = int(fila["ranking"])
    h = _hash(neg)
    imgs = base["imagenes"]
    hero = imgs["hero"][n % len(imgs["hero"])]
    pool = [x for x in imgs["galeria"] if x != hero]
    k = (n * 2 + h) % len(pool)
    galeria = (pool[k:] + pool[:k])[:5]
    return {
        "_nota": "Editá lo que quieras y corré: python scripts/demo.py --render <este archivo>. "
                 "En 'fotos' poné las fotos reales del cliente (URLs o rutas): la primera va al hero y las siguientes a la galería.",
        "rubro": clave, "ranking": int(fila["ranking"]),
        "negocio": neg, "localidad": loc, "direccion": direccion_corta(fila["direccion"]), "telefono": fila["telefono"],
        "whatsapp": fila["whatsapp"], "rating": fila["rating"], "fotos_en_google": int(fila["fotos"] or 0),
        "link_maps": fila["link_maps"], "instagram": fila["web"] if "instagram.com" in fila["web"] else "",
        "horarios": "",
        "fotos": [],
        "tema": base["temas"][n % len(base["temas"])],
        "hero_stock": hero, "galeria_stock": galeria,
        **{k2: (sub(v) if isinstance(v, str) else v) for k2, v in base.items()
           if k2 not in ("_nota", "temas", "imagenes")},
    }


def imagenes(d):
    """Devuelve (hero, [galeria x5], {tipo: img}) usando las fotos reales si las hay y el stock para completar."""
    stock = lambda n: f"img/{n}"  # noqa: E731
    reales = list(d.get("fotos") or [])
    hero = reales[0] if reales else stock(d["hero_stock"])
    gal = reales[1:6] + [stock(n) for n in d["galeria_stock"]]
    return hero, gal[:5], {t["titulo"]: stock(t["imagen"]) for t in d["tipos"]}


def copiar_stock(d, carpeta):
    src = os.path.join(ROOT, "templates", "assets", d["rubro"])
    dst = os.path.join(carpeta, "img")
    os.makedirs(dst, exist_ok=True)
    for n in {d["hero_stock"], *d["galeria_stock"], *(t["imagen"] for t in d["tipos"])}:
        shutil.copyfile(os.path.join(src, n), os.path.join(dst, n))


def render(d):
    wa = d["whatsapp"]
    wa_link = f"https://wa.me/{wa}?text={quote(d['mensaje_wa'])}" if wa else d["link_maps"]

    def boton_wa(clase):
        return (f'<a class="btn {clase}" href="{e(wa_link)}" target="_blank" rel="noopener">'
                f'{ICONOS["wa"]}<span>WhatsApp</span></a>')

    hero, gal, img_tipo = imagenes(d)
    r = fmt_rating(d["rating"])
    rating = (f'<div class="rating entra"><b>{r}</b><span>Calificación en Google</span></div>' if r else "")

    datos = []
    if r:
        datos.append((r, "de calificación en Google"))
    if d["fotos_en_google"] >= 10:
        datos.append((f'+{d["fotos_en_google"] // 10 * 10}', "fotos del salón en Google"))
    datos.append((d["localidad"], d["direccion"]))
    datos_html = "".join(f"<div><b>{e(a)}</b><span>{e(b)}</span></div>" for a, b in datos[:3])

    tipos = "".join(
        f'<article><div class="tipo"><img src="{e(img_tipo[t["titulo"]])}" alt="" loading="lazy"></div>'
        f'<div class="tipo-pie"><h3>{e(t["titulo"])}</h3><p>{e(t["texto"])}</p></div></article>' for t in d["tipos"])
    galeria = "".join(f'<figure><img src="{e(u)}" alt="Ambientación de un evento" loading="lazy"></figure>' for u in gal)

    contacto = "".join(f"<div><dt>{e(k)}</dt><dd>{e(v)}</dd></div>" for k, v in
                       [("Dirección", d["direccion"]), ("Teléfono", d["telefono"]), ("Horarios", d["horarios"])] if v)
    ig = d.get("instagram", "")
    partes = [x for x in urlparse(ig).path.split("/") if x] if ig else []
    ig_user = "@" + partes[0] if partes and partes[0] not in ("p", "reel", "explore") else ("Instagram" if ig else "")
    instagram_html = (f'<a class="btn btn-chico" style="background:transparent;border:1px solid var(--linea)" href="{e(ig)}" '
                      f'target="_blank" rel="noopener">{e(ig_user)}</a>') if ig else ""
    instagram_pie = f'<a href="{e(ig)}" target="_blank" rel="noopener">{e(ig_user)}</a>' if ig else "WhatsApp"

    corto = re.split(r"\s[-|]\s", d["negocio"])[0].strip()
    gigante = f'<span style="font-size:clamp(48px,{min(13, round(150 / max(len(corto), 1), 1))}vw,210px)">{e(corto)}</span>'
    mapa = "https://www.google.com/maps?q=" + quote(f'{d["negocio"]}, {d["direccion"]}') + "&output=embed"

    valores = {
        **{k: e(str(v)) for k, v in d.items() if isinstance(v, (str, int, float))},
        **{k: str(v) for k, v in d["tema"].items()},  # valores CSS del tema (fuentes, colores)
        "hero_img": e(hero), "rating_html": rating, "datos_html": datos_html, "tipos_html": tipos,
        "galeria_html": galeria, "contacto_html": contacto, "instagram_html": instagram_html,
        "instagram_pie": instagram_pie, "negocio_corto": gigante, "mapa_src": e(mapa),
        "boton_wa_hero": boton_wa("btn-vidrio"), "boton_wa_ubicacion": boton_wa("btn-oscuro"),
        "boton_wa_flotante": f'<a class="wa-flotante" href="{e(wa_link)}" target="_blank" rel="noopener" aria-label="WhatsApp">{ICONOS["wa"]}</a>',
        "form_opciones": "".join(f"<option>{e(o)}</option>" for o in d["form_tipos"]),
        "icono_wa": ICONOS["wa"], "mensaje_wa_json": json.dumps(d["mensaje_wa"], ensure_ascii=False).replace("<", "\\u003c"),
    }
    with open(TEMPLATE, encoding="utf-8") as f:
        out = f.read()
    for k, v in valores.items():
        out = out.replace("{{" + k + "}}", str(v))
    if "{{" in out:
        falta = out[out.index("{{"):out.index("{{") + 40]
        sys.exit(f"Quedó un campo sin completar en la plantilla: {falta}")
    return out


def escribir(d, carpeta):
    copiar_stock(d, carpeta)
    with open(os.path.join(carpeta, "index.html"), "w", encoding="utf-8") as f:
        f.write(render(d))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tanda")
    ap.add_argument("--ranking", type=int)
    ap.add_argument("--demos", action="store_true", help="todas las marcadas para demo")
    ap.add_argument("--rubro", help="filtrar --demos por rubro (clave de config/rubros.json)")
    ap.add_argument("--render", help="regenerar index.html desde un datos.json editado")
    a = ap.parse_args()

    if a.render:
        with open(a.render, encoding="utf-8") as f:
            d = json.load(f)
        escribir(d, os.path.dirname(a.render))
        print(f"Regenerada: {os.path.relpath(os.path.dirname(a.render), ROOT)}/index.html")
        return

    with open(a.tanda or ultima_tanda(), encoding="utf-8-sig") as f:
        filas = list(csv.DictReader(f))
    if a.ranking:
        elegidas = [x for x in filas if int(x["ranking"]) == a.ranking]
    elif a.demos:
        elegidas = [x for x in filas if x["demo"] == "Sí" and (not a.rubro or rubro_clave(x["rubro"]) == a.rubro)]
    else:
        ap.error("usá --ranking N, --demos o --render")
    if not elegidas:
        sys.exit("No encontré prospectos con ese criterio.")
    for fila in elegidas:
        carpeta = os.path.join(OUT, "demos", f"{int(fila['ranking']):02d}-{slug(fila['negocio'])[:40]}")
        jp = os.path.join(carpeta, "datos.json")
        if os.path.exists(jp):  # no pisar ediciones: si ya existe, se regenera desde el JSON
            with open(jp, encoding="utf-8") as f:
                d = json.load(f)
        else:
            d = armar_datos(fila)
            os.makedirs(carpeta, exist_ok=True)
            with open(jp, "w", encoding="utf-8") as f:
                json.dump(d, f, ensure_ascii=False, indent=2)
        escribir(d, carpeta)
        print(f"  #{fila['ranking']} {fila['negocio']} -> {os.path.relpath(carpeta, ROOT)}/index.html")


if __name__ == "__main__":
    main()
