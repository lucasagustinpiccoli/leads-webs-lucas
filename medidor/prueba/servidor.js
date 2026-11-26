// Servidor de prueba: se comporta como el receptor y guarda lo que recibe, para verificar el medidor sin Google.
const http=require('http');const fs=require('fs');const path=require('path');const recibidos=[];
http.createServer((q,r)=>{
  if(q.method==='POST'){let b='';q.on('data',c=>b+=c);q.on('end',()=>{try{recibidos.push(JSON.parse(b))}catch(e){recibidos.push({malo:b})}r.writeHead(200,{'content-type':'text/plain'});r.end('ok')});return}
  if(q.url==='/recibidos'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify(recibidos));return}
  const f=q.url==='/medidor.js'?path.join(__dirname,'..','medidor.js'):path.join(__dirname,'pagina.html');
  r.writeHead(200,{'content-type':f.endsWith('.js')?'text/javascript':'text/html'});r.end(fs.readFileSync(f));
}).listen(8801);
