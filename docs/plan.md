# Máquina de clientes: venta de páginas web con Claude Code

Nov 10, 2026 · @Lucas

## Objetivo y contexto

La meta es juntar USD 1,000 en seis semanas (hasta el 22 de diciembre de 2026) vendiendo páginas web a negocios que hoy no tienen sitio, como ingreso extra. La prospección se arma con Claude Code a partir de datos públicos de Google Maps.

**Supuestos de la cuenta**

- 5 ventas de USD 200 o 10 de USD 100 llevan a los USD 1,000.
- Con mensajes en frío personalizados, cierra entre 3% y 5% de los contactados: hacen falta entre 100 y 150 contactos, unos 25 por semana.
- Las primeras ventas tienen que caer hacia la semana 3, porque entre respuesta, demo, decisión y pago pasan varios días.
- La red cercana (club, familia, clientes de conocidos) cierra más rápido que el contacto en frío y tiene que dar las primeras 1 o 2 ventas.
- El cuello de botella no es encontrar prospectos sino cerrar, y por eso la estrategia se mide desde el primer contacto.

**Punto de partida:** ya existe una herramienta de Claude Code que scrapea Google Maps, armada para buscar prospectos de community management para Sol (carpeta search-leads-sol). Es la base de este proyecto; se adapta en vez de empezar de cero.

**Cobertura:** mantener en paralelo la búsqueda laboral o freelance de análisis de datos, porque las webs son el extra que puede completar el número, no la única fuente.

## Oferta y precios

La oferta es una base con precio de entrada razonable más extras opcionales, y todo se produce con una plantilla por rubro para que cada web lleve 2 o 3 horas, no 8.

| Paquete | Qué incluye | Precio (USD) |
| --- | --- | --- |
| Base | Landing con secciones estándar, botón de WhatsApp, mapa, 1 ronda de correcciones | 150 a 200 |
| Extra | Reservas, galería, formulario, carta o catálogo, o una ronda de correcciones adicional (cada uno) | 40 a 60 |
| Mantenimiento opcional | Hosting, cambios menores y soporte, por mes | 15 a 20 |

**Por qué este esquema**

- A USD 100 por una web de 8 horas son unos USD 12 por hora: solo cierra si la web lleva 2 o 3 horas.
- A USD 200 por 8 horas son USD 25 por hora, que es el piso razonable.
- Separar base y extras mantiene bajo el precio de entrada y cobra más a quien pide más.
- El mantenimiento mensual arma un ingreso predecible a partir del segundo cliente.
- Es más fácil bajar un precio que subirlo: se ofrece USD 150 a los primeros 20 contactos y se ajusta según las objeciones.

**Tabulador de referencia:** [Tabulador de cobro de Web Design Network](https://comunidad.southprojects.dev/recursos/tabulador). Calcula la hora a partir de lo que querés ganar y sugiere precios por tipo de proyecto, con un presupuesto de siete pasos (tamaño, extras, copy, idiomas, movimiento, tipo de cliente, plazo y rondas). Está pensado para proyectos completos con estrategia, copy y QA, así que da números más altos que los de este plan. Sirve como ancla para justificar el precio ("esto normalmente cuesta X, te lo dejo a Y porque ya tengo la base armada"), no como tarifa obligatoria.

Pendiente: correr el tabulador con la tarifa objetivo por hora y comparar el resultado con estos precios.

## Estrategia de venta

La estrategia es un embudo que empieza por quien compra más fácil y usa una demo con los datos reales del negocio como diferencial.

**1. A quién se le vende, en este orden**

1. Red cercana: club, familia, conocidos con negocio, clientes de Sol y de la tía que no tengan web. Meta: 1 o 2 ventas en las primeras dos semanas.
2. Negocios con buena reputación y sin web, que salen del scraping. Priorizar rubros con margen (clínicas, dentistas, talleres, estudios contables o jurídicos, veterinarias) antes que kioscos o peluquerías chicas.
3. Referidos: cada cliente cerrado termina con la pregunta "¿conocés a alguien más que lo necesite?".

**2. Qué se vende**

No se vende "una página web" sino el resultado: que los encuentren en Google, que los contacten por WhatsApp con un click y que se vean profesionales. Un solo mensaje y un solo beneficio.

**3. Cómo se contacta: demo primero**

En vez de preguntar "¿te interesa una web?", se manda la demo hecha con sus datos. Mensaje modelo: *"Hola, vi que \[negocio\] tiene excelentes reseñas pero no tiene web. Te armé una demo con tus datos, mirala acá: \[link\]. Si te gusta, la dejamos andando esta semana."*

Para que la demo no consuma las horas:

- Se arma solo para los 10 a 15 prospectos mejor calificados, no para los 100.
- Con la plantilla por rubro lleva 20 a 30 minutos.
- Al resto se le manda un mensaje corto con una captura o un ejemplo previo (Colo Studio, el chatbot de la concesionaria).
- El envío lo hace Lucas a mano o semi-manual. Automatizar mensajes masivos por WhatsApp puede costar el número y rinde menos que un mensaje personalizado.

**4. Secuencia de seguimiento**

| Día | Acción |
| --- | --- |
| 0 | Mensaje con la demo |
| 3 | Recordatorio corto ("¿pudiste verla?") |
| 7 | Último toque con un motivo para decidir ("esta semana tengo lugar para entregarla rápido") |
| Después | Se marca como frío en la planilla y se deja de insistir |

**5. Objeciones y respuestas**

| Objeción | Respuesta |
| --- | --- |
| "Es caro" | Paquete base más barato listo, y la cuenta de cuántos clientes nuevos necesita para pagarse |
| "Ya tengo Instagram" | Instagram no aparece en Google ni da confianza a clientes nuevos, y no permite reservas, mapa ni WhatsApp bien armados |
| "Lo tengo que pensar" | Demo con vencimiento o precio de lanzamiento por tiempo limitado |

**6. Cierre y cobro**

50% por adelantado y 50% a la entrega, con el alcance escrito en el mismo mensaje: qué incluye y cuántas correcciones. Evita pedidos de extras infinitos y filtra a los que no van en serio.

## Pipeline de prospección con Claude Code

El pipeline convierte una búsqueda de rubro y zona en una lista calificada de prospectos, con demo y mensaje listos para que Lucas los envíe.

1. **Búsqueda.** Rubro más zona en Google Maps (por ejemplo, veterinarias en Caseros). Un solo rubro y una sola zona para el piloto.
2. **Extracción.** Por cada negocio: nombre, rubro, dirección, teléfono comercial, rating, cantidad de reseñas, cantidad de fotos, horarios, link de Maps y el campo de sitio web.
3. **Filtro.** Se descartan los que tienen web propia. Quedan los que no tienen sitio o que solo linkean a Instagram, Facebook o un agregador de links.
4. **Calificación.** Puntaje por rating, cantidad de reseñas, fotos disponibles y si tienen teléfono o WhatsApp. Un negocio con 4,7 estrellas y 200 reseñas sin web es el prospecto ideal. Salen los 30 mejores para el piloto.
5. **Plantilla por rubro.** Una landing base con estructura, diseño y deploy resueltos una sola vez. Cada negocio nuevo es cambiar datos, fotos y colores.
6. **Demo.** Para los 10 a 15 mejores, Claude Code genera la landing con los datos reales del negocio. Meta: 20 a 30 minutos por demo.
7. **Mensaje.** Claude redacta el contacto con el nombre del negocio y un detalle específico (reseñas, una foto, el barrio). Lucas lo envía.
8. **Registro.** Cada prospecto entra en la planilla de seguimiento con su estado y fecha de próximo contacto.

**Reglas del scraping**

- Solo datos públicos comerciales: nombre, teléfono, dirección y reseñas del negocio. Nada de datos personales de los dueños.
- Scrapear Google Maps directamente va contra sus términos de uso. Para el piloto conviene usar la herramienta ya armada si corre sobre la API oficial de Places o sobre un servicio de terceros como Apify, y verificar eso antes de escalar.
- Mensajes por WhatsApp o Instagram a mano, con volumen bajo y personalizado, para no arriesgar el número.

## Cómo arrancar hoy en Claude Code

El arranque son seis pasos y el primero es darle a Claude Code este documento como contexto.

1. Exportar este doc a Markdown y guardarlo en la carpeta del proyecto como `CLAUDE.md`, así Claude Code lo lee en cada sesión.
2. Copiar la carpeta search-leads-sol (la herramienta de Sol) a una carpeta nueva de este proyecto y abrir la copia en Claude Code, así la original queda intacta.
3. Pegar el prompt inicial de abajo y pedirle un plan antes de ejecutar nada.
4. Elegir rubro y zona del piloto y correr la búsqueda con 30 resultados.
5. Revisar el CSV: que los filtros sean correctos y que el puntaje ordene bien.
6. Armar la plantilla del rubro y generar 3 demos de prueba antes de contactar a nadie.

**Prompt inicial para pegar**

```markdown
Contexto: soy Lucas, analista de datos en Buenos Aires. Quiero armar un sistema para conseguir clientes que necesiten una página web. Busco negocios locales sin sitio web, les preparo una demo con sus datos reales y los contacto yo a mano.

Ya tengo una herramienta que scrapea Google Maps, armada para buscar prospectos de community management para Sol. Está en C:\Users\Lucas\Desktop\Proyectos IA\Sol scrapping\search-leads-sol. Usala como referencia: reutilizá su lógica de extracción y adaptala a este caso (negocios sin web). No modifiques la carpeta original: trabajá sobre una copia. Quiero que hagas esto, en orden y mostrándome un plan antes de ejecutar:

1. Revisá la herramienta existente y explicame cómo obtiene los datos (API oficial, scraping directo o un servicio de terceros) y qué campos devuelve.
2. Adaptala para recibir rubro y zona como parámetros y extraer: nombre, rubro, dirección, teléfono, rating, cantidad de reseñas, cantidad de fotos, horarios, link de Maps y sitio web.
3. Filtrá los negocios que tienen web propia. Dejá los que no tienen sitio o que solo linkean a Instagram, Facebook o un agregador de links.
4. Calculá un puntaje de prospecto (rating, reseñas, fotos, teléfono) y exportá un CSV ordenado de mayor a menor.
5. Creá una plantilla de landing para el rubro elegido, alimentada por un JSON, que genere una demo a partir de una fila del CSV.
6. Redactá, por cada prospecto, un mensaje de contacto corto en español rioplatense con el nombre del negocio y un detalle específico. No lo envíes: guardalo en el CSV.
7. Creá una planilla de seguimiento con estado y fecha del próximo contacto.

Reglas: solo datos públicos comerciales, nada de datos personales de dueños; no envíes mensajes de ningún tipo; no hagas más de lo que te pido en cada paso y confirmame antes de pasar al siguiente.
```

**Para definir antes de correrlo**

- Rubro y zona del piloto.
- Si hay 2 o 3 webs ya hechas para mostrar como ejemplo (por ejemplo Colo Studio) o conviene armar una demo propia por rubro.

## Seguimiento y métricas

Con las primeras 30 personas contactadas ya se sabe si el problema es el mensaje, el precio o el rubro, siempre que se mida desde el primer contacto.

**Columnas de la planilla de seguimiento**

| Columna | Para qué sirve |
| --- | --- |
| Negocio, rubro, zona | Identificar al prospecto |
| Puntaje | Priorizar a quién se contacta primero |
| Canal | WhatsApp, Instagram o red cercana |
| Estado | Sin contactar, contactado, respondió, demo enviada, negociando, cerrado o frío |
| Fecha de contacto y de próximo seguimiento | Cumplir la secuencia de días 0, 3 y 7 |
| Objeción | Registrar qué frena el cierre |
| Precio ofrecido y cobrado | Medir si el precio es el problema |
| Cobro | 50% adelanto y 50% entrega |

**Qué medir**

| Métrica | Si baja, el problema probable es |
| --- | --- |
| Contactados por semana (meta: 25) | Falta de volumen |
| Tasa de respuesta (esperable: 5% a 10%) | El mensaje o el canal |
| Demos vistas sobre demos enviadas | El interés en la demo |
| Cierres sobre respuestas | El precio o el rubro |
| Ingresos acumulados contra los USD 1,000 | El ritmo general |

Cada cliente cerrado también registra de dónde vino (red, scraping o referido), para saber en qué canal poner el tiempo en las semanas 4 y 5.

## Cronograma y riesgos

El plan tiene cuatro etapas y tres hitos: 2 ventas el 30 de noviembre, 4 o 5 ventas el 14 de diciembre y USD 1,000 cobrados el 22 de diciembre.

&#91;embedded content: plan de 6 semanas · 4 etapas, 3 hitos\]

La semana 1 prepara la plantilla y la red; las semanas 2 y 3 son de demos y contacto; las 4 y 5 ajustan el mensaje; la 6 queda de margen para cobrar.

**Riesgos y plan B**

| Riesgo | Plan B |
| --- | --- |
| Pocas respuestas | Ajustar el mensaje, reforzar la red cercana y sumar un segundo rubro en la semana 4 |
| El precio frena el cierre | Paquete de entrada más barato (USD 100 a 120) para cerrar rápido |
| Las demos consumen demasiadas horas | Demo solo para los 10 a 15 mejores y plantilla por rubro |
| Los cobros llegan tarde | 50% de adelanto y cerrar las primeras ventas antes de la semana 4 |
| Bloqueo del número de WhatsApp | Envío manual, volumen bajo y mensajes personalizados |
| Las webs no alcanzan por sí solas | Mantener en paralelo la búsqueda laboral y el freelance de datos |
