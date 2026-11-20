/* Lupa: asistente guiado de Lumen Studio. Hace unas preguntas, calcula un rango de precio con la tabla de la página
   y arma el mensaje para Lucas por WhatsApp. No usa IA ni guarda nada: los datos solo viajan en ese mensaje. */
(function () {
  "use strict";

  var PRECIO_BASE = 180;
  var EXTRA_MIN = 40;
  var EXTRA_MAX = 60;

  var RUBROS = ["Salud o consultorio", "Salón o eventos", "Belleza o estética", "Gimnasio o deporte", "Estudio profesional", "Comercio o tienda", "Otro rubro"];
  var QUIERE = [
    { id: "wa", txt: "Que me escriban por WhatsApp", extra: false },
    { id: "turnos", txt: "Reserva de turnos", extra: true },
    { id: "galeria", txt: "Galería de fotos", extra: true },
    { id: "catalogo", txt: "Carta o catálogo", extra: true },
    { id: "form", txt: "Formulario de contacto", extra: true },
    { id: "sistema", txt: "Un sistema para administrar mi negocio", extra: false, medida: true }
  ];
  var MATERIAL = ["Tengo logo y fotos", "Tengo algo", "Parto de cero"];
  var CUANDO = ["Lo antes posible", "En el próximo mes", "Sin apuro"];

  /* Rango de precio: la base más los extras elegidos. Un sistema de gestión se presupuesta aparte. */
  function estimar(cantidadExtras, conSistema) {
    var n = Math.max(0, cantidadExtras | 0);
    return { min: PRECIO_BASE + n * EXTRA_MIN, max: PRECIO_BASE + n * EXTRA_MAX, aparte: !!conSistema };
  }

  function listaTexto(items) {
    if (items.length <= 1) return items.join("");
    return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
  }

  function armarMensaje(d, est) {
    var precio = "USD " + est.min + (est.max !== est.min ? " a " + est.max : "");
    var l = [
      "Hola Lucas, soy " + d.nombre + (d.negocio ? " de " + d.negocio : "") + ". Hablé con Lupa en tu página.",
      "Tipo de negocio: " + d.rubro,
      "Quiero: " + listaTexto(d.quiere),
      "Material: " + d.material,
      "Plazo: " + d.cuando,
      "Estimación de Lupa: " + precio + (est.aparte ? ", más el sistema de gestión, que se presupuesta aparte" : "") + "."
    ];
    return l.join("\n");
  }

  window.Lupa = { estimar: estimar, armarMensaje: armarMensaje };

  var log = document.getElementById("chat-log");
  var entrada = document.getElementById("chat-input");
  if (!log || !entrada) return;

  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var datos = {};
  var iniciado = false;

  function esperar(ms) { return new Promise(function (ok) { setTimeout(ok, reducido ? 0 : ms); }); }
  function abajo() { log.scrollTop = log.scrollHeight; }

  function burbuja(texto, quien) {
    var b = document.createElement("div");
    b.className = "burbuja " + quien;
    b.textContent = texto;
    log.appendChild(b);
    abajo();
    return b;
  }

  /* Lupa "escribe": un indicador de tres puntos y después el mensaje. */
  function decir(texto) {
    var t = document.createElement("div");
    t.className = "burbuja lupa escribiendo";
    t.setAttribute("aria-hidden", "true");
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t);
    abajo();
    return esperar(550 + Math.min(texto.length * 12, 700)).then(function () {
      t.remove();
      return burbuja(texto, "lupa");
    });
  }

  function limpiarEntrada() { entrada.innerHTML = ""; }

  function boton(txt, clase) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = clase || "opcion";
    b.textContent = txt;
    return b;
  }

  function elegirUno(opciones) {
    return new Promise(function (ok) {
      limpiarEntrada();
      var cont = document.createElement("div");
      cont.className = "opciones";
      opciones.forEach(function (o) {
        var b = boton(o);
        b.addEventListener("click", function () { limpiarEntrada(); burbuja(o, "yo"); ok(o); });
        cont.appendChild(b);
      });
      entrada.appendChild(cont);
      cont.firstChild.focus({ preventScroll: true });
    });
  }

  function elegirVarios(opciones) {
    return new Promise(function (ok) {
      limpiarEntrada();
      var cont = document.createElement("div");
      cont.className = "opciones";
      var marcadas = {};
      var seguir = boton("Listo", "btn btn--primary btn--small");
      seguir.disabled = true;
      opciones.forEach(function (o) {
        var b = boton(o.txt);
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          marcadas[o.id] = !marcadas[o.id];
          b.setAttribute("aria-pressed", marcadas[o.id] ? "true" : "false");
          seguir.disabled = !Object.keys(marcadas).some(function (k) { return marcadas[k]; });
        });
        cont.appendChild(b);
      });
      seguir.addEventListener("click", function () {
        var elegidas = opciones.filter(function (o) { return marcadas[o.id]; });
        limpiarEntrada();
        burbuja(elegidas.map(function (o) { return o.txt; }).join(", "), "yo");
        ok(elegidas);
      });
      entrada.appendChild(cont);
      entrada.appendChild(seguir);
      cont.firstChild.focus({ preventScroll: true });
    });
  }

  function pedirDatos() {
    return new Promise(function (ok) {
      limpiarEntrada();
      var f = document.createElement("form");
      f.className = "datos-form";
      f.noValidate = true;
      f.innerHTML =
        '<label>Tu nombre<input name="nombre" autocomplete="name" required></label>' +
        '<label>Nombre de tu negocio <span class="opcional">(opcional)</span><input name="negocio" autocomplete="organization"></label>' +
        '<p class="error" role="alert" hidden>Escribí tu nombre para que Lucas sepa a quién responder.</p>';
      var b = boton("Ver mi resumen", "btn btn--primary");
      b.type = "submit";
      f.appendChild(b);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var nombre = f.nombre.value.trim();
        if (!nombre) { f.querySelector(".error").hidden = false; f.nombre.setAttribute("aria-invalid", "true"); f.nombre.focus(); return; }
        var negocio = f.negocio.value.trim();
        limpiarEntrada();
        burbuja(nombre + (negocio ? ", " + negocio : ""), "yo");
        ok({ nombre: nombre, negocio: negocio });
      });
      entrada.appendChild(f);
      f.nombre.focus({ preventScroll: true });
    });
  }

  function cierre() {
    var extras = datos.quiereObj.filter(function (o) { return o.extra; }).length;
    var est = estimar(extras, datos.quiereObj.some(function (o) { return o.medida; }));
    var precio = "USD " + est.min + (est.max !== est.min ? " a " + est.max : "");
    var resumen = "Gracias, " + datos.nombre + ". Para " + datos.rubro.toLowerCase() + ", con " +
      listaTexto(datos.quiere.map(function (t) { return t.toLowerCase(); })) + ", la estimación es de " + precio +
      (est.aparte ? ", más el sistema de gestión, que se presupuesta aparte" : "") + ".";
    return decir(resumen)
      .then(function () { return decir("Es una estimación: el precio final te lo confirma Lucas por escrito antes de empezar. Hosting y soporte opcionales cuestan USD 15 a 20 por mes."); })
      .then(function () {
        limpiarEntrada();
        var wa = window.LP_WA || "";
        var a = document.createElement("a");
        a.className = "btn btn--primary";
        a.textContent = "Seguir con Lucas por WhatsApp";
        var msg = armarMensaje(datos, est);
        if (wa) { a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(msg); a.target = "_blank"; a.rel = "noopener"; }
        else { a.href = "#contacto"; }
        var otra = boton("Empezar de nuevo", "btn btn--small");
        otra.addEventListener("click", reiniciar);
        var fila = document.createElement("div");
        fila.className = "opciones fin";
        fila.appendChild(a); fila.appendChild(otra);
        entrada.appendChild(fila);
        var nota = document.createElement("p");
        nota.className = "nota-chat";
        nota.textContent = "No guardo nada: tus respuestas solo viajan en el mensaje de WhatsApp.";
        entrada.appendChild(nota);
        a.focus({ preventScroll: true });
      });
  }

  function correr() {
    datos = {};
    return decir("Hola, soy Lupa, el asistente de Lumen Studio. Te hago cinco preguntas, te muestro un rango de precio y le paso el resumen a Lucas.")
      .then(function () { return decir("¿Qué tipo de negocio tenés?"); })
      .then(function () { return elegirUno(RUBROS); })
      .then(function (r) { datos.rubro = r; return decir("¿Qué querés que haga tu página? Podés elegir varias. Incluye siempre botón de WhatsApp y mapa."); })
      .then(function () { return elegirVarios(QUIERE); })
      .then(function (q) { datos.quiereObj = q; datos.quiere = q.map(function (o) { return o.txt; }); return decir("¿Ya tenés logo y fotos?"); })
      .then(function () { return elegirUno(MATERIAL); })
      .then(function (m) { datos.material = m; return decir("¿Para cuándo la necesitás?"); })
      .then(function () { return elegirUno(CUANDO); })
      .then(function (c) { datos.cuando = c; return decir("Última: ¿cómo te llamás y cómo se llama tu negocio?"); })
      .then(pedirDatos)
      .then(function (p) { datos.nombre = p.nombre; datos.negocio = p.negocio; return cierre(); });
  }

  function reiniciar() { log.innerHTML = ""; limpiarEntrada(); correr(); }

  /* Arranca cuando el chat entra en pantalla, así la conversación no pasa sin que nadie la vea. */
  function iniciar() { if (iniciado) return; iniciado = true; correr(); }
  if (!("IntersectionObserver" in window)) { iniciar(); return; }
  var io = new IntersectionObserver(function (es) {
    if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); iniciar(); }
  }, { threshold: 0.25 });
  io.observe(log.parentNode);
})();
