/* Desplazamiento suave entre secciones: los enlaces internos (#trabajos, #contacto...) se deslizan con una curva de entrada y salida. */
(function () {
  "use strict";
  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raf = 0;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function desfase() { var v = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop); return isNaN(v) ? 0 : v; }
  function parar() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  function IrA(el) {
    if (!el) return;
    var destino = Math.max(0, Math.round(el.getBoundingClientRect().top + window.pageYOffset - desfase()));
    var max = document.documentElement.scrollHeight - window.innerHeight;
    destino = Math.min(destino, max);
    var ini = window.pageYOffset, dist = destino - ini;
    parar();
    if (reducido || Math.abs(dist) < 2) { window.scrollTo(0, destino); return; }
    var dur = Math.min(1400, 650 + Math.abs(dist) * 0.35), t0 = null;
    function paso(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      window.scrollTo(0, ini + dist * ease(p));
      if (p < 1) raf = requestAnimationFrame(paso); else raf = 0;
    }
    raf = requestAnimationFrame(paso);
  }
  window.IrA = IrA;
  ["wheel", "touchstart", "keydown"].forEach(function (e) { window.addEventListener(e, parar, { passive: true }); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute("data-wa") || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var el = document.getElementById(decodeURIComponent(id.slice(1)));
    if (!el) return;
    e.preventDefault();
    IrA(el);
    try { history.pushState(null, "", id); } catch (x) {}
  });
})();
