/* Halo Vista · medidor v1. Cuenta visitas y contactos de una landing y los manda a una planilla de Google.
   Sin cookies y sin guardar nada en el navegador: no identifica a nadie, solo suma eventos.
   Uso en la landing, antes de </body>:
   <script src="medidor.js" data-endpoint="URL_DE_APPS_SCRIPT" data-clave="CLAVE" data-sitio="nombre-del-cliente" defer></script>
   Sin data-endpoint no hace nada. Respeta "No rastrear" y Global Privacy Control. */
(function () {
  "use strict";
  var s = document.currentScript;
  if (!s) return;
  var cfg = { endpoint: s.getAttribute("data-endpoint") || "", clave: s.getAttribute("data-clave") || "", sitio: s.getAttribute("data-sitio") || location.hostname, local: s.hasAttribute("data-local") };
  if (!cfg.endpoint) return;
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  if (!cfg.local && /^(localhost|127\.|\[::1\]|)$/.test(location.hostname)) return;   // no cuenta pruebas locales ni archivos sueltos

  function dispositivo() { var w = window.innerWidth; return w < 700 ? "celular" : w < 1100 ? "tablet" : "escritorio"; }
  function origen() {
    var u = new URLSearchParams(location.search).get("utm_source");
    if (u) return u.toLowerCase().slice(0, 40);
    var r = document.referrer; if (!r) return "directo";
    var h; try { h = new URL(r).hostname.replace(/^www\./, "").replace(/^l\./, ""); } catch (e) { return "directo"; }
    if (h === location.hostname.replace(/^www\./, "")) return "interno";
    if (/instagram\./.test(h)) return "instagram";
    if (/(^|\.)google\./.test(h)) return "google";
    if (/facebook\.|fb\.com/.test(h)) return "facebook";
    if (/whatsapp\.|wa\.me/.test(h)) return "whatsapp";
    return h.slice(0, 40);
  }
  var ORIGEN = origen(), DISP = dispositivo();

  function enviar(tipo, detalle) {
    var cuerpo = JSON.stringify({ clave: cfg.clave, sitio: cfg.sitio, tipo: tipo, ruta: location.pathname, origen: ORIGEN, dispositivo: DISP, detalle: String(detalle || "").slice(0, 80) });
    try {
      // text/plain evita la consulta previa de CORS; Apps Script la recibe igual
      if (navigator.sendBeacon && navigator.sendBeacon(cfg.endpoint, new Blob([cuerpo], { type: "text/plain;charset=UTF-8" }))) return;
      fetch(cfg.endpoint, { method: "POST", mode: "no-cors", keepalive: true, body: cuerpo });
    } catch (e) { /* medir nunca debe romper la página */ }
  }

  enviar("visita");
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var h = a.getAttribute("href") || "", d = a.getAttribute("data-medir") || (a.textContent || "").trim();
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\b|^whatsapp:/i.test(h)) enviar("whatsapp", d);
    else if (/^tel:/i.test(h)) enviar("llamada", d);
    else if (/^mailto:/i.test(h)) enviar("email", d);
  }, true);
  window.HaloMedidor = { evento: enviar };   // para formularios: HaloMedidor.evento("formulario", "pedido de visita")
})();
