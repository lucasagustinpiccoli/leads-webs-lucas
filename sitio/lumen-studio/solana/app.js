/* Residencias Solana: unidades, planos, etapas y formulario. Todo lo que se muestra sale de los datos de abajo. */
(function () {
  "use strict";
  var WA = ""; // demo: sin número, WhatsApp abre para elegir un contacto
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
  /* número de departamento: piso * 10 + orden dentro del piso (no toca azar() ni el estado de cada unidad) */
  (function () { var c = {}; UNIDADES.forEach(function (u) { c[u.piso] = (c[u.piso] || 0) + 1; u.num = u.piso * 10 + c[u.piso]; }); })();
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
  /* ---- plano en tres capas, dibujado en metros reales: cada mueble tiene su medida, no se estira con el ambiente ---- */
  var K = 10;           // unidades por metro
  var WT = 2.0;         // espesor de pared (0,20 m)
  function f1(v) { return (v * K).toFixed(1); }
  function RR(x, y, w, h, att, r) { return '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '"' + (r ? ' rx="' + f1(r) + '"' : "") + " " + att + "/>"; }
  function CC(cx, cy, r, att) { return '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r) + '" ' + att + "/>"; }
  var MAD = 'fill="url(#gMadera)" stroke="#8f7048" stroke-width=".35"';
  var TEL = 'fill="url(#gTela)" stroke="#b9ae9b" stroke-width=".35"';
  var TELO = 'fill="url(#gTelaO)" stroke="#a89c88" stroke-width=".35"';
  var BLA = 'fill="url(#gBlanco)" stroke="#bfc4c6" stroke-width=".35"';
  var ACE = 'fill="url(#gAcero)" stroke="#8d969b" stroke-width=".3"';

  function planta(cx, cy, r) {
    var s = CC(cx, cy, r * 1.05, 'fill="#3f5a38" fill-opacity=".35"');
    for (var i = 0; i < 8; i++) { var a = i * .785 + .3, rr = r * (0.55 + (i % 3) * .18); s += '<ellipse cx="' + f1(cx + Math.cos(a) * rr * .55) + '" cy="' + f1(cy + Math.sin(a) * rr * .55) + '" rx="' + f1(r * .55) + '" ry="' + f1(r * .2) + '" transform="rotate(' + (a * 57.3).toFixed(0) + " " + f1(cx + Math.cos(a) * rr * .55) + " " + f1(cy + Math.sin(a) * rr * .55) + ')" fill="' + (i % 2 ? "#6f9060" : "#88aa76") + '"/>'; }
    return s + CC(cx, cy, r * .16, 'fill="#46623c"');
  }
  function alfombra(x, y, w, h, c) { return RR(x, y, w, h, 'data-rug="1" fill="' + (c || "#d8d0c0") + '"', .05) + RR(x, y, w, h, 'data-rug="1" filter="url(#tejido)"', .05) + RR(x + .06, y + .06, w - .12, h - .12, 'data-rug="1" fill="none" stroke="#b9ae9b" stroke-width=".4"', .04); }
  function giro(s, x, y, w, h) { return '<g transform="rotate(180 ' + f1(x + w / 2) + " " + f1(y + h / 2) + ')">' + s + "</g>"; }
  function silla(cx, cy, d, giro) { /* silla vista desde arriba: asiento 0,45 y respaldo */ var a = 0.45;
    return '<g transform="rotate(' + (giro || 0) + " " + f1(cx) + " " + f1(cy) + ')">' + RR(cx - a / 2, cy - a / 2, a, a, TEL, .08) + RR(cx - a / 2, cy + a / 2 - .04, a, .1, MAD, .04) + "</g>"; }
  function sofa(x, y, w, d) { /* sofá de 3 cuerpos, w largo, d profundo (frente hacia arriba) */
    var s = RR(x, y, w, d, TEL, .12) + RR(x, y, w, .26, TELO, .1);
    s += RR(x, y + .06, .22, d - .06, TELO, .1) + RR(x + w - .22, y + .06, .22, d - .06, TELO, .1);
    var n = w > 1.7 ? 3 : 2, aw = (w - .5) / n;
    for (var i = 0; i < n; i++) s += RR(x + .25 + i * aw + .02, y + .3, aw - .04, d - .38, TEL, .08);
    s += RR(x + .3, y + .3, .42, .3, 'fill="#c9b79a" stroke="#a89476" stroke-width=".3"', .07) + RR(x + w - .72, y + .3, .42, .3, 'fill="#9aa59b" stroke="#7d887e" stroke-width=".3"', .07);
    return s;
  }
  function mesaRedonda(cx, cy, d, sillas) {
    var s = "", i, r = d / 2 + .38;
    for (i = 0; i < sillas; i++) { var a = (i / sillas) * 6.283 + .4; s += silla(cx + Math.cos(a) * r, cy + Math.sin(a) * r, .45, a * 57.3 + 90); }
    return s + CC(cx, cy, d / 2, MAD) + CC(cx, cy, d / 2 * .72, 'fill="none" stroke="#a98a60" stroke-width=".3"') + planta(cx, cy, .15);
  }
  function cama(x, y, w, l) { /* x,y esquina sup. izquierda; cabecera arriba */
    var s = RR(x - .04, y - .05, w + .08, l + .1, 'fill="#5b4631"', .06);
    s += RR(x, y, w, l, 'fill="#fbfaf6" stroke="#cdc6b8" stroke-width=".35"', .06);
    var pw = (w - .3) / 2; s += RR(x + .1, y + .12, pw, .42, 'fill="#ffffff" stroke="#d6d0c4" stroke-width=".3"', .1) + RR(x + .2 + pw, y + .12, pw, .42, 'fill="#ffffff" stroke="#d6d0c4" stroke-width=".3"', .1);
    s += RR(x, y + l * .42, w, l * .58, 'fill="url(#gManta)" stroke="#c9bda8" stroke-width=".35"', .05);
    s += RR(x, y + l * .42, w, .12, 'fill="#fbfaf6" fill-opacity=".85"') + RR(x + w * .2, y + l * .62, w * .6, .3, 'fill="#e6dccb" stroke="#cdbf9f" stroke-width=".3"', .06);
    return s;
  }
  function velador(x, y) { return RR(x, y, .45, .4, MAD, .04) + CC(x + .225, y + .2, .09, 'fill="#fbf1d2" stroke="#d4c28a" stroke-width=".25"'); }
  function dormM(x, y, w, h, tamano) {
    var bw = tamano === "king" ? 1.8 : (w >= 3.8 ? 1.6 : 1.4), bl = 2.0, bx = x + (w - bw) / 2, by = y + .12;
    if (w < 3.4) bx = x + (w - bw) / 2 + .25;
    var s = alfombra(bx - .5, by + .7, bw + 1.0, bl - .2 > h - .9 ? h - 1.0 : bl, "#d6cdb9");
    s += cama(bx, by, bw, bl) + velador(bx - .52, by + .05) + (w >= 3.4 ? velador(bx + bw + .07, by + .05) : "");
    if (w >= 3.8 && h >= 3.2) s += RR(x + w - .62, y + h - 2.2, .52, 2.0, MAD, .03) + RR(x + w - .5, y + h - 2.1, .02, 1.8, 'fill="none" stroke="#8f7048" stroke-width=".25"');
    return s + planta(x + .32, y + .3, .2);
  }
  function livingM(x, y, w, h, tipo) {
    /* sofá arriba (bajo la ventana) para dejar libres las puertas y aberturas de abajo y de los costados */
    var sx = x + (w < 5.2 ? (tipo === "dos" ? 1.7 : .8) : 1.2), sy = y + .14, s = alfombra(sx - .3, sy + .5, 2.9, 2.0, "#d9d2c3");
    s += sofa(sx, sy, 2.2, .95);
    s += RR(sx + .6, sy + 1.25, 1.0, .6, MAD, .06) + RR(sx + .72, sy + 1.32, .36, .26, 'fill="#fff" stroke="#cfc6b6" stroke-width=".3"', .04) + CC(sx + 1.3, sy + 1.55, .08, 'fill="#e9e3d6" stroke="#cfc6b6" stroke-width=".25"');
    if (tipo === "dos") s += '<g transform="rotate(-8 ' + f1(x + 1.2) + " " + f1(y + 2.9) + ')">' + RR(x + .75, y + 2.45, .85, .85, TEL, .3) + RR(x + .75, y + 3.2, .85, .15, TELO, .07) + "</g>";
    if (tipo === "tres") s += mesaRedonda(x + w - 1.45, y + 2.75, 1.1, 4);
    if (tipo === "pent") s += mesaRedonda(x + 4.5, y + 4.2, 1.2, 6) + '<g transform="rotate(-10 ' + f1(x + 4.6) + " " + f1(y + 1.6) + ')">' + RR(x + 4.2, y + 1.2, .85, .85, TEL, .3) + RR(x + 4.2, y + 1.95, .85, .15, TELO, .07) + "</g>";
    return s + (tipo === "dos" ? "" : planta(x + .32, y + .32, .25)) + (tipo === "tres" ? "" : planta(x + w - .3, y + .3, .22));
  }
  function estarDorm(x, y, w, h) { /* monoambiente: dormitorio arriba, estar abajo */
    var bw = 1.6, bx = x + w - bw - .95;
    var s = alfombra(bx - .4, y + .9, bw + .8, 1.85, "#d6cdb9") + cama(bx, y + .12, bw, 2.0) + velador(bx - .52, y + .17) + velador(bx + bw + .07, y + .17);
    var sy = y + h - 1.2, sx = x + .5;
    s += alfombra(x + .3, y + h - 3.0, w - .8, 2.1, "#d9d2c3") + sofa(sx, sy, 2.0, .95) + RR(sx + .5, sy - .85, .95, .55, MAD, .06) + CC(x + w - 1.1, y + h - 1.9, .38, TEL) + planta(x + .3, y + .3, .25);
    return s + planta(x + w - .3, y + 2.6, .22);
  }
  function cocinaM(x, y, w, h) {
    var s = RR(x + .08, y + .08, w - .16, .6, 'fill="url(#gBlanco)" stroke="#bfc4c6" stroke-width=".35"', .03);
    var fr = .7; s += RR(x + w - .08 - fr, y + .08, fr, .7, ACE, .04) + RR(x + w - .08 - fr + .05, y + .13, fr - .1, .06, 'fill="#6e777c"');
    var hx = x + .5;
    [[0, 0], [.34, 0], [0, .3], [.34, .3]].forEach(function (p, i) { s += CC(hx + p[0] + .2, y + .26 + p[1] * .6 + .0, i % 3 ? .08 : .11, 'fill="#252a2d" stroke="#555" stroke-width=".2"'); });
    s += RR(x + w * .5 - .1, y + .16, Math.max(.5, w * .26), .42, ACE, .05) + RR(x + w * .5 + .02, y + .24, Math.max(.5, w * .26) - .24, .26, 'fill="#aeb7bb" stroke="#80898e" stroke-width=".25"', .04) + CC(x + w * .5 + .12 + Math.max(.5, w * .26) - .24, y + .37, .03, 'fill="#555"');
    if (h >= 3.0) { s += RR(x + .08, y + .68, .6, Math.min(h - 1.0, 1.9), 'fill="url(#gBlanco)" stroke="#bfc4c6" stroke-width=".35"', .03); }
    return s;
  }
  function banoM(x, y, w, h) {
    var tl = Math.min(1.7, w - .3), s = RR(x + .08, y + .08, tl, .78, 'fill="url(#gBlanco)" stroke="#bfc4c6" stroke-width=".4"', .3) + RR(x + .2, y + .18, tl - .24, .58, 'fill="#e9eef0" stroke="#d3dadd" stroke-width=".3"', .26) + CC(x + .45, y + .47, .05, 'fill="#9ca3a7"');
    var ty = y + h - 1.05;
    s += RR(x + .25, ty, .4, .24, BLA, .05) + '<ellipse cx="' + f1(x + .45) + '" cy="' + f1(ty + .55) + '" rx="' + f1(.2) + '" ry="' + f1(.3) + '" fill="url(#gBlanco)" stroke="#bfc4c6" stroke-width=".35"/>';
    var vx = x + w - .85; s += RR(vx, y + h - .62, .7, .5, 'fill="url(#gMadera)" stroke="#8f7048" stroke-width=".35"', .04) + RR(vx + .12, y + h - .56, .46, .34, 'fill="#fff" stroke="#c4c9cb" stroke-width=".3"', .1) + CC(vx + .35, y + h - .39, .035, 'fill="#8d969b"');
    return s;
  }
  function escrM(x, y, w, h) {
    var dw = Math.min(1.7, w - 1.0), dx = x + (w - dw) / 2, s = RR(x + w - .52, y + .12, .4, Math.min(h - .3, 2.2), MAD, .03);
    s += alfombra(dx - .2, y + .9, dw + .4, 1.4, "#d9d2c3") + RR(dx, y + .1, dw, .72, MAD, .04) + RR(dx + dw / 2 - .3, y + .17, .6, .04, 'fill="#1f2326"') + RR(dx + dw / 2 - .26, y + .21, .52, .3, 'fill="#2a2f33" stroke="#555" stroke-width=".2"', .02) + RR(dx + .2, y + .3, .34, .24, 'fill="#fdf8e9" stroke="#d6cdb4" stroke-width=".2"') + silla(dx + dw / 2, y + 1.2, .5, 180);
    return s + planta(x + .3, y + h - .3, .24);
  }
  function vestM(x, y, w, h) { return RR(x + .1, y + .1, w - .2, .55, MAD, .03) + RR(x + w - .65, y + .65, .55, h - .75, MAD, .03) + RR(x + .1, y + h - .65, w - .85, .55, MAD, .03) + CC(x + w / 2 - .2, y + h / 2, .0, 'fill="none"'); }
  function pasilloM(x, y, w, h) { var s = planta(x + w - .3, y + h - .3, .2); if (w > h && w > 2.6) s += RR(x + 1.0, y + h / 2 - .25, w - 2.4, .5, 'data-rug="1" fill="#d9d2c3"', .04); return s; }
  function mueble(n, x, y, w, h) {
    n = n.toLowerCase();
    if (n.indexOf("pasillo") > -1) return pasilloM(x, y, w, h);
    if (n.indexOf("vestidor") > -1) return vestM(x, y, w, h);
    if (n.indexOf("dormitorio") > -1 && w < 3.4) return giro(dormM(x, y, w, h, ""), x, y, w, h);
    if (n.indexOf("cocina") > -1) return giro(cocinaM(x, y, w, h), x, y, w, h);
    if (n.indexOf("estar") > -1) return estarDorm(x, y, w, h);
    if (n.indexOf("living") > -1) return livingM(x, y, w, h, tipoActual);
    if (n.indexOf("baño") > -1) return (tipoActual === "dos" || tipoActual === "tres") ? giro(banoM(x, y, w, h), x, y, w, h) : banoM(x, y, w, h);
    if (n.indexOf("escritorio") > -1) return escrM(x, y, w, h);
    return dormM(x, y, w, h, n.indexOf("suite") > -1 ? "king" : "");
  }

  var GEO = {
    mono: { W: 7.0, H: 5.4, rooms: [["Estar y dormitorio", 0, 0, 4.4, 5.4], ["Baño", 4.4, 0, 2.6, 2.4], ["Cocina", 4.4, 2.4, 2.6, 3.0]], bal: [-1.2, 0.6, 1.2, 4.2],
      ven: [[0.6, 0, 1.8, "h"], [2.6, 0, 1.2, "h"], [5.2, 0, 1.2, "h"], [7.0, 3.0, 1.4, "v"]],
      pu: [[0, 1.2, 1.8, "v", 0], [3.0, 5.4, 0.9, "h", -1], [4.4, 1.5, 0.8, "v", -1], [4.4, 3.0, 1.2, "v", 0]] },
    dos: { W: 9.0, H: 6.9, rooms: [["Living", 0, 0, 4.8, 4.3], ["Cocina", 0, 4.3, 2.4, 2.6], ["Baño", 2.4, 4.3, 2.4, 2.6], ["Escritorio", 4.8, 0, 4.2, 2.6], ["Dormitorio", 4.8, 2.6, 4.2, 4.3]], bal: [-1.7, 0, 1.7, 4.3],
      ven: [[2.4, 0, 2.2, "h"], [5.6, 0, 2.6, "h"], [9.0, 0.5, 1.6, "v"], [9.0, 3.4, 2.4, "v"], [5.6, 6.9, 2.6, "h"]],
      pu: [[0, 1.0, 1.9, "v", 0], [0.5, 0, 0.9, "h", 1], [4.8, 1.2, 0.8, "v", -1], [4.8, 3.2, 0.8, "v", -1], [3.0, 4.3, 0.8, "h", -1], [0.3, 4.3, 1.6, "h", 0]] },
    tres: { W: 11.0, H: 8.5, rooms: [["Living", 0, 0, 5.0, 4.8], ["Cocina", 0, 4.8, 2.8, 3.7], ["Baño", 2.8, 4.8, 2.2, 3.7], ["Dormitorio 1", 5.0, 0, 6.0, 3.4], ["Pasillo", 5.0, 3.4, 6.0, 1.1], ["Dormitorio 2", 5.0, 4.5, 3.0, 4.0], ["Dormitorio 3", 8.0, 4.5, 3.0, 4.0]], bal: [-2.5, 0, 2.5, 4.8],
      ven: [[0.5, 0, 2.6, "h"], [5.8, 0, 4.4, "h"], [11.0, 0.8, 1.8, "v"], [11.0, 5.4, 1.8, "v"], [5.6, 8.5, 2.0, "h"], [8.4, 8.5, 2.0, "h"], [0, 5.6, 1.4, "v"]],
      pu: [[0, 1.2, 2.0, "v", 0], [3.9, 0, 0.9, "h", 1], [5.0, 3.5, 0.9, "v", 0], [6.0, 3.4, 0.8, "h", -1], [5.2, 4.5, 0.8, "h", 1], [9.2, 4.5, 0.8, "h", 1], [3.4, 4.8, 0.8, "h", -1], [0.4, 4.8, 1.6, "h", 0]] },
    pent: { W: 13.0, H: 11.4, rooms: [["Living", 0, 0, 6.4, 6.0], ["Cocina", 0, 6.0, 3.4, 5.4], ["Baño", 3.4, 6.0, 3.0, 5.4], ["Pasillo", 6.4, 0, 1.2, 11.4], ["Suite", 7.6, 0, 3.4, 5.6], ["Baño en suite", 11.0, 0, 2.0, 3.4], ["Vestidor", 11.0, 3.4, 2.0, 2.2], ["Escritorio", 7.6, 5.6, 5.4, 2.4], ["Dormitorio", 7.6, 8.0, 5.4, 3.4]], bal: [-6.7, 0, 6.7, 6.0],
      ven: [[0.8, 0, 4.8, "h"], [8.2, 0, 4.0, "h"], [13.0, 0.8, 1.8, "v"], [13.0, 6.0, 1.6, "v"], [13.0, 8.8, 1.8, "v"], [8.4, 11.4, 3.6, "h"]],
      pu: [[0, 1.4, 3.6, "v", 0], [4.6, 0, 0.9, "h", 1], [6.4, 2.0, 1.0, "v", 0], [7.6, 4.0, 0.8, "v", 1], [11.0, 2.55, 0.8, "v", -1], [11.0, 4.1, 0.8, "v", -1], [7.6, 6.5, 0.8, "v", 1], [7.6, 9.4, 0.8, "v", 1], [6.4, 7.0, 0.8, "v", -1], [0.5, 6.0, 1.8, "h", 0]] }
  };

  var tipoActual = "";
  function plano(t, opts) {
    tipoActual = t.id;
    var g = GEO[t.id], piso = "", pared = "", mue = "", etiq = "", oclu = "", n = 0;
    var b = g.bal, minx = Math.min(0, b[0]), maxx = Math.max(g.W, b[0] + b[2]), miny = 0, maxy = g.H;
    var vw0 = (Math.max(g.W, b[0] + b[2]) - Math.min(0, b[0]) + 2) * K, fs = vw0 * 0.0185, fm = fs / K;
    g.rooms.forEach(function (a) {
      var nom = a[0], x = a[1], y = a[2], w = a[3], h = a[4], bano = nom.toLowerCase().indexOf("baño") > -1, coc = nom.toLowerCase().indexOf("cocina") > -1;
      piso += RR(x, y, w, h, 'fill="url(#' + (bano ? "baldosa" : coc ? "ceramico" : "madera") + ')"') + ((bano || coc) ? "" : RR(x, y, w, h, 'filter="url(#grano)"'));
      oclu += '<clipPath id="cp' + n + '"><rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '"/></clipPath><g clip-path="url(#cp' + n + ')">' + RR(x, y, w, h, 'fill="none" stroke="#000" stroke-opacity=".42" stroke-width="7" filter="url(#difuso)"') + "</g>"; n++;
      pared += RR(x, y, w, h, 'fill="none" stroke="currentColor" stroke-width="' + WT + '" stroke-linejoin="miter"');
      mue += mueble(nom, x, y, w, h);
      var m2 = Math.round(w * h), l = nom.toLowerCase(), alto = l.indexOf("living") > -1 || l.indexOf("estar") > -1, tx = l.indexOf("estar") > -1 ? x + 1.9 : (l.indexOf("living") > -1 ? x + Math.min(2.2, w / 2) : x + w / 2), ty = l.indexOf("estar") > -1 ? y + 2.8 : (l.indexOf("living") > -1 ? y + h - .5 : (l.indexOf("baño") > -1 && (t.id === "dos" || t.id === "tres") ? y + h / 2 + .3 : y + h - .5)), lab = nom.replace(" en suite", ""), ancho = lab.length * fm * .6 + fm * 2.2;
      if (l.indexOf("pasillo") > -1 && w < 2.2) return;
      etiq += RR(tx - ancho / 2, ty - fm * 1.25, ancho, fm * 2.9, 'fill="#fff" fill-opacity=".93" stroke="#d8d4cb" stroke-width=".2"', fm * .6) + '<text x="' + f1(tx) + '" y="' + f1(ty) + '" class="t1">' + lab + '</text><text x="' + f1(tx) + '" y="' + f1(ty + fm * 1.2) + '" class="t2">' + m2 + " m²</text>";
    });
    var hot = "";
    if (opts && opts.hot) { var hi = 0; g.rooms.forEach(function (a) { if (/pasillo/i.test(a[0])) return; var cx = a[1] + a[3] / 2, cy = a[2] + a[4] / 2; hot += '<g class="hs" data-i="' + hi + '" style="--k:' + hi + '"><circle class="hh" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(.62) + '"/><circle class="hd" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(.27) + '"/><text x="' + f1(cx) + '" y="' + f1(cy) + '">' + (hi + 1 < 10 ? "0" : "") + (hi + 1) + "</text></g>"; hi++; }); }
    // exterior
    piso += RR(b[0], b[1], b[2], b[3], 'fill="url(#deck)"');
    pared += RR(b[0], b[1], b[2], b[3], 'fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="3 2"');
    var vert = b[3] > b[2], cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
    if (vert) {
      var ty0 = b[1] + b[3] * .8;
      mue += planta(cx, b[1] + .32, .26) + CC(cx, ty0, .4, MAD) + (b[2] >= 2 ? silla(cx - .9, ty0, .45, 90) + silla(cx + .9, ty0, .45, 270) : planta(cx, b[1] + b[3] - .3, .24));
    } else {
      mue += planta(b[0] + .45, b[1] + .45, .3) + planta(b[0] + .45, b[1] + b[3] - .45, .3) + CC(cx, cy, .5, MAD) + silla(cx - 1.0, cy, .45, 90) + silla(cx + 1.0, cy, .45, 270) + silla(cx, cy - 1.0, .45, 180);
    }
    etiq += '<text x="' + f1(b[0] + b[2] / 2) + '" y="' + f1(b[1] + b[3] + .7) + '" class="t2">' + t.ext.split(" de ")[0].replace(/^(\S+)\s.*$/, "$1").replace("Balcón", "Balcón").replace("Terraza", "Terraza") + ", " + Math.round(b[2] * b[3]) + " m²</text>";
    if (vert) maxy = Math.max(maxy, b[1] + b[3]);
    // ventanas y puertas
    var fin = "";
    g.ven.forEach(function (v) {
      var x = v[0], y = v[1], L = v[2], h = v[3] === "h";
      pared += (h ? RR(x, y - .13, L, .26, 'fill="#dbeaf0" stroke="currentColor" stroke-width=".4"') + '<line x1="' + f1(x) + '" y1="' + f1(y) + '" x2="' + f1(x + L) + '" y2="' + f1(y) + '" stroke="#7d9aa5" stroke-width=".5"/>'
        : RR(x - .13, y, .26, L, 'fill="#dbeaf0" stroke="currentColor" stroke-width=".4"') + '<line x1="' + f1(x) + '" y1="' + f1(y) + '" x2="' + f1(x) + '" y2="' + f1(y + L) + '" stroke="#7d9aa5" stroke-width=".5"/>');
    });
    g.pu.forEach(function (p) {
      var x = p[0], y = p[1], L = p[2], h = p[3] === "h", s = p[4];
      pared += h ? RR(x, y - .1, L, .2, 'fill="#e6d6b8"') : RR(x - .1, y, .2, L, 'fill="#e6d6b8"');
      if (!s) return;
      if (h) fin += '<path d="M ' + f1(x + L) + " " + f1(y) + " A " + f1(L) + " " + f1(L) + " 0 0 " + (s === 1 ? 1 : 0) + " " + f1(x) + " " + f1(y + s * L) + '" fill="none" stroke="#6b665c" stroke-width=".3"/><line x1="' + f1(x) + '" y1="' + f1(y) + '" x2="' + f1(x) + '" y2="' + f1(y + s * L) + '" stroke="#3a3731" stroke-width=".6"/>';
      else fin += '<path d="M ' + f1(x) + " " + f1(y + L) + " A " + f1(L) + " " + f1(L) + " 0 0 " + (s === 1 ? 0 : 1) + " " + f1(x + s * L) + " " + f1(y) + '" fill="none" stroke="#6b665c" stroke-width=".3"/><line x1="' + f1(x) + '" y1="' + f1(y) + '" x2="' + f1(x + s * L) + '" y2="' + f1(y) + '" stroke="#3a3731" stroke-width=".6"/>';
    });
    mue += '<g class="fin">' + fin + "</g>";
    window.__dbg = window.__dbg || {}; window.__dbg[t.id] = { pu: g.pu, K: K };
    var pad = 1.0, vx = (minx - pad) * K, vy = (miny - pad - 1.2) * K, vw = (maxx - minx + 2 * pad) * K, vh = (maxy - miny + 2 * pad + 1.2 + (vert ? 0.2 : 1.6)) * K;
    var VB = vx.toFixed(0) + " " + vy.toFixed(0) + " " + vw.toFixed(0) + " " + vh.toFixed(0);
    var defs = '<defs><pattern id="madera" width="14" height="1.4" patternUnits="userSpaceOnUse"><rect width="14" height="1.4" fill="#e3cfa9"/><path d="M0 0H14" stroke="#c9b189" stroke-width=".22"/><path d="M5 0V1.4M11 0V1.4" stroke="#d3be99" stroke-width=".16"/></pattern>' +
      '<pattern id="baldosa" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#ece9e2"/><path d="M0 0H6V6" fill="none" stroke="#d9d4c8" stroke-width=".3"/></pattern>' +
      '<pattern id="ceramico" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#d9d6cf"/><path d="M0 0H6V6" fill="none" stroke="#c4c0b6" stroke-width=".3"/></pattern>' +
      '<pattern id="deck" width="12" height="2" patternUnits="userSpaceOnUse"><rect width="12" height="2" fill="#d6d2c8"/><path d="M0 0H12" stroke="#bfbaae" stroke-width=".3"/></pattern>' +
      '<filter id="sombra" x="-6%" y="-6%" width="112%" height="118%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.2" flood-color="#2a1d0e" flood-opacity=".4"/></filter>' +
      '<filter id="difuso" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter>' +
      '<filter id="grano" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.9" numOctaves="2" seed="7" result="r"/><feColorMatrix in="r" type="matrix" values="0 0 0 0 .42  0 0 0 0 .27  0 0 0 0 .12  0 0 0 .9 -.34"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<filter id="tejido" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3" result="r"/><feColorMatrix in="r" type="matrix" values="0 0 0 0 .3  0 0 0 0 .27  0 0 0 0 .22  0 0 0 .8 -.28"/><feComposite in2="SourceGraphic" operator="in"/></filter>' +
      '<linearGradient id="gTela" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfbf7"/><stop offset="1" stop-color="#e2d9c8"/></linearGradient>' +
      '<linearGradient id="gTelaO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e1d1"/><stop offset="1" stop-color="#cfc4ae"/></linearGradient>' +
      '<linearGradient id="gManta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2d6bf"/><stop offset="1" stop-color="#cdbf9f"/></linearGradient>' +
      '<linearGradient id="gMadera" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9b88c"/><stop offset="1" stop-color="#b58a58"/></linearGradient>' +
      '<linearGradient id="gBlanco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3e6e7"/></linearGradient>' +
      '<linearGradient id="gAcero" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d3d9dc"/><stop offset=".5" stop-color="#f1f4f5"/><stop offset="1" stop-color="#b9c1c5"/></linearGradient>' +
      '<radialGradient id="luz" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>';
    var comp = '<g transform="translate(' + f1(maxx + .2) + " " + f1(miny - .2) + ')"><circle r="7" fill="#fff" stroke="#1a1a1a" stroke-width=".6"/><path d="M0 -4.4L2.8 3.2L0 1.7L-2.8 3.2Z" fill="#1a1a1a"/><text y="-9.4" class="t2">N</text></g>';
    function svg(cls, cont, z, estilo) { return '<svg class="capa ' + cls + '" viewBox="' + VB + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="--fs:' + fs.toFixed(2) + ';' + (z !== undefined ? "transform:translateZ(" + z + "px);" : "") + (estilo || "") + '">' + (cls === "c-piso" ? defs : "") + cont + "</svg>"; }
    return '<div class="p3d" role="img" aria-label="Plano de ' + t.nombre + ', con muebles"><div class="cuerpo">' +
      svg("c-piso", piso + oclu + RR(minx, miny, maxx - minx, maxy - miny, 'fill="url(#luz)"')) + extruir(svg, pared, "c-pared", 12, 8, 1.7, ["#0b0b0b", "#2a2a2a"], true) + extruir(svg, mue, "c-mueble", 26, 4, 1.6, null, false) + svg("c-etiq", etiq + comp, 44) + (opts && opts.hot ? svg("c-hot", hot, 60) : "") + "</div></div>";
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

  /* ---- elegí tu piso: la torre es la interfaz ----
     CÓMO CALIBRAR: abrí la página con ?calibrar=1 (por ejemplo solana/?calibrar=1#pisos). Cada piso se dibuja con borde rojo y su número.
       Los valores salen de BANDAS, un arreglo en porcentajes de la imagen: {p: piso, t: top %, h: alto %, l: izquierda %, w: ancho %}.
       Con la torre dibujada en SVG ya coinciden; si cambiás la imagen, ajustá esos números hasta que cada banda cubra su piso.
     CÓMO CAMBIAR LA IMAGEN: poné la ruta de una foto vertical de la torre completa en TORRE_IMG (por ejemplo "img/torre.jpg").
       Si queda vacía se usa la torre dibujada en SVG (placeholder). Después recalibrá BANDAS.
     PRECIOS DE LA TARJETA: "Desde USD" es el precio más bajo entre las unidades DISPONIBLES de ese piso; sale de TIPOS[x].precio. Si no hay disponibles no se muestra precio. */
  (function () {
    var host = $("te-edificio"), te = $("te"), sec = $("pisos"); if (!host || !te || !sec) return;
    var TORRE_IMG = "";
    var calibrar = /[?&]calibrar=1/.test(location.search);
    var ES = function (v) { return Math.round(v * 100) / 100; };
    var VBW = 440, VBH = 1040, FH = 62, TOP = 96, X0 = 100, X1 = 340, PX0 = 124, PX1 = 316;
    function yTop(p) { return TOP + (14 - p) * FH; }
    var BANDAS = [];
    for (var q = 1; q <= 14; q++) { var a = q >= 13 ? PX0 - 24 : X0 - 8, b = q >= 13 ? PX1 + 24 : X1 + 8; BANDAS.push({ p: q, t: ES(yTop(q) / VBH * 100), h: ES(FH / VBH * 100), l: ES(a / VBW * 100), w: ES((b - a) / VBW * 100) }); }

    /* ---- datos por piso (salen de UNIDADES y TIPOS, una sola fuente) ---- */
    var tipoDe = function (id) { return TIPOS.filter(function (x) { return x.id === id; })[0]; };
    function datos(p) {
      var us = UNIDADES.filter(function (u) { return u.piso === p; }), li = us.filter(function (u) { return u.estado === "disponible"; });
      var desde = li.length ? Math.min.apply(null, li.map(function (u) { return tipoDe(u.tipo).precio; })) : 0;
      var res = us.filter(function (u) { return u.estado === "reservada"; }).length;
      return { us: us, libres: li, desde: desde, estado: li.length ? "Disponible" : res ? "Reservado" : "Vendido" };
    }
    var dosd = function (n) { return (n < 10 ? "0" : "") + n; };
    var nombreBanda = function (p) { var d = datos(p).libres.length; return "Piso " + p + ", " + (d ? d + (d === 1 ? " unidad disponible" : " unidades disponibles") : "sin unidades disponibles"); };

    /* ---- la torre dibujada (placeholder hasta tener la foto) ---- */
    function torre() {
      var o = '<svg viewBox="0 0 ' + VBW + " " + VBH + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax meet"><defs>' +
        '<linearGradient id="te-hor" x1="0" x2="1"><stop offset="0" stop-color="#6c7075"/><stop offset=".45" stop-color="#a3a7ab"/><stop offset="1" stop-color="#5d6166"/></linearGradient>' +
        '<linearGradient id="te-vid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101215"/><stop offset="1" stop-color="#252a2f"/></linearGradient>' +
        '<linearGradient id="te-suelo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#25272b"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient>' +
        '<linearGradient id="te-lob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1eee7" stop-opacity=".95"/><stop offset="1" stop-color="#c9c5bb" stop-opacity=".8"/></linearGradient></defs>';
      // edificios vecinos (siluetas al fondo)
      var vec = [[0, 640, 46, 330], [40, 560, 38, 410], [350, 700, 40, 270], [386, 600, 54, 370]];
      vec.forEach(function (v, i) { o += '<rect x="' + v[0] + '" y="' + v[1] + '" width="' + v[2] + '" height="' + v[3] + '" fill="#121316"/>'; for (var k = 0; k < 14; k++) { var r = azar(i * 31 + k + 3); if (r > .45) o += '<rect x="' + (v[0] + 6 + (k % 3) * 11) + '" y="' + (v[1] + 12 + Math.floor(k / 3) * 22) + '" width="6" height="9" fill="#d9d6cf" opacity="' + (.25 + r * .3).toFixed(2) + '"/>'; } });
      // azotea y antena
      o += '<line x1="220" y1="22" x2="220" y2="' + (yTop(14) - 26) + '" stroke="#8a8e92" stroke-width="2"/><circle cx="220" cy="22" r="2.6" fill="#fff"/><rect x="186" y="' + (yTop(14) - 30) + '" width="68" height="22" fill="#55595e"/>';
      for (var p = 14; p >= 1; p--) {
        var t = yTop(p), pent = p >= 13, x0 = pent ? PX0 : X0, x1 = pent ? PX1 : X1, ancho = x1 - x0, vx = x0 + 10, vw = ancho - 20, n = pent ? 5 : 6, pw = vw / n;
        o += '<g class="te-p" data-p="' + p + '"><rect x="' + x0 + '" y="' + t + '" width="' + ancho + '" height="' + FH + '" fill="url(#te-hor)"/>';
        var gy = pent ? t + 8 : t + 12, gh = pent ? FH - 20 : 34;
        o += '<rect x="' + vx + '" y="' + gy + '" width="' + vw + '" height="' + gh + '" fill="url(#te-vid)"/><g class="te-lz">';
        for (var i = 0; i < n; i++) { var r = azar(p * 17 + i * 5 + 2); if (r > .28) o += '<rect x="' + (vx + i * pw + 1.5).toFixed(1) + '" y="' + (gy + 1.5) + '" width="' + (pw - 3).toFixed(1) + '" height="' + (gh - 3) + '" fill="#f2efe8" opacity="' + (.45 + r * .45).toFixed(2) + '"/>'; }
        o += '</g>';
        for (i = 1; i < n; i++) o += '<line x1="' + (vx + i * pw).toFixed(1) + '" y1="' + gy + '" x2="' + (vx + i * pw).toFixed(1) + '" y2="' + (gy + gh) + '" stroke="#000" stroke-opacity=".5" stroke-width="1.2"/>';
        var sx = x0 - 8, sw = ancho + 16;
        o += '<rect x="' + sx + '" y="' + (t + FH - 9) + '" width="' + sw + '" height="9" fill="#b4b7ba"/><rect x="' + sx + '" y="' + (t + FH) + '" width="' + sw + '" height="3" fill="#000" opacity=".4"/>';
        o += '<rect x="' + sx + '" y="' + (t + FH - 30) + '" width="' + sw + '" height="21" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/>';
        for (var px = sx + 16; px < sx + sw - 4; px += 32) o += '<line x1="' + px + '" y1="' + (t + FH - 30) + '" x2="' + px + '" y2="' + (t + FH - 9) + '" stroke="#fff" stroke-opacity=".28" stroke-width=".8"/>';
        o += '<rect x="' + x0 + '" y="' + t + '" width="' + ancho + '" height="1.5" fill="#fff" opacity=".2"/>';
        if (p === 13) o += '<rect x="' + X0 + '" y="' + (t + FH - 30) + '" width="' + (PX0 - X0) + '" height="30" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/><rect x="' + PX1 + '" y="' + (t + FH - 30) + '" width="' + (X1 - PX1) + '" height="30" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/>';
        if (p === 14) o += '<rect x="112" y="' + (t - 9) + '" width="216" height="9" fill="#b4b7ba"/><rect x="112" y="' + (t - 9) + '" width="216" height="2" fill="#fff" opacity=".35"/>';
        o += "</g>";
      }
      // planta baja y calle
      var base = yTop(1) + FH;
      o += '<rect x="0" y="' + (base + 40) + '" width="' + VBW + '" height="' + (VBH - base - 40) + '" fill="url(#te-suelo)"/><rect x="92" y="' + base + '" width="256" height="40" fill="#4c5055"/><rect x="108" y="' + (base + 6) + '" width="224" height="34" fill="url(#te-lob)"/><rect x="88" y="' + (base - 2) + '" width="264" height="7" fill="#b4b7ba"/>';
      for (i = 1; i < 6; i++) o += '<line x1="' + (108 + i * 37.3).toFixed(1) + '" y1="' + (base + 6) + '" x2="' + (108 + i * 37.3).toFixed(1) + '" y2="' + (base + 40) + '" stroke="#000" stroke-opacity=".4" stroke-width="1.2"/>';
      return o + "</svg>";
    }
    host.innerHTML = (TORRE_IMG ? '<img class="te-img" src="' + TORRE_IMG + '" alt="" decoding="async">' : torre()) + BANDAS.map(function (b) {
      return '<button type="button" class="te-banda" data-p="' + b.p + '" style="top:' + b.t + "%;height:" + b.h + "%;left:" + b.l + "%;width:" + b.w + '%" aria-label="' + nombreBanda(b.p) + '"><i></i><span class="te-bn">' + b.p + "</span></button>";
    }).join("");
    if (calibrar) te.classList.add("calibrar");
    var bandas = [].slice.call(host.querySelectorAll(".te-banda")), luces = [].slice.call(host.querySelectorAll(".te-lz"));
    bandas.forEach(function (b) { if (!datos(Number(b.dataset.p)).libres.length) b.classList.add("agotado"); });

    /* ---- entrada controlada por el scroll: la torre se acerca y se encienden las luces de abajo hacia arriba ---- */
    var fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
    $("te-hint").textContent = fino ? "Pasá el mouse por un piso" : "Tocá un piso";
    var eAct = -1, tick = false;
    function entrada() {
      var r = sec.getBoundingClientRect(), rango = r.height - innerHeight, prog = rango > 0 ? Math.max(0, Math.min(1, -r.top / rango)) : 1;
      var e = reducido ? 1 : Math.max(0, Math.min(1, prog / .35));
      if (Math.abs(e - eAct) > .002) {
        eAct = e; te.style.setProperty("--e", e.toFixed(3));
        luces.forEach(function (g, i) { var piso = Number(g.parentNode.dataset.p); g.style.opacity = reducido ? 1 : Math.max(0, Math.min(1, (e - .15 - (piso - 1) / 14 * .6) / .25)).toFixed(2); });
        te.classList.toggle("listo", e >= .999);
      }
      tick = false;
    }
    function pedir() { if (!tick) { tick = true; requestAnimationFrame(entrada); } }
    addEventListener("scroll", pedir, { passive: true }); addEventListener("resize", pedir); entrada();

    /* ---- tarjeta flotante (hover) ---- */
    var tarj = $("te-tarjeta"), linea = $("te-linea"), fach = $("te-fachada"), hovP = 0;
    function tarjeta(p, abierta) {
      var d = datos(p), nd = d.libres.length;
      tarj.innerHTML = '<div class="te-fila"><span class="te-k">Piso</span><span class="te-est' + (nd ? "" : " no") + '">' + (nd ? "Disponible" : d.estado) + '</span></div><p class="te-n">' + dosd(p) + "</p>" +
        '<p>' + (nd ? nd + " de " + d.us.length + (nd === 1 ? " disponible" : " disponibles") : "Sin unidades disponibles") + "</p>" + (nd ? '<p class="te-precio">Desde USD ' + fmt(d.desde) + "</p>" : "") +
        (nd ? '<p class="te-cta">' + "Tocá para ver las plantas" + '</p><button type="button" class="btn te-ver" data-ver="' + p + '">Ver plantas</button>' : '<p class="te-cta">Vendido</p>');
    }
    function ubicar(banda) {
      var f = fach.getBoundingClientRect(), r = banda.getBoundingClientRect(), cy = r.top + r.height / 2 - f.top;
      if (innerWidth <= 900) { tarj.style.transform = "none"; return; }
      var w = tarj.offsetWidth, h = tarj.offsetHeight, der = f.right - r.right > w + 100, x = der ? r.right - f.left + 72 : r.left - f.left - 72 - w, y = Math.max(84, Math.min(f.height - h - 24, cy - h / 2));
      tarj.style.left = x + "px"; tarj.style.top = "0px"; tarj.style.transform = "translateY(" + y + "px)";
      var y0 = der ? r.right - f.left : r.left - f.left - 72;
      linea.style.left = y0 + "px"; linea.style.top = cy + "px"; linea.style.width = "72px"; linea.style.transform = "none";
    }
    function mostrar(p) {
      if (!te.classList.contains("listo") && !calibrar) return;
      var banda = host.querySelector('.te-banda[data-p="' + p + '"]'); if (!banda) return;
      if (hovP !== p) { bandas.forEach(function (b) { b.classList.remove("on"); }); banda.classList.add("on"); tarjeta(p); hovP = p; }
      ubicar(banda); tarj.classList.add("on"); linea.classList.toggle("on", innerWidth > 900);
    }
    function ocultar() { hovP = 0; tarj.classList.remove("on"); linea.classList.remove("on"); bandas.forEach(function (b) { b.classList.remove("on"); }); }
    host.addEventListener("pointerover", function (e) { var b = e.target.closest(".te-banda"); if (b && e.pointerType !== "touch") mostrar(Number(b.dataset.p)); });
    host.addEventListener("pointerleave", function (e) { if (fino && te.dataset.vista === "fachada") ocultar(); });
    host.addEventListener("focusin", function (e) { var b = e.target.closest(".te-banda"); if (b) mostrar(Number(b.dataset.p)); });
    host.addEventListener("focusout", function (e) { if (fino && !host.contains(e.relatedTarget) && !tarj.contains(e.relatedTarget)) ocultar(); });
    host.addEventListener("keydown", function (e) {
      var b = e.target.closest(".te-banda"); if (!b) return;
      var i = bandas.indexOf(b), s = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
      if (s) { e.preventDefault(); var n = bandas[Math.max(0, Math.min(bandas.length - 1, i + s))]; n.focus(); }
    });
    host.addEventListener("click", function (e) {
      var b = e.target.closest(".te-banda"); if (!b) return;
      var p = Number(b.dataset.p), d = datos(p); if (!d.libres.length) { mostrar(p); return; }
      var teclado = e.detail === 0;
      if (fino || teclado) abrir(p); else if (hovP === p && tarj.classList.contains("on")) abrir(p); else mostrar(p);
    });
    tarj.addEventListener("click", function (e) { var v = e.target.closest("[data-ver]"); if (v) abrir(Number(v.dataset.ver)); });

    /* ---- vista B: planta del piso y ficha ---- */
    var sel = { p: 0, uid: 0 }, plana = false, zoomI = -1;
    var inn = $("te-plano-in"), ficha = $("te-ficha"), chips = $("te-chips"), planoBox = $("te-plano");
    function unico(h, pre) {
      var ids = []; h.replace(/ id="([^"]+)"/g, function (m, i) { ids.push(i); return m; });
      ids.forEach(function (i) { h = h.split(' id="' + i + '"').join(' id="' + pre + i + '"').split("url(#" + i + ")").join("url(#" + pre + i + ")"); });
      return h;
    }
    var geoAmb = function (t) { return GEO[t.id].rooms.filter(function (r) { return !/pasillo/i.test(r[0]); }); };
    function frase(t) {
      var amb = geoAmb(t).map(function (r) { return r[0].toLowerCase(); }), lista = amb.length > 1 ? amb.slice(0, -1).join(", ") + " y " + amb[amb.length - 1] : amb[0];
      return t.nombre + " de " + t.m2 + " m² cubiertos, con " + lista + ". " + t.ext + ".";
    }
    function unidad() { return UNIDADES.filter(function (u) { return u.piso === sel.p && u.num === sel.uid; })[0]; }
    function dibujar() {
      var u = unidad(), t = tipoDe(u.tipo), d = datos(sel.p), amb = geoAmb(t), ext = (t.ext.match(/(\d+)\s*m²/) || [0, ""])[1];
      zoomI = -1; inn.style.transform = ""; inn.innerHTML = unico(plano(t, { hot: true }), "te-"); plana = false; $("te-plana").setAttribute("aria-pressed", "false"); $("te-plana").textContent = "Vista plana";
      chips.innerHTML = d.libres.length > 1 ? d.libres.map(function (x) { var tt = tipoDe(x.tipo); return '<button type="button" data-u="' + x.num + '" aria-pressed="' + (x.num === sel.uid) + '">' + x.num + " · " + tt.nombre + " · " + tt.m2 + " m²</button>"; }).join("") : "";
      ficha.innerHTML = '<div class="te-sup"><span class="te-k">Piso ' + sel.p + '</span><span class="te-est">Disponible</span></div><h3 id="te-tit" tabindex="-1">Departamento ' + u.num + '</h3><p class="te-sub">' + t.nombre + "</p>" +
        '<div class="te-cif"><div><b>' + t.m2 + '</b><span>m² cubiertos</span></div><div><b>' + (ext || "-") + '</b><span>m² de ' + (t.id === "pent" ? "terraza" : "balcón") + '</span></div><div><b>' + amb.length + "</b><span>espacios</span></div></div>" +
        '<p class="te-precio">Desde USD ' + fmt(t.precio) + '</p><p class="te-desc">' + frase(t) + '</p><ol class="te-amb">' + amb.map(function (r, i) { return '<li data-i="' + i + '"><button type="button" data-i="' + i + '"><span>' + dosd(i + 1) + "</span><span>" + r[0] + "</span></button></li>"; }).join("") + "</ol>" +
        '<div class="te-acc"><button type="button" class="btn" id="te-consultar">Consultar esta unidad</button><button type="button" class="btn btn-borde" id="te-volver">Volver a la fachada</button></div>';
      $("te-consultar").addEventListener("click", function () {
        $("f-tipo").value = t.id; var nom = $("f-nombre").value.trim();
        irAWhatsApp((nom ? "¡Hola! Mi nombre es " + nom + "." : "¡Hola!") + " Quiero consultar por el departamento " + u.num + " (" + t.nombre.toLowerCase() + ", piso " + sel.p + ") en Solana. Muchas gracias.");
      });
      $("te-volver").addEventListener("click", volver);
    }
    function resaltar(i, on) {
      var g = inn.querySelector('.hs[data-i="' + i + '"]'), li = ficha.querySelector('.te-amb li[data-i="' + i + '"]');
      if (g) g.classList.toggle("on", on); if (li) li.classList.toggle("on", on);
    }
    function zoom(i) {
      var g = inn.querySelector('.hs[data-i="' + i + '"]'); if (!g) return;
      if (zoomI === i) { zoomI = -1; inn.style.transform = ""; return; }
      if (reducido) return;
      inn.style.transition = "none"; inn.style.transform = "none";
      var r = inn.getBoundingClientRect(), h = g.getBoundingClientRect(), ox = h.left + h.width / 2 - r.left, oy = h.top + h.height / 2 - r.top;
      inn.style.transformOrigin = ox + "px " + oy + "px"; void inn.offsetWidth; inn.style.transition = "";
      inn.style.transform = "translate(" + (r.width / 2 - ox).toFixed(0) + "px," + (r.height / 2 - oy).toFixed(0) + "px) scale(1.45)"; zoomI = i;
    }
    inn.addEventListener("pointerover", function (e) { var g = e.target.closest(".hs"); if (g) resaltar(g.dataset.i, true); });
    inn.addEventListener("pointerout", function (e) { var g = e.target.closest(".hs"); if (g) resaltar(g.dataset.i, false); });
    inn.addEventListener("click", function (e) { var g = e.target.closest(".hs"); if (g) zoom(Number(g.dataset.i)); });
    ficha.addEventListener("pointerover", function (e) { var b = e.target.closest("[data-i]"); if (b) resaltar(b.dataset.i, true); });
    ficha.addEventListener("pointerout", function (e) { var b = e.target.closest("[data-i]"); if (b) resaltar(b.dataset.i, false); });
    ficha.addEventListener("focusin", function (e) { var b = e.target.closest("button[data-i]"); if (b) resaltar(b.dataset.i, true); });
    ficha.addEventListener("focusout", function (e) { var b = e.target.closest("button[data-i]"); if (b) resaltar(b.dataset.i, false); });
    ficha.addEventListener("click", function (e) { var b = e.target.closest("button[data-i]"); if (b) zoom(Number(b.dataset.i)); });
    chips.addEventListener("click", function (e) { var b = e.target.closest("[data-u]"); if (!b) return; sel.uid = Number(b.dataset.u); dibujar(); });
    $("te-plana").addEventListener("click", function () { plana = !plana; this.setAttribute("aria-pressed", String(plana)); this.textContent = plana ? "Vista 3D" : "Vista plana"; var p3 = inn.querySelector(".p3d"); if (p3) p3.dataset.plana = plana ? "1" : "0"; });
    if (!reducido) {
      planoBox.addEventListener("pointermove", function (e) {
        if (plana || zoomI > -1) return;
        var r = planoBox.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        inn.style.setProperty("--rx", (34 - py * 12).toFixed(1) + "deg"); inn.style.setProperty("--rz", (-14 + px * 16).toFixed(1) + "deg");
      });
      planoBox.addEventListener("pointerleave", function () { inn.style.removeProperty("--rx"); inn.style.removeProperty("--rz"); });
    }

    /* ---- transición fachada <-> planta (800 ms, con transiciones CSS para poder volver a mitad de camino) ---- */
    var plantaEl = $("te-planta");
    function abrir(p) {
      var d = datos(p); if (!d.libres.length) return;
      sel.p = p; sel.uid = d.libres[0].num; dibujar();
      var banda = host.querySelector('.te-banda[data-p="' + p + '"]'), f = host.getBoundingClientRect(), r = banda.getBoundingClientRect();
      host.style.setProperty("--ox", ((r.left + r.width / 2 - f.left) / f.width * 100).toFixed(1) + "%"); host.style.setProperty("--oy", ((r.top + r.height / 2 - f.top) / f.height * 100).toFixed(1) + "%");
      ocultar(); te.dataset.vista = "planta"; plantaEl.setAttribute("aria-hidden", "false"); fach.setAttribute("inert", ""); plantaEl.removeAttribute("inert");
      setTimeout(function () { var t = $("te-tit"); if (t && te.dataset.vista === "planta") t.focus({ preventScroll: true }); }, reducido ? 0 : 500);
    }
    function volver() {
      te.dataset.vista = "fachada"; plantaEl.setAttribute("aria-hidden", "true"); plantaEl.setAttribute("inert", ""); fach.removeAttribute("inert");
      var b = host.querySelector('.te-banda[data-p="' + sel.p + '"]'); setTimeout(function () { if (b && te.dataset.vista === "fachada") b.focus({ preventScroll: true }); }, reducido ? 0 : 400);
    }
    plantaEl.setAttribute("inert", "");
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && te.dataset.vista === "planta") volver(); });
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
    ["#apertura", "#unidades", "#pisos", "#contacto", "footer"].forEach(function (s) { var el = document.querySelector(s); if (el) io.observe(el); });
  } else { barra.classList.add("ver"); }
})();
