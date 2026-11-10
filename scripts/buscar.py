"""Busca negocios por rubro y zona con la API de Google Places (New) y exporta un CSV.

Uso:
  python scripts/buscar.py --rubro veterinaria --zona Caseros
  python scripts/buscar.py --rubro dentista --zona "zona oeste" --max 60
  python scripts/buscar.py --desde-raw output/raw/veterinaria-caseros-2026-11-10.json   (re-procesa sin llamar a la API)

Necesita la variable de entorno GOOGLE_PLACES_API_KEY.
Solo usa la librería estándar de Python.

Salida:
  output/{rubro}-{zona}-{fecha}.csv   una fila por negocio (sin duplicados por place_id)
  output/raw/{rubro}-{zona}-{fecha}.json   respuesta cruda de la API, para re-procesar sin volver a pagar
"""
import argparse
import csv
import datetime as dt
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "output")
API = "https://places.googleapis.com/v1/places:searchText"
USO = os.path.join(OUT, "uso-api.json")
# Freno propio para no salir del cupo gratis: cada página de resultados cuenta como 1 llamada.
# Con los campos que pedimos, Text Search entra en el nivel "Enterprise" de Google, que tiene 1.000 llamadas
# gratis por mes (verificar en https://developers.google.com/maps/billing-and-pricing/pricing).
# El freno corta bastante antes, en 500, y se cambia con PLACES_LIMITE_MENSUAL.
LIMITE_MENSUAL = int(os.environ.get("PLACES_LIMITE_MENSUAL", "500"))

# Solo los campos que usamos: la API cobra según los campos pedidos.
FIELD_MASK = ",".join([
    "places.id", "places.displayName", "places.primaryTypeDisplayName", "places.formattedAddress",
    "places.nationalPhoneNumber", "places.internationalPhoneNumber", "places.rating", "places.userRatingCount",
    "places.photos", "places.regularOpeningHours.weekdayDescriptions", "places.googleMapsUri",
    "places.websiteUri", "places.businessStatus", "nextPageToken",
])

COLUMNAS = ["place_id", "negocio", "rubro", "categoria", "direccion", "localidad", "telefono", "whatsapp",
            "nota_telefono", "rating", "resenas", "fotos", "horarios", "link_maps", "web", "estado_negocio",
            "busqueda"]


def cargar(nombre):
    with open(os.path.join(ROOT, "config", nombre), encoding="utf-8") as f:
        return json.load(f)


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def localidades(zona, zonas):
    """'zona oeste' o 'caba' se expanden a sus localidades; cualquier otra cosa es una localidad suelta."""
    return zonas.get(zona.strip().lower(), [zona.strip()])


def uso_del_mes():
    mes = dt.date.today().strftime("%Y-%m")
    try:
        with open(USO, encoding="utf-8") as f:
            return mes, json.load(f).get(mes, 0)
    except (FileNotFoundError, ValueError):
        return mes, 0


def sumar_uso():
    mes, n = uso_del_mes()
    try:
        with open(USO, encoding="utf-8") as f:
            todo = json.load(f)
    except (FileNotFoundError, ValueError):
        todo = {}
    todo[mes] = n + 1
    os.makedirs(OUT, exist_ok=True)
    with open(USO, "w", encoding="utf-8") as f:
        json.dump(todo, f, indent=1)


def buscar_texto(query, api_key, page_token=None):
    mes, n = uso_del_mes()
    if n >= LIMITE_MENSUAL:
        sys.exit(f"Freno de uso: ya van {n} llamadas en {mes} (límite {LIMITE_MENSUAL}). No se llama a la API.")
    body = {"textQuery": query, "languageCode": "es", "regionCode": "AR", "pageSize": 20}
    if page_token:
        body["pageToken"] = page_token
    req = urllib.request.Request(
        API, data=json.dumps(body).encode(), method="POST",
        headers={"Content-Type": "application/json", "X-Goog-Api-Key": api_key, "X-Goog-FieldMask": FIELD_MASK},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            sumar_uso()
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Error {e.code} de la API de Places para '{query}':\n{e.read().decode(errors='replace')}")


def whatsapp(intl):
    """'+54 11 4444-5555' / '+54 9 11 5555-1234' -> ('5491144445555', nota). Mismas reglas que la herramienta de Sol."""
    d = re.sub(r"\D", "", intl or "")
    if not d:
        return "", ""
    if not d.startswith("54"):
        return "", "Número no argentino: verificar"
    resto = d[3:] if d.startswith("549") else d[2:]
    nota = ""
    # Fijo de AMBA: 11 + 8 dígitos que empiezan con 4. Igual se arma el link (muchos usan WA Business en el fijo).
    if not d.startswith("549") and resto.startswith("11") and len(resto) == 10 and resto[2] == "4":
        nota = "Fijo: puede no tener WA"
    return "549" + resto, nota


def fila(p, rubro, localidad, query):
    wa, nota = whatsapp(p.get("internationalPhoneNumber"))
    return {
        "place_id": p.get("id", ""),
        "negocio": (p.get("displayName") or {}).get("text", ""),
        "rubro": rubro,
        "categoria": (p.get("primaryTypeDisplayName") or {}).get("text", ""),
        "direccion": p.get("formattedAddress", ""),
        "localidad": localidad,
        "telefono": p.get("nationalPhoneNumber", ""),
        "whatsapp": wa,
        "nota_telefono": nota,
        "rating": p.get("rating", ""),
        "resenas": p.get("userRatingCount", 0),
        "fotos": len(p.get("photos") or []),  # la API devuelve como máximo 10
        "horarios": " | ".join((p.get("regularOpeningHours") or {}).get("weekdayDescriptions") or []),
        "link_maps": p.get("googleMapsUri", ""),
        "web": p.get("websiteUri", ""),
        "estado_negocio": p.get("businessStatus", ""),
        "busqueda": query,
    }


def procesar(raw):
    """raw = {"rubro": ..., "consultas": [{"localidad", "query", "places": [...]}, ...]} -> filas sin duplicados."""
    vistos, filas = set(), []
    for c in raw["consultas"]:
        for p in c["places"]:
            if p.get("id") in vistos:
                continue
            vistos.add(p.get("id"))
            filas.append(fila(p, raw["rubro"], c["localidad"], c["query"]))
    return filas


def consultar(rubro_clave, zona, maximo, api_key, pausa=0.3):
    rubros, zonas = cargar("rubros.json"), cargar("zonas.json")
    if rubro_clave not in rubros:
        sys.exit(f"Rubro desconocido: {rubro_clave}. Opciones: {', '.join(rubros)}")
    rubro = rubros[rubro_clave]
    raw = {"rubro": rubro["nombre"], "zona": zona, "fecha": dt.date.today().isoformat(), "consultas": []}
    ids = set()
    for loc in localidades(zona, zonas):
        for termino in rubro["busquedas"]:
            if len(ids) >= maximo:
                return raw
            query = f"{termino} en {loc}, Buenos Aires"
            token, places = None, []
            for _ in range(3):  # la API da hasta 3 páginas de 20 (60 resultados) por consulta
                r = buscar_texto(query, api_key, token)
                places += r.get("places", [])
                token = r.get("nextPageToken")
                if not token or len(ids | {p["id"] for p in places}) >= maximo:
                    break
                time.sleep(pausa)
            raw["consultas"].append({"localidad": loc, "query": query, "places": places})
            ids |= {p["id"] for p in places}
            print(f"  {query}: {len(places)} resultados ({len(ids)} únicos en total)")
            time.sleep(pausa)
    return raw


def escribir_csv(filas, path):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:  # utf-8-sig: Excel abre bien los acentos
        w = csv.DictWriter(f, fieldnames=COLUMNAS)
        w.writeheader()
        w.writerows(filas)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rubro", help="clave de config/rubros.json, ej. veterinaria")
    ap.add_argument("--zona", help="localidad (ej. Caseros) o 'zona oeste' / 'caba'")
    ap.add_argument("--max", type=int, default=60, help="máximo de negocios únicos a traer (default 60)")
    ap.add_argument("--desde-raw", help="re-procesar un JSON crudo guardado, sin llamar a la API")
    a = ap.parse_args()

    if a.desde_raw:
        with open(a.desde_raw, encoding="utf-8") as f:
            raw = json.load(f)
        base = os.path.splitext(os.path.basename(a.desde_raw))[0]
    else:
        if not (a.rubro and a.zona):
            ap.error("hacen falta --rubro y --zona (o --desde-raw)")
        key = os.environ.get("GOOGLE_PLACES_API_KEY")
        if not key:
            sys.exit("Falta la variable de entorno GOOGLE_PLACES_API_KEY.")
        print(f"Buscando {a.rubro} en {a.zona} (máx. {a.max})…")
        raw = consultar(a.rubro, a.zona, a.max, key)
        base = f"{slug(a.rubro)}-{slug(a.zona)}-{raw['fecha']}"
        os.makedirs(os.path.join(OUT, "raw"), exist_ok=True)
        with open(os.path.join(OUT, "raw", base + ".json"), "w", encoding="utf-8") as f:
            json.dump(raw, f, ensure_ascii=False, indent=1)

    filas = procesar(raw)[: a.max] if not a.desde_raw else procesar(raw)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, base + ".csv")
    escribir_csv(filas, path)
    con_web = sum(1 for x in filas if x["web"])
    print(f"Listo: {len(filas)} negocios ({con_web} con algo en el campo web) -> {os.path.relpath(path, ROOT)}")
    if not a.desde_raw:
        mes, n = uso_del_mes()
        print(f"Uso de la API en {mes}: {n} llamadas de {LIMITE_MENSUAL} (freno propio).")


if __name__ == "__main__":
    main()
