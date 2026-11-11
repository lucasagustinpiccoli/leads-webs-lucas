---
name: diseno-anti-ia
description: Criterio y método para diseñar landings y sitios de negocios reales (comercios, consultorios, salones, estudios, profesionales) que no parezcan "página hecha por IA". Partir de referencias reales (Framer y sitios premiados), elegir fotografía creíble y sin caras, tipografía y paleta con intención, textos honestos y en voseo, y revisar con capturas en escritorio y celular antes de mostrar. Usalo siempre que tengas que crear, rediseñar o revisar el diseño de una landing, demo, web o página para un cliente o negocio, cuando alguien diga que una página "parece de IA", "genérica", "de plantilla" o "fea", o pida que se vea "como Framer", "profesional" o "premium", aunque no mencione diseño explícitamente.
---

# Diseño que no parece hecho por IA

Una página "de IA" se reconoce en dos segundos. Tiene un gradiente violeta y un hero centrado con un título que dice "Elevá tu experiencia". Abajo vienen tres tarjetas iguales con íconos de línea, un em-dash en cada párrafo, y fotos inventadas o directamente ninguna.

El problema no es estético: el dueño del negocio no se reconoce en una página así y no la compra. Este skill es el método para salir de ese default.

Si también está disponible el skill `design-taste-frontend`, sus reglas detalladas valen. Este skill es la versión corta y práctica para negocios locales.

## 1. Empezá por referencias, no por el código

El default de un modelo es el promedio de todo lo que vio, y el promedio es justo lo que se reconoce como IA. Para salir de ahí, mirá diseño real antes de escribir una línea:

- Buscá entre 3 y 6 referencias del rubro. El marketplace de Framer (`framer.com/marketplace/templates/...`, con WebSearch y `allowed_domains: ["framer.com"]`) es una buena fuente porque cada template tiene una vista previa en vivo. También sirven Awwwards, sitios de negocios reales bien hechos y las referencias que traiga el usuario.
- Sacá capturas de página entera (Playwright, `fullPage: true`) y miralas. Anotá en concreto:
  - cómo resuelven el hero,
  - qué tipografía usan y en qué tamaño,
  - cuántos colores hay,
  - cómo cambia el layout de una sección a otra,
  - qué hacen con las fotos,
  - qué detalle hace que se sienta caro.
- Tomá **patrones**, no contenido: nada de copiar textos, logos ni imágenes.

Patrones que se repiten en lo bueno y casi nunca en lo genérico:
- **Fotografía grande** como protagonista: un hero a pantalla casi completa, a veces dentro de un marco con bordes redondeados y un margen chico alrededor.
- **Tipografía con carácter y en grande:** un serif editorial, un sans display muy ajustado o un condensado en mayúsculas. Siempre una sola familia de títulos, usada con convicción.
- **Una frase grande sola** después del hero, en vez de un párrafo de marketing.
- **Datos concretos en números grandes**, solo si son reales.
- **Secciones que cambian de forma:** tarjetas verticales con foto, una galería asimétrica (un arco, una celda doble), una banda oscura con una frase, un split con mapa. Que no haya dos secciones con el mismo layout.
- **El nombre del negocio gigante** en el footer.
- **Mucho aire y pocos elementos por pantalla.**

## 2. Fotografía

Sin fotos buenas no hay diseño que salve la página.

- **Fotos reales del negocio**, solo con permiso del dueño. Las de Google Maps o Instagram de terceros no se usan en una demo: suelen mostrar clientes, a veces chicos, que no aceptaron aparecer en una página que va a circular.
- **Para demos y propuestas, stock con licencia libre.** Pexels sirve y deja bajar por número de foto (`images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?w=1600`). Unsplash bloquea las descargas automáticas. Aclará en la página que las fotos son de referencia.
- **Criterios para elegir:**
  - sin caras reconocibles,
  - creíbles para el negocio real (un salón de barrio no es un hotel de cinco estrellas),
  - todas con una luz y un tono parecidos,
  - horizontales para el hero y verticales para tarjetas.
- **Mirá cada foto antes de usarla.** Bajalas, armá una hoja de contacto y leela. Una foto elegida solo por el título que tiene en el banco de imágenes es una lotería.
- Prohibido rellenar con gradientes "de placeholder", dibujos SVG hechos a mano o capturas falsas armadas con divs. Si no hay fotos, decilo y dejá el lugar marcado.

## 3. Tipografía y color

- **Una familia para títulos y una para texto, como máximo.** La de títulos se usa grande, con el interlineado y el tracking ajustados (`line-height` cerca de 1, tracking negativo en los sans).
- Evitá como default Inter para títulos, y Fraunces e Instrument Serif, que son los serif que más usan las IA. El serif se justifica en hotelería, eventos, gastronomía o rubros clásicos. Si no, un sans con personalidad: Manrope, Archivo condensado, Hanken Grotesk, Geist, Satoshi.
- **Paleta:** un neutro de fondo (nunca blanco puro ni negro puro), un tono oscuro de marca y **un solo acento**, usado igual en toda la página.
- Familias que funcionan:
  - verde bosque con hueso y un acento lima,
  - casi negro con terracota,
  - azul pizarra con naranja,
  - oliva con ladrillo,
  - monocromo con un solo color saturado.
- Evitá el violeta con brillo y también el beige + dorado + marrón espresso, que es el "premium" por defecto de todas las IA.
- **Contraste:** el texto de cada botón contra su fondo tiene que dar 4,5:1 o más. El texto sobre fotos necesita una capa oscura o un degradé que lo sostenga.
- **Un solo radio de bordes** en toda la página. Si hay variaciones (botones en píldora, tarjetas de 22 px), que sigan una regla fija.

## 4. Layout

- **Hero:**
  - entra en la primera pantalla,
  - título de 2 líneas como máximo (3 en celular),
  - bajada de 20 palabras como máximo,
  - 1 botón principal y como mucho 1 secundario.
  - Nada más adentro: ni logos de clientes ni listas de beneficios.
- **Nada de tres tarjetas iguales en fila** como sección de "servicios". Usá tarjetas verticales con foto (que en celular se deslizan de costado), un split, una lista con números grandes o una galería.
- **Etiquetas chicas en mayúscula arriba de los títulos** (eyebrows): una cada tres secciones, como máximo. El título solo alcanza.
- **Un solo texto por intención.** Si el botón principal dice "Pedí turno", dice lo mismo en el menú, el hero y el final. "Reservá", "Agendá" y "Contactanos" juntos confunden.
- **Menú de una línea**, de 64 a 72 px de alto. En celular, un botón chico con texto en vez de un ícono suelto.
- **En celular todo en una columna**, sin scroll horizontal, y los botones flotantes no pueden tapar contenido. Si hay un botón de WhatsApp flotante, conviene que aparezca recién después del hero.

## 5. Textos

- **Voseo rioplatense y frases cortas con verbos concretos:** "Pedí turno", "Vení a conocer el salón", "Contanos la fecha".
- **Sin em-dash (—) ni en-dash (–).** Es la marca más clara de texto de IA. Usá punto, coma o dos puntos.
- **Prohibido el vocabulario de folleto:** "elevá", "experiencia única", "soluciones integrales", "tu bienestar es nuestra prioridad", "llevá tu X al siguiente nivel".
- **Honestidad.** Los datos del negocio (años, servicios, precios, capacidades, obras sociales, premios, testimonios) se ponen solo si los viste en una fuente real. Si no, el texto es genérico del rubro.
  - Un número falso que suena preciso ("+500 eventos realizados") es peor que no poner nada: el dueño sabe que es mentira.
  - En salud no se prometen resultados.
- **Releé cada texto visible en voz alta**: títulos, botones, textos alternativos, footer. Si una frase suena linda pero no dice nada, reemplazala por una que diga algo.

## 6. Movimiento

Solo lo que tiene una razón de ser:
- el hero entra con un zoom lento de la foto y el texto aparece de abajo,
- las secciones aparecen al hacer scroll (con `IntersectionObserver`, nunca un listener de scroll),
- los botones se hunden apenas al tocarlos.

Todo se desactiva con `prefers-reduced-motion`. Nada de animaciones en loop, cursores personalizados ni parallax por todos lados.

## 7. Revisá con capturas antes de mostrar

El diseño se evalúa mirándolo, no leyendo el CSS. Antes de mostrarle nada al usuario:

1. Sacá capturas en escritorio (1440×900) y en celular (iPhone 13), de lo primero que se ve y de la página entera.
2. Chequeos automáticos:
   - sin errores de JavaScript,
   - sin scroll horizontal,
   - sin em-dashes en el texto visible,
   - las tipografías cargaron (si no, la captura miente),
   - ningún botón se parte en dos renglones,
   - las imágenes existen.
3. **Miralas de verdad**, con ojo de cliente:
   - ¿Se ve como una referencia de Framer o como una plantilla de 2015?
   - ¿Las fotos parecen del mismo lugar?
   - ¿Algo tapa algo?
   - ¿Hay celdas vacías en una grilla?
   - ¿Un texto se corta?
   - ¿Algún dato es inventado?
4. Corregí y volvé a capturar. Cuando el usuario pidió "que no parezca IA", mostrale las capturas, no solo el archivo.

## Lista rápida de señales de IA

Si ves alguna, corregila antes de entregar:
- gradientes violetas o azules con brillo,
- hero centrado sobre una mancha de color sin foto,
- tres tarjetas iguales con íconos de línea,
- em-dash,
- "Elevá", "Descubrí", "Experiencia",
- eyebrows en todas las secciones,
- números falsos y precisos,
- testimonios inventados con nombres genéricos,
- íconos SVG dibujados a mano,
- capturas de producto armadas con divs,
- fotos que no se miraron,
- el mismo layout repetido en varias secciones,
- texto gris claro sobre blanco,
- el botón de WhatsApp tapando algo.
