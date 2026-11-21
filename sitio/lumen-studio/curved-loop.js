/* CurvedLoop de React Bits (https://reactbits.dev), portado de React a JavaScript puro.
   Texto que corre en bucle sobre un camino (arco, onda, línea). Se puede arrastrar y lanzar.
   Uso: CurvedLoop(contenedor, { text: "A · B · C", shape: "line", speed: 2, fontSize: 40, ... }) -> { destroy() }
   Diferencias con el original: el ancho del camino sigue el ancho real del contenedor (así el texto mantiene su tamaño en
   píxeles también en el celular) y no incluye la forma "circle". */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg", XLINK = "http://www.w3.org/1999/xlink";
  var MAX_FLING = 4000, WAVE_LENGTH = 960, TAU = Math.PI * 2;
  var DEF = { text: "", speed: 2, curveAmount: 0, direction: "left", interactive: true, pauseOnHover: false, edgeFade: 0,
    shape: "line", fontSize: 40, fontWeight: 400, letterSpacing: 0, separator: "", scrollBoost: 0, height: 88, fontFamily: "inherit" };

  function wrap(v, len) { return len > 0 ? (((v % len) + len) % len) - len : v; }
  function el(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  function wavePath(amp, base, W) {
    var from = -100, to = W + 100, k = TAU / WAVE_LENGTH;
    function y(x) { return base + amp * Math.cos(k * (x - W / 2)); }
    function sl(x) { return -amp * k * Math.sin(k * (x - W / 2)); }
    var n = Math.ceil((to - from) / (WAVE_LENGTH / 8)), st = (to - from) / n, d = "M" + from + "," + y(from).toFixed(2);
    for (var i = 0; i < n; i++) {
      var x0 = from + i * st, x1 = x0 + st;
      d += " C" + (x0 + st / 3).toFixed(2) + "," + (y(x0) + sl(x0) * st / 3).toFixed(2) + " " + (x1 - st / 3).toFixed(2) + "," + (y(x1) - sl(x1) * st / 3).toFixed(2) + " " + x1.toFixed(2) + "," + y(x1).toFixed(2);
    }
    return d;
  }
  function trazo(o, W, H) {
    var base = H / 2 + o.fontSize * 0.36;
    if (o.shape === "wave") return wavePath(o.curveAmount * 0.25, base, W);
    if (o.shape === "arc") return "M-100," + base + " Q" + (W / 2) + "," + (base + o.curveAmount) + " " + (W + 100) + "," + base;
    return "M-100," + base + " L" + (W + 100) + "," + base;
  }
  function mascara(amount) {
    var size = Math.min(Math.max(amount, 0), 1) * 50;
    if (size <= 0) return "";
    var l = [], r = [];
    for (var i = 0; i <= 10; i++) { var t = i / 10, a = (t * t * t * (t * (t * 6 - 15) + 10)).toFixed(3);
      l.push("rgba(0,0,0," + a + ") " + (t * size).toFixed(2) + "%"); r.unshift("rgba(0,0,0," + a + ") " + (100 - t * size).toFixed(2) + "%"); }
    return "linear-gradient(to right," + l.concat(r).join(",") + ")";
  }

  function CurvedLoop(cont, opciones) {
    var o = Object.assign({}, DEF, opciones || {});
    if (!cont || !o.text) return null;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var cuerpo = o.text.replace(/\s+$/, ""), marca = String(o.separator || "").trim();
    var unidad = marca ? cuerpo + " " + marca + " " : cuerpo + " ";

    var jacket = document.createElement("div");
    jacket.className = "curved-loop-jacket";
    var m = mascara(o.edgeFade);
    if (m) { jacket.style.webkitMaskImage = m; jacket.style.maskImage = m; }
    jacket.style.cursor = o.interactive ? "grab" : "auto";
    jacket.style.touchAction = o.interactive ? "pan-y" : "auto";
    var svg = el("svg", { "class": "curved-loop-svg", role: "img", "aria-label": cuerpo });
    svg.style.fontSize = o.fontSize + "px"; svg.style.fontWeight = o.fontWeight; svg.style.letterSpacing = o.letterSpacing + "px"; svg.style.fontFamily = o.fontFamily;
    var id = "cl" + Math.random().toString(36).slice(2, 8);
    var medida = el("text", { "xml:space": "preserve" }); medida.style.visibility = "hidden"; medida.textContent = unidad;
    var defs = el("defs", {}), camino = el("path", { id: id, fill: "none", stroke: "transparent" }); defs.appendChild(camino);
    var texto = el("text", { "xml:space": "preserve", fill: "currentColor" });
    var tp = el("textPath", { "xml:space": "preserve" }); tp.setAttributeNS(XLINK, "xlink:href", "#" + id); tp.setAttribute("href", "#" + id);
    texto.appendChild(tp);
    svg.appendChild(medida); svg.appendChild(defs); svg.appendChild(texto);
    jacket.appendChild(svg); cont.appendChild(jacket);

    var W = 1, spacing = 0, pathLen = 0, offset = 0, vel = 0, dir = o.direction, hover = false, visible = true, raf = 0, last = 0, disposed = false;
    var scroll = { dist: 0, level: 0 }, drag = { active: false, x: 0, t: 0, v: 0, scale: 1 };

    function medir() {
      W = Math.max(1, cont.clientWidth);
      svg.setAttribute("viewBox", "0 0 " + W + " " + o.height);
      svg.style.height = o.height + "px";
      camino.setAttribute("d", trazo(o, W, o.height));
      pathLen = camino.getTotalLength();
      spacing = medida.getComputedTextLength();
      if (spacing <= 0) return;
      var copias = Math.ceil((pathLen || W) / spacing) + 2;
      tp.textContent = unidad.repeat(copias);
      offset = wrap(offset, spacing);
      tp.setAttribute("startOffset", offset + "px");
    }
    function aplicar() { tp.setAttribute("startOffset", offset + "px"); }

    function tick(now) {
      raf = 0;
      if (disposed || !visible || document.hidden || spacing <= 0) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0; last = now;
      var rate = dt > 0 ? scroll.dist / dt : 0; scroll.dist = 0;
      scroll.level += (rate - scroll.level) * (1 - Math.exp(-dt * (rate > scroll.level ? 10 : 2.4)));
      if (!drag.active) {
        var sign = dir === "right" ? 1 : -1, parado = reducido || (o.pauseOnHover && hover);
        var objetivo = parado ? 0 : sign * o.speed * 60, extra = parado ? 0 : sign * scroll.level * o.scrollBoost * 0.3;
        vel += (objetivo - vel) * (1 - Math.exp(-dt * 3));
        var paso = (vel + extra) * dt;
        if (Math.abs(paso) > 0.0001) { offset = wrap(offset + paso, spacing); aplicar(); }
      }
      raf = requestAnimationFrame(tick);
    }
    function despertar() { if (!raf && !disposed) { last = 0; raf = requestAnimationFrame(tick); } }

    function down(e) {
      if (!o.interactive || spacing <= 0) return;
      var r = svg.getBoundingClientRect();
      drag = { active: true, x: e.clientX, t: performance.now(), v: 0, scale: W / (r.width || W) };
      vel = 0; jacket.style.cursor = "grabbing";
      if (jacket.setPointerCapture) jacket.setPointerCapture(e.pointerId);
    }
    function move(e) {
      if (!drag.active) return;
      var now = performance.now(), delta = (e.clientX - drag.x) * drag.scale, dt = Math.max(now - drag.t, 1) / 1000;
      drag.x = e.clientX; drag.t = now; drag.v = drag.v * 0.5 + (delta / dt) * 0.5;
      offset = wrap(offset + delta, spacing); aplicar();
    }
    function up() {
      if (!drag.active) return;
      drag.active = false; jacket.style.cursor = o.interactive ? "grab" : "auto";
      var fling = performance.now() - drag.t > 100 ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.v));
      vel = fling; if (Math.abs(fling) > 60) dir = fling > 0 ? "right" : "left";
      despertar();
    }
    jacket.addEventListener("pointerdown", down); jacket.addEventListener("pointermove", move);
    jacket.addEventListener("pointerup", up); jacket.addEventListener("pointercancel", up); jacket.addEventListener("lostpointercapture", up);
    jacket.addEventListener("pointerenter", function () { hover = true; });
    jacket.addEventListener("pointerleave", function () { hover = false; up(); });

    var onScroll = null;
    if (o.scrollBoost) {
      var prev = window.scrollY;
      onScroll = function () { scroll.dist += Math.abs(window.scrollY - prev); prev = window.scrollY; };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    var ro = new ResizeObserver(function () { medir(); despertar(); }); ro.observe(cont);
    var io = new IntersectionObserver(function (es) { visible = es.some(function (x) { return x.isIntersecting; }); if (visible) { scroll.level = 0; despertar(); } }); io.observe(cont);
    function arranque() { medir(); despertar(); }
    arranque();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arranque);
    return { destroy: function () { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); if (onScroll) window.removeEventListener("scroll", onScroll); jacket.remove(); } };
  }
  window.CurvedLoop = CurvedLoop;
})();
