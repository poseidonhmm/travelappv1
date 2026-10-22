import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFeedbackStore,feedbackKey,validateFeedback } from '../lib/feedback.mjs';

const known=new Set(['paris','wadi-rum','bali']);
const base={
 query:'Romantic getaway',region:'all',scenery:[],vibes:['romantic'],
 engine:'ai',destinationId:'wadi-rum',rating:'bad',reason:'wrong-trip-type',
 note:'A desert camp is romantic in an adventurous sense, not classic romance.',
 rank:1,interpretation:'Classic romantic atmosphere'
};
test('feedback validator accepts a rated match and rejects unknown IDs, reasons, oversized notes',()=>{
 const f=validateFeedback(base,known);
 assert.equal(f.destinationId,'wadi-rum');
 assert.throws(()=>validateFeedback({...base,destinationId:'made-up-id'},known));
 assert.throws(()=>validateFeedback({...base,reason:'banana'},known));
 assert.throws(()=>validateFeedback({...base,note:'x'.repeat(601)},known));
 assert.throws(()=>validateFeedback({...base,query:'x'.repeat(401)},known));
 assert.throws(()=>validateFeedback({...base,rank:0},known));
});
test('feedback key is stable for equivalent searches and filters',()=>{
 const first=feedbackKey(base);
 const second=feedbackKey({...base,query:'romantic GETAWAY ',vibes:['romantic']});
 assert.equal(first,second);
});
test('feedback is stored locally and subsequent ratings update rather than duplicate',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-feedback-'));
 try{
  const path=join(folder,'feedback.json');
  const store=createFeedbackStore({filePath:path,knownIds:known});
  assert.deepEqual(await store.list(),[]);
  const first=await store.save(base);
  assert.ok(first.id);
  assert.equal((await store.list()).length,1);
  await store.save({...base,rating:'good',reason:'great-match',note:''});
  const records=await store.list();
  assert.equal(records.length,1);
  assert.equal(records[0].rating,'good');
  assert.equal(records[0].id,first.id);
  await Promise.all([
   store.save({...base,destinationId:'paris',rating:'good',reason:'great-match'}),
   store.save({...base,destinationId:'bali',rating:'bad',reason:'not-relevant'})
  ]);
  assert.equal((await store.list()).length,3);
  const fresh=createFeedbackStore({filePath:path,knownIds:known});
  assert.equal((await fresh.list()).length,3);
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('same query with different home, month or food priorities records separate evaluation examples',()=>{
 const a=validateFeedback({...base,homeRegion:'Europe',homeCountry:'United Kingdom',
  travelMonth:'2026-11',foodPriority:'essential',journey:'nearby',mood:'sociable',rank:120},known);
 assert.equal(a.rank,120);
 assert.equal(a.homeRegion,'Europe');
 assert.notEqual(feedbackKey(a),feedbackKey({...a,foodPriority:'any'}));
 assert.notEqual(feedbackKey(a),feedbackKey({...a,travelMonth:'2027-02'}));
 assert.notEqual(feedbackKey(a),feedbackKey({...a,homeRegion:'Asia'}));
 assert.throws(()=>validateFeedback({...a,foodPriority:'invalid'},known));
 assert.throws(()=>validateFeedback({...a,travelMonth:'next week'},known));
});


test('beach follow-up is a distinct feedback context and legacy feedback keeps its identity',async()=>{
 assert.equal(validateFeedback(base,known).beachPriority,'any');
 assert.equal(feedbackKey(base),feedbackKey({...base,beachPriority:'any'}));
 assert.notEqual(feedbackKey(base),feedbackKey({...base,beachPriority:'important'}));
 assert.throws(()=>validateFeedback({...base,beachPriority:'required'},known));
 const folder=await mkdtemp(join(tmpdir(),'wanderly-feedback-legacy-'));
 try{
  const {writeFile}=await import('node:fs/promises');
  const filePath=join(folder,'feedback.json');
  const legacy={...base,id:'saved-feedback-id',homeCountry:'An older free-text country',homeRegion:'Europe',createdAt:'2026-01-01T00:00:00.000Z'};
  await writeFile(filePath,JSON.stringify([legacy]));
  const store=createFeedbackStore({filePath,knownIds:known});
  assert.equal((await store.list())[0].homeCountry,legacy.homeCountry,'history is read without country migration');
  const updated=await store.save({...legacy,rating:'good'});
  assert.equal(updated.id,'saved-feedback-id');
  assert.equal((await store.list()).length,1);
 }finally{await rm(folder,{recursive:true,force:true});}
});
