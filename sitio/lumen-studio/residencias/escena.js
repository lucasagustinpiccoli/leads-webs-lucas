/* Torre en 3D, armada en la propia página con three.js (sin imágenes). La cámara recorre el edificio mientras se baja:
   cada capítulo del texto (data-cap) corresponde a un plano. Es una visualización de ejemplo: los renders reales del estudio
   reemplazan esta escena. Sin WebGL o sin JavaScript, la página se lee igual sobre un fondo de cielo. */
(function () {
  "use strict";
  var canvas = document.getElementById("lienzo");
  if (!canvas || !window.THREE) return;
  var THREE = window.THREE, renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { return; }
  document.documentElement.classList.add("con-3d");
  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x14233a, 55, 170);
  var cam = new THREE.PerspectiveCamera(36, 1, 0.1, 500);

  /* ---------- luces ---------- */
  var hemi = new THREE.HemisphereLight(0xbcd4ff, 0x0b1118, 0.7); scene.add(hemi);
  var sol = new THREE.DirectionalLight(0xffb98a, 1.2); sol.position.set(-30, 22, 28); scene.add(sol);

  /* ---------- torre ---------- */
  var PISOS = 14, ALTO = 1.0, BASE_Y = 2.0, W = 9.6, D = 6.8;
  var matLosa = new THREE.MeshStandardMaterial({ color: 0xe3e7ec, roughness: 0.55, metalness: 0.05 });
  var matVidrio = new THREE.MeshStandardMaterial({ color: 0x17283a, roughness: 0.18, metalness: 0.75 });
  var matBorde = new THREE.MeshStandardMaterial({ color: 0x9fb4c8, roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.55 });
  var matLuz = new THREE.MeshBasicMaterial({ color: 0x8fe8ff });
  var torre = new THREE.Group(); scene.add(torre);
  var pisos = [], tiras = [];
  function caja(w, h, d, mat, x, y, z, padre) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); (padre || torre).add(m); return m; }

  // podio de acceso
  caja(26, 2, 18, new THREE.MeshStandardMaterial({ color: 0x1b2937, roughness: 0.5, metalness: 0.3 }), 0, 1, 0);
  caja(11, 0.9, 0.06, new THREE.MeshBasicMaterial({ color: 0xffcf8a }), 0, 0.95, 9.04);
  caja(24, 0.12, 0.5, matBorde, 0, 2.06, 8.4);

  for (var i = 0; i < PISOS; i++) {
    var g = new THREE.Group();
    g.position.set(Math.sin(i * 0.5) * 0.9, BASE_Y + i * ALTO, Math.cos(i * 0.37) * 0.6);
    g.rotation.y = i * 0.024;
    torre.add(g);
    caja(W + (i % 2 ? 0.5 : 0), 0.26, D + (i % 3 === 0 ? 0.5 : 0), matLosa, 0, 0.13, 0, g);
    caja(W - 0.3, ALTO - 0.26, D - 0.3, matVidrio, 0, 0.26 + (ALTO - 0.26) / 2, 0, g);
    var lado = i % 2 ? 1 : -1;
    caja(W * 0.46, 0.1, 1.3, matLosa, lado * W * 0.22, 0.31, D / 2 + 0.55, g);       // balcón
    caja(W * 0.46, 0.34, 0.05, matBorde, lado * W * 0.22, 0.5, D / 2 + 1.18, g);      // baranda de vidrio
    var tira = caja(0.09, ALTO - 0.26, 0.09, new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.15 }), W / 2 - 0.12, 0.26 + (ALTO - 0.26) / 2, D / 2 - 0.12, g);
    tiras.push(tira); pisos.push(g);
  }
  // terraza con pileta
  var techo = new THREE.Group(); techo.position.set(pisos[PISOS - 1].position.x, BASE_Y + PISOS * ALTO, pisos[PISOS - 1].position.z); techo.rotation.y = PISOS * 0.024; torre.add(techo);
  caja(W, 0.26, D, matLosa, 0, 0.13, 0, techo);
  caja(5.2, 0.06, 2.4, new THREE.MeshBasicMaterial({ color: 0x5ee8ff }), -1.4, 0.3, 0.4, techo);
  caja(5.6, 0.34, 0.06, matBorde, -1.4, 0.42, 1.68, techo);
  caja(2.6, 0.08, 4.6, new THREE.MeshStandardMaterial({ color: 0xb59a74, roughness: 0.8 }), 3.2, 0.3, 0, techo);   // solárium
  for (var k = 0; k < 5; k++) { var s = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2f6b4a, roughness: 0.9 })); s.position.set(-3.8 + k * 0.7, 0.55, -2.6); techo.add(s); }

  /* ---------- ventanas con luz (se encienden de noche) ---------- */
  var geoV = new THREE.PlaneGeometry(0.86, 0.5), matV = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var tmp = new THREE.Object3D(), ventanas = [];
  var caras = [{ n: 7, z: D / 2 - 0.14, ry: 0, span: W - 1.4 }, { n: 7, z: D / 2 - 0.14, ry: Math.PI, span: W - 1.4 }, { n: 4, z: W / 2 - 0.14, ry: Math.PI / 2, span: D - 1.2 }, { n: 4, z: W / 2 - 0.14, ry: -Math.PI / 2, span: D - 1.2 }];
  var total = 0; caras.forEach(function (c) { total += c.n; }); total *= PISOS;
  var inst = new THREE.InstancedMesh(geoV, matV, total); inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  var idx = 0;
  function azar(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  pisos.forEach(function (g, pi) {
    g.updateMatrixWorld(true);
    caras.forEach(function (c, ci) {
      for (var j = 0; j < c.n; j++) {
        var u = (j - (c.n - 1) / 2) * (c.span / c.n);
        var local = new THREE.Object3D(); local.rotation.y = c.ry;
        if (ci < 2) local.position.set(ci === 0 ? u : -u, 0.26 + (ALTO - 0.26) / 2, ci === 0 ? c.z : -c.z);
        else local.position.set(ci === 2 ? c.z : -c.z, 0.26 + (ALTO - 0.26) / 2, ci === 2 ? -u : u);
        local.updateMatrix();
        tmp.matrix.copy(g.matrixWorld).multiply(local.matrix);
        inst.setMatrixAt(idx, tmp.matrix);
        var r = azar(pi * 91 + ci * 17 + j * 7 + 3);
        ventanas.push(r < 0.62 ? 0.45 + r * 0.9 : 0.03);
        idx++;
      }
    });
  });
  torre.add(inst);
  var cFria = new THREE.Color(0x203248), cCalida = new THREE.Color(0xffd699), cTmp = new THREE.Color();
  function pintarVentanas(noche) {
    for (var q = 0; q < ventanas.length; q++) {
      cTmp.copy(cFria).lerp(cCalida, Math.min(1, ventanas[q] * noche)); inst.setColorAt(q, cTmp);
    }
    inst.instanceColor.needsUpdate = true;
  }

  /* ---------- entorno ---------- */
  var suelo = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshStandardMaterial({ color: 0x0c131b, roughness: 0.9 }));
  suelo.rotation.x = -Math.PI / 2; scene.add(suelo);
  var rejilla = new THREE.GridHelper(300, 100, 0x1e3145, 0x132130); rejilla.position.y = 0.02; scene.add(rejilla);
  var plaza = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 0.16, 72), new THREE.MeshStandardMaterial({ color: 0x182534, roughness: 0.7 })); plaza.position.y = 0.08; scene.add(plaza);
  [0, 1].forEach(function (a) { var calle = new THREE.Mesh(new THREE.BoxGeometry(a ? 14 : 400, 0.03, a ? 400 : 14), new THREE.MeshStandardMaterial({ color: 0x0a0f15, roughness: 0.95 })); calle.position.set(a ? -52 : 0, 0.03, a ? 0 : 42); scene.add(calle); });
  var vecinos = new THREE.Group(); scene.add(vecinos);
  var matV2 = new THREE.MeshStandardMaterial({ color: 0x111a24, roughness: 0.6, metalness: 0.25 });
  for (var v = 0; v < 26; v++) {
    var ang = v * 2.399, rad = 48 + (v % 5) * 14 + azar(v) * 22;
    var h = 5 + azar(v + 40) * 24, w = 7 + azar(v + 80) * 9, d = 7 + azar(v + 120) * 9;
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matV2); b.position.set(Math.cos(ang) * rad, h / 2, Math.sin(ang) * rad - 12); vecinos.add(b);
  }
  var arboles = new THREE.InstancedMesh(new THREE.ConeGeometry(0.95, 2.6, 7), new THREE.MeshStandardMaterial({ color: 0x1f4a35, roughness: 0.9 }), 64);
  for (var t = 0; t < 64; t++) {
    var a2 = t / 64 * Math.PI * 2, r2 = 21.5 + azar(t) * 5; var esc = 0.7 + azar(t + 9) * 0.8;
    tmp.position.set(Math.cos(a2) * r2, 1.3 * esc, Math.sin(a2) * r2); tmp.scale.set(esc, esc, esc); tmp.rotation.set(0, 0, 0); tmp.updateMatrix(); arboles.setMatrixAt(t, tmp.matrix);
  }
  scene.add(arboles);
  var estrellas = (function () {
    var pos = new Float32Array(420 * 3);
    for (var s2 = 0; s2 < 420; s2++) { var th = azar(s2) * Math.PI * 2, ph = Math.acos(azar(s2 + 500) * 0.9 + 0.08); pos[s2 * 3] = 220 * Math.sin(ph) * Math.cos(th); pos[s2 * 3 + 1] = 220 * Math.cos(ph) + 10; pos[s2 * 3 + 2] = 220 * Math.sin(ph) * Math.sin(th); }
    var geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0, fog: false })); scene.add(p); return p;
  })();

  /* ---------- planos de cámara, uno por capítulo ---------- */
  var K = [
    { p: [30, 9, 40], t: [0, 9, 0], n: 0.0, d: -4 },
    { p: [-22, 10, 27], t: [0, 9, 0], n: 0.18, d: 4 },
    { p: [14, 5, 15], t: [0, 5, 0], n: 0.35, d: -4 },
    { p: [12, 10.5, 13], t: [0, 10.5, 0], n: 0.55, d: 4 },
    { p: [11, 15.5, 11], t: [0, 15.5, 0], n: 0.75, d: -4 },
    { p: [8, 19.5, 9], t: [0, 16.4, -1], n: 0.95, d: 4 },
    { p: [0, 27, 38], t: [0, 10, 0], n: 1.0, d: -4 }
  ];
  var SKY = {
    dia: { top: [43, 58, 99], med: [138, 106, 142], hor: [242, 168, 122] },
    noche: { top: [4, 6, 11], med: [10, 18, 32], hor: [20, 35, 58] }
  };
  var cielo = document.getElementById("cielo");
  function mezcla(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
  var nocheMostrada = -1;
  function aplicarNoche(n) {
    if (Math.abs(n - nocheMostrada) < 0.01) return;
    nocheMostrada = n;
    var top = mezcla(SKY.dia.top, SKY.noche.top, n), med = mezcla(SKY.dia.med, SKY.noche.med, n), hor = mezcla(SKY.dia.hor, SKY.noche.hor, n);
    if (cielo) cielo.style.background = "linear-gradient(180deg," + rgb(top) + " 0%," + rgb(med) + " 52%," + rgb(hor) + " 100%)";
    scene.fog.color.setRGB(hor[0] / 255, hor[1] / 255, hor[2] / 255);
    sol.intensity = 1.25 - n * 1.0; sol.color.setHex(n < 0.5 ? 0xffb98a : 0x7d9bff); hemi.intensity = 0.75 - n * 0.35;
    estrellas.material.opacity = Math.max(0, (n - 0.4) / 0.6) * 0.9;
    pintarVentanas(n);
  }

  /* ---------- scroll: posición fraccional entre capítulos ---------- */
  var caps = [].slice.call(document.querySelectorAll("[data-cap]"));
  var centros = [];
  function medir() { centros = caps.map(function (c) { var r = c.getBoundingClientRect(); return r.top + window.scrollY + r.height / 2; }); }
  function fraccion() {
    if (!centros.length) return 0;
    var y = window.scrollY + window.innerHeight / 2;
    if (y <= centros[0]) return 0;
    for (var i = 0; i < centros.length - 1; i++) if (y <= centros[i + 1]) return i + (y - centros[i]) / (centros[i + 1] - centros[i]);
    return centros.length - 1;
  }
  function suave(x) { return x * x * (3 - 2 * x); }
  var UP = new THREE.Vector3(0, 1, 0), meta = 0, actual = 0, pos = new THREE.Vector3(), mira = new THREE.Vector3(), aux = new THREE.Vector3();
  function planos(f) {
    var i = Math.min(K.length - 2, Math.floor(f)), u = suave(Math.min(1, Math.max(0, f - i)));
    var a = K[i], b = K[i + 1];
    pos.set(a.p[0] + (b.p[0] - a.p[0]) * u, a.p[1] + (b.p[1] - a.p[1]) * u, a.p[2] + (b.p[2] - a.p[2]) * u);
    mira.set(a.t[0] + (b.t[0] - a.t[0]) * u, a.t[1] + (b.t[1] - a.t[1]) * u, a.t[2] + (b.t[2] - a.t[2]) * u);
    // en pantallas anchas la torre se corre a un costado para dejar lugar al texto
    var d = window.innerWidth > 900 ? a.d + (b.d - a.d) * u : 0;
    if (d) { aux.subVectors(mira, pos).normalize(); aux.cross(UP).normalize(); mira.addScaledVector(aux, d); }
    return a.n + (b.n - a.n) * u;
  }
  var hud = document.getElementById("hud"), hudN = document.getElementById("hud-n");
  var resaltado = -1;
  function resaltarPiso(y, activo) {
    var p = activo ? Math.max(0, Math.min(PISOS - 1, Math.round((y - BASE_Y) / ALTO - 0.5))) : -1;
    if (p === resaltado) return; resaltado = p;
    tiras.forEach(function (t, q) { t.material.opacity = q === p ? 1 : q < p ? 0.55 : 0.15; });
    if (hud) { hud.classList.toggle("on", p >= 0); if (p >= 0 && hudN) hudN.textContent = String(p + 1).padStart(2, "0"); }
  }

  var visible = true, ultimo = performance.now();
  function ajustar() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < 700 ? 52 : 36; cam.updateProjectionMatrix(); medir();
  }
  function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    if (!visible || document.hidden) return;
    var dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
    meta = fraccion();
    actual += (meta - actual) * (reducido ? 1 : 1 - Math.pow(0.0006, dt));
    var n = planos(actual);
    if (!reducido) { var sway = Math.sin(ahora / 3200) * 0.35; pos.x += sway; pos.y += Math.cos(ahora / 4100) * 0.12; }
    cam.position.copy(pos); cam.lookAt(mira);
    aplicarNoche(Math.round(n * 100) / 100);
    resaltarPiso(mira.y, actual > 1.7 && actual < 4.6);
    renderer.render(scene, cam);
  }
  window.addEventListener("resize", ajustar);
  window.addEventListener("load", medir);
  if (window.ResizeObserver) new ResizeObserver(medir).observe(document.body);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(document.getElementById("escena"));
  ajustar(); aplicarNoche(0);
  window.Escena = { reajustar: ajustar };
  requestAnimationFrame(function (t) { ultimo = t; cuadro(t); });
})();
