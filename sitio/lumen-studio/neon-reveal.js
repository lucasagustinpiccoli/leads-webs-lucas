/* Apertura "Neon Reveal": un tubo de neón se enciende en el borde de arriba, parpadea al prenderse y su luz baja
   revelando el contenido. Inspirada en la descripción pública del componente Neon Reveal de React Bits Pro
   (https://pro.reactbits.dev/docs/components/neon-reveal); es una versión propia en JavaScript puro, no el componente
   licenciado. Los nombres y valores por defecto de las opciones siguen los de esa documentación.
   Uso: NeonReveal(contenedor, { contenido: elemento_a_revelar }). Devuelve { replay() }. */
(function () {
  "use strict";
  var DEFAULTS = {
    colors: ["#FF9FFC", "#B163E9"], revealDelay: 300, revealDuration: 2500, thickness: 3, glow: 1, spill: 1, reach: 1,
    intensity: 1, feather: 0.15, inset: 24, length: 0.9, hum: 1, flicker: 1, interactive: true, intro: true
  };
  function salida(t) { return 1 - Math.pow(1 - t, 3); }
  function rgba(hex, a) {
    var n = parseInt(hex.replace("#", ""), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function NeonReveal(raiz, opciones) {
    var o = Object.assign({}, DEFAULTS, opciones || {});
    var contenido = o.contenido;
    if (!raiz || !contenido) return null;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var tubo = o.colors[0], luz = o.colors[1];

    var capa = document.createElement("div");
    capa.className = "nr-capa";
    capa.setAttribute("aria-hidden", "true");
    var derrame = document.createElement("div");
    derrame.className = "nr-derrame";
    var barra = document.createElement("div");
    barra.className = "nr-tubo";
    var halo = document.createElement("div");
    halo.className = "nr-halo";
    capa.appendChild(derrame); capa.appendChild(halo); capa.appendChild(barra);
    raiz.insertBefore(capa, raiz.firstChild);

    var largo = Math.min(1, Math.max(0.1, o.length));
    // Geometría y colores: el tubo tiene un núcleo casi blanco con extremos redondeados y una luz que baja del tono claro al oscuro
    function oscuro(hex, k) {
      var n = parseInt(hex.replace("#", ""), 16);
      return "rgb(" + Math.round((n >> 16 & 255) * k) + "," + Math.round((n >> 8 & 255) * k) + "," + Math.round((n & 255) * k) + ")";
    }
    var hondo = oscuro(luz, 0.42);
    var izq = ((1 - largo) / 2 * 100) + "%";
    barra.style.cssText = "top:" + o.inset + "px;left:" + izq + ";width:" + (largo * 100) + "%;height:" + o.thickness + "px;" +
      "background:#fff;border-radius:" + o.thickness + "px;";
    halo.style.cssText = "top:" + (o.inset - 26 * o.glow) + "px;left:calc(" + izq + " - 2%);width:" + (largo * 100 + 4) + "%;height:" + (o.thickness + 52 * o.glow) + "px;" +
      "background:radial-gradient(ellipse at 50% 50%," + rgba(tubo, 0.7 * o.intensity) + "," + rgba(luz, 0.35 * o.intensity) + " 48%,transparent 74%);filter:blur(" + (10 * o.glow) + "px);";
    derrame.style.cssText = "top:" + o.inset + "px;height:" + (78 * o.reach) + "%;" +
      "background:" +
      "linear-gradient(to bottom," + rgba(tubo, 0.55 * o.spill * o.intensity) + "," + rgba(tubo, 0) + " 22%)," +
      "radial-gradient(ellipse 78% 100% at 50% 0%," + rgba(tubo, 0.9 * o.spill * o.intensity) + " 0%," + rgba(luz, 0.82 * o.spill * o.intensity) + " 26%," + rgba(hondo, 0.7 * o.spill * o.intensity) + " 58%,transparent 100%);";

    function aplicar(p, enc, frac) {
      // p: avance de la luz sobre el contenido (0 a 1), enc: encendido del tubo (0 a 1), frac: largo encendido (0 a 1)
      var borde = (p * (100 + o.feather * 100)).toFixed(2);
      var mask = "linear-gradient(to bottom,#000 calc(" + borde + "% - " + (o.feather * 100) + "%),transparent " + borde + "%)";
      contenido.style.webkitMaskImage = mask; contenido.style.maskImage = mask;
      barra.style.opacity = Math.min(1, enc * o.intensity);
      barra.style.transform = "scaleX(" + frac.toFixed(4) + ")";
      barra.style.boxShadow = enc > 0.02 ? "0 0 2px 1px #fff,0 0 " + (8 * o.glow) + "px 2px " + tubo + ",0 0 " + (22 * o.glow) + "px 6px " + rgba(tubo, 0.8) + ",0 0 " + (60 * o.glow) + "px 14px " + rgba(luz, 0.7) : "none";
      halo.style.opacity = enc;
      halo.style.transform = "scaleX(" + frac.toFixed(4) + ")";
      derrame.style.opacity = Math.min(1, enc * (0.22 + 0.78 * Math.max(p, frac * 0.7)));
      derrame.style.transform = "scale(" + frac.toFixed(4) + "," + (0.25 + 0.75 * p).toFixed(4) + ")";
    }

    var raf = 0, ejecucion = 0;
    function parar() { cancelAnimationFrame(raf); raf = 0; ejecucion++; }

    function quieto() { // estado final: contenido revelado y tubo prendido
      aplicar(1, 1, 1);
      contenido.style.webkitMaskImage = ""; contenido.style.maskImage = "";
      raiz.classList.add("nr-listo");
    }

    /* Línea de tiempo: una porción chica del centro titila dos veces, queda prendida, se expande hacia los lados
       y la luz baja revelando el contenido. */
    var CHICO = 0.06, PARPADEO_FIN = 580, EXPANDE = 1100, LUZ_DESDE = 700;
    function reproducir() {
      parar();
      raiz.classList.remove("nr-listo");
      if (reducido || !o.intro) { quieto(); return; }
      var mia = ejecucion, t0 = performance.now() + o.revealDelay;
      aplicar(0, 0, CHICO);
      (function paso(ahora) {
        if (mia !== ejecucion) return;
        var ms = ahora - t0;
        if (ms >= o.revealDuration) { quieto(); return; }
        if (ms < 0) { raf = requestAnimationFrame(paso); return; }
        var enc = 1, frac = CHICO;
        if (ms < PARPADEO_FIN) {
          enc = o.flicker > 0 ? ((ms < 150) || (ms >= 290 && ms < 440) ? 1 : 0) : Math.min(1, ms / PARPADEO_FIN);
        } else {
          frac = CHICO + (1 - CHICO) * salida(Math.min(1, (ms - PARPADEO_FIN) / EXPANDE));
        }
        var p = salida(Math.max(0, Math.min(1, (ms - LUZ_DESDE) / (o.revealDuration - LUZ_DESDE))));
        aplicar(p, enc, frac);
        raf = requestAnimationFrame(paso);
      })(performance.now());
    }

    if (o.interactive) {
      raiz.addEventListener("click", function (ev) {
        if (ev.target.closest("a,button,input,textarea,select,label")) return;
        reproducir();
      });
    }
    reproducir();
    return { replay: reproducir };
  }
  window.NeonReveal = NeonReveal;
})();
