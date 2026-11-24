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
  function dato(k) { var c = raiz.querySelector('[data-k="' + k + '"]'); return c ? c.value.trim() : ""; }
  function lista(a, y) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " " + y + " " + a[a.length - 1]; }
  function minus(x) { return x.charAt(0).toLowerCase() + x.slice(1); }
  function servicios() { return [].slice.call(raiz.querySelectorAll(".fm-chip input:checked")).map(function (i) { return i.parentNode.querySelector("span").textContent.trim(); }); }
  function completo(n) {
    var c = pasos[n].querySelector("[data-k]");
    if (c && c.type === "email") return /^\S+@\S+\.\S+$/.test(c.value.trim());
    return !pasos[n].hasAttribute("data-requerido") || !!valor(n);
  }

  function mensaje() {
    var s = servicios().map(minus), pais = raiz.querySelector("select").value, num = dato("tel").replace(/\D/g, "").replace(/^0+/, "");
    var nom = dato("nombre"), lug = dato("lugar"), neg = dato("negocio"), sobre = dato("sobre"), mail = dato("email"), p = [];
    if (en()) {
      p.push("Hi! I'm " + nom + (lug ? ", from " + lug : "") + (neg ? ". I run " + neg + " and I'd like to get a website for it." : ". I'd like to get a website."));
      if (s.length) p.push("What I need: " + lista(s, "and") + ".");
      if (sobre) p.push("About my business: " + sobre.replace(/[.\s]+$/, "") + ".");
      p.push("You can reach me on this WhatsApp (+" + pais + num + ") or at " + mail + ".\nThank you!");
    } else {
      p.push("¡Hola! Soy " + nom + (lug ? ", de " + lug : "") + (neg ? ". Tengo un negocio, " + neg + ", y me gustaría tener mi página web." : ". Me gustaría tener mi página web."));
      if (s.length) p.push("Lo que necesito: " + lista(s, "y") + ".");
      if (sobre) p.push("Sobre mi negocio: " + sobre.replace(/[.\s]+$/, "") + ".");
      p.push("Pueden escribirme a este WhatsApp (+" + pais + num + ") o a mi correo: " + mail + ".\n¡Muchas gracias!");
    }
    return p.join("\n\n");
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
      raiz.querySelector(".fm-nombre").textContent = dato("nombre").split(/\s+/)[0] || "";
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
    if (actual >= TOTAL) enviado = false;
    mostrar(actual >= TOTAL ? 0 : actual);
  }
  function cerrar() {
    if (!abierto) return;
    abierto = false; raiz.classList.remove("ver");
    document.documentElement.classList.remove("fm-abierto");
    setTimeout(function () { if (!abierto) raiz.hidden = true; }, 260);
    if (ultimo && ultimo.focus) ultimo.focus({ preventScroll: true });
  }

  /* Las respuestas van a un Google Form (queda en una hoja de cálculo). La respuesta de Google no se puede leer desde la página (no-cors). */
  var GF = "https://docs.google.com/forms/d/e/1FAIpQLSf5Q3EbDCnlDwYFOxMDZ3g02kSShxp97C5NLdcKTKSIXZApUA/formResponse";
  var CAMPOS = { nombre: "784819223", lugar: "1508206983", tel: "1182865596", email: "1144432110", negocio: "570423621", sobre: "449006908", necesita: "1250606072" };
  function guardar() {
    var d = new URLSearchParams(), pais = raiz.querySelector("select").value, num = dato("tel").replace(/\D/g, "").replace(/^0+/, "");
    d.append("entry." + CAMPOS.nombre, dato("nombre"));
    d.append("entry." + CAMPOS.lugar, dato("lugar"));
    d.append("entry." + CAMPOS.tel, "+" + pais + " " + num);
    d.append("entry." + CAMPOS.email, dato("email"));
    d.append("entry." + CAMPOS.negocio, dato("negocio"));
    d.append("entry." + CAMPOS.sobre, dato("sobre"));
    d.append("entry." + CAMPOS.necesita, servicios().join(", "));
    try { fetch(GF, { method: "POST", mode: "no-cors", body: d, keepalive: true }); } catch (e) {}
  }
  var enviado = false;
  sig.addEventListener("click", function () {
    if (!completo(actual)) return;
    if (actual === TOTAL - 1 && !enviado) { enviado = true; guardar(); }
    mostrar(actual + 1);
  });
  atras.addEventListener("click", function () { mostrar(actual - 1); });
  var c2 = raiz.querySelector("[data-fm-cerrar2]"); if (c2) c2.addEventListener("click", cerrar);
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
