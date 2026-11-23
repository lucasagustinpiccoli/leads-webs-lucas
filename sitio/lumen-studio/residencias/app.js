/* Residencias Solana: unidades, planos, etapas y formulario. Todo lo que se muestra sale de los datos de abajo. */
(function () {
  "use strict";
  var WA = "5491100000000";
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return n.toLocaleString("es-AR"); };
  function azar(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ---- tipos de unidad y plano (en un cuadro de 100 x 76) ---- */
  var TIPOS = [
    { id: "mono", nombre: "Monoambiente", m2: 38, ext: "Balcón de 5 m²", precio: 78000, porPiso: 1, pisos: [1, 12],
      amb: [["Estar y dormitorio", 0, 0, 62, 64], ["Baño", 62, 0, 38, 26], ["Cocina", 62, 26, 38, 38]], ext_r: [0, 64, 62, 12, "Balcón"] },
    { id: "dos", nombre: "2 ambientes", m2: 62, ext: "Balcón de 8 m²", precio: 124000, porPiso: 2, pisos: [1, 12],
      amb: [["Living", 0, 0, 50, 38], ["Cocina", 0, 38, 28, 26], ["Baño", 28, 38, 22, 26], ["Dormitorio", 50, 0, 50, 40], ["Escritorio", 50, 40, 50, 24]], ext_r: [0, 64, 70, 12, "Balcón"] },
    { id: "tres", nombre: "3 ambientes", m2: 94, ext: "Balcón de 12 m²", precio: 188000, porPiso: 1, pisos: [1, 12],
      amb: [["Living", 0, 0, 44, 36], ["Cocina", 0, 36, 26, 28], ["Baño", 26, 36, 18, 28], ["Dormitorio 1", 44, 0, 56, 30], ["Dormitorio 2", 44, 30, 28, 34], ["Dormitorio 3", 72, 30, 28, 34]], ext_r: [0, 64, 100, 12, "Balcón corrido"] },
    { id: "pent", nombre: "Penthouse", m2: 148, ext: "Terraza de 40 m²", precio: 330000, porPiso: 2, pisos: [13, 14],
      amb: [["Living", 0, 0, 52, 40], ["Cocina", 0, 40, 24, 24], ["Baño", 24, 40, 28, 24], ["Suite", 52, 0, 48, 32], ["Dormitorio", 52, 32, 48, 32]], ext_r: [0, 64, 100, 12, "Terraza propia"] }
  ];
  var UNIDADES = [], n = 0;
  TIPOS.forEach(function (t) {
    for (var p = t.pisos[0]; p <= t.pisos[1]; p++) for (var k = 0; k < t.porPiso; k++) {
      var r = azar(n++ + 5);
      UNIDADES.push({ tipo: t.id, piso: p, estado: r < 0.58 ? "disponible" : r < 0.74 ? "reservada" : "vendida" });
    }
  });
  var TOTAL = UNIDADES.length, DISP = UNIDADES.filter(function (u) { return u.estado === "disponible"; }).length;
  function libres(id) { return UNIDADES.filter(function (u) { return u.tipo === id && u.estado === "disponible"; }).length; }

  /* ---- cifras del primer capítulo ---- */
  var valores = { pisos: 14, total: TOTAL, disp: DISP };
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function contar(el) {
    var fin = valores[el.dataset.cuenta];
    if (reducido) { el.textContent = fmt(fin); return; }
    var t0 = performance.now();
    (function paso(t) { var k = Math.min(1, (t - t0) / 1200); el.textContent = fmt(Math.round(fin * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(paso); })(t0);
  }
  [].forEach.call(document.querySelectorAll("[data-cuenta]"), function (el) { el.textContent = fmt(valores[el.dataset.cuenta]); });
  if ("IntersectionObserver" in window && !reducido) {
    var io0 = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { contar(x.target); io0.unobserve(x.target); } }); }, { threshold: 0.6 });
    [].forEach.call(document.querySelectorAll("[data-cuenta]"), function (el) { el.textContent = "0"; io0.observe(el); });
  }

  /* ---- unidades ---- */
  var tabs = $("tabs"), actual = TIPOS[1];
  TIPOS.forEach(function (t) {
    var b = document.createElement("button"); b.type = "button"; b.className = "tab"; b.setAttribute("role", "tab"); b.id = "tab-" + t.id;
    b.setAttribute("aria-selected", t.id === actual.id ? "true" : "false"); b.textContent = t.nombre;
    b.addEventListener("click", function () { actual = t; pintar(); });
    tabs.appendChild(b);
  });
  function plano(t) {
    var s = '<svg viewBox="-1 -1 102 78" role="img" aria-label="Plano de ' + t.nombre + '">';
    t.amb.forEach(function (a) { s += '<rect class="amb" x="' + a[1] + '" y="' + a[2] + '" width="' + a[3] + '" height="' + a[4] + '"/><text x="' + (a[1] + a[3] / 2) + '" y="' + (a[2] + a[4] / 2 + 1.2) + '">' + a[0] + '</text>'; });
    var e = t.ext_r; s += '<rect class="bal" x="' + e[0] + '" y="' + e[1] + '" width="' + e[2] + '" height="' + e[3] + '"/><text x="' + (e[0] + e[2] / 2) + '" y="' + (e[1] + e[3] / 2 + 1.2) + '">' + e[4] + '</text></svg>';
    return s;
  }
  function fotoTipo(id) { var i = document.querySelector('#fotos-tipo img[data-t="' + id + '"]'); return i ? i.getAttribute('src') : ''; }
  function pintar() {
    [].forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.id === "tab-" + actual.id ? "true" : "false"); });
    $("plano").innerHTML = plano(actual);
    var l = libres(actual.id), pis = actual.pisos[0] === actual.pisos[1] ? "piso " + actual.pisos[0] : "pisos " + actual.pisos[0] + " a " + actual.pisos[1];
    $("ficha").innerHTML = '<img class="foto-tipo" src="' + fotoTipo(actual.id) + '" alt="Ambiente de ' + actual.nombre + '" loading="lazy"><h3>' + actual.nombre + '</h3><p class="precio">Desde USD ' + fmt(actual.precio) + '</p>' +
      '<dl><div><dt>Superficie cubierta</dt><dd>' + actual.m2 + ' m²</dd></div><div><dt>Exterior</dt><dd>' + actual.ext + '</dd></div><div><dt>Ubicación</dt><dd>' + pis + '</dd></div><div><dt>Disponibles</dt><dd>' + l + '</dd></div><div><dt>Entrega</dt><dd>Diciembre de 2027</dd></div></dl>' +
      '<button class="btn" type="button" id="consultar">Consultar este tipo</button>';
    $("consultar").addEventListener("click", function () { $("f-tipo").value = actual.id; irAWhatsApp(mensaje($("f-nombre").value.trim(), actual)); });
  }
  function mensaje(nombre, t) {
    var saludo = nombre ? "¡Hola! Mi nombre es " + nombre + "." : "¡Hola!";
    return saludo + (t ? " Quiero consultar por un " + (t.id === "pent" ? "penthouse" : "departamento de " + t.nombre.toLowerCase()) + " en Solana." : " Quiero consultar por las unidades disponibles en Solana.") + " Muchas gracias.";
  }
  function irAWhatsApp(texto) { window.location.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(texto); }
  pintar();

  /* ---- formulario ---- */
  var sel = $("f-tipo");
  var o0 = document.createElement("option"); o0.value = ""; o0.textContent = "Todavía no elegí uno"; sel.appendChild(o0);
  TIPOS.forEach(function (t) { var o = document.createElement("option"); o.value = t.id; o.textContent = t.nombre + ", " + t.m2 + " m²"; sel.appendChild(o); });
  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var nombre = $("f-nombre").value.trim();
    if (!nombre) { $("f-error").style.display = "block"; $("f-nombre").setAttribute("aria-invalid", "true"); $("f-nombre").focus(); return; }
    irAWhatsApp(mensaje(nombre, TIPOS.filter(function (t) { return t.id === sel.value; })[0] || null));
  });
  $("f-nombre").addEventListener("input", function () { $("f-error").style.display = "none"; this.removeAttribute("aria-invalid"); });

  /* ---- línea de etapas: se llena una vez hasta donde va la obra ---- */
  var ol = $("ol-etapas"), HASTA = 0.4;
  if ("IntersectionObserver" in window && !reducido) {
    ol.style.setProperty("--prog", "0.02");
    var ioE = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ol.style.setProperty("--prog", HASTA); ioE.disconnect(); } }, { threshold: 0.5 });
    ioE.observe(ol);
  } else { ol.style.setProperty("--prog", HASTA); }

  /* ---- barra superior, botón flotante y barra del celular ---- */
  var cab = $("cab"), aviso = document.querySelector(".aviso");
  function alBajar() { cab.classList.toggle("solida", window.scrollY > 80); cab.style.top = aviso ? Math.max(0, aviso.offsetHeight - window.scrollY) + "px" : "0px"; }
  alBajar(); window.addEventListener("scroll", alBajar, { passive: true });
  var flota = $("flota"), barra = $("barra"), vistos = new Set();
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { x.isIntersecting ? vistos.add(x.target) : vistos.delete(x.target); });
      var ocultar = vistos.size > 0; flota.classList.toggle("oculta", ocultar); barra.classList.toggle("ver", !ocultar);
    });
    ["#apertura", "#unidades", "#contacto", "footer"].forEach(function (s) { var el = document.querySelector(s); if (el) io.observe(el); });
  } else { barra.classList.add("ver"); }
})();
