/* Formulario "Empezá tu proyecto": preguntas de a una, en pantalla completa. Al final arma el mensaje con las respuestas y
   abre WhatsApp (lo envía la persona, nunca se manda solo). Sin servidor: las respuestas solo viajan en ese mensaje. */
(function () {
  "use strict";
  var raiz = document.getElementById("formulario");
  if (!raiz) return;
  var pasos = [].slice.call(raiz.querySelectorAll(".fm-paso"));
  var barra = raiz.querySelector(".fm-progreso i"), botonera = raiz.querySelector("[data-fm-botonera]");
  var sig = raiz.querySelector("[data-fm-sig]"), atras = raiz.querySelector("[data-fm-atras]"), enviar = raiz.querySelector("[data-fm-enviar]");
  var TOTAL = pasos.length - 1; // el último "paso" es la pantalla de cierre
  var actual = 0, abierto = false, ultimo = null;
  function t(s) { return window.I18N ? window.I18N.t(s) : s; }
  function en() { return !!(window.I18N && window.I18N.lang === "en"); }

  function valor(n) { var c = pasos[n].querySelector("[data-k]"); return c ? c.value.trim() : ""; }
  function servicios() { return [].slice.call(raiz.querySelectorAll(".fm-chip input:checked")).map(function (i) { return i.parentNode.querySelector("span").textContent.trim(); }); }
  function completo(n) { return !pasos[n].hasAttribute("data-requerido") || !!valor(n); }

  function mensaje() {
    var s = servicios(), pais = pasos[2].querySelector("select").value, num = valor(2).replace(/\D/g, "").replace(/^0+/, "");
    if (en()) return "Hi! I'm " + valor(0) + (valor(1) ? ", from " + valor(1) : "") + "." + (valor(3) ? " My business is " + valor(3) + "." : "") + (s.length ? " I need: " + s.join(", ") + "." : "") + (valor(4) ? " About my business: " + valor(4) : "") + " My WhatsApp: +" + pais + num + ".";
    return "¡Hola! Soy " + valor(0) + (valor(1) ? ", de " + valor(1) : "") + "." + (valor(3) ? " Mi negocio es " + valor(3) + "." : "") + (s.length ? " Necesito: " + s.join(", ") + "." : "") + (valor(4) ? " Sobre mi negocio: " + valor(4) : "") + " Mi WhatsApp: +" + pais + num + ".";
  }

  function mostrar(n, enfocar) {
    actual = Math.max(0, Math.min(TOTAL, n));
    pasos.forEach(function (p, i) {
      p.hidden = i !== actual;
      var num = p.querySelector(".fm-num");
      if (num) num.textContent = en() ? "Question " + (i + 1) + " of " + TOTAL : "Pregunta " + (i + 1) + " de " + TOTAL;
    });
    barra.style.transform = "scaleX(" + (actual / TOTAL) + ")";
    var fin = actual === TOTAL;
    botonera.hidden = fin; atras.hidden = actual === 0; sig.disabled = !completo(actual);
    sig.textContent = t(actual === TOTAL - 1 ? "Terminar" : "Continuar");
    if (fin) {
      raiz.querySelector(".fm-nombre").textContent = valor(0).split(/\s+/)[0] || "";
      var wa = window.LP_WA || "";
      enviar.href = wa ? "https://wa.me/" + wa + "?text=" + encodeURIComponent(mensaje()) : "#contacto";
      if (wa) { enviar.target = "_blank"; enviar.rel = "noopener"; } else { enviar.removeAttribute("target"); }
    }
    if (enfocar !== false) {
      var f = fin ? enviar : (pasos[actual].querySelector("input[type=text],input[type=tel],textarea") || pasos[actual].querySelector("input"));
      if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 80);
    }
  }

  function abrir(desde) {
    if (abierto) return;
    abierto = true; ultimo = desde || document.activeElement;
    raiz.hidden = false; document.documentElement.classList.add("fm-abierto");
    requestAnimationFrame(function () { raiz.classList.add("ver"); });
    mostrar(actual >= TOTAL ? 0 : actual);
  }
  function cerrar() {
    if (!abierto) return;
    abierto = false; raiz.classList.remove("ver");
    document.documentElement.classList.remove("fm-abierto");
    setTimeout(function () { if (!abierto) raiz.hidden = true; }, 260);
    if (ultimo && ultimo.focus) ultimo.focus({ preventScroll: true });
  }

  sig.addEventListener("click", function () { if (completo(actual)) mostrar(actual + 1); });
  atras.addEventListener("click", function () { mostrar(actual - 1); });
  raiz.querySelector("[data-fm-volver]").addEventListener("click", function () { mostrar(0); });
  raiz.querySelector("[data-fm-cerrar]").addEventListener("click", cerrar);
  enviar.addEventListener("click", function () { if (!window.LP_WA) cerrar(); });
  raiz.addEventListener("input", function () { sig.disabled = !completo(actual); });
  raiz.addEventListener("change", function () { sig.disabled = !completo(actual); });
  raiz.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { e.preventDefault(); cerrar(); return; }
    if (e.key === "Enter" && !e.shiftKey && actual < TOTAL && e.target.tagName === "INPUT" && e.target.type !== "checkbox") {
      e.preventDefault(); if (completo(actual)) mostrar(actual + 1);
    }
    if (e.key === "Tab") { // el foco se queda adentro del formulario
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
