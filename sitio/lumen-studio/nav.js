/* Barra superior: pegada al arrancar; al bajar un poco pasa a flotante y redondeada. */
(function () {
  "use strict";
  var nav = document.querySelector(".nav");
  if (!nav) return;
  var esperando = false;
  function revisar() { esperando = false; nav.classList.toggle("flota", window.scrollY > 24); }
  window.addEventListener("scroll", function () { if (!esperando) { esperando = true; requestAnimationFrame(revisar); } }, { passive: true });
  revisar();
})();
