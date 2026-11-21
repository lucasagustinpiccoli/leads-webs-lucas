# Página madre de Lumen Studio

Una sola página (`index.html` + `img/`). Se publica junto con las demos con `python scripts/armar_sitio.py`.

## Antes de publicar, completar

1. **Número de WhatsApp.** En `index.html`, buscá `COMPLETAR` (al final, en el `<script>`) y reemplazá `549XXXXXXXXXX` por tu número con código de país, sin `+` ni espacios. Ejemplo: `5491155551234`. Mientras tenga las X, los botones de contacto no abren WhatsApp.
2. **Permisos de los casos.** Confirmar con cada dueño que puede aparecer en tu portfolio: Colo Studio y R&RG Estudio Jurídico. La propuesta de R&RG está rotulada como propuesta de rediseño: no la muestres sin el permiso de tu amigo.
3. **El precio** aparece solo como "desde USD 200" en las preguntas frecuentes y en Ray (`PRECIO_BASE` en `ray-chat.js`). No hay sección de precios.

## Lo que no tiene, a propósito

Testimonios, reseñas, logos de clientes y años de experiencia: no hay nada de eso que se pueda respaldar todavía. Se suman a medida que cierres clientes: pedí una reseña de Google a cada uno al entregar.


## GymFlow (demo interactiva)

`gymflow/index.html` es una maqueta autónoma con datos ficticios (sin login, sin servidor), hecha a partir del sistema real de gimnasio. Se abre desde el panel de Trabajos. Es `noindex`. Carga la tipografía de Google y la librería de Excel (jsDelivr) desde internet; todo lo demás va dentro del archivo.
