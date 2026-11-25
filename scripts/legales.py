"""Genera las páginas legales (aviso legal y política de privacidad), el sitemap y los metadatos de SEO de la home
a partir de config/sitio.json. Para cambiar el mail, el CUIT o el dominio: editá ese archivo y corré
    python scripts/legales.py
Después armá el sitio como siempre (python scripts/armar_sitio.py).

Qué escribe:
  sitio/lumen-studio/privacidad/index.html, sitio/lumen-studio/aviso-legal/index.html, sitio/lumen-studio/404.html
  sitio/lumen-studio/sitemap.xml
  el bloque entre <!--seo:inicio--> y <!--seo:fin--> del index.html (canonical, vista previa para redes, datos estructurados
  y, si config/sitio.json trae cf_analytics_token, el código de Cloudflare Web Analytics).
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = os.path.join(ROOT, "sitio", "lumen-studio")
C = json.load(open(os.path.join(ROOT, "config", "sitio.json"), encoding="utf-8"))
E = html.escape
URL = C["url"].rstrip("/")
HOY = "25 de noviembre de 2026"
CSS = """
:root{--noche:#0a0a0a;--crema:#f4f1e8;--suave:#a9a69d;--ambar:#edbb64;--linea:rgba(244,241,232,.16)}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--noche);color:var(--crema);font:400 17px/1.65 "Geist",system-ui,-apple-system,"Segoe UI",sans-serif;padding:0 clamp(18px,5vw,56px)}
main{width:min(720px,100%);margin:0 auto;padding:clamp(40px,8vw,88px) 0}
.volver{display:inline-block;margin-bottom:36px;color:var(--suave);text-decoration:none;font-size:.95rem;min-height:44px;line-height:44px}
.volver:hover{color:var(--crema)}
h1{font:400 clamp(2rem,6vw,3.2rem)/1.1 "Hedvig Letters Serif",Georgia,serif;margin-bottom:10px;text-wrap:balance}
.fecha{color:var(--suave);font-size:.9rem;margin-bottom:36px}
h2{font:500 1.2rem/1.3 "Geist",sans-serif;margin:34px 0 10px}
p,li{color:#d8d5cc}p{margin-bottom:12px}
ul{margin:0 0 12px 20px}li{margin-bottom:6px}
a{color:var(--ambar)}
a:focus-visible{outline:2px solid var(--crema);outline-offset:3px}
.pie{margin-top:48px;padding-top:20px;border-top:1px solid var(--linea);color:var(--suave);font-size:.9rem}
"""


def pagina(titulo, descripcion, cuerpo, ruta):
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0A0A0A">
<title>{E(titulo)} | Halo Studio</title>
<meta name="description" content="{E(descripcion)}">
<link rel="canonical" href="{URL}{ruta}">
<link rel="icon" href="../logo/favicon.svg" type="image/svg+xml">
<link rel="icon" href="../logo/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="../logo/apple-touch-icon.png">
<link rel="stylesheet" href="../fuentes.css">
<style>{CSS}</style>
</head>
<body>
<main>
<a class="volver" href="../">&larr; Volver a Halo Studio</a>
<h1>{E(titulo)}</h1>
<p class="fecha">Última actualización: {HOY}</p>
{cuerpo}
<p class="pie">Halo Studio · Buenos Aires, Argentina · <a href="mailto:{E(C['email'])}">{E(C['email'])}</a></p>
</main>
</body>
</html>
"""


mail = f'<a href="mailto:{E(C["email"])}">{E(C["email"])}</a>'
analitica = ("<p>Para saber cuántas personas visitan la página y desde dónde llegan, usamos Cloudflare Web Analytics, que mide las visitas "
             "sin cookies y sin identificar a nadie.</p>") if C.get("cf_analytics_token") else ""

AVISO = f"""
<h2>Titular del sitio</h2>
<p>Este sitio web pertenece a <strong>{E(C['nombre'])}</strong>, CUIT {E(C['cuit'])}, que presta servicios de diseño y desarrollo web bajo el nombre
<strong>{E(C['marca'])}</strong>, desde Buenos Aires, Argentina.</p>
<p>Contacto: {mail}.</p>
<h2>Qué ofrece el sitio</h2>
<p>El sitio presenta los servicios de {E(C['marca'])} y una selección de proyectos de ejemplo. Algunos proyectos son maquetas con datos ficticios,
hechas para mostrar cómo trabaja el estudio: no corresponden a negocios reales ni constituyen una oferta de venta.</p>
<h2>Demos preparadas para negocios</h2>
<p>Las páginas de demostración que {E(C['marca'])} prepara para negocios concretos se arman únicamente con información comercial pública del negocio
(nombre, dirección, teléfono y reseñas visibles en Google Maps) y con fotografías de bancos de imágenes de uso libre. No tienen ningún vínculo
con el negocio mencionado ni implican su conformidad hasta que este lo confirme por escrito. Si sos titular de un negocio y querés que retiremos
una demo, escribinos y la damos de baja.</p>
<h2>Propiedad intelectual</h2>
<p>El diseño, los textos y el código del sitio son de {E(C['marca'])}, salvo las fotografías de bancos de imágenes de uso libre y las marcas de
terceros que se mencionan, que pertenecen a sus titulares. No se pueden copiar ni reutilizar sin autorización.</p>
<h2>Responsabilidad</h2>
<p>Hacemos lo posible para que la información del sitio sea correcta y esté al día, pero no garantizamos que no tenga errores ni que esté siempre
disponible. Los enlaces a sitios de terceros, como WhatsApp, Instagram o Google Maps, se ofrecen como comodidad: no controlamos su contenido.</p>
<h2>Legislación aplicable</h2>
<p>Este aviso se rige por las leyes de la República Argentina.</p>
<p>Los datos personales que recogemos se tratan según lo que explica la <a href="../privacidad/">política de privacidad</a>.</p>
"""

PRIV = f"""
<h2>Quién es responsable</h2>
<p>El responsable del tratamiento de tus datos es <strong>{E(C['nombre'])}</strong> (CUIT {E(C['cuit'])}), de {E(C['marca'])}. Podés escribirnos a {mail}.</p>
<h2>Qué datos recogemos</h2>
<p>Cuando completás el formulario &ldquo;Empezá tu proyecto&rdquo; nos dejás los datos que escribís vos:</p>
<ul>
<li>nombre, y ciudad y país desde donde nos escribís;</li>
<li>número de teléfono o WhatsApp y correo electrónico;</li>
<li>nombre del negocio, una descripción de lo que hacés y qué necesitás.</li>
</ul>
<p>Si en cambio nos escribís por WhatsApp, recibimos tu número y el mensaje que envíes. No te pedimos datos sensibles ni de otras personas.</p>
<h2>Para qué los usamos</h2>
<p>Usamos tus datos únicamente para responder tu consulta, preparar la demo o la propuesta que pediste y contactarte por WhatsApp o por correo. No los vendemos ni los usamos para enviarte publicidad de terceros.</p>
<h2>Dónde se guardan y quién los ve</h2>
<p>Las respuestas del formulario se guardan en una hoja de cálculo de Google, en la cuenta del titular del sitio, y se pueden almacenar en servidores de Google ubicados fuera de la Argentina. El sitio se aloja en Cloudflare. No compartimos tus datos con nadie más, salvo que una autoridad lo exija por ley.</p>
<h2>Cuánto tiempo los conservamos</h2>
<p>Los guardamos mientras sea necesario para atender tu consulta. Si no avanzamos con un proyecto, los borramos cuando nos lo pidas. Si contratás el servicio, aplican los plazos que figuren en el contrato.</p>
<h2>Cookies y datos del navegador</h2>
<p>Este sitio no usa cookies de seguimiento ni de publicidad. Solo guarda en tu navegador el idioma que elegiste (español o inglés), para recordarlo en la próxima visita. Ese dato no sale de tu dispositivo.</p>
{analitica}
<h2>Tus derechos</h2>
<p>Podés pedirnos en cualquier momento que te mostremos qué datos tuyos tenemos, que los corrijamos o que los borremos. Escribinos a {mail} y te respondemos en un plazo razonable.</p>
<p>Según la Ley 25.326 de Protección de Datos Personales, el titular de los datos puede ejercer gratuitamente el derecho de acceso a intervalos no inferiores a seis meses. La Agencia de Acceso a la Información Pública es el órgano de control de esa ley y atiende denuncias y reclamos por incumplimientos.</p>
<h2>Cambios en esta política</h2>
<p>Si cambiamos algo importante, actualizamos esta página y la fecha de arriba.</p>
"""

P404 = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0A0A0A">
<title>No encontramos esa página | Halo Studio</title>
<link rel="icon" href="/logo/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fuentes.css">
<style>
{CSS}
main{{min-height:100svh;display:flex;flex-direction:column;justify-content:center}}
.n{{font:400 clamp(5rem,22vw,11rem)/1 "Hedvig Letters Serif",Georgia,serif;color:var(--ambar);margin-bottom:6px}}
.btn{{display:inline-flex;align-items:center;min-height:48px;padding:0 24px;margin-top:18px;border-radius:8px;background:var(--ambar);color:#0a0a0a;font-weight:500;text-decoration:none;align-self:flex-start}}
</style>
</head>
<body>
<main>
<p class="n" aria-hidden="true">404</p>
<h1>No encontramos esa página</h1>
<p style="margin-top:10px">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
<a class="btn" href="/">Volver al inicio</a>
</main>
</body>
</html>
"""

for ruta, titulo, desc, cuerpo in (
    ("/privacidad/", "Política de privacidad", "Qué datos recoge Halo Studio cuando completás el formulario, para qué los usa y cómo podés pedir que los corrija o los borre.", PRIV),
    ("/aviso-legal/", "Aviso legal", "Datos del titular de Halo Studio, alcance del sitio y condiciones de uso.", AVISO),
):
    d = os.path.join(SITIO, ruta.strip("/"))
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(pagina(titulo, desc, cuerpo, ruta))
open(os.path.join(SITIO, "404.html"), "w", encoding="utf-8").write(P404)

# sitemap: solo la home y las páginas legales (las demos con datos ficticios no hace falta indexarlas)
paginas = [("/", "1.0"), ("/aviso-legal/", "0.3"), ("/privacidad/", "0.3")]
open(os.path.join(SITIO, "sitemap.xml"), "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"  <url><loc>{URL}{p}</loc><priority>{pr}</priority></url>\n" for p, pr in paginas) + "</urlset>\n")

# bloque de SEO de la home
ld = {
    "@context": "https://schema.org", "@type": "ProfessionalService", "name": C["marca"], "url": URL + "/",
    "image": URL + "/img/og.jpg", "email": C["email"],
    "description": "Diseño y desarrollo de páginas web para negocios y profesionales de Buenos Aires.",
    "areaServed": "Buenos Aires, Argentina", "founder": {"@type": "Person", "name": C["nombre"]},
    "address": {"@type": "PostalAddress", "addressLocality": "Buenos Aires", "addressCountry": "AR"},
}
bloque = f"""<!--seo:inicio-->
<link rel="canonical" href="{URL}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{E(C['marca'])}">
<meta property="og:locale" content="es_AR">
<meta property="og:title" content="Halo Studio | Diseño web para negocios locales">
<meta property="og:description" content="Páginas web claras y rápidas para negocios y profesionales de Buenos Aires. Ves la demo antes de pagar.">
<meta property="og:url" content="{URL}/">
<meta property="og:image" content="{URL}/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
"""
if C.get("cf_analytics_token"):
    bloque += f"""<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{{"token": "{C['cf_analytics_token']}"}}'></script>\n"""
bloque += "<!--seo:fin-->"
p = os.path.join(SITIO, "index.html")
s = open(p, encoding="utf-8").read()
if "<!--seo:inicio-->" in s:
    s = re.sub(r"<!--seo:inicio-->.*?<!--seo:fin-->", lambda m: bloque, s, flags=re.S)
else:
    s = s.replace('<link rel="preload" href="fonts/staatliches-latin.woff2"', bloque + '\n<link rel="preload" href="fonts/staatliches-latin.woff2"', 1)
open(p, "w", encoding="utf-8").write(s)
print("listo: privacidad, aviso legal, 404, sitemap y SEO de la home")
