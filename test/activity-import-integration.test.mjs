import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppServer} from '../server.mjs';
import {importActivities} from '../lib/activity-import.mjs';
import {recommendActivities} from '../public/activities.js';
import {createActivityPlan,editPlan} from '../public/itinerary.js';
import {recommendedActivitiesHTML} from '../public/activity-planner.js';

// Synthetic fixtures exercise software only. They are never imported into the
// project catalogue and no evidence or image URL is fetched by these tests.
const today=new Date().toISOString().slice(0,10);
function candidate(destinationId){
 const sourceUrl='https://fixture-operator.org/visit';
 return {id:destinationId+'-import-integration-fixture',destinationId,name:'Synthetic food experience',category:'food',description:'An illustrative test record, not a real attraction.',provider:null,
  location:{label:'Synthetic test location',sourceUrl,verified:true},durationMinutes:null,durationSourceUrl:null,interests:['food'],atmospheres:['relaxed'],
  seasonality:{months:[],restriction:null,sourceUrl:null,verified:false},considerations:[],sources:[{url:sourceUrl,title:'Synthetic evidence fixture',type:'official',checkedAt:today}],lastCheckedAt:today,price:null,
  photo:{source:'external',fileName:null,imageUrl:'https://fixture-images.org/food.jpg',pageUrl:'https://fixture-images.org/food',title:'Synthetic image fixture',creator:'Test Creator',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',attribution:'Test Creator, CC BY 4.0',checkedAt:today,subjectConfirmed:true}};
}

test('imported activities reach the correct itineraries and confirmed photos use the separate review-aware cache',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-import-display-'));
 const catalogue=join(folder,'activities.json'),reviews=join(folder,'reviews.json'),photoCache=join(folder,'photos.json');
 const seed=await readFile(new URL('../data/activities.json',import.meta.url),'utf8');
 await writeFile(catalogue,seed);
 const batch={schemaVersion:1,activities:[candidate('lisbon'),candidate('rotorua')]};
 let server;
 try{
  const imported=await importActivities({input:batch,filePath:catalogue});
  assert.equal(imported.added.length,2);
  const afterImport=await readFile(catalogue,'utf8');
  assert.deepEqual(JSON.parse(afterImport).slice(0,7),JSON.parse(seed),'existing catalogue records remain intact');
  server=createAppServer({activityCataloguePath:catalogue,activityReviewPath:reviews,activityPhotoCachePath:photoCache});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const get=async path=>(await (await fetch(base+path)).json()).items;
  const post=async(record,action)=>{
   const response=await fetch(base+'/api/activity-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({record,expectedRevision:record.revision,action,reviewer:'Fixture reviewer',notes:'Synthetic test only'})});
   const result=await response.json();assert.equal(response.status,200,JSON.stringify(result));return result.item;
  };
  let publicRecords=await get('/api/activities?destination=lisbon');
  const id=batch.activities[0].id;
  assert.ok(publicRecords.every(record=>record.destinationId==='lisbon'));
  assert.equal(publicRecords.find(record=>record.id===id).photo,null,'unreviewed image URLs are not served to travellers');
  assert.equal(recommendActivities(publicRecords,'lisbon',{foodPriority:'important'})[0].id,id);
  assert.match(recommendedActivitiesHTML(publicRecords,'lisbon',{foodPriority:'important'},5),/Synthetic food experience/);
  assert.doesNotMatch(recommendedActivitiesHTML(publicRecords,'lisbon',{},5),/fixture-images/);
  const outline=createActivityPlan(publicRecords,'lisbon',5,{foodPriority:'important'});
  assert.equal(outline[0].items[0].activityId,id);
  const legacy=[{label:'My saved day',items:[{key:'legacy',template:'food'}]},{label:'Next day',items:[]}];
  let edited=editPlan(legacy,{action:'add',dayIndex:0,item:{key:'imported',activityId:id}});
  edited=editPlan(edited,{action:'up',dayIndex:0,itemIndex:1});
  edited=editPlan(edited,{action:'move',dayIndex:0,itemIndex:0,targetDay:1});
  assert.equal(edited[1].items[0].activityId,id);
  edited=editPlan(edited,{action:'remove',dayIndex:1,itemIndex:0});
  assert.deepEqual(edited,legacy,'imported activity edits retain legacy ideas and day titles');

  let record=(await get('/api/activity-review')).find(record=>record.id===id);
  assert.equal(record.photo.subjectConfirmed,false,'import clears a supplied subject claim');
  record=await post(record,'approve');
  assert.equal((await get('/api/activities')).find(record=>record.id===id).photo,null,'activity approval alone does not identify the image');
  record=await post({...record,photo:{...record.photo,subjectConfirmed:true}},'approve');
  publicRecords=await get('/api/activities?destination=lisbon');
  assert.equal(publicRecords.find(record=>record.id===id).photo.imageUrl,batch.activities[0].photo.imageUrl);
  const html=recommendedActivitiesHTML(publicRecords,'lisbon',{},5);
  assert.match(html,/data-activity-photo-image="lisbon-import-integration-fixture"/);
  assert.match(html,/Test Creator/);assert.match(html,/CC BY 4.0/);
  assert.doesNotMatch(html,/data-photo-activity=/,'activity cards never invoke destination photo selection');
  let cached=JSON.parse(await readFile(photoCache,'utf8'));
  assert.ok(Object.values(cached.entries).some(entry=>entry.activityId===id));

  const beforeReview=await readFile(reviews,'utf8');
  const repeated=await importActivities({input:batch,filePath:catalogue});
  assert.equal(repeated.added.length,0);assert.equal(repeated.skipped.length,2);
  assert.equal(await readFile(catalogue,'utf8'),afterImport);
  assert.equal(await readFile(reviews,'utf8'),beforeReview,'re-import never touches local human decisions');

  record=await post({...record,photo:{...record.photo,title:'Changed photo metadata'}},'save');
  assert.equal(record.verification.status,'ready-for-review');
  assert.equal((await get('/api/activities')).find(record=>record.id===id).photo,null);
  cached=JSON.parse(await readFile(photoCache,'utf8'));
  assert.ok(!Object.values(cached.entries).some(entry=>entry.activityId===id),'demotion evicts old approved metadata');
  await post(record,'reject');
  assert.ok(!recommendActivities(await get('/api/activities'),'lisbon',{}).some(record=>record.id===id));
 }finally{
  if(server?.listening)await new Promise(resolve=>server.close(resolve));
  await rm(folder,{recursive:true,force:true});
 }
});
