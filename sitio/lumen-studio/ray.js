/* Ray: la mascota de Halo Studio. Flota abajo a la derecha, aparece al pasar el hero y abre el chat.
   Se inspira en el comportamiento del componente Mochi de Framer (los ojos siguen el puntero, parpadea, mira alrededor,
   se duerme si nadie lo toca y salta al despertar), reimplementado en JavaScript puro sobre un SVG propio. */
(function () {
  "use strict";
  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var raiz = document.getElementById("ray");
  if (!raiz) return;
  var boton = raiz.querySelector(".ray-fig");
  var burbuja = raiz.querySelector(".ray-burbuja");
  var panel = raiz.querySelector(".ray-chat");
  var cerrar = raiz.querySelector(".ray-cerrar");
  var ojos = [].slice.call(raiz.querySelectorAll(".ray-pupila"));
  var parpados = [].slice.call(raiz.querySelectorAll(".ray-ojo"));
  var hero = document.getElementById("inicio");
  var abierto = false, visible = false, dormido = false, ultimaActividad = Date.now();
  var objetivo = { x: 0, y: 0 }, actual = { x: 0, y: 0 }, raf = 0;

  function despertarLoop() { if (!raf) raf = requestAnimationFrame(mover); }
  function mover() {
    raf = 0;
    actual.x += (objetivo.x - actual.x) * 0.16; actual.y += (objetivo.y - actual.y) * 0.16;
    ojos.forEach(function (o) { o.style.transform = "translate(" + actual.x.toFixed(2) + "px," + actual.y.toFixed(2) + "px)"; });
    if (Math.abs(objetivo.x - actual.x) > 0.05 || Math.abs(objetivo.y - actual.y) > 0.05) raf = requestAnimationFrame(mover);
  }
  function mirar(x, y) {
    var r = boton.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.36;
    var dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220);
    objetivo.x = dx / d * 9 * k; objetivo.y = dy / d * 7 * k;
    despertarLoop();
  }

  function saltar() {
    if (reducido) return;
    boton.classList.remove("saltando"); void boton.offsetWidth; boton.classList.add("saltando");
  }
  function dormir(si) {
    if (dormido === si) return;
    dormido = si; raiz.classList.toggle("dormido", si);
    if (!si) saltar();
  }
  function actividad() { ultimaActividad = Date.now(); if (dormido) dormir(false); }

  /* parpadeo y miradas al azar */
  function parpadear() { parpados.forEach(function (p) { p.classList.add("cierra"); }); setTimeout(function () { parpados.forEach(function (p) { p.classList.remove("cierra"); }); }, 130); }
  (function ciclo() {
    setTimeout(function () {
      if (visible && !dormido) {
        parpadear();
        if (Math.random() < 0.3) setTimeout(parpadear, 260);
        if (Math.random() < 0.35 && !abierto) { objetivo.x = (Math.random() - 0.5) * 14; objetivo.y = (Math.random() - 0.3) * 8; despertarLoop(); }
      }
      if (visible && !dormido && !abierto && Date.now() - ultimaActividad > 12000) dormir(true);
      ciclo();
    }, 2200 + Math.random() * 2600);
  })();

  window.addEventListener("pointermove", function (e) { if (!visible) return; mirar(e.clientX, e.clientY); actividad(); }, { passive: true });
  window.addEventListener("scroll", actividad, { passive: true });
  window.addEventListener("keydown", actividad);

  /* aparece cuando el hero queda atrás; la burbuja saluda una vez */
  var saludado = false, burbujaTimer = 0;
  function mostrarBurbuja() {
    if (abierto) return;
    burbuja.classList.add("ver");
    clearTimeout(burbujaTimer);
    burbujaTimer = setTimeout(function () { burbuja.classList.remove("ver"); }, 5000);
  }
  /* el globo no vuelve después de una interacción: cualquier toque o tecla lo cierra */
  ["pointerdown", "keydown"].forEach(function (e) { window.addEventListener(e, function (ev) { if (burbuja.classList.contains("ver") && !burbuja.contains(ev.target)) { burbuja.classList.remove("ver"); } }, { passive: true }); });
  function alCambiarHero(heroVisible) {
    visible = !heroVisible;
    raiz.classList.toggle("ver", visible);
    if (visible && !saludado) { saludado = true; setTimeout(function () { saltar(); mostrarBurbuja(); }, 700); }
    if (!visible) { burbuja.classList.remove("ver"); setCerrado(); }
  }
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { alCambiarHero(es[0].isIntersecting && es[0].intersectionRatio > 0.35); }, { threshold: [0, 0.35, 0.6] }).observe(hero);
  } else { alCambiarHero(false); }

  /* en la sección de trabajos se esconde en el margen para no tapar las capturas */
  var trabajos = document.getElementById("trabajos");
  if (trabajos && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { raiz.classList.toggle("escondido", es[0].isIntersecting); }, { rootMargin: "-10% 0px -10% 0px" }).observe(trabajos);
  }

  /* abrir y cerrar el chat */
  function setCerrado() {
    abierto = false; panel.hidden = true; raiz.classList.remove("abierto"); boton.setAttribute("aria-expanded", "false");
  }
  function abrir() {
    abierto = true; panel.hidden = false; raiz.classList.add("abierto", "ver"); burbuja.classList.remove("ver");
    boton.setAttribute("aria-expanded", "true"); actividad(); saltar();
    if (window.RayChat) window.RayChat.iniciar();
  }
  window.RayAbrir = abrir;
  window.RayCerrar = setCerrado;
  boton.addEventListener("click", function () { abierto ? setCerrado() : abrir(); });
  cerrar.addEventListener("click", function () { setCerrado(); boton.focus(); });
  burbuja.addEventListener("click", abrir);
  raiz.addEventListener("keydown", function (e) { if (e.key === "Escape" && abierto) { setCerrado(); boton.focus(); } });
  boton.addEventListener("pointerenter", function () { actividad(); if (!abierto) { saltar(); } });
  document.querySelectorAll("[data-ray-abrir]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); raiz.classList.add("ver"); abrir(); });
  });
})();
