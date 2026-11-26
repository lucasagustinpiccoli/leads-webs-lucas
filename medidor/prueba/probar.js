const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const srv=spawn('node',[__dirname+'/servidor.js']);await new Promise(r=>setTimeout(r,700));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});
await p.goto('http://localhost:8801/?utm_source=Instagram');await p.waitForTimeout(500);
for(const id of ['#wa','#tel','#mail','#otro']){await p.evaluate(s=>document.querySelector(s).addEventListener('click',e=>e.preventDefault()),id);await p.click(id);}
await p.evaluate(()=>HaloMedidor.evento('formulario','pedido de visita'));await p.waitForTimeout(700);
const r=await (await fetch('http://localhost:8801/recibidos')).json();
console.log(r.map(e=>[e.tipo,e.origen,e.dispositivo,e.detalle].join(' | ')).join('\n'));
const ok=r.length===5&&r[0].tipo==='visita'&&r[0].origen==='instagram'&&r[0].dispositivo==='celular'&&r.map(e=>e.tipo).join()==='visita,whatsapp,llamada,email,formulario';
console.log(ok?'\nOK: 5 eventos, los esperados':'\nFALLA');
// sin endpoint y con No rastrear no deben enviar nada
const c=await b.newContext({});const q=await c.newPage();await q.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1'}));await q.goto('http://localhost:8801/');await q.waitForTimeout(500);
const r2=await (await fetch('http://localhost:8801/recibidos')).json();console.log('con No rastrear, eventos nuevos:',r2.length-r.length);
await b.close();srv.kill();process.exit(ok?0:1)})();
