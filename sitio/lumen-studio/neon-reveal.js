/* Apertura "Neon Reveal": un tubo de neón apagado, finito, cruza el borde de arriba. Un tramo del centro titila dos veces,
   queda prendido y se expande hacia los lados mientras su luz baja y el contenido aparece detrás.
   Inspirada en la descripción pública del componente Neon Reveal de React Bits Pro
   (https://pro.reactbits.dev/docs/components/neon-reveal); es una versión propia en JavaScript puro, no el componente
   licenciado. Los nombres y valores por defecto de las opciones siguen los de esa documentación.
   Solo anima opacidad y transformaciones (corren en la GPU), así que se mantiene fluida.
   Uso: NeonReveal(contenedor, { contenido: elemento_cuyos_hijos_aparecen }). Devuelve { replay() }. */
(function () {
  "use strict";
  var DEFAULTS = {
    colors: ["#FF9FFC", "#B163E9"], revealDelay: 300, revealDuration: 2500, thickness: 3, glow: 1, spill: 1, reach: 1,
    intensity: 1, inset: 24, length: 0.9, hum: 1, flicker: 1, interactive: true, intro: true
  };
  function rgba(hex, a) {
    var n = parseInt(hex.replace("#", ""), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  function oscuro(hex, k) {
    var n = parseInt(hex.replace("#", ""), 16);
    return "rgb(" + Math.round((n >> 16 & 255) * k) + "," + Math.round((n >> 8 & 255) * k) + "," + Math.round((n & 255) * k) + ")";
  }
  var SUAVE = "cubic-bezier(0.4, 0, 0.2, 1)";
  var ENTRADA = "cubic-bezier(0.16, 1, 0.3, 1)";
  var EXPANDE = "cubic-bezier(0.65, 0, 0.35, 1)";

  function NeonReveal(raiz, opciones) {
    var o = Object.assign({}, DEFAULTS, opciones || {});
    var contenido = o.contenido;
    if (!raiz || !contenido || !raiz.animate) return null;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var tubo = o.colors[0], luz = o.colors[1], hondo = oscuro(luz, 0.42);
    var largo = Math.min(1, Math.max(0.1, o.length));
    var izq = ((1 - largo) / 2 * 100) + "%", ancho = (largo * 100) + "%";
    var grosor = o.thickness;
    var CHICO = 0.06;

    function div(clase, css) {
      var d = document.createElement("div");
      d.className = clase; d.style.cssText = css || "";
      return d;
    }
    var capa = div("nr-capa");
    capa.setAttribute("aria-hidden", "true");
    // tubo apagado, de punta a punta
    var base = div("nr-base", "top:" + o.inset + "px;left:" + izq + ";width:" + ancho + ";height:" + grosor + "px;border-radius:" + grosor + "px;background:rgba(255,255,255,0.2);");
    // tramo encendido: crece desde el centro y arrastra su halo y su luz
    var lit = div("nr-lit", "top:" + o.inset + "px;left:" + izq + ";width:" + ancho + ";height:" + grosor + "px;");
    // la luz es un cuenco (media elipse) tan ancho como el tramo prendido; baja de tono claro a oscuro y se apaga en el borde
    var derrame = div("nr-derrame", "left:calc(" + izq + " - " + (largo * 5) + "%);width:" + (largo * 110) + "%;top:" + (o.inset + grosor / 2) + "px;height:" + (72 * o.reach) + "dvh;" +
      "background:radial-gradient(ellipse 50% 100% at 50% 0%," +
      rgba(tubo, 1 * o.spill * o.intensity) + " 0%," + rgba(tubo, 0.85 * o.spill * o.intensity) + " 12%," + rgba(luz, 0.92 * o.spill * o.intensity) + " 34%," +
      rgba(hondo, 0.78 * o.spill * o.intensity) + " 62%," + rgba(hondo, 0.18 * o.spill * o.intensity) + " 86%,transparent 100%);filter:blur(" + (6 * o.glow) + "px);");
    var halo = div("nr-halo", "left:-3%;right:-3%;top:" + (-26 * o.glow) + "px;height:" + (grosor + 52 * o.glow) + "px;" +
      "background:radial-gradient(ellipse at 50% 50%," + rgba(tubo, 0.7 * o.intensity) + "," + rgba(luz, 0.35 * o.intensity) + " 48%,transparent 74%);filter:blur(" + (10 * o.glow) + "px);");
    var nucleo = div("nr-nucleo", "inset:0;border-radius:" + grosor + "px;background:#fff;box-shadow:0 0 3px rgba(255,255,255,.9),0 0 " + (8 * o.glow) + "px " + tubo + ",0 0 " + (20 * o.glow) + "px " + rgba(tubo, 0.55) + ",0 0 " + (44 * o.glow) + "px " + rgba(luz, 0.45) + ";");
    lit.appendChild(halo); lit.appendChild(nucleo);
    capa.appendChild(derrame); capa.appendChild(base); capa.appendChild(lit);
    raiz.insertBefore(capa, raiz.firstChild);

    var animaciones = [];
    function cancelar() { animaciones.forEach(function (a) { a.cancel(); }); animaciones = []; }
    function a(el, cuadros, op) { var x = el.animate(cuadros, Object.assign({ fill: "both" }, op)); animaciones.push(x); return x; }

    function quieto() { // estado final: tubo prendido y contenido a la vista
      cancelar();
      raiz.classList.add("nr-iniciado", "nr-listo");
    }

    function reproducir() {
      cancelar();
      raiz.classList.remove("nr-listo");
      raiz.classList.add("nr-iniciado");
      if (reducido || !o.intro) { quieto(); return; }
      var k = o.revealDuration / 2500;          // escala de todos los tiempos
      var T = 2900 * k, delay = o.revealDelay;  // el tramo de luz dura 2,9 s con la duración por defecto
      var parpadeo = o.flicker > 0;

      // el tubo apagado aparece de a poco
      a(base, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 * k, delay: delay, easing: SUAVE });

      // dos titileos suaves del tramo central y después queda prendido
      var cuadros = parpadeo
        ? [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.07 }, { opacity: 0.12, offset: 0.15 }, { opacity: 1, offset: 0.23 }, { opacity: 0.2, offset: 0.31 }, { opacity: 1, offset: 0.4 }, { opacity: 1, offset: 1 }]
        : [{ opacity: 0, offset: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 1, offset: 1 }];
      a(nucleo, cuadros, { duration: T, delay: delay, easing: SUAVE });
      a(halo, cuadros, { duration: T, delay: delay, easing: SUAVE });

      // el tramo se expande hacia los lados, con arranque y llegada suaves
      a(lit, [{ transform: "scaleX(" + CHICO + ")", offset: 0 }, { transform: "scaleX(" + CHICO + ")", offset: 0.34, easing: EXPANDE }, { transform: "scaleX(1)", offset: 1 }],
        { duration: T, delay: delay, easing: "linear" });

      // el cuenco de luz nace proporcional al tramo, titila con él y crece con la misma curva
      var chico = "scale(0.12, 0.12)";
      var fl = parpadeo
        ? [[0, 0], [0.07, 0.95], [0.15, 0.25], [0.23, 0.95], [0.31, 0.3], [0.4, 0.9]]
        : [[0, 0], [0.4, 0.9]];
      var kd = fl.map(function (f, i) { var k = { opacity: f[1], transform: chico, offset: f[0] }; if (i === fl.length - 1) k.easing = EXPANDE; return k; });
      kd.push({ opacity: 1, transform: "scale(1, 1)", offset: 1 });
      a(derrame, kd, { duration: T, delay: delay, easing: "linear" });

      // el contenido aparece de arriba hacia abajo, siguiendo a la luz
      var hijos = Array.prototype.slice.call(contenido.children);
      var ultima = null;
      hijos.forEach(function (h, i) {
        ultima = a(h, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 900 * k, delay: delay + (1600 + i * 300) * k, easing: ENTRADA });
      });

      var fin = animaciones.slice();
      Promise.all(fin.map(function (x) { return x.finished; })).then(function () {
        if (!animaciones.length) return;
        fin.forEach(function (x) { try { x.commitStyles(); } catch (e) {} x.cancel(); });
        animaciones = [];
        raiz.classList.add("nr-listo");
      }, function () {});
      return ultima;
    }

    if (o.interactive) {
      raiz.addEventListener("click", function (ev) {
        if (ev.target.closest("a,button,input,textarea,select,label")) return;
        reproducir();
      });
    }
    reproducir();
    return { replay: reproducir, subtituloMs: (o.revealDelay + (1600 + 1 * 300) * (o.revealDuration / 2500)) };
  }
  window.NeonReveal = NeonReveal;
})();
