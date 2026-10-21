import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createAiSearch,InputError,parseSearchRequest } from './lib/ai-search.mjs';
import { createFeedbackStore,DEFAULT_FEEDBACK_PATH } from './lib/feedback.mjs';
import { createPhotoStore,DEFAULT_PHOTO_CACHE } from './lib/photos.mjs';

const files=new Map([
 ['/', ['public/index.html','text/html; charset=utf-8']],
 ['/index.html',['public/index.html','text/html; charset=utf-8']],
 ['/style.css',['public/style.css','text/css; charset=utf-8']],
 ['/app.js',['public/app.js','text/javascript; charset=utf-8']],
 ['/feedback.js',['public/feedback.js','text/javascript; charset=utf-8']],
 ['/feedback.css',['public/feedback.css','text/css; charset=utf-8']],
 ['/photos.js',['public/photos.js','text/javascript; charset=utf-8']],
 ['/photos.css',['public/photos.css','text/css; charset=utf-8']],
 ['/recommend.js',['public/recommend.js','text/javascript; charset=utf-8']],
 ['/data/destinations.json',['data/destinations.json','application/json; charset=utf-8']]
]);
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'};
let aiService=null,previousKey=null;
async function getApiKey(){
 if(process.env.OPENAI_API_KEY?.trim())return process.env.OPENAI_API_KEY.trim();
 try{
  const env=await readFile(new URL('.env',import.meta.url),'utf8');
  const line=env.split(/\r?\n/).find(x=>/^\s*OPENAI_API_KEY\s*=/.test(x));
  if(!line)return '';
  return line.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g,'');
 }catch{return '';}
}
async function getService(){
 const key=await getApiKey();
 if(!aiService||key!==previousKey){
  const destinations=JSON.parse(await readFile(new URL('data/destinations.json',import.meta.url),'utf8'));
  aiService=createAiSearch({destinations,apiKey:key});
  previousKey=key;
 }
 return aiService;
}
function json(response,status,data,method='GET'){
 response.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...headers});
 response.end(method==='HEAD'?undefined:JSON.stringify(data));
}
async function readRequest(request){
 let text='';
 for await (const part of request){
  text+=part.toString('utf8');
  if(Buffer.byteLength(text,'utf8')>8192)throw new InputError('Search request too large.');
 }
 try{return JSON.parse(text);}catch{throw new InputError('Invalid JSON request.');}
}
const requestTimes=[];
function allowSearch(){
 const now=Date.now();
 while(requestTimes.length&&requestTimes[0]<now-60000)requestTimes.shift();
 if(requestTimes.length>=20)return false;
 requestTimes.push(now);return true;
}
export function createAppServer({feedbackPath=DEFAULT_FEEDBACK_PATH,photoCachePath=DEFAULT_PHOTO_CACHE,photoFetchImpl=fetch}={}){
 let feedbackStore=null,photoStore=null;
 async function getFeedback(){
  if(!feedbackStore){
   const profiles=JSON.parse(await readFile(new URL('data/destinations.json',import.meta.url),'utf8'));
   feedbackStore=createFeedbackStore({filePath:feedbackPath,knownIds:new Set(profiles.map(d=>d.id))});
  }
  return feedbackStore;
 }
 async function getPhotos(){
  if(!photoStore){
   const destinations=JSON.parse(await readFile(new URL('data/destinations.json',import.meta.url),'utf8'));
   photoStore=createPhotoStore({destinations,cachePath:photoCachePath,fetchImpl:photoFetchImpl});
  }
  return photoStore;
 }
 return http.createServer(async(request,response)=>{
  try{
   const url=new URL(request.url,'http://localhost');
   // Reject cross-site form/API submissions (the local app never needs third-party origins).
   if(request.method==='POST'&&request.headers.origin){
    const origin=new URL(request.headers.origin);
    const host=request.headers.host||'';
    if(origin.host!==host||!['http:','https:'].includes(origin.protocol)){
     json(response,403,{error:'Cross-origin requests are not allowed.'});return;
    }
   }
   if(url.pathname==='/api/photos'){
    if(!['GET','HEAD'].includes(request.method)){
     response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;
    }
    const id=url.searchParams.get('destination')||'';
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>100){json(response,400,{error:'Invalid destination ID.'});return;}
    const store=await getPhotos();
    const images=await store.getPhotos(id);
    if(images===null){json(response,404,{error:'Destination not found.'});return;}
    json(response,200,{destinationId:id,photos:images,verified:false,source:'Wikimedia Commons candidates'},request.method);return;
   }
   if(url.pathname==='/api/status'&&['GET','HEAD'].includes(request.method)){
    json(response,200,{aiConfigured:!!(await getApiKey())},request.method);return;
   }
   if(url.pathname==='/api/feedback'){
    const store=await getFeedback();
    if(request.method==='GET'||request.method==='HEAD'){
     json(response,200,{items:await store.list()},request.method);return;
    }
    if(request.method==='POST'){
     const record=await store.save(await readRequest(request));
     json(response,200,{saved:true,item:record});return;
    }
    response.writeHead(405,{'Allow':'GET, HEAD, POST'});response.end();return;
   }
   if(url.pathname==='/api/search'){
    if(request.method!=='POST'){response.writeHead(405,{'Allow':'POST'});response.end();return;}
    if(!allowSearch()){json(response,429,{error:'Too many searches. Try again in a minute.'});return;}
    const input=parseSearchRequest(await readRequest(request));
    const service=await getService();
    json(response,200,await service.search(input));return;
   }
   if(!['GET','HEAD'].includes(request.method)){response.writeHead(405,{'Allow':'GET, HEAD'});response.end();return;}
   const entry=files.get(url.pathname);
   if(!entry){response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8',...headers});response.end('Not found');return;}
   const body=await readFile(new URL(entry[0],import.meta.url));
   response.writeHead(200,{'Content-Type':entry[1],...headers});
   response.end(request.method==='HEAD'?undefined:body);
  }catch(error){
   if(error instanceof InputError||error?.statusCode===400){json(response,400,{error:error.message});return;}
   console.error('Local server error:',error?.message||'unknown error');
   json(response,500,{error:'Unexpected server error.'});
  }
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const port=Number(process.env.PORT)||3000;
 createAppServer().listen(port,'127.0.0.1',()=>console.log('Wanderly: http://localhost:'+port+'\nTo enable AI, set OPENAI_API_KEY in a local .env file.'));
}
