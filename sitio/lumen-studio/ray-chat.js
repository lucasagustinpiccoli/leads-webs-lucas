/* Ray: asistente de Lumen Studio. Saluda, pregunta el nombre y guía a tres caminos: ver los proyectos,
   empezar un proyecto (abre el formulario) o seguir por WhatsApp con un mensaje ya escrito.
   No usa IA ni guarda nada: el nombre solo se usa en esta conversación y en el mensaje de WhatsApp. */
(function () {
  "use strict";

  function EN() { return window.I18N && window.I18N.lang === "en"; }
  function L(es, en) { return EN() ? en : es; }

  var log = document.getElementById("chat-log");
  var entrada = document.getElementById("chat-input");
  if (!log || !entrada) return;

  var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nombre = "";
  var iniciado = false;
  var gen = 0; // cada reinicio invalida la conversación anterior

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

  /* Ray "escribe": tres puntos y después el mensaje. */
  function decir(texto) {
    var g = gen;
    var t = document.createElement("div");
    t.className = "burbuja bot escribiendo";
    t.setAttribute("aria-hidden", "true");
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t);
    abajo();
    return esperar(500 + Math.min(texto.length * 10, 600)).then(function () {
      t.remove();
      if (g !== gen) return new Promise(function () {}); // conversación vieja: no sigue
      return burbuja(texto, "bot");
    });
  }

  function limpiar() { entrada.innerHTML = ""; }
  function boton(txt, clase) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = clase || "opcion";
    b.textContent = txt;
    return b;
  }

  /* Pide el nombre. */
  function pedirNombre() {
    return new Promise(function (ok) {
      limpiar();
      var f = document.createElement("form");
      f.className = "datos-form";
      f.noValidate = true;
      f.innerHTML =
        '<label>' + L("Tu nombre", "Your name") + '<input name="nombre" autocomplete="given-name" maxlength="40" required></label>' +
        '<p class="error" role="alert" hidden>' + L("Escribí tu nombre para seguir.", "Type your name to continue.") + '</p>';
      var b = boton(L("Seguir", "Continue"), "btn btn--primary");
      b.type = "submit";
      f.appendChild(b);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var n = f.nombre.value.trim().replace(/\s+/g, " ");
        if (!n) { f.querySelector(".error").hidden = false; f.nombre.setAttribute("aria-invalid", "true"); f.nombre.focus(); return; }
        limpiar();
        burbuja(n, "yo");
        ok(n);
      });
      entrada.appendChild(f);
      f.nombre.focus({ preventScroll: true });
    });
  }

  /* Mensaje de WhatsApp escrito en primera persona, con el nombre. */
  function mensajeWA() {
    return EN()
      ? "Hi! My name is " + nombre + ". I saw the Lumen Studio website and I'd like to ask about a website for my business. Thank you!"
      : "¡Hola! Mi nombre es " + nombre + ". Vi la página de Lumen Studio y me gustaría consultar por una web para mi negocio. Muchas gracias.";
  }

  function enlaceWA() {
    var a = document.createElement("a");
    a.className = "btn btn--primary";
    a.textContent = L("Abrir WhatsApp", "Open WhatsApp");
    var wa = window.LP_WA || "";
    if (wa) { a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(mensajeWA()); a.target = "_blank"; a.rel = "noopener"; }
    else { a.href = "#contacto"; a.addEventListener("click", function (e) { e.preventDefault(); cerrarChat(); abrirFormulario(a); }); }
    return a;
  }

  function cerrarChat() { if (window.RayCerrar) window.RayCerrar(); }
  function abrirFormulario(desde) { if (window.Formulario) window.Formulario.abrir(desde); else location.hash = "#contacto"; }

  /* Las tres salidas. Cada una responde con el nombre y ofrece su botón. */
  function accion(id) {
    var n = nombre;
    if (id === "proyectos") {
      return decir(L("Dale, " + n + ". Te muestro los proyectos: hay sitios con reservas, un catálogo, una landing de app y una inmobiliaria.", "Sure, " + n + ". Here are the projects: websites with online booking, a catalogue, an app landing page and a real-estate site.")).then(function () {
        var ir = boton(L("Ver los proyectos", "See the projects"), "btn btn--primary");
        ir.addEventListener("click", function () {
          cerrarChat();
          var t = document.getElementById("trabajos"); if (t) t.scrollIntoView({ behavior: reducido ? "auto" : "smooth" });
        });
        return opcionesFinales(ir);
      });
    }
    if (id === "empezar") {
      return decir(L("Muy bien, " + n + ". Te hago unas preguntas cortas sobre tu negocio y armamos una demo de tu página, sin costo.", "Great, " + n + ". A few short questions about your business and we'll put together a demo of your site, at no cost.")).then(function () {
        var ir = boton(L("Empezar mi proyecto", "Start my project"), "btn btn--primary");
        ir.addEventListener("click", function () { cerrarChat(); abrirFormulario(ir); });
        return opcionesFinales(ir);
      });
    }
    return decir(L("Perfecto, " + n + ". Te dejo el botón: abre WhatsApp con un mensaje ya escrito, solo tenés que enviarlo.", "Perfect, " + n + ". Here's the button: it opens WhatsApp with a message already written, you just have to send it.")).then(function () {
      return opcionesFinales(enlaceWA());
    });
  }

  function opcionesFinales(principal) {
    limpiar();
    var fila = document.createElement("div");
    fila.className = "opciones fin";
    var otra = boton(L("Otra opción", "Another option"), "btn btn--small");
    otra.addEventListener("click", function () { burbuja(L("Otra opción", "Another option"), "yo"); menu(); });
    fila.appendChild(principal); fila.appendChild(otra);
    entrada.appendChild(fila);
    principal.focus({ preventScroll: true });
  }

  /* Reconoce lo que el usuario escribe y lo lleva a una de las tres salidas. */
  function interpretar(txt) {
    var t = txt.toLowerCase();
    if (/whats|wsp|wpp|watsap|mensaje|escrib|hablar|chat|contact/.test(t)) return "whatsapp";
    if (/proyecto|trabajo|portfolio|portafolio|ejemplo|demo|ver |muestra|project|work|example/.test(t)) return "proyectos";
    if (/empez|web|p[aá]gina|precio|cu[aá]nto|presupuesto|armar|hacer|necesito|quiero|start|price|cost|website|budget/.test(t)) return "empezar";
    return "";
  }

  function menu() {
    limpiar();
    var cont = document.createElement("div");
    cont.className = "opciones";
    [["proyectos", L("Ver los proyectos", "See the projects")], ["empezar", L("Empezar mi proyecto", "Start my project")], ["whatsapp", L("Hablar por WhatsApp", "Chat on WhatsApp")]].forEach(function (o) {
      var b = boton(o[1]);
      b.addEventListener("click", function () { limpiar(); burbuja(o[1], "yo"); accion(o[0]); });
      cont.appendChild(b);
    });
    entrada.appendChild(cont);
    var f = document.createElement("form");
    f.className = "libre";
    f.innerHTML = '<input name="t" maxlength="120" autocomplete="off" aria-label="' + L("O escribí lo que necesitás", "Or type what you need") + '" placeholder="' + L("O escribí lo que necesitás", "Or type what you need") + '"><button type="submit" class="btn btn--small">' + L("Enviar", "Send") + '</button>';
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = f.t.value.trim();
      if (!t) return;
      limpiar(); burbuja(t, "yo");
      var id = interpretar(t);
      if (id) accion(id);
      else decir(L("No te entendí del todo, " + nombre + ". Elegí una de estas opciones y te ayudo.", "I didn't quite get that, " + nombre + ". Pick one of these options and I'll help.")).then(menu);
    });
    entrada.appendChild(f);
    cont.firstChild.focus({ preventScroll: true });
  }

  function correr() {
    gen++;
    nombre = "";
    return decir(L("¡Hola! Soy Ray, el asistente de Lumen Studio.", "Hi! I'm Ray, the Lumen Studio assistant."))
      .then(function () { return decir(L("¿Cómo te llamás?", "What's your name?")); })
      .then(pedirNombre)
      .then(function (n) { nombre = n; return decir(L("Mucho gusto, " + nombre + ". ¿Qué querés hacer?", "Nice to meet you, " + nombre + ". What would you like to do?")); })
      .then(menu);
  }

  function reiniciar() { log.innerHTML = ""; limpiar(); correr(); }

  /* La conversación arranca la primera vez que se abre el chat. */
  window.RayChat = { iniciar: function () { if (iniciado) return; iniciado = true; correr(); } };
  /* Al cambiar de idioma la conversación se reinicia en el idioma nuevo. */
  if (window.I18N) window.I18N.onChange(function () { if (iniciado) reiniciar(); });
})();
