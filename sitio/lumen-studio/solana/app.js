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
  function plano(t) {
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
      svg("c-piso", piso + oclu + RR(minx, miny, maxx - minx, maxy - miny, 'fill="url(#luz)"')) + extruir(svg, pared, "c-pared", 12, 8, 1.7, ["#0b0b0b", "#2a2a2a"], true) + extruir(svg, mue, "c-mueble", 26, 4, 1.6, null, false) + svg("c-etiq", etiq + comp, 44) + "</div></div>";
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
      var filas = pisos.map(function (p) {
        var us = porPiso(p), d = us.filter(function (u) { return u.estado === "disponible"; }).length, atico = p >= 13;
        var ven = us.map(function (u) { return '<i class="v ' + u.estado + '"></i>'; }).join("");
        return '<button type="button" class="piso' + (atico ? " atico" : "") + (p === 14 ? " ultimo" : "") + '" data-p="' + p + '" aria-pressed="' + (p === pisoSel) + '" aria-label="Piso ' + p + ', ' + (d ? d + (d === 1 ? " unidad disponible" : " unidades disponibles") : "sin unidades disponibles") + '"><span class="n">' + (p < 10 ? "0" + p : p) + '</span><span class="fach">' + ven + '</span></button>';
      }).join("");
      cont.innerHTML = '<div class="azotea" aria-hidden="true"><i class="antena"></i><i class="tanque"></i></div>' + filas + '<div class="pb" aria-hidden="true"><span class="n"></span><span class="base"><i class="toldo"></i><i class="vidrio"></i><i class="vidrio"></i><i class="puerta"></i><i class="vidrio"></i><i class="vidrio"></i></span></div><div class="vereda" aria-hidden="true"></div>';
      var us = porPiso(pisoSel);
      var dsp = us.filter(function (u) { return u.estado === "disponible"; }).length;
      $("t-piso").textContent = "Piso " + pisoSel;
      $("t-sub").textContent = dsp ? dsp + (dsp === 1 ? " unidad disponible" : " unidades disponibles") : "Sin unidades disponibles";
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
