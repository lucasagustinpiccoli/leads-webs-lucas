"""Integra el logo de Halo Studio (paquete v3) en sitio/lumen-studio/index.html.
Uso: python scripts/integrar_logo_halo.py /ruta/a/halo-logo-v3
Copia los SVG a sitio/lumen-studio/logo/ y reemplaza el texto del menú, el título del inicio, el pie, el formulario y el favicon.
Se puede correr más de una vez: los bloques ya reemplazados se detectan y se actualizan."""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = os.path.join(ROOT, "sitio", "lumen-studio")
SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/hl/x/halo-logo-v3"
INICIO = 1.0  # segundos: cuando el tubo de neón empieza a abrirse, el sol empieza a salir


def leer(*p):
    with open(os.path.join(SRC, *p), encoding="utf-8") as f:
        return f.read()


def b64(*p):
    with open(os.path.join(SRC, *p), "rb") as f:
        return base64.b64encode(f.read()).decode()


def sin_cabecera(svg):
    return svg.strip()


AMANECER = """<style>
.line,.refl,.sun,.ring,.glow,.t1,.t2{animation-fill-mode:both}
.line{transform-box:fill-box;transform-origin:50% 50%;animation:lineIn .70s 1.00s cubic-bezier(.23,1,.32,1)}
.sun{animation:rise 2.20s 1.70s cubic-bezier(.28,.55,.2,1)}
.ring{transform-box:fill-box;transform-origin:50% 100%;animation-timing-function:cubic-bezier(.23,1,.32,1)}
.r1{animation:ringIn .90s 2.90s}.r2{animation:ringIn .90s 3.10s}.r3{animation:ringIn .90s 3.30s}
.glow{animation:fade 1.60s 2.30s ease-out}.refl{animation:fade .80s 3.20s}
.t1{animation:textIn .80s 3.10s cubic-bezier(.23,1,.32,1)}.t2{animation:textIn .80s 3.30s cubic-bezier(.23,1,.32,1)}
@keyframes lineIn{from{transform:scaleX(0)}}
@keyframes rise{from{transform:translateY(21px);filter:brightness(.55)}55%{filter:brightness(.85)}to{transform:none;filter:none}}
@keyframes ringIn{from{opacity:0;transform:scale(.82)}}
@keyframes fade{from{opacity:0}}
@keyframes textIn{from{opacity:0;transform:translateY(8px)}}
@media (prefers-reduced-motion:reduce){.line,.refl,.sun,.ring,.glow,.t1,.t2{animation:none}}
</style>"""


def amanecer(svg):
    """Cambia la animación del paquete por una de amanecer: primero el horizonte solo, después sale el sol y se encienden los aros.
    Arranca cuando el tubo de neón del inicio empieza a abrirse (1 s)."""
    # "both": antes de su turno cada pieza queda en su estado inicial (oculta), no en el final
    css = re.sub(r"animation:(?!none)([^;}]+)", lambda m: "animation:" + m.group(1) + " both", AMANECER)
    return re.sub(r"<style>.*?</style>", lambda m: css, svg, count=1, flags=re.S)


def poner_clase(svg, clase):
    return svg.replace("<svg ", f'<svg class="{clase}" ', 1).replace(' width="235" height="100"', "").replace(' role="img" aria-label="Halo Studio"', ' aria-hidden="true" focusable="false"', 1)


def main():
    p = os.path.join(SITIO, "index.html")
    with open(p, encoding="utf-8") as f:
        html = f.read()

    # 1) menú: logo animado, sincronizado con la luz del inicio
    animado = sin_cabecera(leer("svg", "halo-logo-animated-on-dark.svg"))
    animado = amanecer(animado)
    animado = poner_clase(animado, "logo-nav")
    nav = f'<a class="wordmark" href="#inicio" aria-label="Halo Studio, inicio">{animado}</a>'
    html, n = re.subn(r'<a class="wordmark" href="#inicio" aria-label="Halo Studio, inicio">.*?</a>', lambda m: nav, html, count=1, flags=re.S)
    assert n == 1, "no encontré el logo del menú"

    # 2) inicio: el nombre grande con la tipografía del logo (sin el sol)
    est = sin_cabecera(leer("svg", "halo-logo-on-dark.svg"))
    textos = re.findall(r'<g><path d="[^"]+" transform="translate\([^)]+\)" fill="#[0-9a-f]+"/></g>', est)
    assert len(textos) == 2, "no encontré los trazos del nombre"
    # nombre del inicio en una sola línea ("Halo" grueso y "Studio" liviano, tipografía del logo), ya convertido a trazados
    with open(os.path.join(SITIO, "logo", "halo-wordmark-inline.svg"), encoding="utf-8") as f:
        hero_svg = f.read().strip()
    html, n = re.subn(r'<span class="gigante" aria-hidden="true">.*?</span></h1>', lambda m: f'<span class="gigante" aria-hidden="true">{hero_svg}</span></h1>', html, count=1, flags=re.S)
    assert n == 1, "no encontré el título del inicio"

    # 3) pie y formulario: logo estático
    est_nav = poner_clase(est, "logo-pie")
    html, n = re.subn(r'<span class="marca-pie"[^>]*>.*?</span>', lambda m: f'<span class="marca-pie" role="img" aria-label="Halo Studio">{est_nav}</span>', html, count=1, flags=re.S)
    assert n == 1, "no encontré el pie"
    est_fm = poner_clase(est.replace('id="gl', 'id="fl').replace('url(#gl', 'url(#fl').replace('id="gt', 'id="ft').replace('url(#gt', 'url(#ft')
                         .replace('id="gs', 'id="fs').replace('url(#gs', 'url(#fs').replace('id="gg', 'id="fg').replace('url(#gg', 'url(#fg')
                         .replace('id="gr', 'id="fr').replace('url(#gr', 'url(#fr').replace('id="cp', 'id="fc').replace('url(#cp', 'url(#fc'), "logo-pie")
    html, n = re.subn(r'<span class="fm-marca"[^>]*>.*?</span>', lambda m: f'<span class="fm-marca" role="img" aria-label="Halo Studio">{est_fm}</span>', html, count=1, flags=re.S)
    assert n == 1, "no encontré la marca del formulario"

    # 4) favicon
    fav = base64.b64encode(leer("svg", "favicon.svg").encode()).decode()
    enlaces = (f'<link rel="icon" href="data:image/svg+xml;base64,{fav}" type="image/svg+xml">\n'
               f'<link rel="icon" href="data:image/png;base64,{b64("png", "favicon-32.png")}" type="image/png" sizes="32x32">\n'
               f'<link rel="apple-touch-icon" href="data:image/png;base64,{b64("png", "apple-touch-icon.png")}">\n')
    html = re.sub(r'<link rel="(?:icon|apple-touch-icon)"[^>]*>\n', "", html)
    html = html.replace("<title>", enlaces + "<title>", 1)

    with open(p, "w", encoding="utf-8") as f:
        f.write(html)

    # copias de los archivos del logo para usarlos fuera de la página
    dest = os.path.join(SITIO, "logo")
    os.makedirs(dest, exist_ok=True)
    for sub, nombres in (("svg", None), ("png", None), ("simple", None)):
        d = os.path.join(SRC, sub)
        for nombre in os.listdir(d):
            if sub == "simple" and not nombre.endswith(".svg"):
                continue
            with open(os.path.join(d, nombre), "rb") as a, open(os.path.join(dest, nombre), "wb") as b:
                b.write(a.read())
    print("listo")


if __name__ == "__main__":
    main()
