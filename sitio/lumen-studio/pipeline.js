/* Cómo trabajamos: un flujo de pasos conectados donde "corre" cada paso y la conexión se va llenando hasta el siguiente.
   Idea del componente Pipeline de React Bits Pro, hecha desde cero en JavaScript puro. Sin JavaScript, o con "reducir
   movimiento", los cuatro pasos se ven terminados y quietos. */
(function () {
  "use strict";
  function Pipeline(raiz, o) {
    o = o || {};
    var nodos = [].slice.call(raiz.querySelectorAll(".pl-nodo")), enlaces = [].slice.call(raiz.querySelectorAll(".pl-enlace"));
    if (!nodos.length) return null;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducido) return null;
    var CORRE = o.run || 1500, LLENA = o.fill || 750, REPOSO = o.rest || 2800, timers = [], activo = false;

    function en(ms, f) { timers.push(setTimeout(f, ms)); }
    function limpiar() { timers.forEach(clearTimeout); timers = []; }
    function reiniciar() {
      nodos.forEach(function (n) { n.classList.remove("is-run", "is-done"); n.style.removeProperty("--dur"); });
      enlaces.forEach(function (e) { e.classList.remove("is-fill"); });
    }
    function ciclo() {
      limpiar(); reiniciar();
      var t = 500;
      nodos.forEach(function (n, i) {
        en(t, function () { n.style.setProperty("--dur", CORRE + "ms"); n.classList.add("is-run"); });
        t += CORRE;
        en(t, function () { n.classList.remove("is-run"); n.classList.add("is-done"); if (enlaces[i]) enlaces[i].classList.add("is-fill"); });
        if (i < nodos.length - 1) t += LLENA;
      });
      en(t + REPOSO, function () { if (activo) ciclo(); });
    }
    raiz.classList.add("anima");
    var io = new IntersectionObserver(function (es) {
      var ve = es.some(function (e) { return e.isIntersecting; });
      if (ve && !activo) { activo = true; ciclo(); }
      else if (!ve && activo) { activo = false; limpiar(); reiniciar(); }
    }, { threshold: 0.35 });
    io.observe(raiz);
    reiniciar();
    return { destroy: function () { activo = false; limpiar(); io.disconnect(); raiz.classList.remove("anima"); } };
  }
  window.Pipeline = Pipeline;
})();
