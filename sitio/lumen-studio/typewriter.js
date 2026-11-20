/* Rotador de palabras con efecto de máquina de escribir.
   Reproduce el modo "Typewriter" del componente AnimatedTextRotator de Framer: escribe cada palabra letra por letra,
   la sostiene, la borra al doble de velocidad y pasa a la siguiente, con un cursor que parpadea.
   Para lectores de pantalla el texto animado se oculta y queda una frase fija. Con "reducir movimiento" no se anima. */
(function () {
  "use strict";
  function Typewriter(el, opciones) {
    var o = Object.assign({ words: [], stagger: 0.07, hold: 1.6, caret: true, loop: true }, opciones || {});
    var words = o.words.filter(Boolean);
    if (!el || !words.length) return null;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var texto = document.createElement("span");
    texto.setAttribute("aria-hidden", "true");
    texto.style.whiteSpace = "pre";
    el.textContent = "";
    el.appendChild(texto);
    var cursor = null;
    if (o.caret && !reducido) {
      cursor = document.createElement("span");
      cursor.className = "cursor";
      cursor.setAttribute("aria-hidden", "true");
      el.appendChild(cursor);
    }
    if (reducido) { texto.textContent = words[0]; return { stop: function () {} }; }

    var muerto = false, visible = true;
    function esperar(s) { return new Promise(function (ok) { setTimeout(ok, s * 1000); }); }
    function puerta() {
      return new Promise(function (ok) {
        (function mirar() { if (muerto || (visible && !document.hidden)) ok(); else setTimeout(mirar, 200); })();
      });
    }
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { visible = es.some(function (e) { return e.isIntersecting; }); }) : null;
    if (io) io.observe(el);

    (async function correr() {
      var i = 0;
      while (!muerto) {
        var letras = Array.from(words[i % words.length]);
        for (var k = 1; k <= letras.length; k++) {
          await puerta(); if (muerto) return;
          texto.textContent = letras.slice(0, k).join("");
          await esperar(Math.max(0.015, o.stagger));
        }
        if (!o.loop && i % words.length === words.length - 1) return;
        await esperar(o.hold);
        for (var j = letras.length - 1; j >= 0; j--) {
          await puerta(); if (muerto) return;
          texto.textContent = letras.slice(0, j).join("");
          await esperar(Math.max(0.01, o.stagger * 0.5));
        }
        await esperar(0.15);
        i++;
      }
    })();
    return { stop: function () { muerto = true; if (io) io.disconnect(); } };
  }
  window.Typewriter = Typewriter;
})();
