/* Grilla de puntos y líneas que se ilumina cerca del cursor.
   Reimplementa en JavaScript puro, sobre un canvas, el componente "Interactive Dots" de Framer (modo dots-lines).
   Uso: DotsGrid(contenedor, { spacing: 60, dotColor: "#F5F2E9", ... }). Sin cursor (celular) queda la grilla tenue y quieta. */
(function () {
  "use strict";
  var DEFAULTS = { dotColor: "#F5F2E9", dotSize: 3, spacing: 60, proximityRadius: 170, maxOpacity: 0.55, backgroundOpacity: 0.05, lineOpacity: 0.03, fadeDelay: 700 };

  function DotsGrid(el, opciones) {
    var o = Object.assign({}, DEFAULTS, opciones || {});
    if (!el) return null;
    var canvas = document.createElement("canvas");
    canvas.className = "dots-canvas";
    canvas.setAttribute("aria-hidden", "true");
    el.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return null; }
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var hayCursor = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var rgb = (function (hex) { var n = parseInt(hex.replace("#", ""), 16); return (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255); })(o.dotColor);

    var w = 1, h = 1, cols = 0, filas = 0, mx = -1e4, my = -1e4, raf = 0, visible = true;
    var vistoEn = new Float32Array(0);   // cuándo estuvo cada punto cerca del cursor
    var fuerza = new Float32Array(0);    // con qué intensidad

    function cerca() { return mx > -o.proximityRadius && mx < w + o.proximityRadius && my > -o.proximityRadius && my < h + o.proximityRadius; }

    function dibujar(ahora) {
      ctx.clearRect(0, 0, w, h);
      var s = o.spacing, r = o.proximityRadius, r2 = r * r, desvaneciendo = false, i, j;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(" + rgb + "," + o.lineOpacity + ")";
      ctx.beginPath();
      for (i = 0; i < cols; i++) { var x = Math.round(i * s + s / 2) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (j = 0; j < filas; j++) { var y = Math.round(j * s + s / 2) + 0.5; ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      for (j = 0; j < filas; j++) {
        for (i = 0; i < cols; i++) {
          var px = i * s + s / 2, py = j * s + s / 2, k = j * cols + i;
          var dx = mx - px, dy = my - py, d2 = dx * dx + dy * dy, a = o.backgroundOpacity;
          if (d2 <= r2) {
            var f = (1 - Math.sqrt(d2) / r) * o.maxOpacity;
            vistoEn[k] = ahora; fuerza[k] = f;
            a = Math.max(a, f);
          } else if (o.fadeDelay > 0 && ahora - vistoEn[k] < o.fadeDelay) {
            a = Math.max(a, fuerza[k] * (1 - (ahora - vistoEn[k]) / o.fadeDelay));
            desvaneciendo = true;
          }
          var extra = Math.max(0, a - o.backgroundOpacity);
          ctx.fillStyle = "rgba(" + rgb + "," + Math.min(1, a) + ")";
          ctx.beginPath();
          ctx.arc(px, py, (o.dotSize / 2) * (1 + extra * 0.8), 0, 6.2832);
          ctx.fill();
        }
      }
      return desvaneciendo;
    }

    function ciclo(t) {
      raf = 0;
      if (!visible || document.hidden) return;
      var desvaneciendo = dibujar(t);
      if (desvaneciendo || cerca()) raf = requestAnimationFrame(ciclo);
    }
    function despertar() { if (!raf) raf = requestAnimationFrame(ciclo); }

    function medir() {
      w = Math.max(1, el.clientWidth); h = Math.max(1, el.clientHeight);
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.ceil(w / o.spacing); filas = Math.ceil(h / o.spacing);
      vistoEn = new Float32Array(cols * filas).fill(-1e9);
      fuerza = new Float32Array(cols * filas);
      dibujar(performance.now());
    }

    function alMover(e) {
      var rect = el.getBoundingClientRect();
      mx = e.clientX - rect.left; my = e.clientY - rect.top;
      if (cerca()) despertar();
    }

    var ro = new ResizeObserver(medir); ro.observe(el);
    var io = new IntersectionObserver(function (es) { visible = es.some(function (x) { return x.isIntersecting; }); if (visible) despertar(); });
    io.observe(el);
    medir();
    if (hayCursor && !reducido) window.addEventListener("mousemove", alMover, { passive: true });
    return { destroy: function () { window.removeEventListener("mousemove", alMover); cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); canvas.remove(); } };
  }
  window.DotsGrid = DotsGrid;
})();
