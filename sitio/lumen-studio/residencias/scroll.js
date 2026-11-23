/* Solana: la foto de apertura se abre con el scroll y el relato cambia de foto al bajar. */
(function () {
  "use strict";
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var suave = function (t) { return t * t * (3 - 2 * t); };

  /* ---- apertura ---- */
  var ap = document.getElementById("apertura"), marco = document.getElementById("marco"), datos = document.getElementById("datos-ap");
  var meta = reducido ? 1 : 0, actual = meta, corriendo = false;
  function progresoApertura() {
    var r = ap.getBoundingClientRect(), total = r.height - window.innerHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 1;
  }
  function pintarApertura(p) {
    var ancho = window.innerWidth <= 900;
    var e = suave(clamp(p / 0.8, 0, 1));
    ap.style.setProperty("--ct", lerp(ancho ? 22 : 24, 0, e).toFixed(2) + "%");
    ap.style.setProperty("--cs", lerp(ancho ? 10 : 30, 0, e).toFixed(2) + "%");
    ap.style.setProperty("--cr", lerp(28, 0, e).toFixed(1) + "px");
    ap.style.setProperty("--zoom", lerp(1.35, 1, e).toFixed(3));
    ap.style.setProperty("--vel", lerp(0.3, 1, clamp((p - 0.3) / 0.6, 0, 1)).toFixed(3));
    ap.style.setProperty("--tit", (1 - clamp((p - 0.28) / 0.5, 0, 1)).toFixed(3));
    var ov = clamp((p - 0.7) / 0.25, 0, 1);
    ap.style.setProperty("--ov", ov.toFixed(3));
    datos.classList.toggle("on", ov > 0.6);
  }
  function paso() {
    actual += (meta - actual) * 0.14;
    if (Math.abs(meta - actual) < 0.0008) actual = meta;
    pintarApertura(actual);
    if (actual !== meta) requestAnimationFrame(paso); else corriendo = false;
  }
  function alScroll() { meta = progresoApertura(); if (reducido) { actual = meta; pintarApertura(actual); } else if (!corriendo) { corriendo = true; requestAnimationFrame(paso); } }
  window.addEventListener("scroll", alScroll, { passive: true });
  window.addEventListener("resize", alScroll);
  meta = progresoApertura(); actual = reducido ? meta : 0; pintarApertura(actual);
  if (!reducido) { corriendo = true; requestAnimationFrame(paso); }

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
