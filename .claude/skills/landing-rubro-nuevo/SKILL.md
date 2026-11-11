---
name: landing-rubro-nuevo
description: Suma un rubro nuevo al generador de demos de leads-webs-lucas (dentistas, veterinarias, estética, institutos de idiomas, academias, estudios jurídicos o contables, consultorios, ropa, o cualquier otro) para que scripts/demo.py pueda armar landings de ese rubro. Cubre entender al cliente del rubro, buscar referencias de Framer, elegir fotos de stock de Pexels sin caras, escribir config/landing/{rubro}.json con textos y tres temas visuales, generar demos y revisarlas con capturas. Usalo siempre que Lucas pida demos, plantilla, landing o "las webs" de un rubro que todavía no tiene archivo en config/landing/, aunque no diga "rubro nuevo" ni "plantilla", y también para rehacer o mejorar la plantilla de un rubro que ya existe.
---

# Sumar un rubro al generador de demos

El repo tiene **un solo motor** de landings: `templates/landing.html` lo completa `scripts/demo.py`. Cada rubro aporta dos cosas:

- `config/landing/{clave}.json`: textos, campos del formulario, qué foto va en cada lugar y tres temas visuales.
- `templates/assets/{clave}/`: entre 10 y 14 fotos de stock con su `CREDITOS.json`.

`{clave}` es la del rubro en `config/rubros.json` (`dentista`, `veterinaria`, `estetica`, `idiomas`...). El ejemplo completo y probado es `config/landing/salon_eventos.json`. Leelo antes de empezar y copiá su forma.

Una demo sirve para que el dueño de un negocio sin web la abra en el celular y piense "esto es mío y se ve mejor que mi Instagram". Por eso importan dos cosas: que no parezca hecha por IA y que no diga nada falso sobre su negocio. Todo el criterio de diseño está en el skill `diseno-anti-ia`. Si está disponible, cargalo en el paso 2.

## Antes de empezar

1. Leé el `CLAUDE.md` del repo, sobre todo "Reglas" y "Demos (paso 5)". Esas reglas valen acá también. Una de ellas es hacer solo lo que se pidió y mostrarle el resultado a Lucas antes de commitear.
2. Confirmá que la clave existe en `config/rubros.json`. Si no existe, sumala ahí primero con sus términos de búsqueda.
3. Fijate qué prospectos de la última tanda (`output/tanda-*.csv`) son de ese rubro y cuáles tienen `demo = Sí`. Con esos vas a probar.

## Paso 1: el cliente del rubro, en tres líneas

Antes de escribir textos, anotá para vos:
- **Quién busca** este negocio.
- **Qué compara** antes de elegir.
- **Qué acción** querés que haga la persona. Esa acción define el botón principal, el formulario y el mensaje de WhatsApp.

| Rubro | Acción principal | Campos útiles del formulario |
|---|---|---|
| Salón de eventos | Pedir presupuesto | tipo de evento, fecha, invitados |
| Dentista / consultorio / estética | Pedir turno | motivo o tratamiento, día preferido |
| Veterinaria | Pedir turno o consultar | tipo de mascota, motivo |
| Instituto de idiomas / academia | Consultar o pedir clase de prueba | curso o nivel, edad del alumno |
| Estudio jurídico / contable | Pedir una consulta | tema, sin fecha ni cantidad |
| Tienda de ropa | Consultar o ver catálogo | qué busca |

**Rubros de salud** (dentistas, consultorios, estética, dermatología): no prometas resultados, no nombres tratamientos puntuales como si el lugar los hiciera ("blanqueamiento en una sesión") y no muestres pacientes. Los textos hablan de atención, cercanía y turnos.

**Estudios jurídicos**: el Colegio de Abogados limita la publicidad. Nada de "ganamos el 95% de los casos" ni testimonios inventados.

## Paso 2: referencias

Buscá entre 3 y 5 templates del rubro en Framer con WebSearch, usando `allowed_domains: ["framer.com"]`. Por ejemplo: "framer template dental clinic", "framer template veterinary", "framer template language school". Cada página del marketplace tiene un link a la vista previa (`*.framer.website` o `*.framer.app`).

Para verlas, la red de este entorno tiene que permitir esos dominios y `framerusercontent.com`. Si no los permite, pedilos con `update_environment`, siguiendo las reglas de la herramienta. Sacá capturas de página entera con Playwright, armá una hoja de contacto y mirala con Read.

Anotá **qué estructura y qué detalles tomás**: cómo resuelven el hero, cómo muestran los servicios, qué datos ponen arriba. No copies textos, marcas ni imágenes de los templates.

La estructura del motor ya está resuelta:
1. hero con foto grande
2. frase grande con 3 datos reales
3. tarjetas verticales de "tipos"
4. galería asimétrica con un arco
5. banda oscura con una frase
6. ubicación con mapa
7. formulario a WhatsApp
8. footer con el nombre gigante

Lo que cambia por rubro es qué son los "tipos", qué dice cada sección y cómo se ve. Si las referencias muestran que el rubro necesita una sección distinta (por ejemplo, horarios muy visibles en una veterinaria con guardia), proponéselo a Lucas antes de tocar la plantilla.

## Paso 3: fotos

Las fotos son lo que más pesa en si la demo parece real o parece IA.

1. **Nunca uses las fotos de Google Maps del negocio.** En vista limitada solo se ve la portada, y suele mostrar clientes, a veces chicos, que no dieron permiso para aparecer en una demo que va a circular. Las fotos reales del cliente entran recién cuando compra, en `fotos` dentro de su `datos.json`.
2. Buscá en Pexels con WebSearch, usando `allowed_domains: ["pexels.com"]` y varias búsquedas en inglés. Por ejemplo, para dentista: "dental clinic interior", "dentist chair modern", "dental office reception". El número de cada foto está al final de su URL (`pexels.com/photo/titulo-19569865/`). Unsplash no sirve: bloquea las descargas automáticas.
3. Bajalas y miralas juntas:
   ```bash
   python .claude/skills/landing-rubro-nuevo/scripts/pexels.py ver 19569865 2306281 ... --dir <scratchpad>/pexels-{clave}
   ```
   Después leé `hoja.jpg` con Read. Necesitás el host `images.pexels.com` habilitado.
4. Elegí entre 10 y 14 fotos con estos criterios:
   - **Sin caras reconocibles.** Espacios, detalles, manos, objetos.
   - **Creíbles para un negocio de barrio del GBA.** Ni lujo inalcanzable ni un hospital gigante.
   - **Una misma luz y tono**, para que la página se sienta de un solo lugar.
   - **Al menos 4 horizontales** para el hero y **varias verticales** para las tarjetas de tipos.
   - Descartá las que tengan texto en otro idioma, marcas visibles o equipamiento que el negocio seguramente no tiene.
5. Guardalas con nombres descriptivos:
   ```bash
   python .claude/skills/landing-rubro-nuevo/scripts/pexels.py guardar --rubro {clave} --dir <scratchpad>/pexels-{clave} 2306281:sillon-luz-natural ...
   ```
   Esto también actualiza `CREDITOS.json`.

## Paso 4: `config/landing/{clave}.json`

Copiá `salon_eventos.json` y reemplazá todo. Así se usa cada clave:

| Clave | Qué es |
|---|---|
| `rubro_label` | Nombre del rubro para el título de la pestaña ("Consultorio odontológico") |
| `nav_tipos` | Texto del menú que lleva a las tarjetas ("Tratamientos", "Cursos", "Servicios") |
| `alt_hero`, `alt_galeria` | Texto alternativo de las fotos, que describe la foto de stock, no el negocio |
| `fotos_label` | Texto junto a la cantidad real de fotos en Google ("fotos del consultorio en Google") |
| `meta_descripcion`, `eyebrow`, `titular`, `bajada` | Hero y buscadores. `titular` de 2 líneas como máximo, `bajada` de 20 palabras como máximo |
| `cta` | Etiqueta única del botón principal ("Pedí turno"). Es la misma en el menú, el hero y la banda |
| `intro` | Frase grande debajo del hero |
| `seccion_tipos` + `tipos` | 4 tarjetas, cada una con `titulo`, `texto` (una línea) e `imagen` (archivo de `templates/assets/{clave}/`) |
| `seccion_galeria`, `banda`, `seccion_ubicacion`, `seccion_presupuesto`, `bajada_presupuesto` | Títulos de cada sección |
| `form` | `tipo_label` + `tipos` (desplegable; si no hace falta, lista vacía), `fecha_label` y `cantidad_label` (`null` para no mostrarlos), `extra_label`, `boton` |
| `mensaje_wa` | Primera línea del WhatsApp que se abre ("¡Hola {negocio}! Quiero pedir un turno.") |
| `imagenes.hero` | Lista de fotos horizontales que rotan como foto principal |
| `imagenes.galeria` | Fotos para la galería: hacen falta 6 o más, porque se toman 5 distintas de la del hero |
| `temas` | 3 temas, que rotan según el puesto en la tanda |

`{negocio}` y `{localidad}` se reemplazan solos en cualquier texto.

**Textos.** Escribí en voseo rioplatense, con frases cortas y concretas. Las afirmaciones tienen que ser genéricas del rubro, nunca hechos del negocio que no viste: nada de "20 años de experiencia", "equipamiento de última generación" ni "atendemos obras sociales". Los únicos datos del negocio son los que llegan de Maps: nombre, dirección, teléfono, rating, cantidad de fotos e Instagram.

Prohibido el em-dash (—) y el en-dash (–): usá punto, coma o dos puntos. Releé cada texto en voz alta. Si suena a folleto de IA ("experiencias únicas", "tu bienestar es nuestra prioridad"), reescribilo más simple.

**Temas.** Cada tema define colores (`fondo`, `superficie`, `tinta`, `suave`, `oscuro`, `acento`, `acento_tinta`) y tipografía (`display`, `display_peso`, `display_caso`, `display_tracking`, `display_ancho`, `cuerpo`, `fuentes` con el parámetro `family=` de Google Fonts).

Los tres tienen que ser **familias distintas**: por ejemplo, uno claro con serif, uno oscuro y contundente, y uno frío con sans. Usá un solo acento por tema y verificá el contraste del texto del botón contra el acento, que tiene que ser 4,5:1 o más (`acento_tinta` resuelve eso).

Para salud conviene ir a lo limpio y luminoso: blancos rotos fríos, verde agua, azul pizarra, un acento cálido. Evitá:
- el beige + dorado + marrón espresso que todas las IA usan para "premium",
- el violeta con brillo,
- Inter, Fraunces e Instrument Serif como tipografía de títulos.

Los temas de salones (bosque, noche, lago) sirven de ejemplo de cómo variar, no para copiarlos.

## Paso 5: generar y revisar

```bash
python scripts/demo.py --demos --rubro {clave}        # o --ranking N para una sola
node .claude/skills/landing-rubro-nuevo/scripts/revisar_demo.js <scratchpad>/capturas-{clave} output/demos/<carpeta> ...
```

Probá con al menos 3 demos de puestos distintos, así aparecen los tres temas (`--ranking` sirve para cualquier puesto del rubro, aunque no tenga `demo = Sí`). Si `datos.json` ya existía, `demo.py` no lo pisa. Para que tome los cambios del JSON del rubro, borrá esa carpeta de demo antes de regenerar. Si Lucas la había editado a mano, preguntale antes.

`revisar_demo.js` hace estos chequeos automáticos:
- sin em-dash,
- sin campos `{{...}}` sin completar,
- imágenes existentes,
- sin errores de JavaScript,
- sin scroll horizontal,
- título de 3 líneas como máximo,
- botones en un renglón,
- tipografía cargada.

Arreglá cualquier FALLA. Después **mirá las capturas** con Read: el primer pantallazo de escritorio y de celular, y la hoja de la página entera. Los chequeos automáticos no ven lo importante:
- ¿Las fotos se sienten de un mismo lugar?
- ¿El texto del hero se lee sobre la foto?
- ¿Algo se ve genérico o de plantilla?
- ¿Algún texto promete algo que no sabemos?

Corregí y volvé a revisar hasta que no te dé vergüenza mandársela al dueño.

Si tuviste que tocar `templates/landing.html` o `scripts/demo.py`, el cambio tiene que ser genérico (configurable desde el JSON) y no puede romper salones. Regenerá una demo de `salon_eventos`, revisala y corré `python -m unittest discover tests`.

## Paso 6: cerrar

- En `CLAUDE.md`, en "Demos (paso 5)", sumá el rubro a la lista de rubros con plantilla.
- Si agregaste algo al motor, sumale un test en `tests/test_demo.py`.
- Mostrale a Lucas las capturas, una de cada tema, y contale qué decidiste y por qué: acción principal, qué son los "tipos", qué fotos y qué temas elegiste. Commiteá cuando él lo apruebe, si no lo pidió antes.
