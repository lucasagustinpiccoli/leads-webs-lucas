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
  /* ---- plano en tres capas (piso, paredes y muebles) para que se vea casi en 3D ---- */
  var K = 2, OX = 10, OY = 22;
  function X(v) { return OX + v * K; }
  function Y(v) { return OY + v * K; }
  function R(x, y, w, h, att) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" ' + att + '/>'; }
  function C(cx, cy, r, att) { return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '" ' + att + '/>'; }
  var TELA = 'fill="url(#gTela)" stroke="#cfc6b6" stroke-width=".5"', MADERA = 'fill="url(#gMadera)" stroke="#a98a60" stroke-width=".4"', VERDE = 'fill="#7d9870"', VERDE2 = 'fill="#9bb38c"';
  function planta(cx, cy, r) { return C(cx, cy, r, VERDE) + C(cx - r * .35, cy - r * .2, r * .7, VERDE2) + C(cx + r * .3, cy + r * .25, r * .55, VERDE2); }
  function silla(cx, cy, r) { return C(cx, cy, r, 'fill="#efe9dd" stroke="#cfc6b6" stroke-width=".4"'); }
  function sala(x, y, w, h) {
    var s = R(x + .1 * w, y + .22 * h, .62 * w, .56 * h, 'rx="1.5" fill="#d9d3c6"') + R(x + .1 * w, y + .22 * h, .62 * w, .56 * h, 'rx="1.5" filter="url(#tejido)"');
    s += R(x + .07 * w, y + .3 * h, .15 * w, .42 * h, 'rx="2" ' + TELA) + R(x + .07 * w, y + .3 * h, .045 * w, .42 * h, 'rx="1.5" fill="#e8e1d4" stroke="#cfc6b6" stroke-width=".4"');
    s += R(x + .33 * w, y + .45 * h, .15 * w, .16 * h, 'rx="1" ' + MADERA);
    s += R(x + .56 * w, y + .46 * h, .13 * w, .17 * h, 'rx="3" ' + TELA);
    var cx = x + .78 * w, cy = y + .2 * h, rr = Math.min(w, h) * .09;
    s += silla(cx - rr * 1.6, cy, rr * .55) + silla(cx + rr * 1.6, cy, rr * .55) + silla(cx, cy - rr * 1.6, rr * .55) + silla(cx, cy + rr * 1.6, rr * .55) + C(cx, cy, rr, MADERA);
    return s + planta(x + .08 * w, y + .12 * h, Math.min(w, h) * .05);
  }
  function cocinaM(x, y, w, h) {
    var s = R(x + .05 * w, y + .05 * h, .9 * w, .2 * h, 'rx=".8" fill="#f3f0ea" stroke="#cfc6b6" stroke-width=".4"');
    s += C(x + .25 * w, y + .15 * h, 2.3, 'fill="#222"') + C(x + .25 * w + 5.5, y + .15 * h, 2.3, 'fill="#222"');
    s += R(x + .58 * w, y + .1 * h, .22 * w, .1 * h, 'rx=".6" fill="#b9bfc3" stroke="#8f979c" stroke-width=".3"');
    if (h > 50) s += R(x + .15 * w, y + .52 * h, .7 * w, .17 * h, 'rx="1" fill="#f3f0ea" stroke="#cfc6b6" stroke-width=".4"') + silla(x + .3 * w, y + .78 * h, 2.4) + silla(x + .7 * w, y + .78 * h, 2.4);
    return s;
  }
  function banoM(x, y, w, h) {
    var s = R(x + .08 * w, y + .08 * h, .84 * w, .27 * h, 'rx="4" fill="#fbfaf7" stroke="#cfc6b6" stroke-width=".5"') + R(x + .14 * w, y + .13 * h, .72 * w, .17 * h, 'rx="3" fill="#eef1f2" stroke="#d6dcde" stroke-width=".3"');
    s += R(x + .1 * w, y + .62 * h, .34 * w, .2 * h, 'rx="1" fill="#fbfaf7" stroke="#cfc6b6" stroke-width=".4"') + C(x + .27 * w, y + .72 * h, 2.2, 'fill="#eef1f2" stroke="#d6dcde" stroke-width=".3"');
    s += R(x + .62 * w, y + .62 * h, .26 * w, .1 * h, 'rx="1" fill="#fbfaf7" stroke="#cfc6b6" stroke-width=".4"') + '<ellipse cx="' + (x + .75 * w).toFixed(1) + '" cy="' + (y + .8 * h).toFixed(1) + '" rx="' + (.1 * w).toFixed(1) + '" ry="' + (.07 * h).toFixed(1) + '" fill="#fbfaf7" stroke="#cfc6b6" stroke-width=".4"/>';
    return s;
  }
  function dormM(x, y, w, h) {
    var s = R(x + .1 * w, y + .2 * h, .8 * w, .66 * h, 'rx="1.5" fill="#d9d3c6"') + R(x + .1 * w, y + .2 * h, .8 * w, .66 * h, 'rx="1.5" filter="url(#tejido)"');
    s += R(x + .2 * w, y + .1 * h, .6 * w, .64 * h, 'rx="1.5" fill="#fbfaf7" stroke="#cfc6b6" stroke-width=".5"') + R(x + .2 * w, y + .1 * h, .6 * w, .06 * h, 'rx="1" fill="#b79b74"');
    s += R(x + .24 * w, y + .18 * h, .24 * w, .12 * h, 'rx="2" fill="#fff" stroke="#d6cfc2" stroke-width=".4"') + R(x + .52 * w, y + .18 * h, .24 * w, .12 * h, 'rx="2" fill="#fff" stroke="#d6cfc2" stroke-width=".4"');
    s += R(x + .2 * w, y + .45 * h, .6 * w, .29 * h, 'rx="1" fill="#e3dccd"');
    s += R(x + .08 * w, y + .12 * h, .1 * w, .1 * h, 'rx=".8" ' + MADERA) + R(x + .82 * w, y + .12 * h, .1 * w, .1 * h, 'rx=".8" ' + MADERA);
    return s + planta(x + .88 * w, y + .88 * h, Math.min(w, h) * .05);
  }
  function escrM(x, y, w, h) {
    return R(x + .1 * w, y + .1 * h, .8 * w, .24 * h, 'rx=".8" ' + MADERA) + R(x + .38 * w, y + .12 * h, .24 * w, .1 * h, 'rx=".5" fill="#2a2a2a"') + silla(x + .5 * w, y + .5 * h, 3.2) + planta(x + .86 * w, y + .84 * h, Math.min(w, h) * .06);
  }
  function mueble(n, x, y, w, h) {
    n = n.toLowerCase();
    if (n.indexOf("estar") > -1) return sala(x, y + .42 * h, w, .58 * h) + dormM(x + .5 * w, y, .5 * w, .46 * h);
    if (n.indexOf("living") > -1) return sala(x, y, w, h);
    if (n.indexOf("cocina") > -1) return cocinaM(x, y, w, h);
    if (n.indexOf("baño") > -1) return banoM(x, y, w, h);
    if (n.indexOf("escritorio") > -1) return escrM(x, y, w, h);
    return dormM(x, y, w, h);
  }
  /* repite una capa varias veces, una sobre otra, para dar altura (paredes y muebles con volumen al inclinar) */
  function mezcla(a, b, k) { var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), o = ""; [16, 8, 0].forEach(function (sh) { var v = Math.round(((pa >> sh) & 255) * (1 - k) + ((pb >> sh) & 255) * k); o += (v < 16 ? "0" : "") + v.toString(16); }); return "#" + o; }
  function extruir(svg, cont, cls, z0, capas, paso, colores, sombrear) {
    var out = "";
    for (var i = 0; i < capas; i++) {
      var k = i / (capas - 1), estilo = colores ? "color:" + mezcla(colores[0], colores[1], k) + ";" : "color:#1a1a1a;filter:brightness(" + (0.72 + 0.28 * k).toFixed(2) + ");";
      var g = i === 0 ? '<g filter="url(#sombra)">' + cont + '</g>' : cont;
      out += svg(cls, g, (z0 + i * paso).toFixed(1), estilo);
    }
    return out;
  }
  function plano(t) {
    var tot = t.amb.reduce(function (a, r) { return a + r[3] * r[4]; }, 0);
    var piso = "", pared = "", mue = "", etiq = "", oclu = "", n = 0;
    t.amb.forEach(function (a) {
      var x = X(a[1]), y = Y(a[2]), w = a[3] * K, h = a[4] * K, bano = a[0].toLowerCase().indexOf("baño") > -1;
      piso += R(x, y, w, h, 'fill="url(#' + (bano ? "baldosa" : "madera") + ')"') + (bano ? "" : R(x, y, w, h, 'filter="url(#grano)"'));
      oclu += '<clipPath id="cp' + (n++) + '"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '"/></clipPath><g clip-path="url(#cp' + (n - 1) + ')"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="9" filter="url(#difuso)"/></g>';
      pared += R(x, y, w, h, 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="miter"');
      mue += mueble(a[0], x, y, w, h);
      var m2 = Math.round(t.m2 * (a[3] * a[4]) / tot);
      var tx = x + w / 2, ty = y + h - 7, nom = a[0];
      var ancho = Math.max(nom.length * 3.1, 18) + 4;
      etiq += R(tx - ancho / 2, ty - 5.2, ancho, 10.6, 'rx="2" fill="#fff" fill-opacity=".92"') + '<text x="' + tx.toFixed(1) + '" y="' + (ty - .2).toFixed(1) + '" class="t1">' + nom + '</text><text x="' + tx.toFixed(1) + '" y="' + (ty + 4).toFixed(1) + '" class="t2">' + m2 + ' m²</text>';
      if (a[2] === 0 && !bano) { var wx = x + w * .12, ww = w * .76; pared += R(wx, y - 1.6, ww, 3.2, 'fill="#eaf1f4" stroke="currentColor" stroke-width=".7"') + '<line x1="' + wx.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (wx + ww).toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="currentColor" stroke-width=".5"/>'; }
    });
    var e = t.ext_r, ex = X(e[0]), ey = Y(e[1]), ew = e[2] * K, eh = e[3] * K;
    piso += R(ex, ey, ew, eh, 'fill="url(#deck)"');
    pared += R(ex, ey, ew, eh, 'fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 2"');
    mue += planta(ex + 7, ey + eh / 2, 3.2) + planta(ex + ew - 7, ey + eh / 2, 3.2) + C(ex + ew / 2, ey + eh / 2, 3.6, MADERA) + silla(ex + ew / 2 - 8, ey + eh / 2, 2.4) + silla(ex + ew / 2 + 8, ey + eh / 2, 2.4);
    var tx2 = ex + ew / 2, ty2 = ey + eh + 7;
    etiq += '<text x="' + tx2.toFixed(1) + '" y="' + ty2.toFixed(1) + '" class="t2">' + e[4] + ', ' + t.ext.replace(/^\D+/, "").replace(/ .*/, "") + ' m²</text>';
    var VB = '0 0 220 ' + (OY + 76 * K + 24);
    var defs = '<defs><pattern id="madera" width="12" height="4" patternUnits="userSpaceOnUse"><rect width="12" height="4" fill="#e7dac4"/><path d="M0 0H12M0 4H12" stroke="#d6c7ac" stroke-width=".5"/><path d="M5 0V4" stroke="#dccfb7" stroke-width=".3"/></pattern>' +
      '<pattern id="baldosa" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#ecebe7"/><path d="M0 0H6V6" fill="none" stroke="#dcdad3" stroke-width=".4"/></pattern>' +
      '<pattern id="deck" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#dedbd3"/><path d="M0 0H5" stroke="#cfcbc1" stroke-width=".5"/></pattern>' +
      '<filter id="sombra" x="-8%" y="-8%" width="120%" height="125%"><feDropShadow dx="0" dy="2.6" stdDeviation="2" flood-color="#2a1d0e" flood-opacity=".38"/></filter>' +
      '<filter id="difuso" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter>' +
      '<filter id="grano" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.95" numOctaves="2" seed="7" result="r"/><feColorMatrix in="r" type="matrix" values="0 0 0 0 .42  0 0 0 0 .27  0 0 0 0 .12  0 0 0 .9 -.32"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<filter id="tejido" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="r"/><feColorMatrix in="r" type="matrix" values="0 0 0 0 .3  0 0 0 0 .27  0 0 0 0 .22  0 0 0 .7 -.22"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<linearGradient id="gTela" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfbf7"/><stop offset="1" stop-color="#e4dccd"/></linearGradient>' +
      '<linearGradient id="gMadera" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9b88c"/><stop offset="1" stop-color="#b98f5f"/></linearGradient>' +
      '<radialGradient id="luz" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
    var comp = '<g transform="translate(200 12)"><circle r="6.4" fill="#fff" stroke="#1a1a1a" stroke-width=".6"/><path d="M0 -4L2.6 3L0 1.6L-2.6 3Z" fill="#1a1a1a"/><text y="-8.5" class="t2">N</text></g>';
    function svg(cls, cont, z, estilo) { return '<svg class="capa ' + cls + '" viewBox="' + VB + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="' + (z !== undefined ? "transform:translateZ(" + z + "px);" : "") + (estilo || "") + '">' + (cls === "c-piso" ? defs : "") + cont + '</svg>'; }
    return '<div class="p3d" role="img" aria-label="Plano de ' + t.nombre + ', con muebles"><div class="cuerpo">' +
      svg("c-piso", piso + oclu + R(X(0), Y(0), 200, 152, 'fill="url(#luz)"')) + extruir(svg, pared, "c-pared", 12, 8, 1.7, ["#0b0b0b", "#2a2a2a"], true) + extruir(svg, mue, "c-mueble", 26, 4, 1.6, null, false) + svg("c-etiq", etiq + comp, 44) + '</div></div>';
  }

  function fotoTipo(id) { var i = document.querySelector('#fotos-tipo img[data-t="' + id + '"]'); return i ? i.getAttribute('src') : ''; }
  function pintar() {
    [].forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.id === "tab-" + actual.id ? "true" : "false"); });
    $("plano").innerHTML = plano(actual); inclinar();
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
  var plana = false;
  function inclinar() { var p = $("plano").querySelector(".p3d"); if (p) p.dataset.plana = plana ? "1" : "0"; }
  var caja = $("plano").parentNode;
  if (!reducido) {
    caja.addEventListener("pointermove", function (e) {
      if (plana) return;
      var r = caja.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      caja.style.setProperty("--rx", (34 - py * 12).toFixed(1) + "deg"); caja.style.setProperty("--rz", (-14 + px * 16).toFixed(1) + "deg");
    });
    caja.addEventListener("pointerleave", function () { caja.style.removeProperty("--rx"); caja.style.removeProperty("--rz"); });
  }
  var bp = $("b-plana"); if (bp) bp.addEventListener("click", function () { plana = !plana; bp.setAttribute("aria-pressed", String(plana)); bp.textContent = plana ? "Vista 3D" : "Vista plana"; inclinar(); });
  pintar();

  /* ---- elegí tu piso ---- */
  (function () {
    var cont = $("torre"), lista = $("lista-piso"); if (!cont || !lista) return;
    var pisoSel = 9;
    var pisos = []; for (var i = 14; i >= 1; i--) pisos.push(i);
    function porPiso(p) { return UNIDADES.filter(function (u) { return u.piso === p; }); }
    function dibujar() {
      cont.innerHTML = pisos.map(function (p) {
        var us = porPiso(p), d = us.filter(function (u) { return u.estado === "disponible"; }).length;
        var ancho = p >= 13 ? 62 : 100 - (p % 2) * 4;
        return '<button type="button" class="piso" data-p="' + p + '" aria-pressed="' + (p === pisoSel) + '" style="--w:' + ancho + '%"><span class="n">' + (p < 10 ? "0" + p : p) + '</span><i></i><em>' + (d ? d + (d === 1 ? " disponible" : " disponibles") : "Sin disponibles") + '</em></button>';
      }).join("");
      var us = porPiso(pisoSel);
      $("t-piso").textContent = "Piso " + pisoSel;
      lista.innerHTML = us.map(function (u) {
        var t = TIPOS.filter(function (x) { return x.id === u.tipo; })[0], ok = u.estado === "disponible";
        return '<li><div><b>' + t.nombre + '</b><span>' + t.m2 + ' m², ' + t.ext.toLowerCase() + '</span></div><span class="est ' + u.estado + '">' + (ok ? "Disponible" : u.estado === "reservada" ? "Reservada" : "Vendida") + '</span>' + (ok ? '<button type="button" class="ver" data-t="' + t.id + '">Ver plano</button>' : "<span></span>") + '</li>';
      }).join("");
    }
    cont.addEventListener("click", function (e) { var b = e.target.closest(".piso"); if (!b) return; pisoSel = Number(b.dataset.p); dibujar(); });
    lista.addEventListener("click", function (e) { var b = e.target.closest(".ver"); if (!b) return; actual = TIPOS.filter(function (x) { return x.id === b.dataset.t; })[0]; pintar(); $("unidades").scrollIntoView(); });
    dibujar();
  })();

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
