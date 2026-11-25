#!/usr/bin/env python3
"""Paso 6: mensajes de contacto para los prospectos marcados para demo de una tanda.

Por cada prospecto arma, con sus datos públicos de Maps: dos mensajes seguidos para el día 0 (observación y oferta con pregunta),
la respuesta para cuando dicen que sí (lleva el link de la demo si existe, o un ejemplo), el recordatorio (día 3), el último
toque (día 7), la versión para mensaje directo de Instagram y un link de wa.me con el primer mensaje ya escrito.

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
BASE_POR_DEFECTO = json.load(open(os.path.join(ROOT, "config", "sitio.json"), encoding="utf-8"))["url"]  # dirección real del sitio (config/sitio.json)
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
RUBROS_TURNOS = {"Dentista", "Veterinaria", "Centro de estética", "Consultorio / centro médico"}
TURNOS = ", con reserva de turnos"

CAMPOS = ["ranking", "negocio", "rubro", "localidad", "canal", "whatsapp", "instagram", "demo", "link", "revisar",
          "mensaje_dia0", "mensaje_dia0b", "mensaje_si", "mensaje_dia3", "mensaje_dia7", "mensaje_instagram", "link_wa_dia0"]


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
    """Devuelve un dict con los textos de una fila de la tanda.

    El primer contacto va en dos mensajes seguidos (día 0): una observación y una oferta que termina en pregunta.
    La demo (o el ejemplo) se manda solo si responden que sí ("si"). Día 3 y día 7 son los recordatorios.
    """
    try:
        buena = float(str(fila["rating"]).replace(",", ".")) >= 4.4
    except ValueError:
        buena = False
    pres = (fila.get("presencia") or "").lower()
    if "gratuita" in pres or "caída" in pres:
        sin_web = "me di cuenta de que su web actual se puede mejorar"
    else:
        sin_web = "me di cuenta de que todavía no tienen página web"
    if con_demo:
        # leads con demo ya armada: un solo mensaje, con el link adentro (texto de Lucas)
        r = rating_txt(fila["rating"])
        gusto = f"las buenas reseñas que tienen en Google ({r})" if buena and r else "lo que hacen"
        verbo = "gustaron" if buena and r else "gustó"
        falta = ("noté que su web actual se puede mejorar, así que armamos una demo de cómo podría ser tu página"
                 if ("gratuita" in pres or "caída" in pres) else
                 "noté que aún no tiene un sitio web propio, así que armamos una demo de cómo podría ser tu página")
        uno = (f"Hola! Soy Lucas de Halo Studio, diseñamos páginas web que ayudan a convertir visitas en clientes. "
               f"Conocí {corto} y me {verbo} {gusto}, pero {falta}: {link}. No tiene costo ni compromiso. "
               "Si te interesa, la ajustamos con vos. ¿La mirás y me contás qué te parece?")
        si = "¡Buenísimo! Contame qué cambiarías (textos, colores, fotos) y la ajustamos. Cuando quede como querés, te paso por escrito qué incluye, cuánto cuesta y el plazo."
        d3 = f"Hola! ¿Pudiste mirar la demo de {corto}? {link}\nSi querés cambiar algo, la ajustamos."
        d7 = (f"Hola! Te escribo por última vez para no molestar. Si en algún momento querés retomar la página de {corto}, "
              "avisame y seguimos. Y si preferís que no te escribamos más, respondé \"baja\".")
        return {"dia0": uno, "dia0b": "", "si": si, "dia3": d3, "dia7": d7, "instagram": uno}
    if buena:
        uno = f"Hola! Soy Lucas de Halo Studio. Vi {corto} y, a pesar de tener tan buenas reseñas en Google, {sin_web}."
    else:
        uno = f"Hola! Soy Lucas de Halo Studio. Vi {corto} y {sin_web}."
    dos = ("Nos dedicamos a diseñar páginas web y te puedo mostrar cómo quedaría la tuya con una demo sin costo y sin compromiso. "
           "Si no te convence, no pagás nada. ¿Te interesa que te la prepare?")
    if con_demo:
        si = f"¡Genial! Ya te dejé armada la demo de {corto}, mirala acá: {link}\nSi querés cambiar algo, lo vemos."
        d3 = f"Hola! Te escribo por si se te pasó mi mensaje. Si querés, te muestro la demo que armé de {corto} para que la veas antes de decidir. ¿Te interesa?"
    else:
        si = (f"¡Genial! Te la preparo con los datos públicos de tu negocio y te aviso cuando esté lista. "
              f"Mientras tanto, te dejo un ejemplo de una página que hice: {ejemplo}")
        d3 = f"Hola! Te escribo por si se te pasó mi mensaje. Si querés, te preparo la demo de {corto} para que la veas antes de decidir. ¿Te interesa?"
    d7 = (f"Hola! Te escribo por última vez para no molestar. Si en algún momento querés ver cómo quedaría la página de {corto}, "
          "avisame y te la preparo. Y si preferís que no te escribamos más, respondé \"baja\".")
    return {"dia0": uno, "dia0b": dos, "si": si, "dia3": d3, "dia7": d7, "instagram": uno + "\n\n" + dos}


def revisar_txt(fila, con_demo):
    notas = []
    if fila.get("notas"):
        notas.append(fila["notas"])
    if con_demo:
        notas.append("Personalizar el \"me gustó\" si podés (ahora sale de la calificación de Maps)")
    else:
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
        m = mensajes(f, link, con_demo, corto, ejemplo)
        instagram = f["web"] if "instagram.com" in (f["web"] or "") else ""
        wa = f["whatsapp"]
        salida.append({
            "ranking": f["ranking"], "negocio": corto, "rubro": f["rubro"], "localidad": f["localidad"],
            "canal": "WhatsApp" if wa else ("Instagram" if instagram else "Llamar"),
            "whatsapp": wa, "instagram": instagram, "demo": "Sí" if con_demo else "No", "link": link,
            "revisar": revisar_txt(f, con_demo),
            "mensaje_dia0": m["dia0"], "mensaje_dia0b": m["dia0b"], "mensaje_si": m["si"], "mensaje_dia3": m["dia3"],
            "mensaje_dia7": m["dia7"], "mensaje_instagram": m["instagram"],
            "link_wa_dia0": f"https://wa.me/{wa}?text={quote(m['dia0'])}" if wa else "",
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


if __name__ == "__main__":
    main()
