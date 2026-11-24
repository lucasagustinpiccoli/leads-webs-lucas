/* Solana — Maqueta 3D interactiva amueblada con iluminación cálida, órbita libre, vista plana y hotspots 3D */
(function (global) {
  "use strict";

  var DEFAULTS = {
    yaw: -0.54,
    pitch: 0.66,
    zoom: 1.0
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function shadeHex(hex, factor) {
    var n = parseInt(hex.slice(1), 16);
    var r = clamp(Math.round(((n >> 16) & 255) * factor), 0, 255);
    var g = clamp(Math.round(((n >> 8) & 255) * factor), 0, 255);
    var b = clamp(Math.round((n & 255) * factor), 0, 255);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function createScene(tipo, opts) {
    var g = tipo.geo;
    var bal = g.bal;
    var minX = Math.min(0, bal[0]);
    var maxX = Math.max(g.W, bal[0] + bal[2]);
    var minY = 0;
    var maxY = g.H;
    var cx = (minX + maxX) / 2;
    var cy = (minY + maxY) / 2;
    var span = Math.max(maxX - minX, maxY - minY);

    var boxes = [];
    var lights = [];
    var floorCells = [];
    var hotspotCoords = [];

    function addBox(x, y, z, w, d, h, colors, tag, alpha) {
      boxes.push({
        x: x, y: y, z: z,
        w: w, d: d, h: h,
        top: colors.top,
        front: colors.front || shadeHex(colors.top, 0.80),
        side: colors.side || shadeHex(colors.top, 0.68),
        stroke: colors.stroke || null,
        alpha: alpha !== undefined ? alpha : 1,
        tag: tag || ""
      });
    }

    function addFloor(x, y, w, d, style, roomIdx) {
      var step = 1.65;
      var nx = Math.max(1, Math.round(w / step));
      var ny = Math.max(1, Math.round(d / step));
      var sx = w / nx, sy = d / ny;
      for (var ix = 0; ix < nx; ix++) {
        for (var iy = 0; iy < ny; iy++) {
          floorCells.push({
            x: x + ix * sx,
            y: y + iy * sy,
            w: sx + 0.015,
            d: sy + 0.015,
            style: style,
            roomIdx: roomIdx,
            grain: ((ix + iy) % 2) * 0.03
          });
        }
      }
    }

    // Plinto base arquitectónico (losa estructural)
    addBox(minX - 0.16, minY - 0.16, -0.34, (maxX - minX) + 0.32, (maxY - minY) + 0.32, 0.34, {
      top: "#292E38",
      front: "#181C24",
      side: "#11151D",
      stroke: "rgba(255,255,255,0.06)"
    }, "slab");

    // Paletas de materiales arquitectónicos (estilo Arbo calidez natural)
    var MAT = {
      wall: { top: "#F7F3EA", front: "#E6DFD2", side: "#D3CABB", stroke: "rgba(40,34,26,0.08)" },
      wallWarm: { top: "#F7F3EA", front: "#EFE2CB", side: "#DECBAE" },
      wood: { top: "#C59865", front: "#9F7444", side: "#845E35" },
      woodDark: { top: "#7B5636", front: "#5F4026", side: "#4A311C" },
      oak: { top: "#D9B98E", front: "#B8956A", side: "#9B7B54" },
      fabric: { top: "#EFEAE0", front: "#D8D0C2", side: "#C3B9A8" },
      cushion: { top: "#FBF8F1", front: "#E5DFD2", side: "#D3CCB9" },
      olive: { top: "#707D4B", front: "#576238", side: "#464F2C" },
      terra: { top: "#B87E5E", front: "#966247", side: "#794E38" },
      marble: { top: "#F7F5F0", front: "#E1DDD4", side: "#CBC6BC" },
      stoneDark: { top: "#383B40", front: "#272A2E", side: "#1D2024" },
      steel: { top: "#B7BEC4", front: "#8D959B", side: "#727980" },
      mullion: { top: "#2A2C30", front: "#1B1D21", side: "#121417" },
      rug: { top: "#DFD7C8", front: "#C8BFAE", side: "#B6AC9A" },
      sheet: { top: "#FCFBF7", front: "#E8E4DA", side: "#D8D2C5" },
      duvet: { top: "#D9CDB9", front: "#C2B49E", side: "#AE9F89" },
      leaf1: { top: "#6A874D", front: "#506839", side: "#3F532C" },
      leaf2: { top: "#82A160", front: "#637E47", side: "#4E6537" },
      glow: { top: "#FFE8B8", front: "#FFDA8E", side: "#E8BC66" }
    };

    function addRug(x, y, w, d) {
      addBox(x, y, 0.005, w, d, 0.028, MAT.rug, "rug");
    }

    function addPlant(px, py, baseZ, size) {
      var s = size || 0.42;
      addBox(px - s * 0.42, py - s * 0.42, baseZ, s * 0.84, s * 0.84, s * 0.9, MAT.stoneDark);
      addBox(px - s * 0.56, py - s * 0.56, baseZ + s * 0.72, s * 1.12, s * 1.12, s * 0.85, MAT.leaf1);
      addBox(px - s * 0.36, py - s * 0.25, baseZ + s * 1.35, s * 0.76, s * 0.72, s * 0.65, MAT.leaf2);
    }

    function addSofa(x, y, w, d, orient) {
      // orient: "down" mira hacia +y, "up" hacia -y, "right" hacia +x
      var hBase = 0.26, hSeat = 0.22, hBack = 0.74;
      if (orient === "right") {
        addBox(x, y, 0, w, d, hBase, MAT.woodDark);
        addBox(x, y, hBase, 0.28, d, hBack - hBase, MAT.fabric);
        addBox(x + 0.08, y, hBase, w - 0.14, 0.2, 0.4, MAT.fabric);
        addBox(x + 0.08, y + d - 0.2, hBase, w - 0.14, 0.2, 0.4, MAT.fabric);
        var segsY = w > 1.7 ? 2 : 1;
        var swY = (d - 0.46) / 3;
        for (var j = 0; j < 3; j++) {
          addBox(x + 0.26, y + 0.22 + j * swY + 0.02, hBase, w - 0.3, swY - 0.04, hSeat, MAT.cushion);
        }
        addBox(x + 0.28, y + 0.35, hBase + hSeat, 0.16, 0.36, 0.28, MAT.olive);
        addBox(x + 0.28, y + d - 0.72, hBase + hSeat, 0.16, 0.36, 0.28, MAT.terra);
      } else {
        addBox(x, y, 0, w, d, hBase, MAT.woodDark);
        addBox(x, y, hBase, w, 0.26, hBack - hBase, MAT.fabric);
        addBox(x, y + 0.1, hBase, 0.22, d - 0.1, 0.42, MAT.fabric);
        addBox(x + w - 0.22, y + 0.1, hBase, 0.22, d - 0.1, 0.42, MAT.fabric);
        var n = w > 1.9 ? 3 : 2;
        var cw = (w - 0.48) / n;
        for (var i = 0; i < n; i++) {
          addBox(x + 0.24 + i * cw + 0.02, y + 0.26, hBase, cw - 0.04, d - 0.32, hSeat, MAT.cushion);
        }
        addBox(x + 0.32, y + 0.28, hBase + hSeat, 0.38, 0.16, 0.28, MAT.olive);
        addBox(x + w - 0.72, y + 0.28, hBase + hSeat, 0.38, 0.16, 0.28, MAT.terra);
      }
    }

    function addArmchair(x, y, rotAlt) {
      addBox(x, y, 0, 0.82, 0.82, 0.24, MAT.woodDark);
      addBox(x + 0.05, y + 0.05, 0.24, 0.72, 0.72, 0.22, MAT.cushion);
      if (rotAlt) {
        addBox(x, y + 0.62, 0.24, 0.82, 0.2, 0.46, MAT.olive);
      } else {
        addBox(x, y, 0.24, 0.2, 0.82, 0.46, MAT.olive);
      }
    }

    function addCoffeeTable(cx0, cy0) {
      addBox(cx0 - 0.48, cy0 - 0.28, 0, 0.96, 0.56, 0.06, MAT.stoneDark);
      addBox(cx0 - 0.55, cy0 - 0.34, 0.06, 1.1, 0.68, 0.3, MAT.oak);
      // libro + florero cálido
      addBox(cx0 - 0.25, cy0 - 0.14, 0.36, 0.28, 0.22, 0.04, MAT.sheet);
      addBox(cx0 + 0.18, cy0 - 0.06, 0.36, 0.14, 0.14, 0.18, MAT.terra);
    }

    function addDiningSet(cx0, cy0, wT, dT, seats) {
      addBox(cx0 - wT * 0.22, cy0 - dT * 0.22, 0, wT * 0.44, dT * 0.44, 0.68, MAT.woodDark);
      addBox(cx0 - wT / 2, cy0 - dT / 2, 0.68, wT, dT, 0.07, MAT.oak);
      addBox(cx0 - 0.12, cy0 - 0.12, 0.75, 0.24, 0.24, 0.14, MAT.leaf1);
      var chairW = 0.42;
      var perSide = seats >= 6 ? 3 : 2;
      for (var i = 0; i < perSide; i++) {
        var ox = cx0 - wT / 2 + (wT / (perSide + 1)) * (i + 1) - chairW / 2;
        addBox(ox, cy0 - dT / 2 - 0.46, 0, chairW, 0.4, 0.44, MAT.fabric);
        addBox(ox, cy0 - dT / 2 - 0.46, 0.44, chairW, 0.1, 0.36, MAT.wood);
        addBox(ox, cy0 + dT / 2 + 0.06, 0, chairW, 0.4, 0.44, MAT.fabric);
        addBox(ox, cy0 + dT / 2 + 0.36, 0.44, chairW, 0.1, 0.36, MAT.wood);
      }
      if (seats >= 6) {
        addBox(cx0 - wT / 2 - 0.46, cy0 - chairW / 2, 0, 0.4, chairW, 0.44, MAT.fabric);
        addBox(cx0 + wT / 2 + 0.06, cy0 - chairW / 2, 0, 0.4, chairW, 0.44, MAT.fabric);
      }
    }

    function addBed(x, y, w, l, horizontal) {
      if (horizontal) {
        addRug(x - 0.35, y - 0.35, l + 0.85, w + 0.7);
        // cabecera contra pared x
        addBox(x, y - 0.2, 0, 0.14, w + 0.4, 1.15, MAT.woodDark);
        addBox(x + 0.14, y, 0, l, w, 0.26, MAT.oak);
        addBox(x + 0.18, y + 0.04, 0.26, l - 0.08, w - 0.08, 0.24, MAT.sheet);
        addBox(x + 0.78, y + 0.03, 0.28, l - 0.72, w - 0.06, 0.26, MAT.duvet);
        // almohadas
        var pw = (w - 0.28) / 2;
        addBox(x + 0.22, y + 0.08, 0.5, 0.42, pw, 0.14, MAT.cushion);
        addBox(x + 0.22, y + 0.2 + pw, 0.5, 0.42, pw, 0.14, MAT.cushion);
        // mesas de luz y lámparas cálidas
        addBox(x + 0.04, y - 0.54, 0, 0.44, 0.42, 0.48, MAT.wood);
        addBox(x + 0.18, y - 0.4, 0.48, 0.16, 0.16, 0.24, MAT.glow);
        addBox(x + 0.04, y + w + 0.12, 0, 0.44, 0.42, 0.48, MAT.wood);
        addBox(x + 0.18, y + w + 0.26, 0.48, 0.16, 0.16, 0.24, MAT.glow);
      } else {
        addRug(x - 0.42, y + 0.4, w + 0.84, Math.max(1.5, l - 0.2));
        addBox(x - 0.18, y, 0, w + 0.36, 0.14, 1.15, MAT.woodDark);
        addBox(x, y + 0.14, 0, w, l, 0.26, MAT.oak);
        addBox(x + 0.04, y + 0.18, 0.26, w - 0.08, l - 0.08, 0.24, MAT.sheet);
        addBox(x + 0.03, y + 0.8, 0.28, w - 0.06, l - 0.74, 0.26, MAT.duvet);
        var pw2 = (w - 0.28) / 2;
        addBox(x + 0.08, y + 0.24, 0.5, pw2, 0.42, 0.14, MAT.cushion);
        addBox(x + 0.2 + pw2, y + 0.24, 0.5, pw2, 0.42, 0.14, MAT.cushion);
        addBox(x - 0.52, y + 0.06, 0, 0.42, 0.42, 0.48, MAT.wood);
        addBox(x - 0.38, y + 0.19, 0.48, 0.15, 0.15, 0.24, MAT.glow);
        addBox(x + w + 0.1, y + 0.06, 0, 0.42, 0.42, 0.48, MAT.wood);
        addBox(x + w + 0.23, y + 0.19, 0.48, 0.15, 0.15, 0.24, MAT.glow);
      }
    }

    function addKitchen(x, y, w, d) {
      // mesada perimetral inferior o lateral hacia el fondo
      var md = 0.68;
      addBox(x + 0.1, y + d - md - 0.08, 0, w - 0.2, md, 0.86, MAT.wood);
      addBox(x + 0.08, y + d - md - 0.1, 0.86, w - 0.16, md + 0.04, 0.06, MAT.marble);
      // anafe negro + bacha acero
      addBox(x + 0.35, y + d - md, 0.92, 0.72, 0.48, 0.03, MAT.stoneDark);
      addBox(x + Math.max(1.2, w * 0.48), y + d - md + 0.04, 0.92, 0.58, 0.42, 0.02, MAT.steel);
      // heladera acero inoxidable
      addBox(x + w - 0.85, y + d - 0.78, 0, 0.76, 0.72, 1.95, MAT.steel);
      // alacena superior + tira LED cálida estilo Arbo
      addBox(x + 0.1, y + d - 0.42, 1.48, w - 1.0, 0.34, 0.62, MAT.woodDark);
      addBox(x + 0.16, y + d - 0.42, 1.44, w - 1.12, 0.06, 0.05, MAT.glow);
      // isla central si hay espacio
      if (w >= 3.0 && d >= 4.2) {
        var ix = x + 0.55, iy = y + 1.25, iw = w - 1.1, id = 0.95;
        addBox(ix, iy, 0, iw, id, 0.86, MAT.woodDark);
        addBox(ix - 0.04, iy - 0.04, 0.86, iw + 0.08, id + 0.08, 0.07, MAT.marble);
        for (var b = 0; b < 3; b++) {
          addBox(ix + 0.25 + b * (iw / 3.1), iy - 0.44, 0, 0.34, 0.34, 0.62, MAT.olive);
        }
      }
    }

    /* Baño: el lugar de cada artefacto se busca para que NINGUNO quede frente a una puerta (zona de giro) ni se pise con otro.
       Las posiciones salen de pocas opciones por artefacto (contra cada pared) y se elige la primera combinación que cumple. */
    function zonasPuerta(x, y, w, d) {
      var zonas = [];
      (g.doors || []).forEach(function (dr) {
        var dx = dr[0], dy = dr[1], L = dr[2], horiz = dr[3] === "h", abre = dr[4] !== "open", prof = (abre ? L : 0.5) + 0.12;
        if (horiz) {
          if (dx + L <= x + 0.05 || dx >= x + w - 0.05) return;
          if (Math.abs(dy - y) < 0.08) zonas.push([dx - x - 0.05, 0, L + 0.1, prof]);
          else if (Math.abs(dy - (y + d)) < 0.08) zonas.push([dx - x - 0.05, d - prof, L + 0.1, prof]);
        } else {
          if (dy + L <= y + 0.05 || dy >= y + d - 0.05) return;
          if (Math.abs(dx - x) < 0.08) zonas.push([0, dy - y - 0.05, prof, L + 0.1]);
          else if (Math.abs(dx - (x + w)) < 0.08) zonas.push([w - prof, dy - y - 0.05, prof, L + 0.1]);
        }
      });
      return zonas;
    }
    function pisa(a, b, m) { return a[0] < b[0] + b[2] + m && a[0] + a[2] + m > b[0] && a[1] < b[1] + b[3] + m && a[1] + a[3] + m > b[1]; }
    function addBathroom(x, y, w, d) {
      var zonas = zonasPuerta(x, y, w, d), tw = Math.min(1.65, w - 0.4), th = Math.min(1.65, d - 0.4), vw = Math.min(1.35, w - 0.45);
      var tinas = [
        { r: [0.14, 0.16, tw, 0.78], v: false }, { r: [0.14, d - 0.94, tw, 0.78], v: false },
        { r: [0.14, 0.16, 0.78, th], v: true }, { r: [w - 0.92, 0.16, 0.78, th], v: true }];
      var lavs = [
        { r: [w - vw - 0.15, d - 0.58, vw, 0.48], pared: "abajo" }, { r: [0.15, d - 0.58, vw, 0.48], pared: "abajo" },
        { r: [w - vw - 0.15, 0.1, vw, 0.48], pared: "arriba" }, { r: [0.15, 0.1, vw, 0.48], pared: "arriba" }];
      var inodoros = [
        { r: [0.24, d - 0.86, 0.42, 0.66] }, { r: [w - 0.66, d - 0.86, 0.42, 0.66] },
        { r: [0.24, 0.2, 0.42, 0.66] }, { r: [w - 0.66, 0.2, 0.42, 0.66] }];
      function libre(r) { return r[0] >= 0.05 && r[1] >= 0.05 && r[0] + r[2] <= w - 0.05 && r[1] + r[3] <= d - 0.05 && !zonas.some(function (z) { return pisa(r, z, 0); }); }
      var elegido = null;
      for (var ti = 0; ti < tinas.length && !elegido; ti++) {
        if (w < 2.2 && !tinas[ti].v && ti < 2) { /* baño angosto: la bañera va a lo largo si entra */ }
        if (!libre(tinas[ti].r)) continue;
        for (var li = 0; li < lavs.length && !elegido; li++) {
          if (!libre(lavs[li].r) || pisa(lavs[li].r, tinas[ti].r, 0.05)) continue;
          for (var ii = 0; ii < inodoros.length; ii++) {
            var iw = inodoros[ii].r;
            if (libre(iw) && !pisa(iw, tinas[ti].r, 0.05) && !pisa(iw, lavs[li].r, 0.05)) { elegido = { t: tinas[ti], l: lavs[li], i: inodoros[ii] }; break; }
          }
        }
      }
      if (!elegido) { // sin lugar para la bañera con la puerta libre: ducha cuadrada en la esquina más lejana
        for (var k = 0; k < inodoros.length && !elegido; k++) {
          for (var m = 0; m < lavs.length && !elegido; m++) {
            if (libre(lavs[m].r) && libre(inodoros[k].r) && !pisa(lavs[m].r, inodoros[k].r, 0.05)) elegido = { t: null, l: lavs[m], i: inodoros[k] };
          }
        }
      }
      if (!elegido) return;
      var L = elegido.l, T = elegido.t, I = elegido.i.r;
      // lavatorio + espejo retroiluminado sobre la pared que le toca
      addBox(x + L.r[0], y + L.r[1], 0.22, L.r[2], L.r[3], 0.56, MAT.woodDark);
      addBox(x + L.r[0] - 0.02, y + L.r[1] - 0.02, 0.78, L.r[2] + 0.04, L.r[3] + 0.04, 0.06, MAT.marble);
      addBox(x + L.r[0] + L.r[2] * 0.28, y + L.r[1] + 0.07, 0.84, 0.48, 0.34, 0.08, MAT.sheet);
      addBox(x + L.r[0] + 0.05, y + (L.pared === "abajo" ? d - 0.14 : 0.06), 1.05, L.r[2] - 0.1, 0.04, 0.78, MAT.glow);
      if (T) { // bañera
        addBox(x + T.r[0], y + T.r[1], 0, T.r[2], T.r[3], 0.52, MAT.sheet);
        addBox(x + T.r[0] + 0.14, y + T.r[1] + 0.1, 0.42, T.r[2] - 0.28, T.r[3] - 0.2, 0.12, MAT.marble);
      }
      // inodoro: pie y mochila contra la pared más cercana
      var arriba = elegido.i.r[1] < d / 2;
      addBox(x + I[0], y + I[1] + (arriba ? 0.2 : 0), 0, I[2], I[3] - 0.2, 0.4, MAT.sheet);
      addBox(x + I[0], y + (arriba ? I[1] : I[1] + I[3] - 0.2), 0.4, I[2], 0.2, 0.38, MAT.sheet);
    }

    function addStudy(x, y, w, d) {
      // biblioteca iluminada en pared trasera + escritorio
      var bw = Math.min(2.6, w - 0.6);
      var bx = x + (w - bw) / 2;
      addBox(bx, y + 0.1, 0, bw, 0.36, 2.05, MAT.woodDark);
      addBox(bx + 0.08, y + 0.12, 0.68, bw - 0.16, 0.06, 0.06, MAT.glow);
      addBox(bx + 0.08, y + 0.12, 1.32, bw - 0.16, 0.06, 0.06, MAT.glow);
      addBox(bx + 0.08, y + 0.12, 1.85, bw - 0.16, 0.06, 0.06, MAT.glow);

      addRug(bx + 0.1, y + 0.85, bw - 0.2, Math.min(1.35, d - 1.0));
      var dw = Math.min(1.65, w - 1.1), dx = x + (w - dw) / 2;
      addBox(dx, y + 0.88, 0, 0.08, 0.65, 0.72, MAT.stoneDark);
      addBox(dx + dw - 0.08, y + 0.88, 0, 0.08, 0.65, 0.72, MAT.stoneDark);
      addBox(dx, y + 0.86, 0.72, dw, 0.68, 0.05, MAT.oak);
      addBox(dx + dw / 2 - 0.28, y + 0.96, 0.77, 0.56, 0.06, 0.34, MAT.stoneDark);
      // silla
      addBox(dx + dw / 2 - 0.24, y + 1.62, 0, 0.48, 0.46, 0.44, MAT.olive);
      addBox(dx + dw / 2 - 0.24, y + 1.98, 0.44, 0.48, 0.09, 0.38, MAT.olive);
    }

    function addDressing(x, y, w, d) {
      addBox(x + 0.1, y + 0.1, 0, w - 0.2, 0.52, 2.0, MAT.woodDark);
      addBox(x + w - 0.58, y + 0.62, 0, 0.48, d - 0.72, 2.0, MAT.woodDark);
      addBox(x + 0.2, y + 0.16, 1.65, w - 0.4, 0.08, 0.06, MAT.glow);
      addBox(x + 0.35, y + d / 2, 0, 0.7, 0.5, 0.42, MAT.fabric);
    }

    // Construir pisos, luces y mobiliario de cada ambiente
    var hi = 0;
    tipo.amb.forEach(function (a) {
      var nom = a[0], rx = a[1], ry = a[2], rw = a[3], rh = a[4];
      var l = nom.toLowerCase();
      var esPasillo = /pasillo/i.test(nom);
      var roomIdx = esPasillo ? -1 : hi;

      var fStyle = l.indexOf("baño") > -1 ? "tile" : l.indexOf("cocina") > -1 ? "stone" : "wood";
      addFloor(rx, ry, rw, rh, fStyle, roomIdx);

      // Luz cálida interior 2700K centrada en cada ambiente
      lights.push({
        x: rx + rw * 0.5,
        y: ry + rh * 0.5,
        r: Math.max(rw, rh) * 0.78,
        roomIdx: roomIdx,
        warmth: l.indexOf("baño") > -1 ? 0.65 : 1.0
      });

      if (!esPasillo) {
        hotspotCoords.push({
          idx: hi,
          label: nom,
          x: rx + rw * 0.5,
          y: ry + rh * 0.5,
          z: 1.05
        });
        hi++;
      }

      // Mobiliario detallado según ambiente
      if (l.indexOf("estar") > -1) {
        addBed(rx + 2.3, ry + 0.18, 1.6, 2.0, false);
        addRug(rx + 0.45, ry + rh - 2.65, 3.2, 2.25);
        addSofa(rx + 0.75, ry + rh - 1.15, 2.25, 0.92, "down");
        addCoffeeTable(rx + 1.85, ry + rh - 1.75);
        addPlant(rx + 0.38, ry + 0.42, 0, 0.42);
        addPlant(rx + rw - 0.38, ry + rh - 0.38, 0, 0.38);
      } else if (l.indexOf("living") > -1) {
        addRug(rx + 0.85, ry + 0.55, Math.min(3.4, rw - 1.3), Math.min(2.6, rh - 1.2));
        addSofa(rx + 1.05, ry + 0.32, Math.min(2.6, rw - 1.8), 0.95, "down");
        addCoffeeTable(rx + 2.25, ry + 1.85);
        addArmchair(rx + 0.55, ry + 2.6, true);
        // biblioteca iluminada en el fondo como en Arbo
        if (rw >= 4.8) {
          var libW = Math.min(2.5, rw - 2.2);
          addBox(rx + rw - libW - 0.25, ry + rh - 0.42, 0, libW, 0.36, 1.95, MAT.woodDark);
          addBox(rx + rw - libW - 0.15, ry + rh - 0.4, 0.7, libW - 0.2, 0.08, 0.06, MAT.glow);
          addBox(rx + rw - libW - 0.15, ry + rh - 0.4, 1.3, libW - 0.2, 0.08, 0.06, MAT.glow);
        }
        if (tipo.id === "tres") {
          addDiningSet(rx + rw - 1.45, ry + 3.1, 1.35, 1.0, 4);
        } else if (tipo.id === "pent") {
          addDiningSet(rx + 4.4, ry + 3.9, 2.1, 1.15, 6);
        }
        addPlant(rx + 0.35, ry + 0.35, 0, 0.44);
      } else if (l.indexOf("cocina") > -1) {
        addKitchen(rx, ry, rw, rh);
      } else if (l.indexOf("baño") > -1) {
        addBathroom(rx, ry, rw, rh);
      } else if (l.indexOf("escritorio") > -1) {
        addStudy(rx, ry, rw, rh);
      } else if (l.indexOf("vestidor") > -1) {
        addDressing(rx, ry, rw, rh);
      } else if (l.indexOf("suite") > -1 || l.indexOf("dormitorio") > -1) {
        var bw = l.indexOf("suite") > -1 ? 1.75 : (rw >= 3.8 ? 1.55 : 1.38);
        var bx0 = rx + (rw - bw) / 2;
        addBed(bx0, ry + 0.18, bw, 1.98, false);
        if (rw >= 3.8 && rh >= 3.0) {
          addBox(rx + rw - 0.58, ry + rh - 2.1, 0, 0.5, 1.9, 2.0, MAT.woodDark);
        }
        addPlant(rx + 0.36, ry + 0.36, 0, 0.38);
      }
    });

    // Balcón o Terraza Gourmet
    addFloor(bal[0], bal[1], bal[2], bal[3], "deck", hi);
    lights.push({
      x: bal[0] + bal[2] * 0.5,
      y: bal[1] + bal[3] * 0.5,
      r: Math.max(bal[2], bal[3]) * 0.72,
      roomIdx: hi,
      warmth: 0.72
    });
    hotspotCoords.push({
      idx: hi,
      label: bal[4],
      x: bal[0] + bal[2] * 0.5,
      y: bal[1] + bal[3] * 0.5,
      z: 0.85
    });

    // Mobiliario exterior + jardineras verdes
    addPlant(bal[0] + 0.42, bal[1] + 0.42, 0, 0.48);
    addPlant(bal[0] + 0.42, bal[1] + bal[3] - 0.42, 0, 0.48);
    if (bal[2] >= 4.0) {
      addDiningSet(bal[0] + bal[2] * 0.46, bal[1] + bal[3] * 0.52, 2.1, 1.0, 6);
      addBox(bal[0] + 0.3, bal[1] + 1.0, 0, 0.8, 0.5, 0.45, MAT.olive);
      addBox(bal[0] + 0.3, bal[1] + 1.8, 0, 0.8, 0.5, 0.45, MAT.olive);
      // barra gourmet terraza
      addBox(bal[0] + bal[2] - 2.2, bal[1] + bal[3] - 0.75, 0, 1.9, 0.62, 0.88, MAT.woodDark);
      addBox(bal[0] + bal[2] - 2.24, bal[1] + bal[3] - 0.78, 0.88, 1.98, 0.68, 0.06, MAT.marble);
      addPlant(bal[0] + bal[2] * 0.5, bal[1] + 0.38, 0, 0.42);
    } else {
      addBox(bal[0] + bal[2] * 0.5 - 0.36, bal[1] + bal[3] * 0.68 - 0.36, 0, 0.72, 0.72, 0.52, MAT.oak);
      addBox(bal[0] + bal[2] * 0.5 - 0.25, bal[1] + bal[3] * 0.68 - 0.92, 0, 0.5, 0.46, 0.42, MAT.fabric);
    }

    // Barandas de vidrio perimetral del balcón / terraza
    var railH = 1.05;
    addBox(bal[0], bal[1], 0, 0.06, bal[3], railH, { top: "#D6ECF7", front: "#A8D0E4", side: "#8BB9D1", stroke: "rgba(255,255,255,0.45)" }, "glass", 0.36);
    addBox(bal[0], bal[1], 0, bal[2], 0.06, railH, { top: "#D6ECF7", front: "#A8D0E4", side: "#8BB9D1", stroke: "rgba(255,255,255,0.45)" }, "glass", 0.32);
    addBox(bal[0], bal[1] + bal[3] - 0.06, 0, bal[2], 0.06, railH, { top: "#D6ECF7", front: "#A8D0E4", side: "#8BB9D1", stroke: "rgba(255,255,255,0.45)" }, "glass", 0.36);
    // postes oscuros del vidrio
    var nPosts = Math.max(2, Math.round(bal[3] / 1.4));
    for (var pi = 0; pi <= nPosts; pi++) {
      addBox(bal[0], bal[1] + (bal[3] - 0.06) * (pi / nPosts), 0, 0.06, 0.06, railH + 0.02, MAT.mullion);
    }

    // Construcción de muros con recorte por puertas y ventanas
    var HWallOuter = 2.35;
    var HWallInner = 2.22;
    var TOuter = 0.18;
    var TInner = 0.13;

    function pushSegment(isHoriz, fixedCoord, a, b, wallH, thick) {
      var segLen = 2.0;
      var total = b - a;
      var parts = Math.max(1, Math.ceil(total / segLen));
      var step = total / parts;
      for (var p = 0; p < parts; p++) {
        var sa = a + p * step;
        var sb = sa + step;
        if (isHoriz) {
          addBox(sa, fixedCoord - thick / 2, 0, sb - sa, thick, wallH, MAT.wall, "wall");
        } else {
          addBox(fixedCoord - thick / 2, sa, 0, thick, sb - sa, wallH, MAT.wall, "wall");
        }
      }
    }

    function buildWallSegments(isHoriz, fixedCoord, start, end, wallH, thick) {
      var openings = [];
      (g.windows || []).forEach(function (w) {
        if ((w[3] === "h") === isHoriz && Math.abs((isHoriz ? w[1] : w[0]) - fixedCoord) < 0.08) {
          var a = isHoriz ? w[0] : w[1];
          openings.push({ s: a, e: a + w[2], kind: "win" });
        }
      });
      (g.doors || []).forEach(function (dr) {
        if ((dr[3] === "h") === isHoriz && Math.abs((isHoriz ? dr[1] : dr[0]) - fixedCoord) < 0.08) {
          var a = isHoriz ? dr[0] : dr[1];
          openings.push({ s: a, e: a + dr[2], kind: dr[4] || "hinge" });
        }
      });
      openings.sort(function (a, b) { return a.s - b.s; });

      var cur = start;
      openings.forEach(function (op) {
        if (op.s > cur + 0.04) {
          pushSegment(isHoriz, fixedCoord, cur, op.s, wallH, thick);
        }
        if (op.kind === "win") {
          // antepecho + vidrio transparente + marco
          if (isHoriz) {
            addBox(op.s, fixedCoord - thick / 2, 0, op.e - op.s, thick, 0.65, MAT.wall, "wall");
            addBox(op.s, fixedCoord - 0.025, 0.65, op.e - op.s, 0.05, wallH - 0.68, { top: "#CCE7F5", front: "#9ECAE0", side: "#84B3CB", stroke: "rgba(255,255,255,0.4)" }, "glass", 0.34);
          } else {
            addBox(fixedCoord - thick / 2, op.s, 0, thick, op.e - op.s, 0.65, MAT.wall, "wall");
            addBox(fixedCoord - 0.025, op.s, 0.65, 0.05, op.e - op.s, wallH - 0.68, { top: "#CCE7F5", front: "#9ECAE0", side: "#84B3CB", stroke: "rgba(255,255,255,0.4)" }, "glass", 0.34);
          }
        } else if (op.kind === "sliding") {
          // paños corredizos hacia el balcón con marcos negros
          if (isHoriz) {
            addBox(op.s, fixedCoord - 0.03, 0, op.e - op.s, 0.06, wallH - 0.04, { top: "#D3ECF9", front: "#9ECBE0", side: "#81B2C9", stroke: "rgba(255,255,255,0.4)" }, "glass", 0.28);
            addBox((op.s + op.e) / 2 - 0.03, fixedCoord - 0.04, 0, 0.06, 0.08, wallH, MAT.mullion);
          } else {
            addBox(fixedCoord - 0.03, op.s, 0, 0.06, op.e - op.s, wallH - 0.04, { top: "#D3ECF9", front: "#9ECBE0", side: "#81B2C9", stroke: "rgba(255,255,255,0.4)" }, "glass", 0.28);
            addBox(fixedCoord - 0.04, (op.s + op.e) / 2 - 0.03, 0, 0.08, 0.06, wallH, MAT.mullion);
          }
        } else if (op.kind === "hinge" || op.kind === "entry") {
          // hoja abierta en ángulo arquitectónico
          if (isHoriz) {
            addBox(op.s, fixedCoord + 0.04, 0, 0.06, (op.e - op.s) * 0.85, 2.06, MAT.woodDark);
          } else {
            addBox(fixedCoord + 0.04, op.s, 0, (op.e - op.s) * 0.85, 0.06, 2.06, MAT.woodDark);
          }
        }
        cur = Math.max(cur, op.e);
      });
      if (end > cur + 0.04) {
        pushSegment(isHoriz, fixedCoord, cur, end, wallH, thick);
      }
    }

    // Muros únicos deduplicados
    var seenH = {};
    var seenV = {};
    function regWall(isH, coord, a, b, isOuter) {
      var key = (isH ? "H:" : "V:") + coord.toFixed(2) + ":" + a.toFixed(2) + ":" + b.toFixed(2);
      var map = isH ? seenH : seenV;
      if (map[key]) return;
      map[key] = true;
      buildWallSegments(isH, coord, a, b, isOuter ? HWallOuter : HWallInner, isOuter ? TOuter : TInner);
    }

    // Exterior shell
    regWall(true, 0, 0, g.W, true);
    regWall(true, g.H, 0, g.W, true);
    regWall(false, 0, 0, g.H, true);
    regWall(false, g.W, 0, g.H, true);

    // Interior partitions (agrupadas limpiamente)
    if (tipo.id === "mono") {
      regWall(false, 4.4, 0, 5.4, false);
      regWall(true, 2.4, 4.4, 7.0, false);
    } else if (tipo.id === "dos") {
      regWall(false, 4.8, 0, 6.9, false);
      regWall(true, 4.3, 0, 4.8, false);
      regWall(false, 2.4, 4.3, 6.9, false);
      regWall(true, 2.6, 4.8, 9.0, false);
    } else if (tipo.id === "tres") {
      regWall(false, 5.0, 0, 8.5, false);
      regWall(true, 4.8, 0, 5.0, false);
      regWall(false, 2.8, 4.8, 8.5, false);
      regWall(true, 3.4, 5.0, 11.0, false);
      regWall(true, 4.5, 5.0, 11.0, false);
      regWall(false, 8.0, 4.5, 8.5, false);
    } else if (tipo.id === "pent") {
      regWall(false, 6.4, 0, 11.4, false);
      regWall(false, 7.6, 0, 11.4, false);
      regWall(true, 6.0, 0, 6.4, false);
      regWall(false, 3.4, 6.0, 11.4, false);
      regWall(true, 5.6, 7.6, 13.0, false);
      regWall(true, 8.0, 7.6, 13.0, false);
      regWall(false, 11.0, 0, 5.6, false);
      regWall(true, 3.4, 11.0, 13.0, false);
    }

    return {
      cx: cx,
      cy: cy,
      cz: 0.75,
      span: span,
      boxes: boxes,
      lights: lights,
      floorCells: floorCells,
      hotspots: hotspotCoords
    };
  }

  function SolanaMaqueta3D(container, tipo, opts) {
    this.container = container;
    this.opts = opts || {};
    this.theme = this.opts.theme || "dark"; // "dark" | "light"
    this.tipo = tipo;
    this.scene = createScene(tipo, opts);

    this.cur = { yaw: DEFAULTS.yaw, pitch: DEFAULTS.pitch, zoom: DEFAULTS.zoom, panX: 0, panY: 0 };
    this.tgt = { yaw: DEFAULTS.yaw, pitch: DEFAULTS.pitch, zoom: DEFAULTS.zoom, panX: 0, panY: 0 };
    this.flat = false;
    this.hoverIdx = -1;
    this.focusIdx = -1;
    this.dragging = false;
    this.dragMoved = false;
    this.lastPt = { x: 0, y: 0 };
    this.destroyed = false;
    this.lastDrawHash = "";

    this._buildDOM();
    this._bindEvents();
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  SolanaMaqueta3D.prototype._buildDOM = function () {
    this.container.innerHTML = "";
    this.container.classList.add("maq3d-host");

    var canvas = document.createElement("canvas");
    canvas.className = "maq3d-canvas";
    canvas.setAttribute("aria-label", "Maqueta 3D amueblada de " + this.tipo.nombre);
    this.container.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    var pinsLayer = document.createElement("div");
    pinsLayer.className = "maq3d-pins";
    this.container.appendChild(pinsLayer);
    this.pinsLayer = pinsLayer;
    this.pinEls = [];

    if (this.opts.hot !== false) {
      var self = this;
      this.scene.hotspots.forEach(function (hs, idx) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "maq3d-pin";
        btn.dataset.i = String(hs.idx);
        btn.style.setProperty("--k", String(idx));
        btn.setAttribute("aria-label", (hs.idx + 1 < 10 ? "0" : "") + (hs.idx + 1) + " " + hs.label);
        btn.innerHTML = '<span class="mp-halo"></span><span class="mp-dot"><i>' +
          (hs.idx + 1 < 10 ? "0" : "") + (hs.idx + 1) + '</i></span><span class="mp-tip">' + hs.label + '</span>';
        btn.addEventListener("pointerenter", function () {
          self.setHighlight(hs.idx);
          if (self.opts.onHover) self.opts.onHover(hs.idx, true);
        });
        btn.addEventListener("pointerleave", function () {
          if (self.focusIdx !== hs.idx) self.setHighlight(-1);
          if (self.opts.onHover) self.opts.onHover(hs.idx, false);
        });
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          self.focusRoom(hs.idx);
          if (self.opts.onSelect) self.opts.onSelect(self.focusIdx);
        });
        pinsLayer.appendChild(btn);
        self.pinEls.push({ el: btn, hs: hs });
      });
    }

    var hint = document.createElement("div");
    hint.className = "maq3d-drag-hint";
    hint.textContent = "Arrastrá para rotar";
    this.container.appendChild(hint);
  };

  SolanaMaqueta3D.prototype._bindEvents = function () {
    var self = this;
    var box = this.container;

    this._onDown = function (e) {
      if (e.target.closest(".maq3d-pin")) return;
      self.dragging = true;
      self.dragMoved = false;
      self.lastPt = { x: e.clientX, y: e.clientY };
      box.classList.add("is-dragging");
      if (box.setPointerCapture && e.pointerId !== undefined) {
        try { box.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };
    this._onMove = function (e) {
      if (self.dragging) {
        var dx = e.clientX - self.lastPt.x;
        var dy = e.clientY - self.lastPt.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) self.dragMoved = true;
        self.lastPt = { x: e.clientX, y: e.clientY };
        self.tgt.yaw += dx * 0.0085;
        if (!self.flat) {
          self.tgt.pitch = clamp(self.tgt.pitch + dy * 0.007, 0.34, 1.48);
        }
        return;
      }
      if (!self.flat && self.focusIdx === -1 && e.pointerType !== "touch") {
        var r = box.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5;
        var ny = (e.clientY - r.top) / r.height - 0.5;
        self.tgt.yaw = DEFAULTS.yaw + nx * 0.16;
        self.tgt.pitch = DEFAULTS.pitch - ny * 0.12;
      }
    };
    this._onUp = function () {
      self.dragging = false;
      box.classList.remove("is-dragging");
    };
    this._onLeave = function () {
      self.dragging = false;
      box.classList.remove("is-dragging");
      if (!self.flat && self.focusIdx === -1) {
        self.tgt.yaw = DEFAULTS.yaw;
        self.tgt.pitch = DEFAULTS.pitch;
      }
    };
    this._onWheel = function (e) {
      if (e.ctrlKey || Math.abs(e.deltaY) > 0) {
        // Solo interceptar si el usuario hace zoom con alt/ctrl o si estamos dentro del modal fullscreen
        if (self.opts.wheelZoom || e.ctrlKey) {
          e.preventDefault();
          self.tgt.zoom = clamp(self.tgt.zoom - e.deltaY * 0.0012, 0.78, 2.2);
        }
      }
    };

    box.addEventListener("pointerdown", this._onDown);
    box.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerup", this._onUp);
    box.addEventListener("pointerleave", this._onLeave);
    box.addEventListener("wheel", this._onWheel, { passive: false });
  };

  SolanaMaqueta3D.prototype._unbind = function () {
    var box = this.container;
    box.removeEventListener("pointerdown", this._onDown);
    box.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerup", this._onUp);
    box.removeEventListener("pointerleave", this._onLeave);
    box.removeEventListener("wheel", this._onWheel);
  };

  SolanaMaqueta3D.prototype.setTipo = function (tipo) {
    this._unbind();
    this.tipo = tipo;
    this.scene = createScene(tipo, this.opts);
    this.focusIdx = -1;
    this.hoverIdx = -1;
    this.tgt.panX = 0;
    this.tgt.panY = 0;
    this.tgt.zoom = DEFAULTS.zoom;
    if (!this.flat) {
      this.tgt.yaw = DEFAULTS.yaw;
      this.tgt.pitch = DEFAULTS.pitch;
    }
    this._buildDOM();
    this._bindEvents();
  };

  SolanaMaqueta3D.prototype.setFlat = function (isFlat) {
    this.flat = !!isFlat;
    this.focusIdx = -1; this.tgt.panX = 0; this.tgt.panY = 0; this.setHighlight(-1);
    if (this.flat) {
      this.tgt.zoom = 1.28;
      this.tgt.pitch = 0.0;   // pitch 0 = vista cenital (de arriba): el eje vertical de la pantalla es el fondo de la planta
      this.tgt.yaw = 0;
    } else {
      this.tgt.zoom = DEFAULTS.zoom;
      this.tgt.pitch = DEFAULTS.pitch;
      this.tgt.yaw = DEFAULTS.yaw;
    }
  };

  SolanaMaqueta3D.prototype.setHighlight = function (idx) {
    this.hoverIdx = idx;
    this.pinEls.forEach(function (p) {
      p.el.classList.toggle("on", p.hs.idx === idx);
    });
  };

  SolanaMaqueta3D.prototype.focusRoom = function (idx) {
    if (this.focusIdx === idx || idx < 0) {
      this.focusIdx = -1;
      this.tgt.panX = 0;
      this.tgt.panY = 0;
      this.tgt.zoom = DEFAULTS.zoom;
      this.setHighlight(-1);
      return -1;
    }
    var hs = this.scene.hotspots[idx];
    if (!hs) return -1;
    this.focusIdx = idx;
    this.tgt.panX = hs.x - this.scene.cx;
    this.tgt.panY = hs.y - this.scene.cy;
    this.tgt.zoom = 1.62;
    this.setHighlight(idx);
    return idx;
  };

  SolanaMaqueta3D.prototype.destroy = function () {
    this.destroyed = true;
    cancelAnimationFrame(this._raf);
    var box = this.container;
    box.removeEventListener("pointerdown", this._onDown);
    box.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerup", this._onUp);
    box.removeEventListener("pointerleave", this._onLeave);
    box.removeEventListener("wheel", this._onWheel);
  };

  SolanaMaqueta3D.prototype._projectFn = function (W, H) {
    var cur = this.cur;
    var sc = this.scene;
    var cyaw = Math.cos(cur.yaw), syaw = Math.sin(cur.yaw);
    var cpitch = Math.cos(cur.pitch), spitch = Math.sin(cur.pitch);
    var fovScale = Math.min(W, H) * 0.72 * cur.zoom / (sc.span * 0.92);
    var persp = 44;

    return function proj(x, y, z) {
      var dx = x - (sc.cx + cur.panX);
      var dy = y - (sc.cy + cur.panY);
      var dz = z - sc.cz;

      var x1 = dx * cyaw - dy * syaw;
      var y1 = dx * syaw + dy * cyaw;

      // pitch: 0 = vista cenital (de arriba), PI/2 = mirada horizontal (de costado)
      var y2 = y1 * cpitch + dz * spitch;
      var depth = y1 * spitch - dz * cpitch;

      var factor = persp / Math.max(8, persp + depth);
      return {
        sx: W * 0.5 + x1 * fovScale * factor,
        sy: H * 0.52 - y2 * fovScale * factor,
        depth: depth,
        scale: fovScale * factor
      };
    };
  };

  SolanaMaqueta3D.prototype._tick = function () {
    if (this.destroyed) return;
    var k = 0.12;
    this.cur.yaw = lerp(this.cur.yaw, this.tgt.yaw, k);
    this.cur.pitch = lerp(this.cur.pitch, this.tgt.pitch, k);
    this.cur.zoom = lerp(this.cur.zoom, this.tgt.zoom, k);
    this.cur.panX = lerp(this.cur.panX, this.tgt.panX, k);
    this.cur.panY = lerp(this.cur.panY, this.tgt.panY, k);

    if (!this.paused) this._render();
    this._raf = requestAnimationFrame(this._tick);
  };

  SolanaMaqueta3D.prototype._render = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = this.container.clientWidth;
    var ch = this.container.clientHeight;
    if (!cw || !ch) return;

    if (this.canvas.width !== Math.round(cw * dpr) || this.canvas.height !== Math.round(ch * dpr)) {
      this.canvas.width = Math.round(cw * dpr);
      this.canvas.height = Math.round(ch * dpr);
    }

    var ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cw, ch);

    var sc = this.scene;
    var proj = this._projectFn(cw, ch);
    var activeRoom = this.focusIdx >= 0 ? this.focusIdx : this.hoverIdx;

    // 1. Sombra suave ambiental debajo de la maqueta
    var cCenter = proj(sc.cx, sc.cy, -0.36);
    var shadowRx = cw * 0.34 * this.cur.zoom;
    var shadowRy = shadowRx * (0.28 + 0.35 * Math.cos(this.cur.pitch));
    var gradSh = ctx.createRadialGradient(cCenter.sx, cCenter.sy + 18, shadowRx * 0.15, cCenter.sx, cCenter.sy + 18, shadowRx);
    if (this.theme === "light") {
      gradSh.addColorStop(0, "rgba(18, 22, 32, 0.24)");
      gradSh.addColorStop(0.65, "rgba(18, 22, 32, 0.09)");
      gradSh.addColorStop(1, "rgba(18, 22, 32, 0)");
    } else {
      gradSh.addColorStop(0, "rgba(0, 0, 0, 0.65)");
      gradSh.addColorStop(0.65, "rgba(3, 8, 22, 0.25)");
      gradSh.addColorStop(1, "rgba(3, 8, 22, 0)");
    }
    ctx.fillStyle = gradSh;
    ctx.beginPath();
    ctx.ellipse(cCenter.sx, cCenter.sy + 18, shadowRx, Math.max(24, shadowRy), 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Celdas de piso ordenadas de atrás hacia adelante
    var floorDraws = sc.floorCells.map(function (c) {
      var p0 = proj(c.x, c.y, 0);
      var p1 = proj(c.x + c.w, c.y, 0);
      var p2 = proj(c.x + c.w, c.y + c.d, 0);
      var p3 = proj(c.x, c.y + c.d, 0);
      return {
        c: c,
        pts: [p0, p1, p2, p3],
        depth: (p0.depth + p1.depth + p2.depth + p3.depth) * 0.25
      };
    });
    floorDraws.sort(function (a, b) { return b.depth - a.depth; });

    floorDraws.forEach(function (fd) {
      var c = fd.c;
      var pts = fd.pts;
      var fill;
      if (c.style === "wood") {
        fill = c.grain ? "#D5BC96" : "#CEA87B";
      } else if (c.style === "tile") {
        fill = c.grain ? "#E7E2D8" : "#DFD9CE";
      } else if (c.style === "stone") {
        fill = c.grain ? "#DCD7CE" : "#D3CEC4";
      } else {
        fill = c.grain ? "#B99E7D" : "#AE9270";
      }

      if (activeRoom >= 0) {
        if (c.roomIdx === activeRoom) {
          fill = shadeHex(fill, 1.12);
        } else {
          fill = shadeHex(fill, 0.78);
        }
      }

      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      ctx.lineTo(pts[1].sx, pts[1].sy);
      ctx.lineTo(pts[2].sx, pts[2].sy);
      ctx.lineTo(pts[3].sx, pts[3].sy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = c.style === "wood" ? "rgba(120,86,48,0.14)" : "rgba(80,75,68,0.16)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    });

    // 3. Pools de iluminación cálida interior 2700K sobre el piso (signature Arbo!)
    var lightSquash = clamp(Math.sin(this.cur.pitch) * 0.7 + 0.3, 0.42, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    sc.lights.forEach(function (lt) {
      var cp = proj(lt.x, lt.y, 0.02);
      var rad = lt.r * cp.scale * 0.85;
      var isLit = activeRoom === -1 || activeRoom === lt.roomIdx;
      var alpha = (activeRoom === lt.roomIdx ? 0.28 : isLit ? 0.14 : 0.04) * lt.warmth;
      var rg = ctx.createRadialGradient(cp.sx, cp.sy, 0, cp.sx, cp.sy, rad);
      rg.addColorStop(0, "rgba(255, 224, 158, " + alpha.toFixed(3) + ")");
      rg.addColorStop(0.55, "rgba(255, 198, 110, " + (alpha * 0.45).toFixed(3) + ")");
      rg.addColorStop(1, "rgba(255, 190, 95, 0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(cp.sx, cp.sy, rad, rad * lightSquash, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 4. Construir caras de los cubos 3D y ordenarlas con precisión (back-to-front painter)
    var faces = [];
    sc.boxes.forEach(function (b) {
      // Centro de masa proyectado para ordenamiento sólido + offset de altura
      var centerProj = proj(b.x + b.w * 0.5, b.y + b.d * 0.5, b.z + b.h * 0.5);
      var baseWeight = b.tag === "slab" ? 1000 : b.tag === "rug" ? 400 : b.tag === "glass" ? -35 : 0;

      // Vértices de la caja: b0..b3 base, t0..t3 tope
      var v = [
        proj(b.x, b.y, b.z),
        proj(b.x + b.w, b.y, b.z),
        proj(b.x + b.w, b.y + b.d, b.z),
        proj(b.x, b.y + b.d, b.z),
        proj(b.x, b.y, b.z + b.h),
        proj(b.x + b.w, b.y, b.z + b.h),
        proj(b.x + b.w, b.y + b.d, b.z + b.h),
        proj(b.x, b.y + b.d, b.z + b.h)
      ];

      function pushFace(indices, color, isTop) {
        var pts = indices.map(function (i) { return v[i]; });
        // Culling backface en espacio pantalla usando producto cruz
        var ax = pts[1].sx - pts[0].sx, ay = pts[1].sy - pts[0].sy;
        var bx = pts[2].sx - pts[0].sx, by = pts[2].sy - pts[0].sy;
        var cross = ax * by - ay * bx;
        if (b.tag !== "glass" && cross > 0) return;

        var avgD = (pts[0].depth + pts[1].depth + pts[2].depth + pts[3].depth) * 0.25;
        faces.push({
          pts: pts,
          color: color,
          stroke: b.stroke || (isTop ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.09)"),
          alpha: b.alpha,
          key: avgD + baseWeight - (isTop ? 0.12 : 0) + (centerProj.depth * 0.05)
        });
      }

      // 5 caras visibles potencialmente (arriba + 4 lados; nunca debajo)
      if (b.tag !== "slab") pushFace([4, 5, 6, 7], b.top, true); // la losa no tapa las celdas del piso
      pushFace([0, 1, 5, 4], b.front, false);
      pushFace([1, 2, 6, 5], b.side, false);
      pushFace([2, 3, 7, 6], b.front, false);
      pushFace([3, 0, 4, 7], b.side, false);
    });

    faces.sort(function (a, b) { return b.key - a.key; });

    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      ctx.globalAlpha = f.alpha;
      ctx.beginPath();
      ctx.moveTo(f.pts[0].sx, f.pts[0].sy);
      ctx.lineTo(f.pts[1].sx, f.pts[1].sy);
      ctx.lineTo(f.pts[2].sx, f.pts[2].sy);
      ctx.lineTo(f.pts[3].sx, f.pts[3].sy);
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.fill();
      if (f.stroke) {
        ctx.strokeStyle = f.stroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 5. Actualizar coordenadas exactas 3D -> 2D de los pins de cada ambiente
    this.pinEls.forEach(function (item) {
      var p = proj(item.hs.x, item.hs.y, item.hs.z);
      item.el.style.left = p.sx.toFixed(1) + "px";
      item.el.style.top = p.sy.toFixed(1) + "px";
    });
  };

  global.SolanaMaqueta3D = SolanaMaqueta3D;
})(window);
