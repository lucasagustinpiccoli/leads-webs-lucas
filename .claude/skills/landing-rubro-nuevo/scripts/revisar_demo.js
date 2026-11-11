// Revisa una o más demos: capturas en escritorio y celular + chequeos automáticos.
//
// Uso: node revisar_demo.js <carpeta-de-salida> <carpeta-demo> [<carpeta-demo> ...]
//   ej: node revisar_demo.js /ruta/scratch/capturas output/demos/03-consultorio-x
//
// Por cada demo escribe {nombre}-desk-fold.png (lo primero que se ve), {nombre}-desk.png (página entera),
// {nombre}-mob-fold.png y {nombre}-mob.png, y {nombre}-hoja.jpg (la página entera de escritorio en columnas,
// para mirarla de un vistazo con Read). Imprime los chequeos; si alguno falla, sale con código 1.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium, devices } = require('playwright');

(async () => {
  const [outDir, ...demos] = process.argv.slice(2);
  if (!outDir || !demos.length) { console.error('Uso: node revisar_demo.js <salida> <demo> [...]'); process.exit(2); }
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  let fallas = 0;
  for (const demo of demos) {
    const html = path.resolve(demo, 'index.html');
    const n = path.basename(path.resolve(demo));
    const texto = fs.readFileSync(html, 'utf8');
    const checks = [];
    const visible = texto.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
    checks.push(['sin em-dash ni en-dash en el texto', !/[—–]/.test(visible)]);
    checks.push(['sin campos {{...}} sin completar', !/\{\{/.test(texto)]);
    checks.push(['franja de demo presente', /class="aviso"/.test(texto)]);
    checks.push(['noindex presente', /noindex/.test(texto)]);
    const faltan = [...texto.matchAll(/src="(img\/[^"]+)"/g)].map(m => m[1]).filter(s => !fs.existsSync(path.resolve(demo, s)));
    checks.push([`imágenes locales existen${faltan.length ? ' (faltan: ' + faltan.join(', ') + ')' : ''}`, !faltan.length]);
    for (const [tag, opts] of [['desk', { viewport: { width: 1440, height: 900 } }], ['mob', { ...devices['iPhone 13'] }]]) {
      const ctx = await b.newContext(opts); const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + html, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
      await p.screenshot({ path: path.join(outDir, `${n}-${tag}-fold.png`) });
      const h = await p.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h; y += 500) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(100); }
      await p.waitForTimeout(900); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
      await p.screenshot({ path: path.join(outDir, `${n}-${tag}.png`), fullPage: true });
      const r = await p.evaluate(() => {
        const h1 = document.querySelector('h1');
        const lh = parseFloat(getComputedStyle(h1).lineHeight) || parseFloat(getComputedStyle(h1).fontSize) * 1.1;
        const ctas = [...document.querySelectorAll('.btn')].filter(x => x.offsetParent).map(x => x.getBoundingClientRect().height);
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          lineasH1: Math.round(h1.getBoundingClientRect().height / lh),
          fuente: document.fonts.check('16px ' + getComputedStyle(h1).fontFamily.split(',')[0]),
          ctaPartido: ctas.some(x => x > 64),
        };
      });
      checks.push([`${tag}: sin errores de JavaScript`, !errs.length]);
      checks.push([`${tag}: sin scroll horizontal (${r.overflow}px)`, r.overflow <= 0]);
      checks.push([`${tag}: título del hero en 3 líneas o menos (${r.lineasH1})`, r.lineasH1 <= 3]);
      checks.push([`${tag}: ningún botón en dos renglones`, !r.ctaPartido]);
      if (tag === 'desk') checks.push(['tipografía del tema cargada (si falla, ¿están habilitados los hosts de Google Fonts?)', r.fuente]);
      await ctx.close();
    }
    try {
      execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
im=Image.open(sys.argv[1]).convert('RGB'); w,h=im.size; seg=2000; tw=520
parts=[im.crop((0,y,w,min(y+seg,h))).resize((tw,int(min(seg,h-y)*tw/w))) for y in range(0,h,seg)]
sh=Image.new('RGB',(tw*len(parts)+12*(len(parts)-1),max(p.height for p in parts)),'white'); x=0
for p in parts: sh.paste(p,(x,0)); x+=tw+12
sh.save(sys.argv[2],quality=85)`, path.join(outDir, `${n}-desk.png`), path.join(outDir, `${n}-hoja.jpg`)]);
    } catch (e) { console.log('  (no se pudo armar la hoja: falta Pillow)'); }
    console.log(`\n${n}`);
    for (const [t, ok] of checks) { console.log(`  ${ok ? 'OK   ' : 'FALLA'} ${t}`); if (!ok) fallas++; }
  }
  await b.close();
  console.log(`\nCapturas en ${outDir}. Mirá primero *-desk-fold.png, *-mob-fold.png y *-hoja.jpg.`);
  process.exit(fallas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
