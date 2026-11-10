"""Filtra y rankea los negocios scrapeados y arma una tanda de prospectos.

Uso:
  python scripts/rankear.py                 -> toma todo output/raw/maps-*.json y arma la próxima tanda de 100
  python scripts/rankear.py --tamano 50 --demos 10

Qué hace:
  1. Junta todos los raw, saca duplicados (por place_id y por teléfono repetido) y los ya entregados en tandas
     anteriores (output/entregados.json).
  2. Filtro: se quedan solo los que NO tienen web propia (sin web, solo Instagram/Facebook, agregador de links,
     WhatsApp o web gratuita/caída). Saca cerrados, cadenas e instituciones (config/excluir.json).
  3. Puntaje 0-100 y ranking. Los mejores N (--demos) quedan marcados para demo.
  4. Escribe output/tanda-NN-{fecha}.csv y suma esos place_id a output/entregados.json.
     Los que no entraron en la tanda quedan para la próxima.
"""
import argparse
import csv
import datetime as dt
import glob
import json
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from buscar import cargar, whatsapp  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
ENTREGADOS = os.path.join(OUT, "entregados.json")

COLUMNAS = ["ranking", "puntaje", "demo", "motivo", "negocio", "rubro", "categoria", "localidad", "direccion",
            "telefono", "whatsapp", "rating", "fotos", "presencia", "web", "horario_hoy", "link_maps", "notas",
            "place_id"]

# Rubros con más margen primero (plan: clínicas, dentistas, estudios, veterinarias antes que negocios chicos).
PESO_RUBRO = {"dentista": 10, "clinica": 10, "abogado": 10, "salon_eventos": 10, "veterinaria": 9, "idiomas": 9,
              "estetica": 9, "contador": 8, "academia": 8, "ropa": 7}

AGREGADORES = ("linktr.ee", "linkin.bio", "beacons.ai", "taplink", "bio.link", "msha.ke", "lnk.bio", "linkbio",
               "wa.me", "api.whatsapp.com", "wa.link", "whatsapp.com")
GRATUITAS = ("business.site", "sites.google.com", "wixsite.com", "blogspot.", "wordpress.com", "negocio.site",
             "ueniweb.com", "godaddysites.com", "mercadoshops", "my.canva.site")


def sin_acentos(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()


def presencia(web):
    w = (web or "").lower()
    if not w:
        return "Sin web"
    if "instagram.com" in w:
        return "Solo Instagram"
    if "facebook.com" in w or "fb.me" in w or "fb.com" in w:
        return "Solo Facebook"
    if any(a in w for a in AGREGADORES):
        return "Agregador / WhatsApp"
    if any(g in w for g in GRATUITAS):
        return "Web gratuita o caída"
    return "Web propia"


def puntuar(n):
    """Devuelve (puntaje, motivos). Sin cantidad de reseñas: en vista limitada Google no la da."""
    pts, mot = 0, []
    r = n["rating"] if isinstance(n["rating"], (int, float)) else None
    if r is None:
        mot.append("sin rating")
    elif r >= 5:
        pts += 26; mot.append("5,0 ⭐ (probablemente pocas reseñas)")
    elif r >= 4.7:
        pts += 30; mot.append(f"{r} ⭐")
    elif r >= 4.4:
        pts += 24; mot.append(f"{r} ⭐")
    elif r >= 4.0:
        pts += 14
    else:
        pts += 4; mot.append(f"rating bajo ({r})")

    f = n["fotos"] or 0
    if f >= 20:
        pts += 20; mot.append(f"{f} fotos")
    elif f >= 5:
        pts += 13; mot.append(f"{f} fotos")
    elif f >= 1:
        pts += 6
    else:
        mot.append("sin fotos")

    tel = n["telefono"]
    if tel.replace(" ", "").startswith("+549"):
        pts += 20; mot.append("celular (WA)")
    elif tel:
        pts += 12
    else:
        mot.append("sin teléfono")

    pres = n["presencia"]
    pts += {"Solo Instagram": 20, "Solo Facebook": 17, "Agregador / WhatsApp": 17, "Web gratuita o caída": 15,
            "Sin web": 14}.get(pres, 0)
    mot.append(pres.lower())

    pts += PESO_RUBRO.get(n["rubro_clave"], 5)
    if n["fuera_de_zona"]:
        pts -= 10; mot.append("verificar zona")
    return max(0, min(100, pts)), mot


def cargar_raw():
    lugares = {}
    for f in sorted(glob.glob(os.path.join(OUT, "raw", "maps-*.json"))):
        with open(f, encoding="utf-8") as fh:
            raw = json.load(fh)
        for c in raw["consultas"]:
            for p in c["places"]:
                if p.get("place_id") and p["place_id"] not in lugares:
                    lugares[p["place_id"]] = {**p, "rubro_clave": c["rubro"], "localidad": c["localidad"]}
    return lugares


def preparar(lugares, rubros, excluir):
    candidatos, descartes = [], {}

    def descartar(motivo):
        descartes[motivo] = descartes.get(motivo, 0) + 1

    for p in lugares.values():
        if p["rubro_clave"] not in rubros:  # rubro sacado de config/rubros.json (ej. talleres)
            descartar("rubro fuera de la lista"); continue
        nombre = sin_acentos(p["nombre"])
        if p.get("cerrado"):
            descartar("cerrado"); continue
        if any(x in nombre + " " for x in excluir):
            descartar("cadena / institución"); continue
        pres = presencia(p.get("web"))
        if pres == "Web propia":
            descartar("tiene web propia"); continue
        wa, nota = whatsapp(p.get("telefono"))
        loc = sin_acentos(p["localidad"])
        fuera = loc not in sin_acentos(p.get("direccion")) and loc not in sin_acentos(p.get("localidad_maps"))
        notas = [x for x in [nota, "Verificar zona" if fuera else ""] if x]
        if pres == "Web gratuita o caída":
            notas.append("Revisar si la web abre")
        n = {
            "negocio": p["nombre"], "rubro": rubros[p["rubro_clave"]]["nombre"], "rubro_clave": p["rubro_clave"],
            "categoria": p.get("categoria", ""), "localidad": p["localidad"], "direccion": p.get("direccion", ""),
            "telefono": p.get("telefono", ""), "whatsapp": wa, "rating": p.get("rating", ""),
            "fotos": p.get("fotos", 0), "presencia": pres, "web": p.get("web", ""),
            "horario_hoy": p.get("horario_hoy", ""), "place_id": p["place_id"],
            "link_maps": f"https://www.google.com/maps/place/?q=place_id:{p['place_id']}",
            "fuera_de_zona": fuera, "notas": notas,
        }
        n["puntaje"], n["_motivos"] = puntuar(n)
        candidatos.append(n)

    # Mismo teléfono = casi siempre el mismo negocio cargado dos veces: queda el de mayor puntaje.
    candidatos.sort(key=lambda x: -x["puntaje"])
    por_tel, unicos = {}, []
    for n in candidatos:
        k = re.sub(r"\D", "", n["telefono"])
        if k and k in por_tel:
            por_tel[k]["notas"].append(f"Mismo teléfono que '{n['negocio']}'")
            descartar("teléfono repetido"); continue
        if k:
            por_tel[k] = n
        unicos.append(n)
    return unicos, descartes


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tamano", type=int, default=100)
    ap.add_argument("--demos", type=int, default=15)
    ap.add_argument("--demos-por-rubro", type=int, default=5,
                    help="tope de demos por rubro: cada rubro necesita su plantilla, conviene concentrarlas")
    ap.add_argument("--no-marcar", action="store_true", help="no sumar la tanda a entregados.json (prueba)")
    a = ap.parse_args()

    rubros = cargar("rubros.json")
    excluir = [sin_acentos(x) for x in cargar("excluir.json")["nombres"]]
    entregados = set(json.load(open(ENTREGADOS, encoding="utf-8"))) if os.path.exists(ENTREGADOS) else set()

    lugares = cargar_raw()
    nuevos = {k: v for k, v in lugares.items() if k not in entregados}
    candidatos, descartes = preparar(nuevos, rubros, excluir)
    tanda = candidatos[: a.tamano]
    if not tanda:
        sys.exit("No hay prospectos nuevos: corré scripts/scrape_maps.js con otras localidades o rubros.")

    demos_rubro = {}
    for i, n in enumerate(tanda, 1):
        n["ranking"] = i
        n["demo"] = ""
        if sum(demos_rubro.values()) < a.demos and demos_rubro.get(n["rubro"], 0) < a.demos_por_rubro:
            demos_rubro[n["rubro"]] = demos_rubro.get(n["rubro"], 0) + 1
            n["demo"] = "Sí"
        n["motivo"] = "; ".join(n["_motivos"])
        n["notas"] = "; ".join(n["notas"])

    num = len(glob.glob(os.path.join(OUT, "tanda-*.csv"))) + 1
    path = os.path.join(OUT, f"tanda-{num:02d}-{dt.date.today().isoformat()}.csv")
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNAS, extrasaction="ignore")
        w.writeheader()
        w.writerows(tanda)
    if not a.no_marcar:
        with open(ENTREGADOS, "w", encoding="utf-8") as f:
            json.dump(sorted(entregados | {n["place_id"] for n in tanda}), f)

    print(f"Negocios scrapeados sin entregar: {len(nuevos)}")
    print("Descartados: " + ", ".join(f"{k} {v}" for k, v in sorted(descartes.items(), key=lambda x: -x[1])))
    print(f"Prospectos sin web propia: {len(candidatos)} -> tanda de {len(tanda)} en {os.path.relpath(path, ROOT)}")
    print(f"Quedan {len(candidatos) - len(tanda)} para la próxima tanda.")
    print("Demos: " + ", ".join(f"{k} {v}" for k, v in demos_rubro.items()))


if __name__ == "__main__":
    main()
