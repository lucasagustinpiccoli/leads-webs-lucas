/* Carrusel 3D de proyectos: celulares en una tira infinita que deriva sola, se arrastra, responde a la rueda y al
   trackpad con inercia, y inclina cada celular según su distancia al centro. Sin librerías. Con "reducir movimiento"
   o sin JavaScript queda una fila que se desliza con el dedo. */
(function () {
  "use strict";
  var car = document.getElementById("car");
  if (!car) return;
  var pista = car.querySelector(".car-pista");
  var originales = Array.prototype.slice.call(pista.children);
  if (!originales.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Segunda tanda para cerrar el lazo; solo se ve, no se lee dos veces
  originales.forEach(function (el) {
    var c = el.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
    pista.appendChild(c);
  });
  car.classList.add("car-js");
  var items = Array.prototype.slice.call(pista.children);
  var N = originales.length, total = items.length;
  var ancho = 0, paso = 0, periodo = 0, w = 230, g = 44, x = 0, vel = 0, deriva = 26, destino = null;
  var arrastrando = false, movido = 0, ultimoX = 0, ultimoT = 0, pausado = false, visible = false, raf = 0, antes = 0;

  function medir() {
    var s = getComputedStyle(car);
    w = parseFloat(s.getPropertyValue("--tw")) || 230;
    g = parseFloat(s.getPropertyValue("--tg")) || 44;
    ancho = car.clientWidth; paso = w + g; periodo = total * paso;
  }
  function mod(a, m) { return ((a % m) + m) % m; }

  function pintar() {
    var centro = ancho / 2;
    for (var i = 0; i < total; i++) {
      var px = mod(i * paso - x + paso, periodo) - paso;
      var d = (px + w / 2 - centro) / (ancho / 2);
      var a = Math.min(Math.abs(d), 1.6);
      var giro = Math.max(-1, Math.min(1, d)) * -24;
      var esc = 1 - a * 0.09;
      items[i].style.transform = "translate3d(" + px.toFixed(1) + "px,0,0) translateZ(" + (-a * 110).toFixed(0) + "px) rotateY(" + giro.toFixed(1) + "deg) scale(" + esc.toFixed(3) + ")";
      items[i].style.zIndex = String(100 - Math.round(a * 50));
    }
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    var dt = Math.min((t - antes) / 1000, 0.05); antes = t;
    if (destino !== null && !arrastrando) {
      var dif = destino - x;
      x += dif * Math.min(1, dt * 7);
      if (Math.abs(dif) < 0.5) destino = null;
    } else if (!arrastrando) {
      x += vel * dt;
      vel *= Math.pow(0.04, dt);            // la inercia se apaga sola
      if (Math.abs(vel) < 8) vel = 0;
      if (!pausado && vel === 0) x += deriva * dt;
    }
    pintar();
  }

  function arrancar() { if (raf || !visible) return; antes = performance.now(); raf = requestAnimationFrame(tick); }
  function frenar() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  // Arrastre con el dedo o el mouse, con inercia al soltar
  car.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    arrastrando = true; movido = 0; destino = null; vel = 0;
    ultimoX = e.clientX; ultimoT = performance.now();
    car.classList.add("arrastrando");
  });
  window.addEventListener("pointermove", function (e) {
    if (!arrastrando) return;
    var dx = e.clientX - ultimoX, ahora = performance.now(), dt = Math.max(ahora - ultimoT, 1);
    if (Math.abs(dx) > 0) { movido += Math.abs(dx); x -= dx; vel = (-dx / dt) * 1000 * 0.6 + vel * 0.4; }
    ultimoX = e.clientX; ultimoT = ahora;
    if (movido > 6 && e.pointerId !== undefined) { try { car.setPointerCapture(e.pointerId); } catch (_) {} }
  });
  function soltar() { if (!arrastrando) return; arrastrando = false; car.classList.remove("arrastrando"); if (performance.now() - ultimoT > 90) vel = 0; }
  window.addEventListener("pointerup", soltar);
  window.addEventListener("pointercancel", soltar);
  // Un arrastre no debe abrir la demo
  car.addEventListener("click", function (e) { if (movido > 6) { e.preventDefault(); e.stopPropagation(); movido = 0; } }, true);
  car.addEventListener("dragstart", function (e) { e.preventDefault(); });

  // Trackpad y rueda horizontal; la rueda vertical sigue moviendo la página
  car.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); destino = null; vel += e.deltaX * 6; }
  }, { passive: false });

  // Pausa con el cursor encima o con el foco adentro
  car.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") pausado = true; });
  car.addEventListener("pointerleave", function () { pausado = false; });
  car.addEventListener("focusin", function (e) {
    pausado = true;
    var el = e.target.closest(".car-item");
    if (!el) return;
    var i = items.indexOf(el);
    var px = mod(i * paso - x + paso, periodo) - paso;
    destino = x + (px + w / 2 - ancho / 2);
  });
  car.addEventListener("focusout", function () { pausado = false; });

  // Solo se anima mientras se ve
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? arrancar() : frenar(); }, { rootMargin: "120px" }).observe(car);
  } else { visible = true; arrancar(); }
  document.addEventListener("visibilitychange", function () { document.hidden ? frenar() : arrancar(); });
  window.addEventListener("resize", function () { medir(); pintar(); });

  medir();
  x = -paso * 0.2;
  pintar();
})();
