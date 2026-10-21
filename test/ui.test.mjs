import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from '../scripts/validate.mjs';
import { matchDestinations, queryHasWeather } from '../public/recommend.js';

test('mobile-first UI serves source files and destination catalogue',async()=>{
 const server=createAppServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const base='http://127.0.0.1:'+server.address().port;
  for(const path of ['/','/style.css','/app.js','/recommend.js','/feedback.js','/feedback.css','/data/destinations.json']){
   const response=await fetch(base+path);
   assert.equal(response.status,200,path);
   assert.ok((await response.text()).length>20,path);
  }
  assert.equal((await fetch(base+'/data/taxonomy.json')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('search uses the real catalogue and prioritises selected region',()=>{
 const {destinations}=load();
 const matches=matchDestinations(destinations,{query:'dramatic mountains',region:'Europe',limit:88});
 assert.ok(matches.length>0);
 assert.ok(matches.every(x=>x.macroRegion==='Europe'));
});
test('sunshine queries trigger an explicit no-weather warning',()=>{
 assert.equal(queryHasWeather('Sunny in February'),true);
 assert.equal(queryHasWeather('posh city break'),false);
});
test('saved-only filter restricts results',()=>{
 const {destinations}=load();
 const savedIds=new Set(['bali']);
 const matches=matchDestinations(destinations,{savedIds});
 assert.deepEqual(matches.map(x=>x.id),['bali']);
});

test('feedback API persists judgments locally without requiring an OpenAI key',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-feedback-api-'));
 const server=createAppServer({feedbackPath:join(folder,'feedback.json')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  let response=await fetch(base+'/api/feedback');
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).items,[]);
  const input={query:'romantic trip',region:'all',scenery:[],vibes:['romantic'],
   engine:'ai',destinationId:'wadi-rum',rating:'bad',reason:'wrong-trip-type',
   note:'Desert romance differs from a classic city break.',rank:1,interpretation:'Classic romance'};
  response=await fetch(base+'/api/feedback',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
  });
  assert.equal(response.status,200);
  assert.equal((await response.json()).item.rating,'bad');
  response=await fetch(base+'/api/feedback');
  const entries=(await response.json()).items;
  assert.equal(entries.length,1);
  assert.equal(entries[0].destinationId,'wadi-rum');
  response=await fetch(base+'/api/feedback',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({...input,destinationId:'does-not-exist'})
  });
  assert.equal(response.status,400);
 }finally{
  await new Promise(resolve=>server.close(resolve));
  await rm(folder,{recursive:true,force:true});
 }
});
