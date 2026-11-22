/* Humo en el título: el texto se pinta con un shader de ruido (WebGL) en blancos y grises, muy lento.
   Es una versión propia de la idea del componente "Text Shader" de Framer: el texto de la página se usa solo para
   medir la caja; se dibuja de nuevo en un canvas y ese dibujo hace de máscara del humo.
   Si WebGL no está disponible, queda el texto normal. Con "reducir movimiento" se dibuja un solo cuadro. */
(function () {
  "use strict";
  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FRAG = [
    "precision mediump float;",
    "uniform vec2 u_res;uniform float u_t;uniform sampler2D u_mask;",
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
    "return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}",
    "float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}",
    "void main(){",
    "vec2 uv=gl_FragCoord.xy/u_res;",
    "vec2 p=vec2(uv.x*u_res.x/u_res.y,uv.y)*1.6;",
    "float t=u_t;",
    "vec2 q=vec2(fbm(p+vec2(0.,t*.9)),fbm(p+vec2(5.2,1.3)-vec2(t*.7,0.)));",
    "vec2 r=vec2(fbm(p+2.2*q+vec2(1.7,9.2)+t*.5),fbm(p+2.2*q+vec2(8.3,2.8)-t*.4));",
    "float v=fbm(p+2.4*r);",
    "v=smoothstep(.18,.88,v);",
    "vec3 dark=vec3(.50,.52,.55),mid=vec3(.80,.81,.83),light=vec3(.98,.98,.99);",
    "vec3 c=mix(dark,mid,smoothstep(0.,.5,v));c=mix(c,light,smoothstep(.45,1.,v));",
    "float a=texture2D(u_mask,vec2(uv.x,1.-uv.y)).a;",
    "gl_FragColor=vec4(c*a,a);}"
  ].join("\n");

  function SmokeText(el, o) {
    o = o || {};
    var velocidad = o.speed || 0.045;
    var reducido = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none";
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) return null;

    function sh(tipo, src) { var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, "u_res"), uT = gl.getUniformLocation(prog, "u_t");
    gl.uniform1i(gl.getUniformLocation(prog, "u_mask"), 0);
    var tex = gl.createTexture();
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var texto = (el.textContent || "").trim(), vivo = true, visible = true, w = 0, h = 0, raf = 0, t0 = performance.now();

    function mascara() {
      var cs = getComputedStyle(el), dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = el.getBoundingClientRect();
      w = Math.max(2, Math.round(r.width * dpr)); h = Math.max(2, Math.round(r.height * dpr));
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
      var c2 = document.createElement("canvas"); c2.width = w; c2.height = h;
      var x = c2.getContext("2d");
      x.font = cs.fontWeight + " " + (parseFloat(cs.fontSize) * dpr) + "px " + cs.fontFamily;
      x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillStyle = "#fff";
      if ("letterSpacing" in x) x.letterSpacing = (parseFloat(cs.letterSpacing) || 0) * dpr + "px";
      var m = x.measureText(texto);
      var asc = m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * dpr * 0.75, desc = m.actualBoundingBoxDescent || 0;
      x.fillText(texto, w / 2, h / 2 + (asc - desc) / 2);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c2);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    function pintar(t) {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, w, h); gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function cuadro(ahora) {
      raf = 0;
      if (!vivo) return;
      if (visible && !document.hidden) pintar(((ahora - t0) / 1000) * velocidad);
      raf = requestAnimationFrame(cuadro);
    }

    function iniciar() {
      el.style.position = "relative"; el.style.color = "transparent";
      el.appendChild(canvas);
      mascara(); pintar(2.5);
      if (!reducido) raf = requestAnimationFrame(cuadro);
    }
    var listo = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    listo.then(iniciar);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { if (canvas.parentNode) { mascara(); pintar((performance.now() - t0) / 1000 * velocidad + 2.5); } }) : null;
    if (ro) ro.observe(el);
    var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es.some(function (e) { return e.isIntersecting; }); }) : null;
    if (io) io.observe(el);
    return { destroy: function () { vivo = false; if (raf) cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); if (canvas.parentNode) canvas.parentNode.removeChild(canvas); el.style.color = ""; } };
  }
  window.SmokeText = SmokeText;
})();
