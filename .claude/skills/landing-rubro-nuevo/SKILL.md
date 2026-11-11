---
name: landing-rubro-nuevo
description: Suma un rubro nuevo al generador de demos de leads-webs-lucas (dentistas, veterinarias, estética, institutos de idiomas, academias, estudios jurídicos o contables, consultorios, ropa, o cualquier otro) para que scripts/demo.py pueda armar landings de ese rubro. Cubre entender al cliente del rubro, buscar referencias, elegir fotos de stock de Pexels sin caras, escribir config/landing/{rubro}.json con textos profesionales y tres temas visuales, generar demos pensadas para celular y revisarlas con capturas. Usalo siempre que Lucas pida demos, plantilla, landing o "las webs" de un rubro que todavía no tiene archivo en config/landing/, aunque no diga "rubro nuevo" ni "plantilla", y también para rehacer o mejorar la plantilla de un rubro que ya existe.
---

# Sumar un rubro al generador de demos

El repo tiene **un solo motor** de landings: `templates/landing.html` lo completa `scripts/demo.py`. Cada rubro aporta dos cosas:

- `config/landing/{clave}.json`: textos, formulario, qué foto va en cada lugar y tres temas visuales.
- `templates/assets/{clave}/`: entre 10 y 14 fotos de stock con su `CREDITOS.json`.

`{clave}` es la del rubro en `config/rubros.json`. El ejemplo completo y probado es `config/landing/salon_eventos.json`. Leelo antes de empezar.

## Para quién es la página

Así va a llegar la gente: el negocio pone el link en la bio de su Instagram o como "sitio web" en su ficha de Google Maps. Casi todos van a abrir la página **desde el celular, dentro del navegador de Instagram o de Maps**, con el pulgar y apurados. Tres consecuencias:

- **Lo que importa se ve en la primera pantalla del celular:** qué es, dónde queda y el botón para pedir turno o presupuesto. El motor ya lo resuelve con un hero sin estrellas, un menú en píldora con el botón siempre visible y una barra fija abajo con el botón principal y WhatsApp.
- **Textos cortos.** Cada frase se lee en una pantalla angosta.
- **El formulario se completa con toques, no tipeando.** El motor tiene un modo `turno` con opciones para tocar.

La demo tiene que hacer que el dueño piense "esto es mío y se ve más profesional que mi Instagram". Por eso importan tres cosas: que no parezca hecha por IA, que el tono sea profesional y que no diga nada falso. El criterio de diseño está en el skill `diseno-anti-ia`: cargalo en el paso 2.

## Antes de empezar

1. Leé el `CLAUDE.md` del repo, sobre todo "Reglas" y "Demos (paso 5)". Hacé solo lo que se pidió y mostrale el resultado a Lucas antes de commitear.
2. Confirmá que la clave existe en `config/rubros.json`. Si no existe, sumala ahí con sus términos de búsqueda.
3. Fijate qué prospectos de la última tanda (`output/tanda-*.csv`) son de ese rubro y cuáles tienen `demo = Sí`. Mirá también su `categoria`: dentro de un rubro hay variantes.
   - Un "dentista" puede ser un centro de radiografías.
   - Una "veterinaria" puede ser un pet shop.
   - Un "consultorio" puede ser de kinesiología.

   Las variantes las resolvés en el paso 5.
4. Listá las tipografías de títulos que ya usan los otros rubros:
   ```bash
   python3 -c "import json,glob;[print(f, [t['display'].split(',')[0] for t in json.load(open(f))['temas']]) for f in glob.glob('config/landing/*.json')]"
   ```
   El rubro nuevo tiene que usar **familias distintas**. Si todos los rubros terminan con las mismas, las demos se parecen entre sí y se nota la plantilla.

## Paso 1: el cliente del rubro, en tres líneas

Anotá para vos:
- **Quién busca** este negocio.
- **Qué compara** antes de elegir.
- **Qué acción** querés que haga la persona.

La acción define el modo del formulario, el botón principal y el mensaje de WhatsApp.

| Rubro | Acción | `form.modo` | Opciones útiles |
|---|---|---|---|
| Salón de eventos | Pedir presupuesto | `presupuesto` | tipo de evento, fecha, invitados |
| Dentista / consultorio / estética | Pedir turno | `turno` | motivo, día, franja |
| Veterinaria | Pedir turno | `turno` | motivo, mascota (extra), día, franja |
| Instituto de idiomas / academia | Consultar o pedir clase de prueba | `turno` | curso o nivel, edad (extra), día, franja |
| Estudio jurídico / contable | Pedir una consulta | `turno` | tema, día, franja |
| Tienda de ropa | Consultar | `presupuesto` sin fecha ni cantidad | qué busca |

El modo `turno` sigue el recorrido de reserva de Colo Studio (colo-studio.pages.dev):
1. elegís el motivo con un toque,
2. elegís uno de los próximos días de atención (los arma solo, según `dias`),
3. elegís la franja,
4. escribís tu nombre,
5. se abre WhatsApp con el mensaje listo: "¡Hola X! Quiero pedir un turno. Soy Ana. Motivo: Control. Día preferido: Jueves 14. Horario: Tarde."

Sin llamadas ni idas y vueltas.

**Rubros de salud** (dentistas, consultorios, estética, dermatología, veterinarias):
- no prometas resultados,
- no nombres tratamientos puntuales como si el lugar los hiciera,
- no muestres pacientes.

**Estudios jurídicos**: el Colegio de Abogados limita la publicidad. Nada de porcentajes de casos ganados ni testimonios inventados.

## Paso 2: referencias

Buscá entre 3 y 5 templates del rubro en Framer con WebSearch, usando `allowed_domains: ["framer.com"]`. Cada página del marketplace tiene un link a su vista previa (`*.framer.website` o `*.framer.app`). Para verlas, la red tiene que permitir esos dominios y `framerusercontent.com`; si no, pedilos con `update_environment` siguiendo sus reglas.

Para rubros de turnos, mirá también **colo-studio.pages.dev**, un sitio real de Lucas que funciona bien. Lo que vale la pena tomar:
- es corto,
- el menú en píldora tiene el botón siempre visible,
- tiene una luz suave detrás del hero,
- usa una palabra en cursiva de la misma familia en los títulos,
- los textos son cálidos pero profesionales: "Belleza y bienestar en cada detalle." o "Reservá en menos de dos minutos, sin llamadas ni esperas."

Si un sitio no carga, sacá capturas de la página del marketplace y anotá que no viste la vista previa. Tomá **patrones**, no textos, marcas ni imágenes.

La estructura del motor ya está resuelta:
1. hero con foto,
2. frase grande con 3 datos reales (el rating va acá, nunca en el hero),
3. tarjetas de "tipos",
4. galería asimétrica,
5. sección oscura con una frase y el formulario,
6. ubicación con mapa,
7. footer con el nombre gigante.

Por rubro cambia qué son los "tipos", qué dice cada parte y cómo se ve. Si el rubro necesita una sección distinta, proponéselo a Lucas antes de tocar la plantilla.

## Paso 3: fotos

1. **Nunca uses las fotos de Google Maps del negocio.** Suelen mostrar clientes, a veces chicos, que no dieron permiso. Las fotos reales entran cuando el cliente compra, en `fotos` dentro de su `datos.json`.
2. Buscá en Pexels con WebSearch, usando `allowed_domains: ["pexels.com"]` y varias búsquedas en inglés. El número de cada foto está al final de su URL. La página de pexels.com suele estar bloqueada, pero `images.pexels.com` funciona. Unsplash no sirve.
3. Bajalas y miralas juntas: `python .claude/skills/landing-rubro-nuevo/scripts/pexels.py ver <números> --dir <scratchpad>/pexels-{clave}`, y después leé `hoja.jpg` con Read.
4. Elegí entre 10 y 14 con estos criterios:
   - **sin caras reconocibles** (espacios, detalles, manos, objetos; en veterinarias, los animales),
   - **creíbles** para un negocio de barrio del GBA,
   - **una misma luz y tono**,
   - **al menos 5 horizontales** para el hero (rotan por puesto) y verticales para las tarjetas.
   - **Sin el mismo sujeto repetido**, como el mismo gato en tres fotos.
   - Descartá las que tengan texto en otro idioma, marcas o equipamiento improbable.
5. Guardalas: `python .claude/skills/landing-rubro-nuevo/scripts/pexels.py guardar --rubro {clave} --dir <...> 2306281:nombre-descriptivo ...`. El script también actualiza `CREDITOS.json`. Las versiones de 800 px para celular las arma solo `demo.py`.

## Paso 4: `config/landing/{clave}.json`

Copiá `salon_eventos.json` y reemplazá todo. Así se usa cada clave:

| Clave | Qué es |
|---|---|
| `rubro_label`, `nav_tipos`, `alt_hero`, `alt_galeria`, `fotos_label`, `meta_descripcion` | Etiquetas. `fotos_label` acompaña la cantidad real de fotos en Google ("fotos del consultorio en Google") |
| `eyebrow`, `titular`, `bajada` | Hero. `titular` de 2 líneas como máximo, `bajada` de 20 palabras como máximo |
| `cta` | Etiqueta única del botón principal ("Pedí turno"), igual en todos lados |
| `intro`, `seccion_tipos`, `tipos` (4, con `titulo`, `texto` e `imagen`), `seccion_galeria`, `banda`, `bajada_presupuesto`, `seccion_ubicacion` | Textos de cada sección. `banda` es la frase grande sobre el formulario |
| `form` | `modo` (`turno` o `presupuesto`), `tipo_label` y `tipos` (opciones para tocar, hasta 6), `extras` (lista de `{label, opciones}`, como "Mascota": Perro / Gato / Otra), `dias` (días de atención, 0 = domingo; por defecto lunes a sábado), `franjas` (como ["Mañana", "Tarde"]), `fecha_label` y `cantidad_label` (solo en `presupuesto`), `extra_label`, `boton` |
| `mensaje_wa` | Primera línea del WhatsApp ("¡Hola {negocio}! Quiero pedir un turno.") |
| `imagenes.hero` (5 o más), `imagenes.galeria` (6 o más) | Nombres de archivo de `templates/assets/{clave}/` |
| `temas` | 3 temas que rotan según el puesto en la tanda |

`{negocio}` y `{localidad}` se reemplazan solos. Una palabra entre asteriscos (`"Tu sonrisa, en *buenas manos*."`) sale en cursiva o en negrita, según el tema. Usala como máximo en una palabra o dos por título, y no en todos los títulos.

**Tono: profesional y cálido, nunca de charla.** Escribí como escribiría un buen consultorio o estudio de la zona: voseo, frases claras, verbos concretos y cero vocabulario de folleto. Todo lo que diga la página tiene que poder firmarlo un profesional.

| Evitar | Por qué | Mejor |
|---|---|---|
| "Para cuidar tu boca *sin vueltas*" | coloquial, resta seriedad | "Atención odontológica cerca de tu casa" |
| "Nos escribís", "Seguimos" (como títulos) | suena a chat, no informa | "Pedí tu turno", "Controles periódicos" |
| "Para el día que algo no anda bien" | vago e informal | "También para consultas que no pueden esperar" |
| "Te contamos qué vemos, sin apuro" | promesa vaga y coloquial | "Te explicamos el diagnóstico y los pasos a seguir" |
| "Bien cuidados, cerca de casa." | aceptable, pero muy de eslogan | "Atención veterinaria en {localidad}" (claro), o con *énfasis* |
| "Tu bienestar es nuestra prioridad", "experiencia única" | folleto de IA | una frase concreta sobre qué se hace y dónde |

Además:
- Sin lunfardo ni muletillas: "posta", "re", "copado", "tranqui", "che", "un lujo".
- Sin preguntas retóricas en los títulos.
- Sin signos de exclamación salvo en el saludo del WhatsApp.
- Prohibido el em-dash (—) y el en-dash (–).
- **Nada que no viste**: ni años, ni equipamiento, ni obras sociales, ni guardia, ni especialidades.

Releé cada texto pensando en cómo se lee en un celular, dentro de Instagram, por alguien que no te conoce.

**Temas.** Cada tema tiene:
- **colores:** `fondo`, `superficie`, `tinta`, `suave`, `oscuro`, `acento`, `acento_tinta`,
- **tipografía:** `display`, `display_peso`, `display_caso`, `display_tracking`, `display_ancho`, `cuerpo`, `fuentes` (el parámetro `family=` de Google Fonts, **con el eje de cursiva** si la familia la tiene: `ital,wght@0,500;1,500`),
- **énfasis:** `enfasis_estilo` (`italic` o `normal`) y `enfasis_peso` (para familias sin cursiva, usá un peso más alto, como `800`).

Reglas para los temas:
- **Tres familias visuales distintas entre sí y distintas de las de otros rubros** (lo listaste antes de empezar).
- Evitá como tipografía de títulos Inter, Fraunces e Instrument Serif.
- Evitá los fondos de papel cálido tipo `#efede7` o `#f2eee6`, que todas las IA usan como "premium". Para salud funcionan mejor los blancos rotos fríos, el verde agua, el azul pizarra o un neutro gris con un acento cálido.
- **Contraste:** el texto del botón contra el acento (`acento_tinta` sobre `acento`) tiene que dar 4,5:1 o más. El acento también se usa como color de texto sobre `oscuro` en el footer. Si un acento vivo no llega con texto blanco, probá texto oscuro antes de oscurecer el acento.

## Paso 5: generar y revisar

```bash
python scripts/demo.py --demos --rubro {clave}        # o --ranking N
node .claude/skills/landing-rubro-nuevo/scripts/revisar_demo.js <scratchpad>/capturas-{clave} output/demos/<carpeta> ...
```

Probá con al menos 3 demos de puestos distintos, así aparecen los tres temas. `--ranking` sirve para cualquier puesto, aunque no esté marcado para demo. Si una carpeta de demo ya tiene `datos.json`, `demo.py` no lo pisa. Para que tome cambios del JSON del rubro, borrá esa carpeta primero, salvo que Lucas la haya editado a mano.

**Variantes por negocio.** Si la `categoria` de Maps muestra que un prospecto es otra cosa dentro del rubro (centro de radiografías, pet shop, ortodoncia), ajustá sus textos y opciones en su `datos.json`. Dejá una clave `_ajuste` que explique qué cambiaste y por qué, y regenerá con `--render`. Mencionaselo a Lucas en el resumen.

`revisar_demo.js` hace estos chequeos automáticos:
- **De contenido:** sin em-dash, sin campos sin completar, imágenes existentes.
- **En escritorio y celular:** sin errores de JavaScript, sin scroll horizontal, título de 3 líneas como máximo, botones en un renglón, botón principal visible sin bajar, sin estrellas en el hero.
- **Solo en escritorio:** tipografía cargada con su peso real.
- **Solo en celular:** áreas de toque de 44 px o más, versión liviana de la foto del hero y barra fija que aparece al bajar.

Arreglá cualquier FALLA. Después **mirá las capturas, empezando por las de celular**, que es como las va a ver casi todo el mundo:
- ¿En la primera pantalla se entiende qué es y cómo pedir turno?
- ¿Las fotos son de un mismo lugar?
- ¿Algún texto suena coloquial, de folleto o promete algo que no sabemos?
- ¿Se parece demasiado a otro rubro?

Corregí y volvé a revisar hasta que te parezca que se la podés mandar al dueño.

Si tocaste `templates/landing.html` o `scripts/demo.py`, el cambio tiene que ser genérico (configurable desde el JSON) y no puede romper salones. Regenerá una demo de `salon_eventos`, revisala y corré `python -m unittest discover tests`.

## Paso 6: cerrar

- En `CLAUDE.md`, sección "Demos (paso 5)", sumá el rubro a la lista de rubros con plantilla.
- Si agregaste algo al motor, sumale un test en `tests/test_demo.py`.
- Mostrale a Lucas una captura de celular y una de escritorio de cada tema, y contale qué decidiste y por qué:
  - acción principal y modo del formulario,
  - qué son los "tipos",
  - fotos, temas y tipografías,
  - variantes por negocio.
- Commiteá cuando él lo apruebe, si no lo pidió antes.
