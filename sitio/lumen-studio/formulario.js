/* Formulario "Empezá tu proyecto": preguntas de a una, en pantalla completa. Al final arma el mensaje con las respuestas y
   abre WhatsApp (lo envía la persona, nunca se manda solo). Sin servidor: las respuestas solo viajan en ese mensaje. */
(function () {
  "use strict";
  var raiz = document.getElementById("formulario");
  if (!raiz) return;
  var pasos = [].slice.call(raiz.querySelectorAll(".fm-paso"));
  var contador = raiz.querySelector(".fm-contador");
  var atras = raiz.querySelector("[data-fm-atras]"), sig = raiz.querySelector("[data-fm-sig]");
  var botonera = raiz.querySelector(".fm-botonera");
  var enviar = raiz.querySelector("[data-fm-enviar]");
  var actual = 0, abierto = false, ultimo = null;
  var TOTAL = pasos.length - 1; // el último "paso" es la pantalla de cierre
  function t(s) { return window.I18N ? window.I18N.t(s) : s; }
  function en() { return window.I18N && window.I18N.lang === "en"; }

  function campo(p) { return p.querySelector("input[type=text],input[type=tel],textarea"); }
  function valor(n) { var c = pasos[n].querySelector("[data-k]"); return c ? c.value.trim() : ""; }
  function servicios() { return [].slice.call(raiz.querySelectorAll(".fm-opcion input:checked")).map(function (i) { return i.closest("label").textContent.trim(); }); }
  function completo(n) {
    var p = pasos[n];
    if (!p.hasAttribute("data-requerido")) return true;
    return !!valor(n);
  }

  function mostrar(n, enfocar) {
    actual = Math.max(0, Math.min(TOTAL, n));
    pasos.forEach(function (p, i) { p.hidden = i !== actual; p.classList.toggle("fm-activo", i === actual); });
    var cierre = actual === TOTAL;
    contador.textContent = cierre ? "" : (actual + 1) + " / " + TOTAL;
    atras.hidden = actual === 0 || cierre;
    sig.hidden = cierre;
    botonera.hidden = cierre;
    sig.disabled = !completo(actual);
    sig.textContent = t(actual === TOTAL - 1 ? "Terminar" : "Siguiente");
    if (cierre) armarCierre();
    if (enfocar !== false) {
      var f = campo(pasos[actual]) || pasos[actual].querySelector("input,select,button");
      if (cierre) f = enviar;
      if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
    }
  }

  function mensaje() {
    var nombre = valor(0), lugar = valor(1), pais = pasos[2].querySelector("select").value, num = valor(2).replace(/[^\d]/g, "").replace(/^0+/, ""), marca = valor(3), cuenta = valor(4), serv = servicios();
    var L = en() ? ["Hi! My name is ", ", from ", ". My brand is ", ". I'm interested in: ", ". About my brand: ", ". My WhatsApp: +"] : ["¡Hola! Soy ", ", de ", ". Mi marca es ", ". Me interesa: ", ". Sobre mi marca: ", ". Mi WhatsApp: +"];
    var m = L[0] + nombre + (lugar ? L[1] + lugar : "") + (marca ? L[2] + marca : "") + (serv.length ? L[3] + serv.join(", ") : "") + (cuenta ? L[4] + cuenta : "") + L[5] + pais + num + ".";
    return m;
  }
  function armarCierre() {
    raiz.querySelector(".fm-nombre").textContent = valor(0).split(/\s+/)[0] || "";
    var wa = window.LP_WA || "";
    enviar.href = wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(mensaje()) : "#contacto";
    if (wa) { enviar.target = "_blank"; enviar.rel = "noopener"; } else { enviar.removeAttribute("target"); }
  }

  function abrir(desde) {
    if (abierto) return;
    abierto = true; ultimo = desde || document.activeElement;
    raiz.hidden = false; document.documentElement.classList.add("fm-abierto");
    requestAnimationFrame(function () { raiz.classList.add("fm-ver"); });
    mostrar(actual >= TOTAL ? 0 : actual);
  }
  function cerrar() {
    if (!abierto) return;
    abierto = false; raiz.classList.remove("fm-ver");
    document.documentElement.classList.remove("fm-abierto");
    setTimeout(function () { if (!abierto) raiz.hidden = true; }, 260);
    if (ultimo && ultimo.focus) ultimo.focus({ preventScroll: true });
  }

  function siguiente() { if (completo(actual)) mostrar(actual + 1); }
  sig.addEventListener("click", siguiente);
  atras.addEventListener("click", function () { mostrar(actual - 1); });
  raiz.querySelector("[data-fm-cerrar]").addEventListener("click", cerrar);
  raiz.querySelectorAll("[data-fm-cerrar-final]").forEach(function (b) { b.addEventListener("click", cerrar); });
  enviar.addEventListener("click", function () { if (!window.LP_WA) { cerrar(); } });

  raiz.addEventListener("input", function () { sig.disabled = !completo(actual); });
  raiz.addEventListener("change", function () { sig.disabled = !completo(actual); });
  raiz.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); cerrar(); return; }
    if (e.key === "Enter" && !e.shiftKey && actual < TOTAL) {
      var tag = e.target.tagName;
      if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "A" || (tag === "INPUT" && e.target.type === "checkbox")) return;
      e.preventDefault(); siguiente();
    }
    // el foco se queda adentro del formulario
    if (e.key === "Tab") {
      var f = [].slice.call(raiz.querySelectorAll("button,input,select,textarea,a[href]")).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); abrir(a); });
  });
  if (window.I18N) window.I18N.onChange(function () { if (abierto) mostrar(actual, false); });
  window.Formulario = { abrir: abrir, cerrar: cerrar };
})();
