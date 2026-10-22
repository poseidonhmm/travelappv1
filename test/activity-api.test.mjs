import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createAppServer} from '../server.mjs';

test('activity API serves evidence and persists explicit local reviews with revision and origin checks',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-activity-api-'));
 const activityReviewPath=join(folder,'reviews.json');
 const server=createAppServer({activityReviewPath});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const post=body=>fetch(base+'/api/activity-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{
  const {items}=await (await fetch(base+'/api/activities')).json();
  assert.equal(items.length,7);
  assert.ok(items.every(a=>a.verification.status==='ready-for-review'));
  assert.equal((await (await fetch(base+'/api/activities?destination=rotorua')).json()).items.length,3);
  let response=await post({record:items[0],expectedRevision:0,action:'approve',reviewer:'',notes:''});
  assert.equal(response.status,400,'approval requires a named manual reviewer');
  response=await post({record:items[0],expectedRevision:0,action:'save',reviewer:'',notes:'Review source currency'});
  assert.equal(response.status,200);
  const {item}=await response.json();
  assert.equal(item.verification.status,'ready-for-review');
  assert.equal(item.revision,1);
  assert.equal(item.verification.notes,'Review source currency');
  assert.equal((await post({record:items[0],expectedRevision:0,action:'save'})).status,409);
  const blocked=await fetch(base+'/api/activity-review',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://another-site.example'},body:JSON.stringify({record:item,expectedRevision:1,action:'save'})});
  assert.equal(blocked.status,403);
  assert.equal((await fetch(base+'/api/activities',{method:'POST'})).status,405);
  const onDisk=JSON.parse(await readFile(activityReviewPath,'utf8'));
  assert.equal(onDisk.records.length,1);
  assert.equal(onDisk.records[0].id,item.id);
  assert.equal((await (await fetch(base+'/api/activity-review')).json()).items.find(a=>a.id===item.id).revision,1);
 }finally{
  await new Promise(resolve=>server.close(resolve));
  await rm(folder,{recursive:true,force:true});
 }
});

test('new browser modules are served and local review files stay private',async()=>{
 const server=createAppServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const path of ['/activities.js','/itinerary.js','/activity-planner.js','/activity-planner.css','/activity-review.js','/activity-review.css','/countries.js','/discovery-groups.js','/discovery.css'])assert.equal((await fetch(base+path)).status,200,path);
  for(const path of ['/data/activity-reviews.local.json','/.env'])assert.equal((await fetch(base+path)).status,404,path);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
