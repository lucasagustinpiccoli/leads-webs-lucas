"""Planilla de seguimiento de leads de Halo Studio: output/leads-halo.xlsx (se abre en Google Sheets).

Mismo formato que la guía del buscador de leads (hoja Leads, hojas "Mensajes {Rubro}" y hoja Templates), adaptado a
negocios sin web que reciben una demo. Se maneja siempre con este script para que el formato quede igual.

Uso:
  python scripts/planilla.py importar [tanda.csv] [mensajes.csv]
      Agrega al final de Leads los prospectos de una tanda (salida de rankear.py) y sus mensajes (salida de mensajes.py)
      a "Mensajes {Rubro}". Saltea los que ya están (compara por Link Maps). Sin argumentos usa la última tanda de output/.
  python scripts/planilla.py mensajes [tanda.csv] [mensajes.csv]
      Refresca solo las hojas \"Mensajes {Rubro}\" de una tanda ya cargada (después de correr scripts/mensajes.py --todos).
  python scripts/planilla.py leer
      Imprime la hoja Leads como JSON.
  python scripts/planilla.py actualizar cambios.json
      Cambia columnas de filas existentes por número, ej: {"12": {"Estado": "Contactado", "Fecha contacto": "2026-12-01"}}

Nunca pisa ni borra filas existentes: solo agrega al final o cambia lo que le pidas.
"""
import csv
import glob
import json
import os
import re
import sys
from urllib.parse import quote

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "output", "leads-halo.xlsx")

LEADS_COLS = ["N", "Negocio", "Rubro", "Zona", "Dirección", "Teléfono", "WhatsApp", "Instagram", "Web", "Presencia",
              "Rating", "Fotos", "Puntaje", "Demo", "Link Maps", "Estado", "Canal", "Fecha contacto", "Próximo paso", "Notas"]
MSG_COLS = ["N", "Negocio", "Zona", "Instagram", "Link Instagram", "WhatsApp", "Mensaje día 0", "Mensaje día 3",
            "Mensaje día 7", "DM Instagram", "Abrir WhatsApp con el mensaje del día 0", "Revisar"]
WIDTHS = {"N": 5, "Negocio": 32, "Rubro": 16, "Zona": 15, "Dirección": 34, "Teléfono": 17, "WhatsApp": 28, "Instagram": 26,
          "Web": 26, "Presencia": 20, "Rating": 7, "Fotos": 7, "Puntaje": 8, "Demo": 7, "Link Maps": 14, "Estado": 16,
          "Canal": 11, "Fecha contacto": 14, "Próximo paso": 22, "Notas": 40, "Link Instagram": 30, "Mensaje día 0": 60,
          "Mensaje día 3": 50, "Mensaje día 7": 50, "DM Instagram": 60, "Abrir WhatsApp con el mensaje del día 0": 24, "Revisar": 30}
WRAP = {"Mensaje día 0", "Mensaje día 3", "Mensaje día 7", "DM Instagram", "Notas", "Dirección", "Revisar"}
ESTADOS = ["Sin contactar", "Contactado", "Seguimiento 1", "Seguimiento 2", "Respondió", "Reunión", "Propuesta enviada",
           "Cliente", "No interesado", "Frío"]
TEMPLATES = [
    ("Si dicen \"Me interesa\"", "Genial. Te paso por escrito qué incluye y cuánto cuesta. Se paga el 50 % para empezar y el 50 % antes de publicar, y el plazo se pacta por escrito según el tamaño de la página."),
    ("Si dicen \"Es caro\"", "La página simple es lo más económico para empezar. Si con un cliente nuevo al mes ya se paga, conviene. Si querés, arrancamos solo con lo esencial."),
    ("Si dicen \"Ya tengo Instagram\"", "Perfecto, la página lo complementa: Instagram no aparece en Google ni permite armar bien reservas, mapa o un botón de WhatsApp. Dejás el link en tu perfil."),
    ("Si dicen \"Lo tengo que pensar\"", "Dale. La demo queda disponible esta semana, así la mostrás a quien quieras."),
    ("Si preguntan \"¿Cuánto tarda?\"", "Ves la demo en pocos días y, una vez confirmado el proyecto, tu web está lista en 7 días según el tamaño. Todo queda pactado por escrito."),
]

BASE = Font(name="Arial", size=10)
LINK = Font(name="Arial", size=10, color="0563C1", underline="single")
HEAD = Font(name="Arial", size=10, bold=True, color="0A0A0A")
FILL = PatternFill("solid", fgColor="EDBB64")


def header(ws, cols):
    for c, h in enumerate(cols, 1):
        cell = ws.cell(1, c, h)
        cell.font, cell.fill = HEAD, FILL
        cell.alignment = Alignment(vertical="center", wrap_text=True)
        ws.column_dimensions[cell.column_letter].width = WIDTHS.get(h, 15)
    ws.freeze_panes = "C2"


def put(ws, r, c, h, value, url=None):
    cell = ws.cell(r, c, value)
    cell.font = LINK if url else BASE
    if url:
        cell.hyperlink = url
    cell.alignment = Alignment(vertical="top", wrap_text=h in WRAP)
    if h == "Rating" and isinstance(value, float):
        cell.number_format = "0.0"


def nuevo_libro():
    wb = Workbook()
    ws = wb.active
    ws.title = "Leads"
    header(ws, LEADS_COLS)
    t = wb.create_sheet("Templates")
    for c, h in enumerate(["Cuándo usarlo", "Mensaje"], 1):
        cell = t.cell(1, c, h)
        cell.font, cell.fill = HEAD, FILL
    for r, (a, b) in enumerate(TEMPLATES, 2):
        t.cell(r, 1, a).font = Font(name="Arial", size=10, bold=True)
        t.cell(r, 2, b).font = BASE
        for c in (1, 2):
            t.cell(r, c).alignment = Alignment(vertical="top", wrap_text=True)
    t.cell(len(TEMPLATES) + 3, 1, "Los mensajes del día 0, 3 y 7 de cada prospecto están en las hojas \"Mensajes {Rubro}\".").font = Font(name="Arial", size=9, italic=True)
    t.column_dimensions["A"].width, t.column_dimensions["B"].width = 34, 100
    return wb


def abrir():
    return load_workbook(XLSX) if os.path.exists(XLSX) else nuevo_libro()


def guardar(wb):
    ws = wb["Leads"]
    ws.auto_filter.ref = ws.dimensions
    ws.data_validations.dataValidation = []
    dv = DataValidation(type="list", formula1='"' + ",".join(ESTADOS) + '"', allow_blank=True)
    ws.add_data_validation(dv)
    col = ws.cell(1, LEADS_COLS.index("Estado") + 1).column_letter
    dv.add(f"{col}2:{col}5000")
    try:
        wb.save(XLSX)
    except PermissionError:
        sys.exit("No pude guardar: cerrá leads-halo.xlsx en Excel y volvé a correr el comando.")


def leer_csv(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def ultimo(patron):
    archivos = sorted(glob.glob(os.path.join(ROOT, "output", patron)))
    return archivos[-1] if archivos else None


def usuario_ig(url):
    m = re.search(r"instagram\.com/([A-Za-z0-9_.]+)", url or "")
    return m.group(1) if m and m.group(1).lower() not in ("p", "reel", "explore") else ""


def num(v):
    try:
        return float(str(v).replace(",", "."))
    except ValueError:
        return ""


def importar(tanda_csv=None, mensajes_csv=None):
    tanda_csv = tanda_csv or ultimo("tanda-*.csv")
    if not tanda_csv:
        sys.exit("No encontré una tanda en output/. Corré primero scrape_maps.js y rankear.py.")
    base = os.path.basename(tanda_csv).replace("tanda-", "mensajes-")
    mensajes_csv = mensajes_csv or (os.path.join(os.path.dirname(tanda_csv), base) if os.path.exists(os.path.join(os.path.dirname(tanda_csv), base)) else None)
    mensajes = {int(m["ranking"]): m for m in leer_csv(mensajes_csv)} if mensajes_csv else {}
    wb = abrir()
    ws = wb["Leads"]
    col_maps = LEADS_COLS.index("Link Maps") + 1
    conocidos = {ws.cell(r, col_maps).hyperlink.target for r in range(2, ws.max_row + 1) if ws.cell(r, col_maps).hyperlink}
    n = max([c.value for c in ws["A"][1:] if isinstance(c.value, int)] or [0])
    r = ws.max_row + 1 if ws["A2"].value else 2
    agregados = []
    for t in leer_csv(tanda_csv):
        maps = t["link_maps"]
        if maps in conocidos:
            continue
        n += 1
        wa = re.sub(r"\D", "", t.get("whatsapp", ""))
        web = t.get("web", "")
        ig = usuario_ig(web) or usuario_ig(mensajes.get(int(t["ranking"]), {}).get("instagram", ""))
        web_propia = "" if usuario_ig(web) else web
        canal = "Instagram" if ig else ("WhatsApp" if wa else "Llamar o visitar")
        vals = [n, t["negocio"], t["rubro"], t["localidad"], t["direccion"], t["telefono"], f"https://wa.me/{wa}" if wa else "",
                f"@{ig}" if ig else "", web_propia, t["presencia"], num(t["rating"]), int(t["fotos"]) if str(t["fotos"]).isdigit() else "",
                int(t["puntaje"]) if str(t["puntaje"]).isdigit() else "", t["demo"], "Ver en Maps", "Sin contactar", canal, "",
                "Mandar primer mensaje", t.get("notas", "")]
        urls = {"WhatsApp": f"https://wa.me/{wa}" if wa else None, "Instagram": f"https://www.instagram.com/{ig}/" if ig else None,
                "Web": web_propia or None, "Link Maps": maps}
        for c, (h, v) in enumerate(zip(LEADS_COLS, vals), 1):
            put(ws, r, c, h, v, urls.get(h))
        r += 1
        agregados.append((n, t, ig, wa, mensajes.get(int(t["ranking"]))))
        conocidos.add(maps)

    # sin mensajes de esa tanda todavía: se cargan los leads y las hojas "Mensajes" quedan para cuando estén escritos
    for rubro in sorted({t["rubro"] for _, t, _, _, _ in agregados if mensajes}):
        nombre = re.sub(r"[\\/*?:\[\]]+", "-", f"Mensajes {rubro}")[:31]
        if nombre not in wb.sheetnames:
            ms = wb.create_sheet(nombre, index=wb.sheetnames.index("Templates"))
            header(ms, MSG_COLS)
        ms = wb[nombre]
        fila = ms.max_row + 1
        for nn, t, ig, wa, m in [x for x in agregados if x[1]["rubro"] == rubro]:
            m = m or {}
            d0 = m.get("mensaje_dia0", "")
            walink = f"https://wa.me/{wa}?text={quote(d0, safe='')}" if wa and d0 else ""
            vals = [nn, t["negocio"], t["localidad"], f"@{ig}" if ig else "Buscar a mano", f"https://instagram.com/{ig}" if ig else "",
                    f"https://wa.me/{wa}" if wa else "", d0, m.get("mensaje_dia3", ""), m.get("mensaje_dia7", ""),
                    m.get("mensaje_instagram", "") if ig else "", "Abrir chat con el mensaje" if walink else "", m.get("revisar", "")]
            urls = {"Instagram": f"https://www.instagram.com/{ig}/" if ig else None, "Link Instagram": vals[4] or None,
                    "WhatsApp": vals[5] or None, "Abrir WhatsApp con el mensaje del día 0": walink or None}
            for c, (h, v) in enumerate(zip(MSG_COLS, vals), 1):
                put(ms, fila, c, h, v, urls.get(h))
            fila += 1
        ms.auto_filter.ref = ms.dimensions
    guardar(wb)
    print(f"Agregados {len(agregados)} leads (N {agregados[0][0]}-{agregados[-1][0]})" if agregados else "No había leads nuevos")


def refrescar_mensajes(tanda_csv=None, mensajes_csv=None):
    """Actualiza (o agrega) las filas de las hojas "Mensajes {Rubro}" de los leads de una tanda que ya están en Leads.
    No toca la hoja Leads ni los estados."""
    tanda_csv = tanda_csv or ultimo("tanda-*.csv")
    if not tanda_csv:
        sys.exit("No encontré una tanda en output/.")
    base = os.path.basename(tanda_csv).replace("tanda-", "mensajes-")
    mensajes_csv = mensajes_csv or os.path.join(os.path.dirname(tanda_csv), base)
    if not os.path.exists(mensajes_csv):
        sys.exit("Falta el CSV de mensajes: corré scripts/mensajes.py --todos primero.")
    mensajes = {int(m["ranking"]): m for m in leer_csv(mensajes_csv)}
    wb = abrir()
    ws = wb["Leads"]
    col_maps = LEADS_COLS.index("Link Maps") + 1
    filas = {ws.cell(r, col_maps).hyperlink.target: ws.cell(r, 1).value for r in range(2, ws.max_row + 1) if ws.cell(r, col_maps).hyperlink}
    hechos = 0
    for t in leer_csv(tanda_csv):
        n = filas.get(t["link_maps"])
        m = mensajes.get(int(t["ranking"]))
        if not n or not m:
            continue
        nombre = re.sub(r"[\\/*?:\[\]]+", "-", f"Mensajes {t['rubro']}")[:31]
        if nombre not in wb.sheetnames:
            ms = wb.create_sheet(nombre, index=wb.sheetnames.index("Templates"))
            header(ms, MSG_COLS)
        ms = wb[nombre]
        fila = next((r for r in range(2, ms.max_row + 1) if ms.cell(r, 1).value == n), None) or ms.max_row + 1
        wa = re.sub(r"\D", "", t.get("whatsapp", ""))
        ig = usuario_ig(t.get("web", "")) or usuario_ig(m.get("instagram", ""))
        d0 = m.get("mensaje_dia0", "")
        walink = f"https://wa.me/{wa}?text={quote(d0, safe='')}" if wa and d0 else ""
        vals = [n, t["negocio"], t["localidad"], f"@{ig}" if ig else "Buscar a mano", f"https://instagram.com/{ig}" if ig else "",
                f"https://wa.me/{wa}" if wa else "", d0, m.get("mensaje_dia3", ""), m.get("mensaje_dia7", ""),
                m.get("mensaje_instagram", "") if ig else "", "Abrir chat con el mensaje" if walink else "", m.get("revisar", "")]
        urls = {"Instagram": f"https://www.instagram.com/{ig}/" if ig else None, "Link Instagram": vals[4] or None,
                "WhatsApp": vals[5] or None, "Abrir WhatsApp con el mensaje del día 0": walink or None}
        for c, (h, v) in enumerate(zip(MSG_COLS, vals), 1):
            put(ms, fila, c, h, v, urls.get(h))
        hechos += 1
    for nombre in wb.sheetnames:
        if nombre.startswith("Mensajes"):
            wb[nombre].auto_filter.ref = wb[nombre].dimensions
    guardar(wb)
    print(f"Mensajes actualizados para {hechos} leads")


def leer():
    if not os.path.exists(XLSX):
        print("[]")
        return
    ws = load_workbook(XLSX)["Leads"]
    hdr = [c.value for c in ws[1]]
    filas = []
    for r in ws.iter_rows(min_row=2):
        if r[0].value is None:
            continue
        d = {h: c.value for h, c in zip(hdr, r)}
        i = hdr.index("Link Maps")
        d["Link Maps"] = r[i].hyperlink.target if r[i].hyperlink else d["Link Maps"]
        filas.append(d)
    print(json.dumps(filas, ensure_ascii=False, default=str))


def actualizar(path):
    with open(path, encoding="utf-8") as f:
        cambios = json.load(f)
    wb = abrir()
    ws = wb["Leads"]
    hdr = [c.value for c in ws[1]]
    filas = {c.value: c.row for c in ws["A"][1:] if c.value is not None}
    for n, cols in cambios.items():
        for h, v in cols.items():
            ws.cell(filas[int(n)], hdr.index(h) + 1).value = v
    guardar(wb)
    print(f"Actualizadas {len(cambios)} filas")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "importar":
        importar(*(sys.argv[2:4]))
    elif cmd == "mensajes":
        refrescar_mensajes(*(sys.argv[2:4]))
    elif cmd == "leer":
        leer()
    elif cmd == "actualizar" and len(sys.argv) > 2:
        actualizar(sys.argv[2])
    else:
        print(__doc__)
