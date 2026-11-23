"""Genera las propuestas de logo de Halo Studio en SVG (texto convertido a trazados, sin depender de fuentes).
Uso: python scripts/logo_halo.py   -> escribe output/logo/*.svg"""
import os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "sitio", "lumen-studio", "fonts")
OUT = os.path.join(ROOT, "output", "logo")
os.makedirs(OUT, exist_ok=True)

NEGRO, CREMA, AMBAR = "#0A0A0A", "#F4F1E8", "#E8A33D"


def fuente(nombre):
    f = TTFont(os.path.join(FONTS, nombre))
    f.flavor = None
    return f


SERIF = fuente("hedvig-letters-serif-latin.woff2")
BEBAS = fuente("staatliches-latin.woff2")


def texto(font, s, tam, x, y, track=0.0):
    """Devuelve (path d, ancho) con el texto convertido a trazados."""
    upm = font["head"].unitsPerEm
    esc = tam / upm
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    partes, cx = [], x
    for ch in s:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (esc, 0, 0, -esc, cx, y))
        gs[g].draw(tp)
        partes.append(pen.getCommands())
        cx += hmtx[g][0] * esc + track * tam
    return " ".join(partes), cx - x


def alto_x(font, tam):
    return font["OS/2"].sxHeight * tam / font["head"].unitsPerEm


def alto_mayus(font, tam):
    return font["OS/2"].sCapHeight * tam / font["head"].unitsPerEm


def svg(ancho, alto, fondo, cuerpo):
    bg = f'<rect width="{ancho}" height="{alto}" fill="{fondo}"/>' if fondo else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}">{bg}{cuerpo}</svg>'


def guardar(nombre, contenido):
    with open(os.path.join(OUT, nombre), "w", encoding="utf-8") as f:
        f.write(contenido)


# ---------- A: "halo" en serif, con la o convertida en aro de luz ----------
def logo_a(fondo, tinta, acento, nombre):
    tam = 150
    base = 190
    d1, w1 = texto(SERIF, "hal", tam, 60, base)
    xh = alto_x(SERIF, tam)
    r = xh / 2 * 1.04
    cx = 60 + w1 + r + 6
    cy = base - xh / 2
    sw = tam * 0.075
    d2, w2 = texto(BEBAS, "STUDIO", 34, 60 + w1 + 2 * r + 34, base, 0.18)
    ancho = int(60 + w1 + 2 * r + 34 + w2 + 60)
    cuerpo = (
        f'<path d="{d1}" fill="{tinta}"/>'
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r - sw / 2:.1f}" fill="none" stroke="{acento}" stroke-width="{sw:.1f}"/>'
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.2:.1f}" fill="{acento}"/>'
        f'<path d="{d2}" fill="{tinta}"/>'
    )
    guardar(nombre, svg(ancho, 260, fondo, cuerpo))


# ---------- B: símbolo (aro con destello) + palabra ----------
def logo_b(fondo, tinta, acento, nombre):
    cx, cy, r = 130, 130, 70
    sw = 16
    # aro abierto arriba a la derecha: la luz que se escapa
    import math
    a0, a1 = math.radians(-60), math.radians(-5)  # hueco
    x0, y0 = cx + r * math.cos(a1), cy + r * math.sin(a1)
    x1, y1 = cx + r * math.cos(a0 + 2 * math.pi), cy + r * math.sin(a0 + 2 * math.pi)
    arco = f'M {x0:.1f} {y0:.1f} A {r} {r} 0 1 1 {x1:.1f} {y1:.1f}'
    d, w = texto(SERIF, "Halo", 118, 250, 168)
    d2, w2 = texto(BEBAS, "STUDIO", 30, 254, 214, 0.34)
    ancho = int(250 + max(w, w2) + 60)
    cuerpo = (
        f'<path d="{arco}" fill="none" stroke="{acento}" stroke-width="{sw}" stroke-linecap="round"/>'
        f'<circle cx="{cx + r * math.cos(math.radians(-32)):.1f}" cy="{cy + r * math.sin(math.radians(-32)):.1f}" r="7" fill="{tinta}"/>'
        f'<path d="{d}" fill="{tinta}"/><path d="{d2}" fill="{tinta}" opacity=".75"/>'
    )
    guardar(nombre, svg(ancho, 260, fondo, cuerpo))


# ---------- C: monograma H con el halo flotando arriba ----------
def logo_c(fondo, tinta, acento, nombre):
    tam = 190
    d, w = texto(BEBAS, "H", tam, 70, 215)
    capa = alto_mayus(BEBAS, tam)
    cx = 70 + w / 2
    top = 215 - capa
    rx, ry = w * 0.62, w * 0.17
    cy = top - 26
    sw = 9
    d2, w2 = texto(SERIF, "Halo", 74, 70 + w + 36, 190)
    d3, w3 = texto(BEBAS, "STUDIO", 26, 70 + w + 40, 224, 0.34)
    ancho = int(70 + w + 36 + max(w2, w3) + 60)
    cuerpo = (
        f'<path d="{d}" fill="{tinta}"/>'
        f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{acento}" stroke-width="{sw}"/>'
        f'<path d="{d2}" fill="{tinta}"/><path d="{d3}" fill="{tinta}" opacity=".75"/>'
    )
    guardar(nombre, svg(ancho, 260, fondo, cuerpo))


if __name__ == "__main__":
    for k, f in (("a", logo_a), ("b", logo_b), ("c", logo_c)):
        f(NEGRO, CREMA, AMBAR, f"halo-{k}-oscuro.svg")
        f(CREMA, NEGRO, "#D38A1F", f"halo-{k}-claro.svg")
    print("listo:", sorted(os.listdir(OUT)))
