const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const er = [];
  p.on('pageerror', e => er.push(e.message));
  await p.goto('file:///home/user/leads-webs-lucas/output/proyecto-residencias.html');
  await p.waitForTimeout(1000);
  let total = 0;
  for (const t of ['mono', 'dos', 'tres', 'pent']) {
    await p.click('#tab-' + t);
    await p.waitForTimeout(300);
    const res = await p.evaluate(async (t) => {
      const dbg = window.__dbg[t];
      const svg = document.querySelector('#plano .c-mueble').cloneNode(true);
      svg.querySelectorAll('[data-rug],.fin').forEach(e => e.remove());
      const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      const S = 2;
      svg.setAttribute('width', vb[2] * S); svg.setAttribute('height', vb[3] * S);
      svg.removeAttribute('style');
      let str = new XMLSerializer().serializeToString(svg);
      str = str.replace(/url\(#[^)]*\)/g, '#000').replace(/ filter="[^"]*"/g, '');
      const img = new Image();
      const url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml' }));
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
      const c = document.createElement('canvas'); c.width = vb[2] * S; c.height = vb[3] * S;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const K = dbg.K, out = [];
      const ocupado = (mx, my) => { const px = Math.round((mx * K - vb[0]) * S), py = Math.round((my * K - vb[1]) * S); if (px < 0 || py < 0 || px >= c.width || py >= c.height) return false; return x.getImageData(px, py, 1, 1).data[3] > 40; };
      dbg.pu.forEach((d, i) => {
        const [dx, dy, L, o, s] = d;
        let bad = 0, n = 0, ejemplo = null;
        if (s !== 0) {
          for (let a = 0.04; a < L; a += 0.05) for (let r = 0.04; r < L; r += 0.05) {
            if (Math.hypot(a, r) > L) continue;
            const mx = o === 'h' ? dx + a : dx + s * r, my = o === 'h' ? dy + s * r : dy + a;
            n++; if (ocupado(mx, my)) { bad++; if (!ejemplo) ejemplo = [mx.toFixed(2), my.toFixed(2)]; }
          }
        } else {
          for (let a = 0.04; a < L; a += 0.05) for (let r = -0.6; r <= 0.6; r += 0.1) {
            const mx = o === 'h' ? dx + a : dx + r, my = o === 'h' ? dy + r : dy + a;
            n++; if (ocupado(mx, my)) { bad++; if (!ejemplo) ejemplo = [mx.toFixed(2), my.toFixed(2)]; }
          }
        }
        if (bad) out.push({ puerta: i, datos: d.join(','), choca: (100 * bad / n).toFixed(0) + '%', en: ejemplo });
      });
      return out;
    }, t);
    console.log(t, res.length ? JSON.stringify(res) : 'OK sin choques');
    total += res.length;
  }
  console.log('errores de página:', er, 'choques:', total);
  await b.close();
})();
