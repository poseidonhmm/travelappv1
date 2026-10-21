import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.mjs';
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
