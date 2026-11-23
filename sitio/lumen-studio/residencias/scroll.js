/* Solana: tarjetas que suben apiladas al inicio y relato que cambia de foto al bajar. */
(function () {
  "use strict";
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var suave = function (t) { return t * t * (3 - 2 * t); };

  /* ---- inicio: tarjetas que suben apiladas ---- */
  var ap = document.getElementById("apertura"), esc = ap.querySelector(".escena"), pista = document.getElementById("pista"), prog = document.getElementById("progreso"), relleno = document.getElementById("relleno");
  var tarjetas = [].slice.call(pista.children), botones = [].slice.call(prog.querySelectorAll("button"));
  var tramos = function (v, ins, outs) {
    if (v <= ins[0]) return outs[0];
    for (var i = 1; i < ins.length; i++) if (v <= ins[i]) { var t = (v - ins[i - 1]) / (ins[i] - ins[i - 1]); return outs[i - 1] + (outs[i] - outs[i - 1]) * suave(t); }
    return outs[outs.length - 1];
  };
  var medidas = { ch: 520, cg: 24 };
  function medir() {
    var vw = window.innerWidth, vh = window.innerHeight, movil = vw < 600, gut = movil ? 20 : Math.min(80, vw * 0.05);
    var cw = Math.max(240, Math.min(vw - gut * 2, 1200)), reserva = (movil ? 64 : 120) * 2 + 84;
    var ch = Math.round(Math.min(680, Math.max(movil ? 520 : 440, vh - reserva)));
    medidas = { ch: ch, cg: 24 };
    ap.style.setProperty("--cw", cw + "px"); ap.style.setProperty("--ch", ch + "px"); ap.style.setProperty("--cg", "24px");
  }
  function pintarInicio(p) {
    pista.style.transform = "translate3d(0," + (-p * (medidas.ch + medidas.cg)).toFixed(1) + "px,0)";
    var o0 = 1 - clamp(p / 0.6, 0, 1);
    tarjetas[0].style.opacity = o0.toFixed(3);
    tarjetas[0].style.transform = "scale(" + lerp(1, 0.97, clamp(p, 0, 1)).toFixed(3) + ")";
    tarjetas[0].style.filter = reducido ? "none" : "blur(" + ((1 - o0) * 6).toFixed(1) + "px)";
    tarjetas[1].style.opacity = tramos(p, [0.4, 0.9, 1.1, 1.6], [0, 1, 1, 0]).toFixed(3);
    tarjetas[1].style.transform = "scale(" + tramos(p, [0.3, 1, 2], [0.97, 1, 0.97]).toFixed(3) + ")";
    tarjetas[2].style.opacity = tramos(p, [1.35, 1.85], [0, 1]).toFixed(3);
    tarjetas[2].style.transform = "scale(" + tramos(p, [1.2, 2], [0.97, 1]).toFixed(3) + ")";
    [].forEach.call(tarjetas, function (t, k) { t.style.visibility = parseFloat(t.style.opacity) < 0.02 ? "hidden" : "visible"; });
    relleno.style.width = (clamp(p - 1, 0, 1) * 100).toFixed(1) + "%";
    prog.style.opacity = clamp((p - 0.3) / 0.6, 0, 1).toFixed(3);
    prog.style.pointerEvents = p < 0.5 ? "none" : "auto";
    botones[0].setAttribute("aria-selected", p <= 1.5 ? "true" : "false"); botones[1].setAttribute("aria-selected", p > 1.5 ? "true" : "false");
  }
  function progresoInicio() {
    var r = ap.getBoundingClientRect(), total = r.height - window.innerHeight;
    var v = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
    return tramos(v, [0, 0.14, 0.4, 0.58, 0.84, 1], [0, 0, 1, 1, 2, 2]);
  }
  var meta = 0, actual = 0, corriendo = false;
  function paso() {
    actual += (meta - actual) * (reducido ? 1 : 0.12);
    if (Math.abs(meta - actual) < 0.001) actual = meta;
    pintarInicio(actual);
    if (actual !== meta) requestAnimationFrame(paso); else corriendo = false;
  }
  function alScroll() { meta = progresoInicio(); if (!corriendo) { corriendo = true; requestAnimationFrame(paso); } }
  botones.forEach(function (b, k) {
    b.addEventListener("click", function () {
      var r = ap.getBoundingClientRect(), total = r.height - window.innerHeight, f = k === 0 ? 0.49 : 0.95;
      window.scrollTo({ top: r.top + window.scrollY + total * f, behavior: reducido ? "auto" : "smooth" });
    });
  });
  window.addEventListener("scroll", alScroll, { passive: true });
  window.addEventListener("resize", function () { medir(); alScroll(); });
  medir(); meta = progresoInicio(); actual = meta; pintarInicio(actual);

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
