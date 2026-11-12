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
Textos base por rubro: config/landing/{rubro}.json. Para sumar un rubro, ver el skill landing-rubro-nuevo.
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
    # Logo oficial de WhatsApp, del paquete simple-icons 13.21.0 (licencia CC0).
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
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
    """'Av. Mitre 4371, B1678AVG Caseros, Provincia de Buenos Aires, Argentina' -> 'Av. Mitre 4371, Caseros'.
    También saca prefijos basura que a veces trae Maps: 'END Ramos Mejía Buenos Aires AR, Av. Gaona 2009' -> 'Av. Gaona 2009'."""
    d = re.sub(r",?\s*Argentina$", "", d or "")
    d = re.sub(r",?\s*Provincia de Buenos Aires", "", d)
    d = re.sub(r"\b[A-Z]\d{4}[A-Z]{0,3}\s*", "", d).strip(" ,")
    partes = [x.strip() for x in d.split(",") if x.strip()]
    while len(partes) > 1 and not re.search(r"\d", partes[0]) and re.search(r"(\bAR$|Buenos Aires|^[A-Z]{2,4}\s)", partes[0]):
        partes.pop(0)
    return ", ".join(partes)


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
    """Copia las fotos de stock y arma una versión de 800 px de cada una (en el celular carga mucho más rápido)."""
    from PIL import Image
    src = os.path.join(ROOT, "templates", "assets", d["rubro"])
    dst = os.path.join(carpeta, "img")
    os.makedirs(dst, exist_ok=True)
    for n in {d["hero_stock"], *d["galeria_stock"], *(t["imagen"] for t in d["tipos"])}:
        shutil.copyfile(os.path.join(src, n), os.path.join(dst, n))
        chica = os.path.join(dst, chica_nombre(n))
        if not os.path.exists(chica):
            im = Image.open(os.path.join(src, n)).convert("RGB")
            im.thumbnail((800, 800))
            im.save(chica, quality=74, optimize=True, progressive=True)


def chica_nombre(n):
    base, ext = os.path.splitext(n)
    return f"{base}-800{ext}"


def srcset(u, sizes):
    """Atributos srcset/sizes para las fotos de stock locales (img/...). Las fotos del cliente van tal cual."""
    if not u.startswith("img/"):
        return ""
    return f'srcset="{e("img/" + chica_nombre(u[4:]))} 800w, {e(u)} 1600w" sizes="{sizes}"'


def titular_html(t):
    """'Tu fiesta, como la *imaginaste*.' -> la palabra entre asteriscos va en cursiva (misma familia tipográfica)."""
    return re.sub(r"\*([^*]+)\*", r"<em>\1</em>", e(t))


def render(d):
    wa = d["whatsapp"]
    wa_link = f"https://wa.me/{wa}?text={quote(d['mensaje_wa'])}" if wa else d["link_maps"]

    def boton_wa(clase):
        return (f'<a class="btn {clase}" href="{e(wa_link)}" target="_blank" rel="noopener">'
                f'{ICONOS["wa"]}<span>WhatsApp</span></a>')

    hero, gal, img_tipo = imagenes(d)
    r = fmt_rating(d["rating"])  # el rating va en los datos de abajo, nunca en el hero

    datos = []
    if r:
        datos.append((r, "de calificación en Google"))
    if d["fotos_en_google"] >= 10:
        datos.append((f'+{d["fotos_en_google"] // 10 * 10}', d["fotos_label"]))
    datos.append((d["localidad"], d["direccion"]))
    datos_html = "".join(f"<div><b>{e(a)}</b><span>{e(b)}</span></div>" for a, b in datos[:3])

    tipos = "".join(
        f'<article><div class="tipo"><img src="{e(img_tipo[t["titulo"]])}" {srcset(img_tipo[t["titulo"]], "(max-width: 767px) 70vw, 25vw")} '
        f'alt="" loading="lazy"></div>'
        f'<div class="tipo-pie"><h3>{e(t["titulo"])}</h3><p>{e(t["texto"])}</p></div></article>' for t in d["tipos"])
    galeria = "".join(f'<figure><img src="{e(u)}" {srcset(u, "(max-width: 767px) 50vw, 33vw")} alt="{e(d["alt_galeria"])}" '
                      f'loading="lazy"></figure>' for u in gal)

    # Teléfono y dirección como links: en el celular abren el discador y la app de mapas.
    tel_digits = re.sub(r"[^\d+]", "", d["telefono"] or "")
    tel_html = f'<a href="tel:{e(tel_digits)}">{e(d["telefono"])}</a>' if tel_digits else ""
    maps_dir = "https://www.google.com/maps/search/?api=1&query=" + quote(f'{d["negocio"]}, {d["direccion"]}')
    contacto = "".join(f"<div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in
                       [("Dirección", f'<a href="{e(maps_dir)}" target="_blank" rel="noopener">{e(d["direccion"])}</a>'),
                        ("Teléfono", tel_html), ("Horarios", e(d["horarios"]))] if v)
    ig = d.get("instagram", "")
    partes = [x for x in urlparse(ig).path.split("/") if x] if ig else []
    ig_user = "@" + partes[0] if partes and partes[0] not in ("p", "reel", "explore") else ("Instagram" if ig else "")
    instagram_html = (f'<a class="btn btn-borde" href="{e(ig)}" target="_blank" rel="noopener">{e(ig_user)}</a>') if ig else ""
    instagram_pie = (f'<a href="{e(ig)}" target="_blank" rel="noopener">{e(ig_user)}</a>' if ig
                     else f'<a href="{e(wa_link)}" target="_blank" rel="noopener">WhatsApp</a>')

    # "nombre_corto" (opcional en datos.json) reemplaza al nombre de Maps en el footer, para nombres largos o tipo keyword.
    corto = (d.get("nombre_corto") or re.split(r"\s[-|]\s", d["negocio"])[0]).strip()
    # Con nombres largos el mínimo baja, así el nombre gigante entra en el celular y no queda cortado.
    minimo = min(48, round(650 / max(len(corto), 1)))
    gigante = f'<span style="font-size:clamp({minimo}px,{min(13, round(150 / max(len(corto), 1), 1))}vw,210px)">{e(corto)}</span>'
    mapa = "https://www.google.com/maps?q=" + quote(f'{d["negocio"]}, {d["direccion"]}') + "&output=embed"

    tema = {"enfasis_estilo": "italic", "enfasis_peso": "inherit", **d["tema"]}
    hero_set = srcset(hero, "100vw")
    valores = {
        **{k: e(str(v)) for k, v in d.items() if isinstance(v, (str, int, float))},
        **{k: str(v) for k, v in tema.items()},  # valores CSS del tema (fuentes, colores, énfasis)
        "hero_img": e(hero), "hero_srcset": hero_set,
        "hero_preload_srcset": hero_set.replace("srcset=", "imagesrcset=").replace("sizes=", "imagesizes="),
        "titular_html": titular_html(d["titular"]), "titular": e(d["titular"].replace("*", "")),
        # los textos grandes también aceptan *énfasis* en cursiva
        **{k: titular_html(d[k]) for k in ("intro", "banda", "seccion_tipos", "seccion_galeria", "seccion_ubicacion") if k in d},
        "meta_descripcion": e(d["meta_descripcion"].replace("*", "")),
        "datos_html": datos_html, "tipos_html": tipos,
        "galeria_html": galeria, "contacto_html": contacto, "instagram_html": instagram_html,
        "instagram_pie": instagram_pie, "negocio_corto": gigante, "mapa_src": e(mapa), "telefono_html": tel_html or "WhatsApp",
        "boton_wa_hero": boton_wa("btn-vidrio"), "boton_wa_ubicacion": boton_wa("btn-oscuro"),
        "boton_wa_flotante": f'<a class="wa-flotante" href="{e(wa_link)}" target="_blank" rel="noopener" aria-label="WhatsApp">{ICONOS["wa"]}</a>',
        "boton_wa_barra": f'<a class="btn btn-wa" href="{e(wa_link)}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">{ICONOS["wa"]}</a>',
        "form_html": formulario(d["form"]), "form_boton": e(d["form"]["boton"]),
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


def chips(label, name, opciones, extra_attr=""):
    """Grupo de opciones grandes para tocar con el pulgar (radio buttons con forma de píldora)."""
    ops = "".join(f'<label class="chip"><input type="radio" name="{name}" value="{e(o)}"><span>{e(o)}</span></label>' for o in opciones)
    return f'<fieldset data-etiqueta="{e(label)}"><legend>{e(label)}</legend><div class="chips"{extra_attr}>{ops}</div></fieldset>'


def formulario(fm):
    """Campos del formulario según el rubro. Cada campo con data-etiqueta se suma al mensaje de WhatsApp.

    modo "turno" (consultorios, veterinarias, estética...): motivo, extras, próximos días y franja, todo con opciones
    para tocar, como el recorrido de reserva de Colo Studio. modo "presupuesto" (salones...): tipo, fecha y cantidad."""
    c = []
    modo = fm.get("modo", "presupuesto")
    if fm.get("tipos"):
        c.append(chips(fm["tipo_label"], "tipo", fm["tipos"]))
    for i, x in enumerate(fm.get("extras", [])):
        c.append(chips(x["label"], f"extra{i}", x["opciones"]))
    if modo == "turno":
        dias = ",".join(str(n) for n in fm.get("dias", [1, 2, 3, 4, 5, 6]))
        c.append(f'<fieldset data-etiqueta="{e(fm.get("dia_label", "Día preferido"))}"><legend>{e(fm.get("dia_label", "Día preferido"))}</legend>'
                 f'<div class="chips" data-dias="{dias}"></div></fieldset>')
        if fm.get("franjas"):
            c.append(chips(fm.get("franja_label", "Horario"), "franja", fm["franjas"]))
    else:
        fila = []
        if fm.get("fecha_label"):
            fila.append(f'<label>{e(fm["fecha_label"])}<input name="fecha" type="date" data-etiqueta="{e(fm["fecha_label"])}"></label>')
        if fm.get("cantidad_label"):
            fila.append(f'<label>{e(fm["cantidad_label"])}<input name="cantidad" type="number" min="1" inputmode="numeric" '
                        f'data-etiqueta="{e(fm["cantidad_label"])}"></label>')
        if fila:
            c.append('<div class="fila">' + "".join(fila) + "</div>")
    c.append('<label>Tu nombre<input name="nombre" autocomplete="name" required aria-describedby="form-error">'
             '<span class="error" id="form-error" role="alert">Escribí tu nombre para que sepamos a quién responder.</span></label>')
    c.append(f'<label>{e(fm["extra_label"])} <span class="opcional">(opcional)</span>'
             f'<textarea name="extra" rows="3" data-etiqueta=""></textarea></label>')
    return "\n          ".join(c)


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
