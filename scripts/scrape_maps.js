// Busca negocios en Google Maps con el método de la herramienta de Sol (sin API, sin tarjeta).
// Abre Maps con Chromium y usa la búsqueda interna de la página: hasta 20 resultados por consulta.
//
// Uso:
//   node scripts/scrape_maps.js --localidades "Caseros,Ramos Mejía" [--rubros veterinaria,dentista] [--terminos 1]
//   node scripts/scrape_maps.js --zona "zona oeste" --terminos 2
//
// Salida: output/raw/maps-{fecha}-{hora}.json (lo procesa scripts/rankear.py).
// Volumen bajo a propósito: pausa de ~1,5 s entre consultas. Si Google muestra un CAPTCHA, el script se frena.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.dirname(__dirname);
const cfg = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'config', f), 'utf8'));

function args() {
  const a = {};
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i += 2) a[v[i].replace(/^--/, '')] = v[i + 1];
  return a;
}

// La función corre dentro de la página de Maps. Posiciones del array interno de Google
// (cambian cada tanto; si algo viene vacío, revisarlas con un volcado de una búsqueda).
async function buscarEnPagina(q) {
  const s = await (await fetch('/maps/search/' + encodeURIComponent(q).replace(/%20/g, '+') + '?hl=es-419')).text();
  if (/captcha|unusual traffic|tráfico inusual/i.test(s)) return { err: 'captcha' };
  const m = s.match(/<link href="(\/search\?tbm=map[^"]+)"/);
  if (!m) return { err: 'nolink' };
  let j = await (await fetch(m[1].replace(/&amp;/g, '&'))).text();
  j = j.replace(/^\)\]\}'\s*/, '').replace(/\/\*""\*\/\s*$/, '');
  let d;
  try { d = JSON.parse(j); } catch (e) { d = JSON.parse(JSON.parse(j).d.replace(/^\)\]\}'\s*/, '')); }
  return (d[64] || []).filter((x) => x && x[1] && x[1][11]).map((x) => {
    const p = x[1];
    const hoy = p[203] && p[203][0] && p[203][0][0];
    return {
      id: p[10], nombre: p[11], categoria: (p[13] || []).join(' / '),
      direccion: p[39] || p[18] || '', localidad_maps: p[166] || '',
      rating: p[4] && p[4][7] != null ? p[4][7] : '',
      resenas: p[4] && p[4][8] != null ? p[4][8] : '',  // en "vista limitada" (sin login) Google no la manda
      fotos: p[37] && p[37][0] == null && Number.isInteger(p[37][1]) ? p[37][1] : 0,
      web: (p[7] && p[7][0]) || '',
      telefono: (p[178] && p[178][0] && p[178][0][0]) || '',
      horario_hoy: hoy ? (hoy[3] || []).map((h) => h[0]).join(', ') : '',
      cerrado: /permanentemente|temporalmente/i.test(JSON.stringify(p)),
      place_id: p[78] || '',
    };
  });
}

(async () => {
  const a = args();
  const rubros = cfg('rubros.json');
  const zonas = cfg('zonas.json');
  const claves = a.rubros ? a.rubros.split(',').map((s) => s.trim()) : Object.keys(rubros);
  const locs = a.localidades ? a.localidades.split(',').map((s) => s.trim())
    : (zonas[(a.zona || 'zona oeste').toLowerCase()] || [a.zona]);
  const nTerm = parseInt(a.terminos || '1', 10);
  for (const k of claves) if (!rubros[k]) { console.error(`Rubro desconocido: ${k}`); process.exit(1); }

  const browser = await chromium.launch();
  const page = await (await browser.newContext({ locale: 'es-419' })).newPage();
  await page.goto('https://www.google.com/maps/?hl=es-419', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const raw = { fecha: new Date().toISOString(), consultas: [] };
  let unicos = new Set();
  for (const loc of locs) {
    for (const k of claves) {
      for (const termino of rubros[k].busquedas.slice(0, nTerm)) {
        const q = `${termino} en ${loc}, Buenos Aires`;
        let r;
        try { r = await page.evaluate(buscarEnPagina, q); } catch (e) { r = { err: e.message }; }
        if (r.err === 'captcha') { console.error('Google pidió CAPTCHA: corto acá y guardo lo que hay.'); break; }
        if (r.err) { console.error(`  ${q}: error ${r.err}`); continue; }
        raw.consultas.push({ rubro: k, localidad: loc, query: q, places: r });
        r.forEach((p) => unicos.add(p.id));
        console.log(`  ${q}: ${r.length} (${unicos.size} únicos)`);
        await page.waitForTimeout(1200 + Math.random() * 800);
      }
    }
  }
  await browser.close();

  const dir = path.join(ROOT, 'output', 'raw');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `maps-${raw.fecha.slice(0, 16).replace(/[:T]/g, '-')}.json`);
  fs.writeFileSync(f, JSON.stringify(raw, null, 1));
  console.log(`Listo: ${raw.consultas.length} consultas, ${unicos.size} negocios únicos -> ${path.relative(ROOT, f)}`);
})().catch((e) => { console.error(e); process.exit(1); });
