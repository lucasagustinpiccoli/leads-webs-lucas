/* Halo Vista: captura interactiva del panel. Los números son de ejemplo y cambian con el período.
   Hay un gráfico de área con globo al pasar el cursor, mini gráficos por indicador, un embudo y estados que se pueden cambiar. Sin librerías. */
(function () {
  "use strict";
  var panel = document.getElementById("vista-panel");
  if (!panel) return;
  var DATOS = {
    "30": {
      visitas: 1842, consultas: 126, agendadas: 10, cerradas: 94, form: 22,
      semanas: [24, 29, 35, 38], canales: [46, 31, 15, 8],
      delta: { visitas: "+12%", consultas: "+18%", tasa: "+0,4 pp", cerradas: "+16%" },
      spark: { visitas: [410, 430, 470, 532], consultas: [24, 29, 35, 38], tasa: [5.9, 6.4, 7.1, 7.1], cerradas: [14, 19, 25, 36] }
    },
    "90": {
      visitas: 5310, consultas: 389, agendadas: 31, cerradas: 290, form: 68,
      semanas: [21, 24, 26, 30, 28, 33, 35, 31, 38, 41, 44, 38], canales: [41, 36, 15, 8],
      delta: { visitas: "+9%", consultas: "+14%", tasa: "+0,3 pp", cerradas: "+12%" },
      spark: { visitas: [380, 395, 410, 420, 400, 440, 452, 430, 470, 490, 505, 520], consultas: [21, 24, 26, 30, 28, 33, 35, 31, 38, 41, 44, 38], tasa: [5.5, 6.1, 6.3, 7.1, 7, 7.5, 7.7, 7.2, 8.1, 8.4, 8.7, 7.3], cerradas: [16, 18, 19, 22, 21, 24, 27, 23, 28, 31, 32, 29] }
    }
  };
  var ESTADOS = [["Nueva", "e-nueva"], ["Respondida", "e-resp"], ["Visita agendada", "e-visita"], ["Cerrada", "e-cerrada"]];
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("vp-svg"), tip = document.getElementById("vp-tip"), canales = document.getElementById("vp-canales");
  var actual = DATOS["30"];
  function tr(s) { return window.I18N && I18N.t ? I18N.t(s) : s; }
  function num(v) { return v.toLocaleString("es-AR"); }
  function pct(v) { return (Math.round(v * 10) / 10).toString().replace(".", ",") + "%"; }
  function el(tag, attrs, texto) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (texto !== undefined) e.textContent = texto; return e; }

  // Curva suave que pasa por los puntos (Catmull-Rom convertida a Bézier)
  function curva(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }

  var puntos = [];
  function grafico(sem) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 520, H = 150, izq = 30, der = 8, arriba = 12, abajo = 26, max = Math.max.apply(null, sem), tope = Math.ceil(max / 10) * 10 + 5;
    var defs = el("defs", {}), g = el("linearGradient", { id: "vp-grad", x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: "0%", style: "stop-color:var(--color-accent);stop-opacity:.42" }));
    g.appendChild(el("stop", { offset: "100%", style: "stop-color:var(--color-accent);stop-opacity:0" }));
    defs.appendChild(g); svg.appendChild(defs);
    var base = H - abajo, i;
    for (i = 0; i <= 3; i++) {
      var y = arriba + (base - arriba) * i / 3;
      svg.appendChild(el("line", { x1: izq, y1: y.toFixed(1), x2: W - der, y2: y.toFixed(1), "class": "vp-rej" }));
      svg.appendChild(el("text", { x: izq - 8, y: (y + 4).toFixed(1), "text-anchor": "end", "class": "vp-eje" }, String(Math.round(tope * (1 - i / 3)))));
    }
    puntos = sem.map(function (v, k) { return [izq + (W - izq - der) * (sem.length === 1 ? 0.5 : k / (sem.length - 1)), base - (v / tope) * (base - arriba)]; });
    var linea = curva(puntos);
    svg.appendChild(el("path", { d: linea + " L" + puntos[puntos.length - 1][0].toFixed(1) + " " + base + " L" + puntos[0][0].toFixed(1) + " " + base + " Z", "class": "vp-area" }));
    svg.appendChild(el("path", { d: linea, pathLength: 1, "class": "vp-lin" }));
    for (i = 0; i < sem.length; i++) if (sem.length <= 6 || i === 0 || i === sem.length - 1 || i % 3 === 0) svg.appendChild(el("text", { x: puntos[i][0].toFixed(1), y: H - 6, "text-anchor": "middle", "class": "vp-eje" }, "S" + (i + 1)));
    svg.appendChild(el("line", { id: "vp-guia", x1: 0, y1: arriba, x2: 0, y2: base, "class": "vp-guia", visibility: "hidden" }));
    svg.appendChild(el("circle", { id: "vp-pto", r: 5, cx: 0, cy: 0, "class": "vp-punto", visibility: "hidden" }));
    svg.setAttribute("aria-label", tr("Gráfico de consultas por semana, datos de ejemplo"));
  }

  function mirar(ev) {
    var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 520, mejor = 0, d = 1e9, i;
    for (i = 0; i < puntos.length; i++) { var dd = Math.abs(puntos[i][0] - x); if (dd < d) { d = dd; mejor = i; } }
    var p = puntos[mejor], gu = document.getElementById("vp-guia"), pt = document.getElementById("vp-pto");
    gu.setAttribute("x1", p[0]); gu.setAttribute("x2", p[0]); gu.setAttribute("visibility", "visible");
    pt.setAttribute("cx", p[0]); pt.setAttribute("cy", p[1]); pt.setAttribute("visibility", "visible");
    tip.hidden = false; tip.textContent = "S" + (mejor + 1) + ": " + actual.semanas[mejor] + " " + tr("Consultas").toLowerCase();
    tip.style.left = (p[0] / 520 * r.width) + "px"; tip.style.top = (p[1] / 150 * r.height) + "px";
  }
  function salir() { tip.hidden = true; var gu = document.getElementById("vp-guia"), pt = document.getElementById("vp-pto"); if (gu) gu.setAttribute("visibility", "hidden"); if (pt) pt.setAttribute("visibility", "hidden"); }
  svg.addEventListener("pointermove", mirar); svg.addEventListener("pointerleave", salir);

  function spark(el0, serie) {
    var w = 80, h = 24, mn = Math.min.apply(null, serie), mx = Math.max.apply(null, serie), rg = mx - mn || 1;
    var pts = serie.map(function (v, i) { return [2 + (w - 4) * i / (serie.length - 1), h - 3 - ((v - mn) / rg) * (h - 6)]; });
    while (el0.firstChild) el0.removeChild(el0.firstChild);
    el0.appendChild(el("path", { d: curva(pts) }));
  }

  var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var listo = calmo;   // sin movimiento: se muestra todo de entrada
  function suave(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Escribe un número y, si ya se vio el panel, lo hace contar desde el valor anterior
  function poner(nodo, valor, fmt) {
    var desde = nodo._v === undefined ? 0 : nodo._v; nodo._v = valor;
    if (calmo || !listo) { nodo.textContent = fmt(valor); if (!listo && !calmo) nodo._v = valor; return; }
    var t0 = performance.now(), dur = 900;
    (function paso(t) {
      var k = Math.min(1, (t - t0) / dur);
      nodo.textContent = fmt(desde + (valor - desde) * suave(k));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }
  function entero(v) { return num(Math.round(v)); }
  function pct1(v) { return pct(v); }

  function pintar(p) {
    var d = DATOS[p]; actual = d;
    var q = function (s) { return panel.querySelector(s); };
    poner(q('[data-k="visitas"]'), d.visitas, entero);
    poner(q('[data-k="consultas"]'), d.consultas, entero);
    poner(q('[data-k="tasa"]'), d.consultas / d.visitas * 100, pct1);
    poner(q('[data-k="cerradas"]'), d.cerradas, entero);
    ["visitas", "consultas", "tasa", "cerradas"].forEach(function (k) {
      q('[data-d="' + k + '"]').textContent = "▲ " + d.delta[k];
      spark(q('[data-s="' + k + '"]'), d.spark[k]);
    });
    var filas = canales.querySelectorAll("li");
    for (var i = 0; i < filas.length; i++) { filas[i].querySelector("b").style.width = d.canales[i] + "%"; filas[i].querySelector("em").textContent = d.canales[i] + "%"; }
    poner(q('[data-f="visitas"]'), d.cerradas, entero); poner(q('[data-f="consultas"]'), d.form, entero);
    poner(q('[data-f="agendadas"]'), d.agendadas, entero);
    var anchos = [100, d.form / d.cerradas * 100, d.agendadas / d.cerradas * 100];
    var emb = panel.querySelectorAll("#vp-embudo li i");
    for (var j = 0; j < emb.length; j++) emb[j].style.width = Math.min(100, anchos[j]) + "%";
    grafico(d.semanas);
  }

  var botones = panel.querySelectorAll(".vp-per button");
  Array.prototype.forEach.call(botones, function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(botones, function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      pintar(b.getAttribute("data-per"));
    });
  });

  // El estado de cada consulta se cambia con un toque, como en el panel real
  Array.prototype.forEach.call(panel.querySelectorAll(".chip"), function (c) {
    c.setAttribute("title", tr("Cambiar estado"));
    c.addEventListener("click", function () {
      var i = (parseInt(c.getAttribute("data-e"), 10) + 1) % ESTADOS.length;
      c.setAttribute("data-e", i);
      c.className = "chip " + ESTADOS[i][1];
      c.textContent = tr(ESTADOS[i][0]);
    });
  });

  pintar("30");

  /* Movimiento, como en los paneles de referencia: el panel llega inclinado hacia atrás, más chico y más tenue,
     y se endereza con el scroll. Cuando ya se ve, entran los indicadores de a uno, los números cuentan,
     la línea se dibuja y las barras crecen. */
  if (calmo) return;
  var ventana = panel, escena = panel.parentNode, chico = window.matchMedia("(max-width: 60rem)");
  panel.classList.add("vp-pre");
  Array.prototype.forEach.call(panel.querySelectorAll(".vp-kpis > div, .vp-fila > *, .vp-caja, .vp-tabla tbody tr"), function (n, i) { n.style.transitionDelay = Math.min(i, 12) * 70 + "ms"; });
  var entro = false, esp = false;
  function mover() {
    esp = false;
    var r = escena.getBoundingClientRect(), vh = window.innerHeight;
    var t = Math.max(0, Math.min(1, (vh * 0.96 - r.top) / (vh * 0.55)));
    var e = suave(t), giro = (chico.matches ? 12 : 22) * (1 - e);
    ventana.style.transform = "translateY(" + ((1 - e) * 34).toFixed(1) + "px) rotateX(" + giro.toFixed(2) + "deg) scale(" + (0.9 + 0.1 * e).toFixed(4) + ")";
    ventana.style.opacity = (0.55 + 0.45 * e).toFixed(3);
    escena.style.setProperty("--g", e.toFixed(3));
    if (!entro && t > 0.7) {
      entro = true; listo = true; setTimeout(function () { Array.prototype.forEach.call(panel.querySelectorAll(".vp-kpis > div, .vp-fila > *, .vp-tabla tbody tr, .vp-caja"), function (n) { n.style.transitionDelay = ""; }); panel.classList.add("vp-listo"); }, 1700);
      panel.classList.remove("vp-pre");
      // los números arrancan en cero y cuentan hasta su valor
      var nodos = panel.querySelectorAll("[data-k],[data-f]");
      Array.prototype.forEach.call(nodos, function (nodo) { var f = nodo._v; nodo._v = 0; nodo.textContent = nodo.hasAttribute("data-k") && nodo.getAttribute("data-k") === "tasa" ? "0%" : "0"; poner(nodo, f, nodo.getAttribute("data-k") === "tasa" ? pct1 : entero); });
    }
  }
  window.addEventListener("scroll", function () { if (!esp) { esp = true; requestAnimationFrame(mover); } }, { passive: true });
  window.addEventListener("resize", mover);
  mover();
})();
