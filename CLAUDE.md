# Leads para webs — instrucciones para Claude

Proyecto de Lucas: conseguir clientes que necesiten una página web. Se buscan negocios locales sin sitio propio,
se les arma una demo con sus datos reales y Lucas los contacta a mano. El plan completo (meta, precios, estrategia,
métricas) está en @docs/plan.md.

Es una adaptación de la herramienta de Sol (`lucasagustinpiccoli/search-leads-sol`): mismo método de búsqueda en
Google Maps (sin API ni tarjeta), pero el objetivo son negocios **sin web**, no cuentas para community management.
Se trabaja en **tandas de 100 prospectos** rankeados, con los mejores marcados para demo.

## Reglas

- Solo datos públicos comerciales del negocio (nombre, teléfono, dirección, reseñas, horarios). Nada de datos personales de los dueños.
- **No mandes mensajes de ningún tipo.** Claude redacta; Lucas envía a mano, en volumen bajo.
- Google Maps se lee solo con `scripts/scrape_maps.js`, en volumen bajo (pausas entre consultas, una tanda por vez).
  Va contra los términos de Google: si aparece un CAPTCHA, se frena y no se intenta esquivarlo. No scrapees Instagram.
- Hacé solo lo que se pide en cada paso y confirmá con Lucas antes de pasar al siguiente.
- Los archivos generados van a `output/` (está en `.gitignore`: tiene teléfonos y no se sube).

## Flujo de una tanda

1. `node scripts/scrape_maps.js --localidades "Caseros,Ramos Mejía" [--rubros veterinaria,dentista] [--terminos 1]`
   (o `--zona "zona oeste"`). Guarda `output/raw/maps-{fecha}.json`. Cada consulta trae hasta 20 negocios:
   6 rubros × 4 localidades ≈ 400 negocios ≈ 270 sin web propia.
2. `python scripts/rankear.py [--tamano 100] [--demos 15] [--demos-por-rubro 5]`
   Junta todos los raw, saca los ya entregados (`output/entregados.json`), filtra los que tienen web propia,
   cerrados, cadenas e instituciones (`config/excluir.json`) y teléfonos repetidos, puntúa y escribe
   `output/tanda-NN-{fecha}.csv`. Lo que sobra queda para la próxima tanda. `--no-marcar` para probar.

### Puntaje (0–100)

- Rating: ≥4,7 → 30; 5,0 exacto → 26 (sin cantidad de reseñas, un 5,0 suele ser de pocas opiniones); ≥4,4 → 24; ≥4 → 14.
- Fotos en Maps: ≥20 → 20; ≥5 → 13; ≥1 → 6. También son material para la demo.
- Teléfono: celular (+54 9) → 20; fijo → 12.
- Presencia: solo Instagram 20; solo Facebook / agregador / WhatsApp 17; web gratuita o caída 15; sin nada 14.
  Quien ya invierte en redes entiende el valor de estar online y es más fácil de convencer.
- Rubro: dentista, clínica, abogado, salón de eventos 10; veterinaria, idiomas, estética 9; contador, academia 8; ropa 7.
  Talleres quedaron afuera: el 97% no tiene web, a un taller se lo elige por cercanía y recomendación.
- −10 si la dirección no coincide con la localidad buscada.

**Límite conocido:** sin login, Google Maps está en "vista limitada" y no da la cantidad de reseñas.

## Demos (paso 5)

- `python scripts/demo.py --demos --rubro salon_eventos` → genera las demos marcadas "Sí" de ese rubro en la última tanda.
  `--ranking N` para una sola; `--render output/demos/{carpeta}/datos.json` para regenerar después de editar.
- `python scripts/demo.py --ficticio dentista` genera `output/demos/ejemplo-dentista/` con una marca inventada (Brío Dental, Ramos Mejía) para
  mostrar la plantilla sin usar un negocio real.
- Cada demo: `output/demos/{ranking}-{negocio}/` con `datos.json` (editable), `index.html` e `img/` (fotos de stock
  y su versión de 800 px). La carpeta entera es lo que se publica. Si `datos.json` ya existe, no se pisa.
- Motor único `templates/landing.html`; textos, formulario, fotos y temas por rubro en `config/landing/{rubro}.json`.
  Rubros con plantilla: `salon_eventos`, `dentista`, `veterinaria`. Para sumar uno, usá el skill `landing-rubro-nuevo`; el criterio de diseño está
  en el skill `diseno-anti-ia`.
- **Cinco estilos de plantilla**, elegidos con `"estilo"` en `config/landing/{rubro}.json`:
  `"evento"` (`templates/landing_evento.html`, salones: foto a pantalla completa, oscuro de punta a punta, títulos con serif,
  tarjetas altas y escalonadas, tira de fotos que se desliza), `"clinico"` (`templates/landing_clinico.html`, dentistas: barra flotante en píldora de vidrio oscuro, presentación partida
  (título con el nombre de la marca sobre fondo oscuro con puntos + foto del consultorio, sello giratorio con la localidad), tarjeta flotante
  abajo a la derecha, **tratamientos en tarjetas de color** (no "motivos de consulta"), una lista corta de puntos y un **pedido de turno por
  pasos** (tratamiento, día y horario con selector de semana, datos, confirmación) que termina en WhatsApp; sin galería de fotos del
  consultorio, sin carruseles ni imágenes que aparecen al hacer scroll, y sin rating ni cantidad de fotos de Google en el hero;
  referencias: bassodontologia.com.ar e interactive-studio.io), `"cercano"`
  (`templates/landing_cercano.html`, veterinarias: claro, con color, fotos redondeadas con un bloque de color detrás,
  etapas y galería que se deslizan), `"sobrio"` (`templates/landing_sobrio.html`: una sola tipografía sans, formas rectas,
  la estructura de la propuesta de R&RG; hoy sin rubro asignado) y el editorial original (`templates/landing.html`, sin
  `estilo`). Ningún rubro comparte estilo con otro, así las demos no se parecen entre sí. Los textos van sin palabras en cursiva.
- **Pensada para celular**: la visita llega desde el link de la bio de Instagram o desde "sitio web" en Google Maps.
  Menú en píldora con el botón principal siempre visible, barra fija abajo en el celular (botón + WhatsApp),
  opciones para tocar en el formulario, teléfono y dirección como links, fotos livianas.
- **La localidad se dice una sola vez: en la dirección** (y en el mapa). Ni el título, ni la bajada, ni los textos de sección la repiten ("Odontología en Ramos Mejía", "consultorio de Ramos Mejía"): se lee como escrito por una IA. Solo el `<title>` y la descripción para buscadores la llevan.
- **Sin estrellas ni rating en el hero**: el rating de Google va en los datos debajo del hero.
- Formulario: `form.modo` = `turno` (motivo, extras, próximos días de atención y franja, todo con toques; inspirado
  en el recorrido de la demo Oliva Atelier (`sitio/lumen-studio/oliva/`)) o `presupuesto` (tipo, fecha, cantidad). Se envía abriendo WhatsApp
  con el mensaje armado (`location.href`, porque el navegador de Instagram bloquea `window.open`).
- Una palabra entre asteriscos en los títulos (`*imaginaste*`) sale con el énfasis del tema (cursiva o peso).
- Tres temas por rubro (color + tipografía) que rotan según el puesto en la tanda, igual que la foto del hero.
- **Tono de los textos: profesional y cálido**, en voseo, sin frases coloquiales ("sin vueltas", "nos escribís") ni de
  folleto. Nada que no se haya visto en Maps: ni años, ni servicios puntuales, ni promesas.
- Fotos: `templates/assets/{rubro}/` son de Pexels (licencia libre, ver `CREDITOS.json`), sin caras reconocibles.
  **No usar fotos de Google Maps del negocio**: suelen mostrar clientes (a veces chicos) que no dieron permiso.
  Cuando el cliente compra, sus fotos reales van en `fotos` dentro de `datos.json` (la primera es el hero).
- La franja "Demo preparada para…" y el `noindex` se quedan hasta que el cliente compre.
- En el sandbox de Claude el mapa embebido sale gris (bloquea maps.gstatic.com); en un navegador normal carga.

## Página madre y publicación

- `sitio/lumen-studio/`: la página de Halo Studio (portfolio de Lucas), rediseñada con la skill Hallmark (tema Studio: papel
  frío, serif Hedvig, un acento naranja, marcas de corte). Estilos en `styles.css`, `tokens.css` y `base.css`. Para volver
  a auditarla: `/hallmark audit sitio/lumen-studio/index.html`. Una sola página en español, estilo sobrio, con
  solo lo que se puede respaldar: sin testimonios ni logos inventados. La demo interactiva de gimnasio está en `sitio/lumen-studio/anima-center/` (maqueta con datos ficticios; el sistema real tiene datos de socios y no se muestra). Ver `sitio/lumen-studio/LEEME.md` (qué completar
  antes de publicar: número de WhatsApp y permisos de los casos).
- La página madre (nombre de marca: Halo Studio) lleva cuatro piezas interactivas, todas en JavaScript puro y sin servidor:
  la apertura "Neon Reveal" (`neon-reveal.js`: un tubo de neón se enciende arriba, parpadea y su luz revela el contenido;
  es una versión propia basada en la descripción pública del componente de React Bits Pro, que requiere licencia; cuando se
  compre la licencia se puede cambiar por el original), un rotador de palabras con efecto de máquina de escribir inspirado
  en el componente AnimatedTextRotator de Framer (`typewriter.js`) una cinta de servicios con CurvedLoop de React Bits (`curved-loop.js`, al pie del hero) y **Ray** (`ray-chat.js`), el asistente (la mascota flotante `ray.js`, que aparece al pasar el hero y abre el chat): saluda, pregunta el nombre y ofrece tres caminos (ver los proyectos, empezar el proyecto, que abre el formulario, o hablar por WhatsApp, con un mensaje ya escrito que lleva el nombre). Entiende también texto libre simple. No muestra precios: el "desde USD 200" solo está en las preguntas frecuentes.
- `python scripts/armar_sitio.py` junta la página madre y las demos de `output/demos/` en `output/publicar/` (y en
  `output/publicar.zip`), con `robots.txt` y `_headers` para que `/demos/` no se indexe. Se sube completo a Cloudflare
  Pages; cada demo queda en su propia dirección (`/demos/{carpeta}/`).

- **Cada demo del portfolio tiene su propio estilo** (Oliva: claro, cálido, serif, pestañas en píldora; Anima Center (antes GymFlow): oscuro, sobrio, sans y cifras monoespaciadas; Brío Dental: hero partido con barra flotante). No se unifican barras, tarjetas ni tipografías entre ellas: que no parezca que todo sale de una plantilla.

## Otras herramientas

- `python scripts/buscar.py --rubro {clave} --zona {localidad | "zona oeste" | "caba"} [--max 60]`
  Llama a Places Text Search (hasta 60 resultados por consulta), deduplica por `place_id` y escribe
  `output/{rubro}-{zona}-{fecha}.csv`. Guarda la respuesta cruda en `output/raw/` para re-procesar con
  `--desde-raw` sin volver a pagar. Necesita `GOOGLE_PLACES_API_KEY` (tarjeta en Google Cloud). Queda como
  alternativa oficial si se escala; hoy no se usa.
- Rubros y términos de búsqueda: `config/rubros.json`. Zonas: `config/zonas.json`.
- Tests offline: `python -m unittest discover tests`.

## Columnas del CSV de una tanda

`ranking, puntaje, demo, motivo, negocio, rubro, categoria, localidad, direccion, telefono, whatsapp, rating, fotos,
presencia, web, horario_hoy, link_maps, notas, place_id`

## Columnas del CSV de buscar.py (Places)

`place_id, negocio, rubro, categoria, direccion, localidad, telefono, whatsapp, nota_telefono, rating, resenas,
fotos, horarios, link_maps, web, estado_negocio, busqueda`

- `fotos` sale de la API con tope de 10: leelo como 0 / pocas / 10+.
- `whatsapp` va normalizado para `wa.me` (`549` + área + número). Los fijos de AMBA llevan
  `nota_telefono = Fijo: puede no tener WA`.
- `web` es el `websiteUri` de Google tal cual: puede ser web propia, Instagram, Facebook o un agregador de links.

## Avance del plan (prompt inicial de docs/plan.md)

1. ✅ Revisión de la herramienta de Sol.
2. ✅ Extracción por rubro y zona (scrape_maps.js; buscar.py con Places como alternativa).
3. ✅ Filtro de negocios con web propia (rankear.py).
4. ✅ Puntaje de prospecto y selección de demos (rankear.py). Tanda 01: Caseros, Ramos Mejía, Morón, Castelar (10 rubros, sin talleres).
5. ✅ Plantilla de landing alimentada por JSON (demo.py). Rubro listo: salones de eventos (5 demos de la tanda 01).
6. ✅ Mensajes de contacto: `python scripts/mensajes.py --base https://tu-dominio` arma `output/mensajes-{tanda}.csv` (día 0, 3 y 7, Instagram y link de WhatsApp) y `output/mensajes-plantillas.md` trae la guía (red cercana, respuestas, cierre).
7. ✅ Planilla de seguimiento: `python scripts/planilla.py importar` pasa la última tanda (y sus mensajes) a `output/leads-halo.xlsx`
   (hojas Leads, Mensajes {Rubro} y Templates, con desplegable de Estado, como la guía del buscador de leads). Saltea los ya cargados.
   `leer` imprime la hoja Leads y `actualizar cambios.json` cambia estados sin pisar filas.
