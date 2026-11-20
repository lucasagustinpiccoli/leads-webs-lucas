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

    // Geometría y colores del tubo y de la luz
    var largo = Math.min(1, Math.max(0.1, o.length));
    barra.style.cssText = "top:" + o.inset + "px;left:" + ((1 - largo) / 2 * 100) + "%;width:" + (largo * 100) + "%;height:" + o.thickness + "px;" +
      "background:linear-gradient(90deg," + rgba(luz, 0) + "," + tubo + " 14%," + tubo + " 86%," + rgba(luz, 0) + ");" +
      "border-radius:" + o.thickness + "px;";
    halo.style.cssText = "top:" + (o.inset - 18 * o.glow) + "px;left:" + ((1 - largo) / 2 * 100) + "%;width:" + (largo * 100) + "%;height:" + (o.thickness + 36 * o.glow) + "px;" +
      "background:radial-gradient(ellipse at 50% 50%," + rgba(tubo, 0.55 * o.intensity) + "," + rgba(luz, 0.25 * o.intensity) + " 45%,transparent 72%);filter:blur(" + (8 * o.glow) + "px);";
    derrame.style.cssText = "top:" + o.inset + "px;height:" + (60 * o.reach) + "%;" +
      "background:radial-gradient(ellipse 62% 100% at 50% 0%," + rgba(luz, 0.5 * o.spill * o.intensity) + "," + rgba(luz, 0.16 * o.spill * o.intensity) + " 46%,transparent 78%);";

    var hum = null;
    function aplicar(p, enc, tapa) {
      // p: progreso de la revelación (0 a 1), enc: encendido del tubo (0 a 1)
      var borde = (p * (100 + o.feather * 100)).toFixed(2);
      var mask = "linear-gradient(to bottom,#000 calc(" + borde + "% - " + (o.feather * 100) + "%),transparent " + borde + "%)";
      contenido.style.webkitMaskImage = mask; contenido.style.maskImage = mask;
      barra.style.opacity = enc * o.intensity;
      barra.style.transform = "scaleX(" + Math.min(1, enc * 1.6) + ")";
      barra.style.boxShadow = enc > 0.02 ? "0 0 " + (6 * o.glow) + "px " + rgba(tubo, 0.9) + ",0 0 " + (22 * o.glow) + "px " + rgba(tubo, 0.55) + ",0 0 " + (54 * o.glow) + "px " + rgba(luz, 0.45) + "" : "none";
      halo.style.opacity = enc;
      derrame.style.opacity = Math.min(1, enc * (0.25 + p * 0.9));
      derrame.style.transform = "scaleY(" + (0.25 + 0.75 * p) + ")";
      if (tapa) contenido.style.visibility = "visible";
    }

    var raf = 0, ejecucion = 0;
    function parar() { cancelAnimationFrame(raf); raf = 0; ejecucion++; }

    function quieto() { // estado final: contenido revelado y tubo prendido
      contenido.style.webkitMaskImage = ""; contenido.style.maskImage = "";
      aplicar(1, 1, true);
      contenido.style.webkitMaskImage = ""; contenido.style.maskImage = "";
      raiz.classList.add("nr-listo");
      if (o.hum > 0 && !reducido) capa.style.setProperty("--nr-hum", o.hum);
    }

    function reproducir() {
      parar();
      raiz.classList.remove("nr-listo");
      if (reducido || !o.intro) { quieto(); return; }
      var mia = ejecucion, t0 = performance.now() + o.revealDelay;
      aplicar(0, 0, true);
      (function paso(ahora) {
        if (mia !== ejecucion) return;
        var t = Math.max(0, (ahora - t0) / o.revealDuration);
        if (t >= 1) { quieto(); return; }
        // el tubo se enciende en el primer 22% con tartamudeos; después la luz baja
        var e = Math.min(1, t / 0.22);
        var enc = e;
        if (e < 1 && o.flicker > 0) enc = e * (Math.random() < 0.38 * o.flicker ? 0.25 + Math.random() * 0.4 : 1);
        var p = salida(Math.max(0, (t - 0.08) / 0.92));
        aplicar(p, enc, true);
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
