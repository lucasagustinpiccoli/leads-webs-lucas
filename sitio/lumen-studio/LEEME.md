# Página madre de Lumen Studio

Una sola página (`index.html` + `img/`). Se publica junto con las demos con `python scripts/armar_sitio.py`.

## Antes de publicar, completar

1. **Número de WhatsApp.** En `index.html`, buscá `COMPLETAR` (al final, en el `<script>`) y reemplazá `549XXXXXXXXXX` por tu número con código de país, sin `+` ni espacios. Ejemplo: `5491155551234`. Mientras tenga las X, los botones de contacto no abren WhatsApp.
2. **Permisos de los casos.** Confirmar con cada dueño que puede aparecer en tu portfolio: R&RG Estudio Jurídico (Oliva Atelier es una marca ficticia, no necesita permiso). La propuesta de R&RG está rotulada como propuesta de rediseño: no la muestres sin el permiso de tu amigo.
3. **El precio** aparece solo como "desde USD 200" en las preguntas frecuentes y en Ray (`PRECIO_BASE` en `ray-chat.js`). No hay sección de precios.

## GymFlow (demo)

El código editable está en `gymflow-src/` (`index.html`, `style.css`, `app.js`, `demo-backend.js`). Para regenerar el archivo único que se publica
(`gymflow/index.html`): `python scripts/armar_gymflow.py`. El rediseño (tipografías Space Grotesk e Inter, luz ambiente, tarjetas con
profundidad, menú con indicador deslizante, gráficos, avatares y animaciones) está al final de `style.css`, bajo "DISEÑO V2".

## Idioma (español / inglés)

El selector EN / ES está en el menú. Las traducciones viven en `i18n.js` (diccionario por texto en español); si cambiás un texto de `index.html`, hay que cambiar también su clave en el diccionario, o ese texto queda en español en la versión en inglés. Ray y el rotador de palabras tienen su versión en cada idioma. La demo `oliva/` (sitio único con rutas por `#`, construido desde el proyecto Oliva Atelier) y `gymflow/` están solo en español.

## Lo que no tiene, a propósito

Testimonios, reseñas, logos de clientes y años de experiencia: no hay nada de eso que se pueda respaldar todavía. Se suman a medida que cierres clientes: pedí una reseña de Google a cada uno al entregar.


## GymFlow (demo interactiva)

`gymflow/index.html` es una maqueta autónoma con datos ficticios (sin login, sin servidor), hecha a partir del sistema real de gimnasio. Se abre desde el panel de Trabajos. Es `noindex`. Carga la tipografía de Google y la librería de Excel (jsDelivr) desde internet; todo lo demás va dentro del archivo.
