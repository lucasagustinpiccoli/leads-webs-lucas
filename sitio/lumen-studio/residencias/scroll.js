/* Solana: foto que se encoge al inicio y relato que cambia de foto al bajar. */
(function () {
  "use strict";
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var suave = function (t) { return t * t * (3 - 2 * t); };

  /* ---- inicio: la foto se encoge con márgenes y esquinas redondeadas al bajar ---- */
  var ap = document.getElementById("apertura");
  var meta = 0, actual = 0, corriendo = false;
  function progresoInicio() {
    var r = ap.getBoundingClientRect(), total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / (total * 0.9), 0, 1) : 0;
  }
  function paso() {
    actual += (meta - actual) * (reducido ? 1 : 0.16);
    if (Math.abs(meta - actual) < 0.001) actual = meta;
    ap.style.setProperty("--p", actual.toFixed(4));
    if (actual !== meta) requestAnimationFrame(paso); else corriendo = false;
  }
  function alScroll() { meta = progresoInicio(); if (!corriendo) { corriendo = true; requestAnimationFrame(paso); } }
  window.addEventListener("scroll", alScroll, { passive: true });
  window.addEventListener("resize", alScroll);
  meta = progresoInicio(); actual = meta; ap.style.setProperty("--p", actual.toFixed(4));

  /* ---- relato ---- */
  var rel = document.getElementById("escena");
  var fotos = [].slice.call(rel.querySelectorAll(".foto")), paneles = [].slice.call(rel.querySelectorAll(".panel")), marcas = [].slice.call(rel.querySelectorAll(".pasos i"));
  var cap = -1;
  function relato() {
    var r = rel.getBoundingClientRect(), total = r.height - window.innerHeight;
    var p = total > 0 ? clamp(-r.top / total, 0, 0.9999) : 0;
    var i = Math.floor(p * fotos.length);
    if (i === cap) return; cap = i;
    fotos.forEach(function (f, k) { f.classList.toggle("on", k === i); });
    paneles.forEach(function (f, k) { f.classList.toggle("on", k === i); });
    marcas.forEach(function (f, k) { f.classList.toggle("on", k === i); });
  }
  window.addEventListener("scroll", relato, { passive: true });
  window.addEventListener("resize", relato);
  relato();
})();
