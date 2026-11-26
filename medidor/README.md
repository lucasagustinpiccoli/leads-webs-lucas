# Halo Vista · medidor v1

Mide una landing y guarda los datos en una planilla de Google. Costo: cero. Sin cookies, sin servidor propio.

## Qué mide y qué no

| Mide solo | No mide solo (lo carga el servicio gestionado) |
|---|---|
| Visitas, con origen (Instagram, Google, directo, utm) y dispositivo | Si el contacto se respondió |
| Clics a WhatsApp | Si hubo visita al local |
| Llamadas (clic en un teléfono) y emails | Si se cerró la venta |
| Formularios enviados (con `HaloMedidor.evento("formulario")`) | Quién escribió |

Un clic a WhatsApp es un **intento de contacto**: no sabemos si la persona terminó enviando el mensaje. Decíselo así al cliente.
Los clics que vienen de la bio de Instagram a veces llegan como "directo". Para que se vean, usar el link con `?utm_source=instagram`.

## Instalación por cliente (15 minutos)

1. **Planilla.** Creá una planilla de Google nueva con el nombre del cliente.
2. **Receptor.** Extensiones → Apps Script. Pegá `apps-script/Codigo.gs`. En `preparar()` cambiá `cambiar-esta-clave` por una clave nueva y corré `preparar` (pide permisos la primera vez). Crea las hojas `eventos` y `resumen`.
3. **Publicar.** Implementar → Nueva implementación → Aplicación web. Ejecutar como: **yo**. Quién tiene acceso: **cualquier persona**. Copiá la URL que termina en `/exec`.
4. **Landing.** Copiá `medidor.js` junto a la página y agregá antes de `</body>`:
   ```html
   <script src="medidor.js" data-endpoint="URL_/exec" data-clave="LA_CLAVE" data-sitio="cliente" defer></script>
   ```
5. **Formulario.** Donde se confirma el envío: `window.HaloMedidor && HaloMedidor.evento("formulario", "pedido de visita")`.
6. **Probar.** Abrí la landing publicada, tocá el botón de WhatsApp y mirá que aparezcan filas en `eventos`.
7. **Tablero.** En Looker Studio (gratis): Crear → Informe → Google Sheets → planilla del cliente → hoja `eventos`. Usá `resumen` como referencia de las cuentas.
8. **Visitas únicas.** Aparte, activá Cloudflare Web Analytics (gratis, sin cookies) para visitantes únicos y países.

## Límites y cuidados

- La clave va dentro del HTML: no es secreta, solo evita basura casual. Una planilla por cliente limita el daño.
- Apps Script tiene cuotas diarias de Google. Alcanza para negocios chicos; revisá las cuotas vigentes si un cliente tiene mucho tráfico. El paso siguiente sería Cloudflare Workers con D1.
- Las visitas cuentan cargas de página, no personas: una persona que recarga suma dos.
- No mide si la persona tiene bloqueador de anuncios que bloquee el envío, ni las visitas con "No rastrear" o Global Privacy Control activos.
- Privacidad: no hay cookies ni datos personales. Sumá una línea a la política del cliente: "Medimos visitas y clics de forma anónima, sin cookies, para entender cómo se usa la página".

## Probar el medidor en tu máquina

```bash
node medidor/prueba/probar.js
```
Levanta un receptor falso, simula visita, WhatsApp, llamada, email y formulario, y comprueba que lleguen.
