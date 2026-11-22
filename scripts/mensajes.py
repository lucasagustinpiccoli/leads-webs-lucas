#!/usr/bin/env python3
"""Paso 6: mensajes de contacto para los prospectos marcados para demo de una tanda.

Por cada prospecto arma, con sus datos públicos de Maps: el primer mensaje (día 0), el recordatorio (día 3), el último
toque (día 7), la versión para mensaje directo de Instagram y un link de wa.me con el primer mensaje ya escrito.
Si el prospecto tiene demo, el primer mensaje lleva su link; si no, lleva un ejemplo ya publicado.

No envía nada: Lucas copia y manda cada mensaje a mano.

Uso:
  python scripts/mensajes.py --base https://lumen-studio.pages.dev            # última tanda, solo los marcados para demo
  python scripts/mensajes.py --tanda output/tanda-01-2026-11-10.csv --todos
Guarda output/mensajes-{tanda}.csv (UTF-8 con BOM, abre bien en Excel y Google Sheets).
"""
import argparse
import csv
import glob
import importlib.util
import json
import os
import re
import sys
import unicodedata
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
BASE_POR_DEFECTO = "https://TU-DOMINIO.pages.dev"
EJEMPLO = BASE_POR_DEFECTO + "/oliva/"  # demo de muestra (Oliva Atelier) de la página madre, para prospectos sin demo

# Qué consigue quien los encuentra en Google, según el rubro. Un solo beneficio por mensaje.
BENEFICIO = {
    "Dentista": "pueda pedir turno con un toque",
    "Veterinaria": "pueda pedir turno con un toque",
    "Centro de estética": "pueda pedir turno con un toque",
    "Salón de eventos": "pueda consultar fechas y pedir presupuesto",
    "Academia": "pueda consultar y anotarse",
    "Estudio jurídico": "pueda hacer su consulta",
}
BENEFICIO_BASE = "pueda escribirte con un toque"

CAMPOS = ["ranking", "negocio", "rubro", "localidad", "canal", "whatsapp", "instagram", "demo", "link", "revisar",
          "mensaje_dia0", "mensaje_dia3", "mensaje_dia7", "mensaje_instagram", "link_wa_dia0"]


def cargar_demo():
    spec = importlib.util.spec_from_file_location("demo", os.path.join(ROOT, "scripts", "demo.py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def _sin_tildes(t):
    return unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()


def nombre_corto(negocio, datos=None, localidad=""):
    """'Casa Ramón - Eventos Boutique' -> 'Casa Ramón'; 'Sellaro Abogados. Ramos Mejía' -> 'Sellaro Abogados'.
    Un nombre_corto de datos.json manda."""
    if datos and datos.get("nombre_corto"):
        return datos["nombre_corto"]
    n = re.split(r"\s[-|]\s", negocio.strip())[0].strip()
    if localidad and _sin_tildes(n).endswith(_sin_tildes(localidad)):
        n = n[:len(n) - len(localidad)].rstrip(" .,-")
    return n


def rating_txt(r):
    try:
        return f"{float(r):.1f}".replace(".", ",")
    except (TypeError, ValueError):
        return ""


def presencia_txt(presencia):
    p = (presencia or "").lower()
    if "instagram" in p:
        return "todavía no tiene un sitio web propio, solo Instagram"
    if "gratuita" in p or "caída" in p:
        return "tiene una web gratuita que se puede mejorar"
    return "todavía no tiene un sitio web propio"


def mensajes(fila, link, con_demo, corto, ejemplo=EJEMPLO):
    """Devuelve (dia0, dia3, dia7, instagram) para una fila de la tanda."""
    r = rating_txt(fila["rating"])
    gancho = f"Vi que {corto} tiene {r} en Google Maps y {presencia_txt(fila['presencia'])}." if r else \
        f"Vi que {corto} {presencia_txt(fila['presencia'])}."
    beneficio = BENEFICIO.get(fila["rubro"], BENEFICIO_BASE)
    if con_demo:
        cuerpo = (f"Te armé una demo con tus datos para que veas cómo quedaría: {link}\n\n"
                  f"Tiene tu botón de WhatsApp y el mapa, para que quien te encuentre en Google {beneficio}. "
                  "Es solo una muestra, sin costo ni compromiso.\n\n"
                  "Si te gusta, la dejamos andando esta semana.")
        d3 = f"Hola, ¿pudiste ver la demo de {corto}? {link}\nSi querés cambiar algo, lo vemos."
    else:
        cuerpo = (f"Te dejo un ejemplo de una página que hice para otro negocio, con reserva de turnos: {ejemplo}\n\n"
                  f"Si te interesa, te armo la tuya con tus datos, con botón de WhatsApp y mapa, para que quien te encuentre en "
                  f"Google {beneficio}. La ves antes de decidir, sin costo ni compromiso.")
        d3 = f"Hola, ¿pudiste ver el ejemplo que te mandé? {ejemplo}\nSi te sirve, te preparo la de {corto} y la ves antes de decidir."
    dia0 = f"Hola, ¿hablo con {corto}? Soy Lucas, diseño páginas web para negocios de la zona.\n\n{gancho} {cuerpo}"
    dia7 = (f"Hola, te escribo por última vez para no molestar. Esta semana tengo lugar para entregar la página de {corto} rápido. "
            "Si querés avanzar, te mando por escrito qué incluye y cuánto cuesta (desde USD 180). "
            "Si no es el momento, no hay problema.")
    ig = dia0.replace(f"Hola, ¿hablo con {corto}?", "Hola, ¿cómo andan?", 1)
    return dia0, d3, dia7, ig


def revisar_txt(fila, con_demo):
    notas = []
    if fila.get("notas"):
        notas.append(fila["notas"])
    if not con_demo:
        notas.append("Sin demo todavía: va con el ejemplo")
    return "; ".join(notas)


def armar(filas, base, demo_mod, solo_demos=True):
    salida = []
    for f in filas:
        if solo_demos and f["demo"] != "Sí":
            continue
        carpeta = f"{int(f['ranking']):02d}-{demo_mod.slug(f['negocio'])[:40]}"
        ruta = os.path.join(OUT, "demos", carpeta)
        con_demo = os.path.exists(os.path.join(ruta, "index.html"))
        datos = None
        if con_demo and os.path.exists(os.path.join(ruta, "datos.json")):
            with open(os.path.join(ruta, "datos.json"), encoding="utf-8") as fh:
                datos = json.load(fh)
        corto = nombre_corto(f["negocio"], datos, f["localidad"])
        ejemplo = f"{base.rstrip('/')}/oliva/"
        link = f"{base.rstrip('/')}/demos/{carpeta}/" if con_demo else ejemplo
        d0, d3, d7, ig = mensajes(f, link, con_demo, corto, ejemplo)
        instagram = f["web"] if "instagram.com" in (f["web"] or "") else ""
        wa = f["whatsapp"]
        salida.append({
            "ranking": f["ranking"], "negocio": corto, "rubro": f["rubro"], "localidad": f["localidad"],
            "canal": "WhatsApp" if wa else ("Instagram" if instagram else "Llamar"),
            "whatsapp": wa, "instagram": instagram, "demo": "Sí" if con_demo else "No", "link": link,
            "revisar": revisar_txt(f, con_demo),
            "mensaje_dia0": d0, "mensaje_dia3": d3, "mensaje_dia7": d7, "mensaje_instagram": ig,
            "link_wa_dia0": f"https://wa.me/{wa}?text={quote(d0)}" if wa else "",
        })
    return salida


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tanda")
    ap.add_argument("--base", default=BASE_POR_DEFECTO, help="dirección donde está publicada la página madre")
    ap.add_argument("--todos", action="store_true", help="todos los prospectos de la tanda, no solo los marcados para demo")
    a = ap.parse_args()
    tanda = a.tanda or sorted(glob.glob(os.path.join(OUT, "tanda-*.csv")))[-1]
    with open(tanda, encoding="utf-8-sig") as fh:
        filas = list(csv.DictReader(fh))
    demo_mod = cargar_demo()
    res = armar(filas, a.base, demo_mod, solo_demos=not a.todos)
    if not res:
        sys.exit("No hay prospectos con ese criterio.")
    nombre = os.path.basename(tanda).replace("tanda-", "mensajes-")
    destino = os.path.join(OUT, nombre)
    with open(destino, "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(res)
    con = sum(1 for r in res if r["demo"] == "Sí")
    print(f"{len(res)} prospectos ({con} con demo, {len(res) - con} con ejemplo) -> {os.path.relpath(destino, ROOT)}")
    if a.base == BASE_POR_DEFECTO:
        print(f"Falta la dirección real: volvé a correr con --base https://tu-dominio (hoy los links dicen {BASE_POR_DEFECTO}).")


if __name__ == "__main__":
    main()
