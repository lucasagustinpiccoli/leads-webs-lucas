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
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from buscar import cargar, slug  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
TEMPLATE = os.path.join(ROOT, "templates", "landing.html")

ICONOS = {
    "wa": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
    "pin": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    "tel": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    "reloj": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    "foto": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/></svg>',
    "fifteen": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7z"/><path d="M8 21h8"/></svg>',
    "rings": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="m10 4 2 3 2-3"/></svg>',
    "balloon": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3a6 6 0 0 1 6 6c0 4-3.5 7-6 7s-6-3-6-7a6 6 0 0 1 6-6z"/><path d="M12 16l-1 2h2l-1-2zM12 18c0 2-2 2-2 4"/></svg>',
    "briefcase": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
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
    # La paleta sale del nombre: cada demo se ve distinta pero siempre igual para el mismo negocio.
    paleta = base["paletas"][int(hashlib.md5(neg.encode()).hexdigest(), 16) % len(base["paletas"])]
    return {
        "_nota": "Editá lo que quieras y corré: python scripts/demo.py --render <este archivo>",
        "rubro": clave, "ranking": int(fila["ranking"]),
        "negocio": neg, "localidad": loc, "direccion": direccion_corta(fila["direccion"]), "telefono": fila["telefono"],
        "whatsapp": fila["whatsapp"], "rating": fila["rating"], "fotos_en_google": int(fila["fotos"] or 0),
        "link_maps": fila["link_maps"], "instagram": fila["web"] if "instagram.com" in fila["web"] else "",
        "horarios": "",
        "fotos": [],
        "paleta": paleta,
        **{k: (sub(v) if isinstance(v, str) else v) for k, v in base.items()
           if k not in ("_nota", "paletas")},
    }


def tarjetas_porque(d):
    cards = []
    r = fmt_rating(d["rating"])
    if r:
        cards.append((f"{r} ★", "Calificación en Google", "Así nos califican quienes ya festejaron con nosotros."))
    n = d["fotos_en_google"]
    if n >= 10:
        cards.append((f"+{n // 10 * 10}", "Fotos en Google", "Mirá cómo quedan los eventos antes de decidir."))
    for x in d["porque_extra"]:
        if len(cards) >= 3:
            break
        cards.append(("", x["titulo"], x["texto"]))
    return "".join(
        f'<div class="card">{f"<div class=grande>{e(g)}</div>" if g else ""}<h3>{e(t)}</h3><p>{e(p)}</p></div>'
        for g, t, p in cards[:3])


def render(d):
    wa = d["whatsapp"]
    wa_link = f"https://wa.me/{wa}?text={quote(d['mensaje_wa'])}" if wa else d["link_maps"]

    def boton(clase, texto):
        return f'<a class="btn btn-wa {clase}" href="{e(wa_link)}" target="_blank" rel="noopener">{ICONOS["wa"]}<span>{e(texto)}</span></a>'

    datos_contacto = [("pin", d["direccion"]), ("tel", d["telefono"]), ("reloj", d["horarios"])]
    filas = "".join(f'<div class="dato">{ICONOS[i]}<span>{e(v)}</span></div>' for i, v in datos_contacto if v)
    r = fmt_rating(d["rating"])
    tarjeta = ('<div class="tarjeta-rating">'
               + (f'<div class="num">{r}</div><div class="estrellas">★★★★★</div><small>Calificación en Google</small><hr>' if r else "")
               + filas + "</div>")
    tipos = "".join(f'<div class="card"><div class="ico">{ICONOS.get(t["icono"], ICONOS["fifteen"])}</div>'
                    f'<h3>{e(t["titulo"])}</h3><p>{e(t["texto"])}</p></div>' for t in d["tipos"])
    fotos = d["fotos"][:5]
    galeria = "".join(f'<div><img src="{e(u)}" alt="Evento en {e(d["negocio"])}" loading="lazy"></div>' for u in fotos)
    galeria += "".join(f'<div class="ph"><div>{ICONOS["foto"]}Foto de tus eventos</div></div>' for _ in range(5 - len(fotos)))
    contacto = (f'<h3 style="font-family:var(--titulo);font-size:26px;color:var(--oscuro)">{e(d["negocio"])}</h3>'
                + filas.replace('class="dato"', 'class="dato" style="opacity:1;color:var(--texto)"')
                + boton("", "Escribinos por WhatsApp"))
    if d.get("instagram"):
        contacto += f'<a href="{e(d["instagram"])}" target="_blank" rel="noopener" style="color:var(--primario);font-weight:600">Seguinos en Instagram →</a>'
    mapa = "https://www.google.com/maps?q=" + quote(f'{d["negocio"]}, {d["direccion"]}') + "&output=embed"

    valores = {
        **{k: e(str(v)) for k, v in d.items() if isinstance(v, (str, int, float))},
        **{k: e(v) for k, v in d["paleta"].items()},
        "boton_wa_nav": boton("btn-chico", "WhatsApp"), "boton_wa_hero": boton("", "Escribinos"),
        "boton_wa_flotante": f'<a class="wa-flotante" href="{e(wa_link)}" target="_blank" rel="noopener" aria-label="WhatsApp">{ICONOS["wa"]}</a>',
        "tarjeta_rating": tarjeta, "tipos_html": tipos, "porque_html": tarjetas_porque(d),
        "galeria_html": galeria, "contacto_html": contacto, "mapa_src": e(mapa),
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
        with open(os.path.join(os.path.dirname(a.render), "index.html"), "w", encoding="utf-8") as f:
            f.write(render(d))
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
        with open(os.path.join(carpeta, "index.html"), "w", encoding="utf-8") as f:
            f.write(render(d))
        print(f"  #{fila['ranking']} {fila['negocio']} -> {os.path.relpath(carpeta, ROOT)}/index.html")


if __name__ == "__main__":
    main()
