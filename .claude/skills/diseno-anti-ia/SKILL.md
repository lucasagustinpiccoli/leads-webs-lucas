---
name: diseno-anti-ia
description: Criterio y método para diseñar landings y sitios de negocios reales (comercios, consultorios, salones, estudios, profesionales) que no parezcan "página hecha por IA" y que funcionen en el celular, que es desde donde llega casi todo el mundo (link en la bio de Instagram o "sitio web" en Google Maps). Partir de referencias reales (Framer, sitios bien hechos), fotografía creíble y sin caras, tipografía y paleta con intención, textos profesionales en voseo, recorridos de reserva simples y revisión con capturas en celular y escritorio antes de mostrar. Usalo siempre que tengas que crear, rediseñar o revisar el diseño o los textos de una landing, demo, web o página para un cliente o negocio, cuando alguien diga que una página "parece de IA", "genérica", "de plantilla", "poco profesional" o "fea", o pida que se vea "como Framer", "profesional" o "premium", aunque no mencione diseño explícitamente.
---

# Diseño que no parece hecho por IA

Una página "de IA" se reconoce en dos segundos. Tiene un gradiente violeta y un hero centrado que dice "Elevá tu experiencia". Abajo vienen tres tarjetas iguales con íconos de línea, un em-dash en cada párrafo, estrellitas de Google en el hero y fotos que nadie miró.

El dueño de un negocio no se reconoce en eso y no lo compra. Este skill es el método para salir de ese default. Si también está disponible el skill `design-taste-frontend`, sus reglas detalladas valen. Este skill es la versión práctica para negocios locales.

## 0. Primero el celular

Un negocio local comparte su web de dos formas: el link en la bio de Instagram o el campo "sitio web" de su ficha de Google Maps. En los dos casos la visita llega **desde un celular, dentro del navegador de esa app**, con una mano y poca paciencia. Diseñá para eso primero y después adaptá a escritorio.

- **Primera pantalla del celular:** qué es, dónde queda y el botón de la acción principal, sin bajar. Lo demás puede esperar.
- **Acción siempre a mano:**
  - un menú en píldora flotante con el botón principal,
  - y en el celular, una barra fija abajo con ese botón y WhatsApp, que aparezca después del hero y se esconda donde ya hay un botón (el formulario, el footer).
- **Áreas de toque de 44 px o más, y formularios que se completan tocando.** Opciones en forma de píldora para motivo, día y franja, en vez de selects y campos de fecha. Lo único que se tipea es el nombre.
- **Links que abren apps:** el teléfono con `tel:`, la dirección con un link de Google Maps y WhatsApp con `wa.me` y el mensaje armado. En el navegador de Instagram, `window.open` suele bloquearse, así que hay que navegar con `location.href`.
- **Liviana:**
  - fotos de 800 px para celular (`srcset`),
  - la del hero precargada,
  - el resto con `loading="lazy"`,
  - pocas tipografías,
  - nada de librerías pesadas para animar tres cosas.
- **Corta.** Colo Studio (colo-studio.pages.dev), un sitio real que funciona bien, tiene 4 secciones y mide 2.500 px en el celular. Cada sección tiene que ganarse su lugar.

## 1. Empezá por referencias, no por el código

El default de un modelo es el promedio de todo lo que vio, y ese promedio es justo lo que se reconoce como IA. Mirá diseño real antes de escribir:

- **Buscá entre 3 y 6 referencias del rubro.** El marketplace de Framer, con WebSearch y `allowed_domains: ["framer.com"]`, tiene vistas previas en vivo. También sirven sitios de negocios reales bien hechos y lo que traiga el usuario. Si una vista previa no carga, decilo; no inventes que la viste.
- **Sacá capturas de página entera, en celular y en escritorio, y miralas.** Anotá:
  - cómo resuelven el hero,
  - qué tipografía usan y en qué tamaño,
  - cuántos colores hay,
  - cómo varía el layout entre secciones,
  - qué hacen con la luz y las fotos,
  - cómo es el recorrido hasta reservar.
- **Tomá patrones, no contenido.**

Patrones que se repiten en lo bueno:
- **fotografía grande** como protagonista,
- **una familia de títulos usada en grande y con convicción**, con una palabra en cursiva o negrita de la misma familia como énfasis ("en cada *detalle*"),
- **una luz suave**: un resplandor del color de acento, muy tenue, detrás del hero o de una sección, o una foto que se funde con el fondo,
- **una frase grande sola después del hero**,
- **datos reales en números grandes**,
- **secciones que cambian de forma**,
- **el nombre gigante en el footer**,
- **mucho aire**.

## 2. Fotografía

- **Fotos reales del negocio, solo con permiso del dueño.** Las de Google Maps o del Instagram del negocio no se usan en una demo: suelen mostrar clientes, a veces chicos, que no aceptaron aparecer.
- **Para demos, stock con licencia libre.** Pexels deja bajar por número de foto desde `images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?w=1600`; su web suele estar bloqueada para bots, así que los números se buscan con WebSearch. Unsplash bloquea las descargas automáticas. Aclará en la página que las fotos son de referencia.
- **Criterios:**
  - sin caras reconocibles,
  - creíbles para el negocio real,
  - todas con la misma luz y tono,
  - sin el mismo sujeto repetido,
  - horizontales para el hero y verticales para tarjetas.
- **Mirá cada foto antes de usarla:** bajalas, armá una hoja de contacto y leela.
- Nada de placeholders con gradiente, SVG dibujados a mano ni capturas falsas hechas con divs.

## 3. Tipografía y color

- **Una familia para títulos y otra para texto, como máximo.** Los títulos van grandes, con interlineado cerca de 1 y tracking negativo en los sans. Cargá el eje de cursiva si lo vas a usar; la cursiva falsa que genera el navegador se ve barata.
- **Evitá como default** Inter para títulos, Fraunces e Instrument Serif. Y **no repitas las mismas familias en todos los proyectos**: si la página anterior usó Newsreader y Barlow Condensed, esta usa otras. El serif se justifica en hotelería, eventos, salud con tono clásico o estudios. Si no, un sans con personalidad.
- **Paleta:**
  - un neutro de fondo (ni blanco ni negro puros),
  - un oscuro de marca,
  - **un solo acento** en toda la página.
- **Evitá:**
  - el violeta con brillo,
  - el beige + dorado + marrón espresso,
  - **los fondos de papel cálido** (`#efede7`, `#f2eee6`, `#f5f1ea` y parecidos), que son el "premium" por defecto de las IA.
- **Paletas que funcionan:**
  - verde bosque con hueso y lima,
  - casi negro con terracota,
  - azul pizarra con naranja,
  - blanco frío con verde agua y coral,
  - oliva con ladrillo.
- **Contraste de 4,5:1 o más** en el texto de cada botón. Ojo: el mismo acento suele usarse sobre fondo claro (botón) y sobre fondo oscuro (texto del footer o de una banda). Si oscurecés el acento para que el texto blanco pase, puede dejar de leerse sobre el oscuro. Muchas veces la solución es mantener el acento vivo y usar **texto oscuro** en el botón.
- **Un solo radio de bordes**, o una regla fija (botones en píldora, tarjetas de 22 px).

## 4. Layout

- **Hero:**
  - entra en la primera pantalla del celular,
  - título de 2 líneas en escritorio y 3 en celular, como máximo,
  - bajada de 20 palabras como máximo,
  - 1 botón principal y como mucho 1 secundario.
  - **Sin estrellas, ratings, insignias ni logos.** El rating de Google, si es bueno, va como dato debajo del hero, no encima de la foto.
- **Nada de tres tarjetas iguales en fila.** Usá tarjetas verticales con foto que en el celular se deslizan de costado, un split, una galería asimétrica o números grandes.
- **Etiquetas chicas en mayúscula sobre los títulos** (eyebrows): una cada tres secciones, como máximo.
- **Un solo texto por intención:** si es "Pedí turno", dice lo mismo en el menú, el hero, la barra y el final.
- **Menú de una línea**, de 64 px de alto o menos.

## 5. Textos: profesionales y cálidos

El tono es el de un buen profesional de la zona hablándole a un vecino: voseo, frases claras y concretas, ni folleto ni charla de WhatsApp. Si un dentista, un abogado o el dueño de un salón no firmaría esa frase en su vidriera, cambiala.

| Evitar | Mejor |
|---|---|
| "Cuidamos tu boca *sin vueltas*" | "Atención odontológica en {localidad}" |
| "Nos escribís / Seguimos" como títulos | "Pedí tu turno / Controles periódicos" |
| "Para el día que algo no anda bien" | "También para consultas que no pueden esperar" |
| "Elevá tu experiencia", "soluciones integrales", "tu bienestar es nuestra prioridad" | qué se hace, para quién y dónde, en una frase |
| "¿Buscás un lugar donde...?" | afirmación directa |

Además:
- **Sin lunfardo ni muletillas:** "posta", "re", "copado", "tranqui", "che", "un lujo", "sin vueltas".
- **Sin signos de exclamación**, salvo en el saludo de WhatsApp.
- **Sin em-dash (—) ni en-dash (–).**
- **Honestidad:** años, servicios, precios, equipamiento, obras sociales, premios y testimonios van solo si los viste en una fuente real. Un número falso que suena preciso ("+500 eventos") es peor que nada. En salud no se prometen resultados.
- **Releé cada texto visible** (títulos, botones, opciones, textos alternativos, footer) imaginando que lo lee en el celular alguien que llegó desde Instagram.

## 6. Recorrido de reserva (negocios de turnos)

Lo que hace bien un sitio de turnos como Colo Studio:
1. **Un paso a la vez y con toques:** servicio o motivo, día, franja horaria y datos mínimos.
2. **Los días se ofrecen ya armados** (los próximos días de atención: "Hoy", "Mañana", "Jue 14"). No hace falta un calendario.
3. **Errores amables y concretos:** "Ese horario ya no está disponible. Elegí otro." o "Escribí tu nombre para que sepamos a quién responder."
4. **El cierre es un mensaje listo para mandar:** WhatsApp se abre con motivo, día y franja escritos.
5. **Promesa simple en el último bloque:** "Reservá en menos de dos minutos, sin llamadas ni esperas." Solo si es cierto para esa página.

Sin un sistema de turnos real, no prometas confirmación automática: el mensaje dice "Pedir turno" y la persona sabe que le van a responder por WhatsApp.

## 7. Movimiento

Solo lo que tiene una razón de ser:
- **Entrada del hero:** la foto con un zoom lento y el texto subiendo, con una curva de salida fuerte (`cubic-bezier(.23,1,.32,1)`).
- **Aparición de secciones** al hacer scroll, con `IntersectionObserver`.
- **Botones** que se hunden un poco al tocarlos (`scale(.97)`, unos 160 ms).
- **Barra fija** que entra y sale con opacidad y desplazamiento.

Los efectos de hover van dentro de `@media (hover: hover)`. Con `prefers-reduced-motion` se apaga todo el desplazamiento. Nada de loops, cursores personalizados ni parallax.

## 8. Revisá con capturas antes de mostrar

1. **Capturas en celular (iPhone 13) y en escritorio (1440×900):** la primera pantalla y la página entera. Empezá mirando las de celular.
2. **Chequeos automáticos:**
   - sin errores de JavaScript,
   - sin scroll horizontal,
   - sin em-dashes,
   - las tipografías cargaron, con su peso real,
   - ningún botón se parte en dos renglones,
   - el botón principal se ve sin bajar,
   - áreas de toque de 44 px o más,
   - las imágenes existen.
3. **Miralas con ojo de cliente:**
   - ¿Desde el celular se entiende en 3 segundos qué es y cómo pedir turno?
   - ¿Se ve como una referencia de Framer o como una plantilla?
   - ¿Algo tapa algo?
   - ¿Hay celdas vacías?
   - ¿Algún texto suena coloquial, de folleto o inventado?
4. **Corregí, volvé a capturar** y mostrale al usuario las capturas, no solo el archivo.

## Lista rápida de señales de IA

Si ves alguna, corregila antes de entregar:
- gradientes violetas,
- hero centrado sin foto,
- estrellas o insignias en el hero,
- tres tarjetas iguales,
- em-dash,
- "Elevá", "Descubrí", "Experiencia",
- eyebrows en todas las secciones,
- números falsos,
- testimonios inventados,
- íconos dibujados a mano,
- fotos sin mirar,
- el mismo layout repetido,
- fondo de papel cálido por defecto,
- las mismas tipografías del proyecto anterior,
- texto gris claro sobre blanco,
- formularios que obligan a tipear en el celular,
- el botón de WhatsApp tapando algo,
- frases coloquiales que restan seriedad.
