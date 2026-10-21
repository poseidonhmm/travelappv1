import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const files = new Map([
 ['/', ['public/index.html', 'text/html; charset=utf-8']],
 ['/index.html', ['public/index.html', 'text/html; charset=utf-8']],
 ['/style.css', ['public/style.css', 'text/css; charset=utf-8']],
 ['/app.js', ['public/app.js', 'text/javascript; charset=utf-8']],
 ['/recommend.js', ['public/recommend.js', 'text/javascript; charset=utf-8']],
 ['/data/destinations.json', ['data/destinations.json', 'application/json; charset=utf-8']]
]);

export function createAppServer() {
 return http.createServer(async (request,response)=>{
  try {
   const url=new URL(request.url,'http://localhost');
   if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;}
   const entry=files.get(url.pathname);
   if(!entry){response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Not found');return;}
   const body=await readFile(new URL(entry[0],import.meta.url));
   response.writeHead(200,{
    'Content-Type':entry[1],
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'X-Frame-Options':'DENY',
    'Referrer-Policy':'no-referrer'
   });
   response.end(request.method==='HEAD'?undefined:body);
  } catch(error) {
   console.error(error);
   response.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});
   response.end('Server error');
  }
 });
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const port=Number(process.env.PORT)||3000;
 createAppServer().listen(port,'127.0.0.1',()=>console.log('Wanderly prototype: http://localhost:'+port));
}
