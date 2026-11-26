/* Halo Vista: tablero de ejemplo. Los números son de muestra y cambian con el período. Sin librerías. */
(function () {
  "use strict";
  var panel = document.getElementById("vista-panel");
  if (!panel) return;
  var DATOS = {
    "30": { visitas: 1842, consultas: 126, cerradas: 21, semanas: [24, 29, 35, 38], canales: [46, 31, 15, 8] },
    "90": { visitas: 5310, consultas: 389, cerradas: 68, semanas: [21, 24, 26, 30, 28, 33, 35, 31, 38, 41, 44, 38], canales: [41, 36, 15, 8] }
  };
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("vp-svg");
  var canales = document.getElementById("vp-canales");
  function n(v) { return v.toLocaleString("es-AR"); }
  function pct(v) { return (Math.round(v * 10) / 10).toString().replace(".", ",") + "%"; }
  function el(tag, attrs, texto) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function grafico(sem) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 480, H = 176, base = H - 26, tope = 22, max = Math.max.apply(null, sem);
    var paso = W / sem.length, ancho = Math.min(46, paso * 0.58), i;
    svg.appendChild(el("line", { x1: 0, y1: base, x2: W, y2: base, "class": "vp-eje" }));
    for (i = 0; i < sem.length; i++) {
      var alto = Math.max(4, (sem[i] / max) * (base - tope));
      var x = paso * i + (paso - ancho) / 2;
      svg.appendChild(el("rect", { x: x.toFixed(1), y: (base - alto).toFixed(1), width: ancho.toFixed(1), height: alto.toFixed(1), rx: 2, "class": "vp-barra-g" + (sem[i] === max ? " max" : "") }));
      if (sem.length <= 6 || sem[i] === max) svg.appendChild(el("text", { x: (x + ancho / 2).toFixed(1), y: (base - alto - 6).toFixed(1), "text-anchor": "middle", "class": "vp-val" }, String(sem[i])));
      if (sem.length <= 6 || i === 0 || i === sem.length - 1 || i % 3 === 0) svg.appendChild(el("text", { x: (x + ancho / 2).toFixed(1), y: H - 6, "text-anchor": "middle", "class": "vp-sem" }, "S" + (i + 1)));
    }
  }

  function pintar(p) {
    var d = DATOS[p];
    panel.querySelector('[data-k="visitas"]').textContent = n(d.visitas);
    panel.querySelector('[data-k="consultas"]').textContent = n(d.consultas);
    panel.querySelector('[data-k="tasa"]').textContent = pct(d.consultas / d.visitas * 100);
    panel.querySelector('[data-k="cerradas"]').textContent = n(d.cerradas);
    var filas = canales.querySelectorAll("li");
    for (var i = 0; i < filas.length; i++) {
      filas[i].querySelector("b").style.width = d.canales[i] + "%";
      filas[i].querySelector("em").textContent = d.canales[i] + "%";
    }
    grafico(d.semanas);
  }

  var botones = panel.querySelectorAll(".vp-per button");
  Array.prototype.forEach.call(botones, function (b) {
    b.addEventListener("click", function () {
      Array.prototype.forEach.call(botones, function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      pintar(b.getAttribute("data-per"));
    });
  });
  pintar("30");
})();
