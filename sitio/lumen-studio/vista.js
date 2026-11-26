/* Halo Vista: panel de ejemplo interactivo. Los números son de muestra.
   - Las tarjetas de indicadores cambian el gráfico; el gráfico muestra el valor al pasar el cursor.
   - Los canales y los tipos de contacto filtran la tabla; el buscador filtra por texto.
   - El menú lateral abre Contactos, Canales e Informes (en el celular, pestañas arriba).
   Sin librerías. */
(function () {
  "use strict";
  var panel = document.getElementById("vista-panel");
  if (!panel) return;
  var calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  /* ---------- datos de ejemplo ---------- */
  var DATOS = {
    "30": {
      visitas: 1842, consultas: 126, agendadas: 10, cerradas: 94, form: 22,
      canales: [46, 31, 15, 8], disp: [68, 27, 5], dias: [14, 18, 17, 21, 24, 19, 13],
      delta: { visitas: "+12%", consultas: "+18%", tasa: "+0,4 pp", cerradas: "+16%" },
      spark: { visitas: [410, 430, 470, 532], consultas: [24, 29, 35, 38], tasa: [5.9, 6.4, 7.1, 7.1], cerradas: [14, 19, 25, 36] }
    },
    "90": {
      visitas: 5310, consultas: 389, agendadas: 31, cerradas: 290, form: 68,
      canales: [41, 36, 15, 8], disp: [66, 29, 5], dias: [41, 52, 49, 58, 66, 74, 49],
      delta: { visitas: "+9%", consultas: "+14%", tasa: "+0,3 pp", cerradas: "+12%" },
      spark: { visitas: [380, 395, 410, 420, 400, 440, 452, 430, 470, 490, 505, 520], consultas: [21, 24, 26, 30, 28, 33, 35, 31, 38, 41, 44, 38], tasa: [5.5, 6.1, 6.3, 7.1, 7, 7.5, 7.7, 7.2, 8.1, 8.4, 8.7, 7.3], cerradas: [16, 18, 19, 22, 21, 24, 27, 23, 28, 31, 32, 29] }
    }
  };
  var METRICAS = {
    visitas: "Visitas por semana", consultas: "Contactos por semana",
    tasa: "Visitas que contactan por semana", cerradas: "Clics a WhatsApp por semana"
  };
  var ORIGENES = ["Instagram", "Google", "Directo", "Otros"], TIPOS = ["WhatsApp", "Formulario", "Llamada"], DISPOS = ["Celular", "Escritorio", "Tablet"];
  var DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  var CONTACTOS = [
    ["WhatsApp", "Instagram", "Celular", "Hoy, 10:42"], ["Formulario", "Google", "Escritorio", "Hoy, 09:15"],
    ["WhatsApp", "Directo", "Celular", "Ayer, 21:08"], ["WhatsApp", "Instagram", "Celular", "Ayer, 18:30"],
    ["Llamada", "Google", "Celular", "Ayer, 12:05"], ["WhatsApp", "Google", "Escritorio", "Lun, 20:44"],
    ["Formulario", "Instagram", "Celular", "Lun, 16:21"], ["WhatsApp", "Otros", "Celular", "Lun, 11:03"],
    ["WhatsApp", "Instagram", "Tablet", "Dom, 22:17"], ["Llamada", "Directo", "Celular", "Dom, 10:50"],
    ["WhatsApp", "Directo", "Celular", "Sáb, 19:36"], ["Formulario", "Google", "Escritorio", "Sáb, 13:12"]
  ];

  /* ---------- estado ---------- */
  var E = { per: "30", metrica: "visitas", origen: "", tipo: "", q: "", vista: "resumen" };
  var actual = DATOS["30"], listo = calmo, puntos = [];

  /* ---------- utilidades ---------- */
  function $(s, r) { return (r || panel).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || panel).querySelectorAll(s)); }
  function tr(s) { return window.I18N && I18N.t ? I18N.t(s) : s; }
  function num(v) { return v.toLocaleString("es-AR"); }
  function pct(v) { return (Math.round(v * 10) / 10).toString().replace(".", ",") + "%"; }
  function entero(v) { return num(Math.round(v)); }
  function el(tag, attrs, texto) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (texto !== undefined) e.textContent = texto; return e; }
  function suave(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function fmt(m) { return m === "tasa" ? pct : entero; }
  function activar(nodo, ev) { nodo.addEventListener("click", ev); nodo.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ev(e); } }); }

  // Escribe un número y, si ya se vio el panel, lo hace contar desde el valor anterior
  function poner(nodo, valor, f) {
    var desde = nodo._v === undefined ? 0 : nodo._v; nodo._v = valor;
    if (calmo || !listo) { nodo.textContent = f(valor); return; }
    var t0 = performance.now(), dur = 900;
    (function paso(t) {
      var k = Math.min(1, (t - t0) / dur);
      nodo.textContent = f(desde + (valor - desde) * suave(k));
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }

  // Curva suave que pasa por los puntos (Catmull-Rom convertida a Bézier)
  function curva(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- gráfico ---------- */
  var svg = $("#vp-svg"), tip = $("#vp-tip");
  function grafico() {
    var sem = actual.spark[E.metrica], f = fmt(E.metrica);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 520, H = 150, izq = 34, der = 8, arriba = 12, abajo = 26, max = Math.max.apply(null, sem);
    var tope = E.metrica === "tasa" ? Math.ceil(max) + 1 : Math.ceil(max / 10) * 10 + (max > 100 ? 20 : 5);
    var defs = el("defs", {}), g = el("linearGradient", { id: "vp-grad", x1: 0, y1: 0, x2: 0, y2: 1 });
    g.appendChild(el("stop", { offset: "0%", style: "stop-color:var(--color-accent);stop-opacity:.42" }));
    g.appendChild(el("stop", { offset: "100%", style: "stop-color:var(--color-accent);stop-opacity:0" }));
    defs.appendChild(g); svg.appendChild(defs);
    var base = H - abajo, i;
    for (i = 0; i <= 3; i++) {
      var y = arriba + (base - arriba) * i / 3;
      svg.appendChild(el("line", { x1: izq, y1: y.toFixed(1), x2: W - der, y2: y.toFixed(1), "class": "vp-rej" }));
      svg.appendChild(el("text", { x: izq - 8, y: (y + 4).toFixed(1), "text-anchor": "end", "class": "vp-eje" }, f(tope * (1 - i / 3))));
    }
    puntos = sem.map(function (v, k) { return [izq + (W - izq - der) * (sem.length === 1 ? 0.5 : k / (sem.length - 1)), base - (v / tope) * (base - arriba)]; });
    var linea = curva(puntos);
    svg.appendChild(el("path", { d: linea + " L" + puntos[puntos.length - 1][0].toFixed(1) + " " + base + " L" + puntos[0][0].toFixed(1) + " " + base + " Z", "class": "vp-area" }));
    svg.appendChild(el("path", { d: linea, pathLength: 1, "class": "vp-lin" }));
    for (i = 0; i < sem.length; i++) if (sem.length <= 6 || i === 0 || i === sem.length - 1 || i % 3 === 0) svg.appendChild(el("text", { x: puntos[i][0].toFixed(1), y: H - 6, "text-anchor": "middle", "class": "vp-eje" }, "S" + (i + 1)));
    svg.appendChild(el("line", { id: "vp-guia", x1: 0, y1: arriba, x2: 0, y2: base, "class": "vp-guia", visibility: "hidden" }));
    svg.appendChild(el("circle", { id: "vp-pto", r: 5, cx: 0, cy: 0, "class": "vp-punto", visibility: "hidden" }));
    var nombre = tr(METRICAS[E.metrica]);
    $(".vp-grafico figcaption").textContent = nombre;
    svg.setAttribute("aria-label", nombre + ", " + tr("datos de ejemplo"));
    if (!calmo && listo) { svg.classList.remove("vp-redib"); void svg.getBoundingClientRect(); svg.classList.add("vp-redib"); }
  }
  function mirar(ev) {
    var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 520, mejor = 0, d = 1e9, i;
    for (i = 0; i < puntos.length; i++) { var dd = Math.abs(puntos[i][0] - x); if (dd < d) { d = dd; mejor = i; } }
    var p = puntos[mejor], gu = $("#vp-guia"), pt = $("#vp-pto");
    gu.setAttribute("x1", p[0]); gu.setAttribute("x2", p[0]); gu.setAttribute("visibility", "visible");
    pt.setAttribute("cx", p[0]); pt.setAttribute("cy", p[1]); pt.setAttribute("visibility", "visible");
    tip.hidden = false; tip.textContent = "S" + (mejor + 1) + ": " + fmt(E.metrica)(actual.spark[E.metrica][mejor]);
    tip.style.left = (p[0] / 520 * r.width) + "px"; tip.style.top = (p[1] / 150 * r.height) + "px";
  }
  function salir() { tip.hidden = true; var gu = $("#vp-guia"), pt = $("#vp-pto"); if (gu) gu.setAttribute("visibility", "hidden"); if (pt) pt.setAttribute("visibility", "hidden"); }
  svg.addEventListener("pointermove", mirar); svg.addEventListener("pointerleave", salir);

  function spark(nodo, serie) {
    var w = 80, h = 24, mn = Math.min.apply(null, serie), mx = Math.max.apply(null, serie), rg = mx - mn || 1;
    var pts = serie.map(function (v, i) { return [2 + (w - 4) * i / (serie.length - 1), h - 3 - ((v - mn) / rg) * (h - 6)]; });
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
    nodo.appendChild(el("path", { d: curva(pts) }));
  }

  /* ---------- tablas filtradas ---------- */
  function filtrados() {
    var q = E.q.trim().toLowerCase();
    return CONTACTOS.filter(function (c) {
      if (E.origen && c[1] !== E.origen) return false;
      if (E.tipo && c[0] !== E.tipo) return false;
      if (q && (tr(c[0]) + " " + tr(c[1]) + " " + tr(c[2]) + " " + tr(c[3])).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  function filas(cuerpo, lista) {
    cuerpo.innerHTML = "";
    lista.forEach(function (c) {
      var tr0 = document.createElement("tr");
      c.forEach(function (v) { var td = document.createElement("td"); td.textContent = tr(v); tr0.appendChild(td); });
      cuerpo.appendChild(tr0);
    });
  }
  function tablas() {
    var l = filtrados();
    filas($("#vp-cuerpo"), l.slice(0, 3)); filas($("#vp-cuerpo2"), l.slice(0, 9));
    $("#vp-vacio").hidden = $("#vp-vacio2").hidden = l.length > 0;
    $("#vp-cuerpo").parentNode.hidden = $("#vp-cuerpo2").parentNode.hidden = l.length === 0;
    // filtros activos, como chips que se quitan con un toque
    var cont = $("#vp-filtros"); cont.innerHTML = "";
    [["origen", E.origen], ["tipo", E.tipo]].forEach(function (f) {
      if (!f[1]) return;
      var b = document.createElement("button"); b.type = "button"; b.className = "vp-filtro"; b.textContent = tr(f[1]) + " ×";
      b.setAttribute("aria-label", tr("Quitar filtro") + ": " + tr(f[1]));
      b.addEventListener("click", function () { E[f[0]] = ""; actualizarFiltros(); });
      cont.appendChild(b);
    });
    $$("#vp-pills button").forEach(function (b) { b.setAttribute("aria-pressed", String((b.getAttribute("data-t") || "") === E.tipo)); });
    $$("#vp-canales li").forEach(function (li, i) { li.classList.toggle("sel", ORIGENES[i] === E.origen); li.setAttribute("aria-pressed", String(ORIGENES[i] === E.origen)); });
    $$("#vp-embudo li").forEach(function (li, i) { li.classList.toggle("sel", TIPOS[i] === E.tipo); li.setAttribute("aria-pressed", String(TIPOS[i] === E.tipo)); });
  }
  function actualizarFiltros() { tablas(); }

  /* ---------- vistas ---------- */
  function barras(ul, nombres, valores, alIr) {
    ul.innerHTML = "";
    nombres.forEach(function (n, i) {
      var li = document.createElement("li");
      li.innerHTML = "<span></span><i><b></b></i><em></em>";
      li.firstChild.textContent = tr(n); li.querySelector("b").style.width = valores[i] + "%"; li.querySelector("em").textContent = valores[i] + "%";
      if (alIr) { li.setAttribute("role", "button"); li.tabIndex = 0; activar(li, function () { alIr(n); }); }
      ul.appendChild(li);
    });
  }
  function vistas() {
    var d = actual;
    barras($("#vp-b-origen"), ORIGENES, d.canales, function (n) { E.origen = n; E.tipo = ""; ir("contactos"); });
    barras($("#vp-b-disp"), DISPOS, d.disp);
    var max = Math.max.apply(null, d.dias), cont = $("#vp-dias"); cont.innerHTML = "";
    d.dias.forEach(function (v, i) {
      var c = document.createElement("div"); c.className = "vp-dia" + (v === max ? " max" : "");
      c.innerHTML = "<b></b><span></span>"; c.querySelector("b").style.height = Math.round(v / max * 100) + "%"; c.title = v + " " + tr("contactos");
      c.querySelector("span").textContent = tr(DIAS[i]); cont.appendChild(c);
    });
    $("#vp-inf-t").textContent = tr("Informe de ejemplo") + ": " + (E.per === "30" ? tr("últimos 30 días") : tr("últimos 90 días"));
    var mejorO = ORIGENES[d.canales.indexOf(Math.max.apply(null, d.canales))], dia = DIAS[d.dias.indexOf(max)];
    var en = window.I18N && I18N.lang === "en", mx = Math.max.apply(null, d.canales), tasa = pct(d.consultas / d.visitas * 100);
    var items = en ? [
      "There were " + num(d.consultas) + " contacts from " + num(d.visitas) + " visits (" + tasa + ").",
      "The source that brings the most is " + tr(mejorO) + " (" + mx + "%).",
      d.disp[0] + "% come from a phone: the WhatsApp button must always be in view.",
      "The day with the most contacts is " + tr(dia) + ".",
      "To try next month: a shorter form."
    ] : [
      "Hubo " + num(d.consultas) + " contactos sobre " + num(d.visitas) + " visitas (" + tasa + ").",
      "El origen que más trae es " + mejorO + " (" + mx + "%).",
      "El " + d.disp[0] + "% llega desde el celular: el botón de WhatsApp tiene que estar siempre a la vista.",
      "El día con más contactos es " + dia + ".",
      "Para probar el próximo mes: un formulario más corto."
    ];
    var ul = $("#vp-inf"); ul.innerHTML = ""; items.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
  }
  var TIT = { resumen: ["Buen día", "Así viene tu página"], contactos: ["Contactos", "Quién te escribió y por dónde"], canales: ["Canales", "De dónde llegan y desde qué dispositivo"], informes: ["Informes", "Qué mirar y qué mejorar"] };
  function ir(v) {
    var app = $(".vp-app");
    if (E.vista === "resumen" && v !== "resumen") app.style.minHeight = app.offsetHeight + "px";   // el panel no cambia de alto al navegar
    E.vista = v;
    $$(".vp-vista").forEach(function (x) { x.hidden = x.getAttribute("data-v") !== v; });
    $$("[data-go]").forEach(function (b) { var on = b.getAttribute("data-go") === v; b.classList.toggle("on", on); if (b.tagName === "LI") { if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); } else b.setAttribute("aria-pressed", String(on)); });
    $("#vp-tit").textContent = tr(TIT[v][0]); $("#vp-sub0").textContent = tr(TIT[v][1]);
    tablas();
  }

  /* ---------- pintar ---------- */
  function pintar() {
    var d = DATOS[E.per]; actual = d;
    poner($('[data-k="visitas"]'), d.visitas, entero);
    poner($('[data-k="consultas"]'), d.consultas, entero);
    poner($('[data-k="tasa"]'), d.consultas / d.visitas * 100, pct);
    poner($('[data-k="cerradas"]'), d.cerradas, entero);
    ["visitas", "consultas", "tasa", "cerradas"].forEach(function (k) {
      $('[data-d="' + k + '"]').textContent = "▲ " + d.delta[k];
      spark($('[data-s="' + k + '"]'), d.spark[k]);
    });
    $$("#vp-canales li").forEach(function (li, i) { li.querySelector("b").style.width = d.canales[i] + "%"; li.querySelector("em").textContent = d.canales[i] + "%"; });
    poner($('[data-f="visitas"]'), d.cerradas, entero); poner($('[data-f="consultas"]'), d.form, entero); poner($('[data-f="agendadas"]'), d.agendadas, entero);
    var anchos = [100, d.form / d.cerradas * 100, d.agendadas / d.cerradas * 100];
    $$("#vp-embudo li i").forEach(function (b, j) { b.style.width = Math.min(100, anchos[j]) + "%"; });
    grafico(); vistas();
  }

  /* ---------- eventos ---------- */
  var botones = $$(".vp-per button");
  botones.forEach(function (b) {
    b.addEventListener("click", function () {
      botones.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      E.per = b.getAttribute("data-per"); pintar();
    });
  });
  // tarjetas de indicadores: elegir qué muestra el gráfico
  var ks = ["visitas", "consultas", "tasa", "cerradas"];
  $$(".vp-kpis > div").forEach(function (t, i) {
    t.setAttribute("role", "button"); t.tabIndex = 0; t.setAttribute("aria-pressed", String(ks[i] === E.metrica)); t.setAttribute("data-m", ks[i]);
    activar(t, function () {
      E.metrica = ks[i];
      $$(".vp-kpis > div").forEach(function (o) { o.classList.toggle("sel", o === t); o.setAttribute("aria-pressed", String(o === t)); });
      grafico();
    });
  });
  $('.vp-kpis > div[data-m="visitas"]').classList.add("sel");
  // canales y tipos: tocar para filtrar la tabla; tocar de nuevo para quitar
  $$("#vp-canales li").forEach(function (li, i) { li.setAttribute("role", "button"); li.tabIndex = 0; activar(li, function () { E.origen = E.origen === ORIGENES[i] ? "" : ORIGENES[i]; tablas(); }); });
  $$("#vp-embudo li").forEach(function (li, i) { li.setAttribute("role", "button"); li.tabIndex = 0; activar(li, function () { E.tipo = E.tipo === TIPOS[i] ? "" : TIPOS[i]; tablas(); }); });
  $$("#vp-pills button").forEach(function (b) { b.addEventListener("click", function () { E.tipo = b.getAttribute("data-t") || ""; tablas(); }); });
  // buscador
  $("#vp-q").addEventListener("input", function (e) { E.q = e.target.value; if (E.q && E.vista !== "contactos") ir("contactos"); else tablas(); });
  // menú lateral y pestañas del celular
  var tabs = $("#vp-tabs");
  [["resumen", "Resumen"], ["contactos", "Contactos"], ["canales", "Canales"], ["informes", "Informes"]].forEach(function (p) {
    var b = document.createElement("button"); b.type = "button"; b.setAttribute("data-go", p[0]); b.setAttribute("aria-pressed", String(p[0] === "resumen")); b.textContent = tr(p[1]); tabs.appendChild(b);
  });
  $$("[data-go]").forEach(function (b) { activar(b, function () { ir(b.getAttribute("data-go")); }); });
  $$(".vp-lado li[aria-disabled]").forEach(function (li) { li.setAttribute("title", tr("Disponible en el panel completo")); });
  if (window.I18N && I18N.onChange) I18N.onChange(function () { grafico(); tablas(); vistas(); ir(E.vista); });

  pintar(); tablas();

  /* ---------- entrada: el panel se endereza con el scroll y los números cuentan ---------- */
  if (calmo) return;
  var escena = panel.parentNode, chico = window.matchMedia("(max-width: 60rem)");
  panel.classList.add("vp-pre");
  $$(".vp-kpis > div, .vp-fila > *, .vp-caja").forEach(function (n, i) { n.style.transitionDelay = Math.min(i, 12) * 70 + "ms"; });
  var entro = false, esp = false;
  function mover() {
    esp = false;
    var r = escena.getBoundingClientRect(), vh = window.innerHeight;
    var t = Math.max(0, Math.min(1, (vh * 0.96 - r.top) / (vh * 0.55)));
    var e = suave(t), giro = (chico.matches ? 12 : 22) * (1 - e);
    panel.style.transform = "translateY(" + ((1 - e) * 34).toFixed(1) + "px) rotateX(" + giro.toFixed(2) + "deg) scale(" + (0.9 + 0.1 * e).toFixed(4) + ")";
    panel.style.opacity = (0.55 + 0.45 * e).toFixed(3);
    escena.style.setProperty("--g", e.toFixed(3));
    if (!entro && t > 0.7) {
      entro = true; listo = true;
      setTimeout(function () { $$(".vp-kpis > div, .vp-fila > *, .vp-caja").forEach(function (n) { n.style.transitionDelay = ""; }); panel.classList.add("vp-listo"); }, 1700);
      panel.classList.remove("vp-pre");
      $$("[data-k],[data-f]").forEach(function (nodo) { var f = nodo._v, esT = nodo.getAttribute("data-k") === "tasa"; nodo._v = 0; nodo.textContent = esT ? "0%" : "0"; poner(nodo, f, esT ? pct : entero); });
    }
  }
  window.addEventListener("scroll", function () { if (!esp) { esp = true; requestAnimationFrame(mover); } }, { passive: true });
  window.addEventListener("resize", mover);
  mover();
})();
