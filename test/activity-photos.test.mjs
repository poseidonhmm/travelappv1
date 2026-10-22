import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,stat,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {validateActivityPhoto,prepareImportedActivityPhoto,publicActivityPhoto,activityPhotoHTML,initializeActivityPhotoFallbacks} from '../public/activity-photos.js';
import {createActivityPhotoStore} from '../lib/activity-photos.mjs';

// Synthetic metadata fixtures only: no test asserts these example images exist.
const now=new Date('2026-10-22T12:00:00.000Z');
const photo=()=>({source:'wikimedia-commons',fileName:'File:Wanderly fixture.jpg',
 imageUrl:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Wanderly_fixture.jpg/800px-Wanderly_fixture.jpg',
 pageUrl:'https://commons.wikimedia.org/wiki/File:Wanderly_fixture.jpg',title:'Activity fixture photo',creator:'Fixture photographer',
 license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',attribution:'Activity fixture photo by Fixture photographer, CC BY-SA 4.0',
 checkedAt:'2026-10-22',subjectConfirmed:true});
const approved=()=>({id:'rotorua-fixture',destinationId:'rotorua',name:'Fixture activity',revision:1,photo:photo(),
 verification:{status:'approved',reviewer:'Test reviewer',reviewedAt:'2026-10-22T09:00:00.000Z',notes:'Manual review fixture'}});
const validate=value=>validateActivityPhoto(value,{now});

test('legacy activity records without photo remain valid and render a neutral activity-specific placeholder',()=>{
 assert.equal(validate(undefined),null);assert.equal(validate(null),null);
 const record={id:'legacy-activity',name:'Saved activity'};
 assert.equal(publicActivityPhoto(record,{now}),null);
 const html=activityPhotoHTML(record,{now});
 assert.match(html,/Activity photo research pending/);assert.match(html,/Saved activity/);
 assert.doesNotMatch(html,/<img|data-photo-activity|destination image/i);
});

test('photo validation returns only complete known metadata without modifying input',()=>{
 const value=photo();const result=validate(value);
 assert.deepEqual(result,value);assert.notEqual(result,value);
 assert.throws(()=>validate({...value,guessedSubject:true}),/Unknown/);
 const partial={...value};delete partial.attribution;
 assert.throws(()=>validate(partial),/incomplete/);
 for(const key of ['creator','title','license','attribution'])assert.throws(()=>validate({...value,[key]:' '}),/Invalid/);
 assert.throws(()=>validate({...value,title:'x'.repeat(301)}),/title/);
 assert.throws(()=>validate({...value,subjectConfirmed:'yes'}),/boolean/);
});

test('Commons filename, source page and actual upload path must describe the same file',()=>{
 assert.ok(validate(photo()));
 const original={...photo(),imageUrl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Wanderly_fixture.jpg'};
 assert.ok(validate(original));
 assert.ok(validate({...original,pageUrl:'https://commons.wikimedia.org/wiki/File%3AWanderly_fixture.jpg'}));
 for(const changed of [
  {fileName:'Wanderly fixture.jpg'},
  {pageUrl:'https://commons.wikimedia.org/wiki/File:Another_photo.jpg'},
  {pageUrl:'https://commons.wikimedia.org.evil.org/wiki/File:Wanderly_fixture.jpg'},
  {imageUrl:'https://upload.wikimedia.org/wikipedia/en/a/ab/Wanderly_fixture.jpg'},
  {imageUrl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Another_photo.jpg'},
  {imageUrl:'https://images.example.org/wikipedia/commons/a/ab/Wanderly_fixture.jpg'}
 ])assert.throws(()=>validate({...photo(),...changed}),/Commons/);
});

test('photo URLs require HTTPS, public hosts and no credentials or unsafe schemes',()=>{
 for(const url of ['http://example.org/photo.jpg','javascript:alert(1)','data:image/png;base64,abc','https://name:secret@example.org/photo.jpg','https://localhost/photo.jpg','https://127.0.0.1/photo.jpg','https://[::1]/photo.jpg','https://example.local/photo.jpg','https://example.org:8443/photo.jpg','https://example.org/space here.jpg']){
  assert.throws(()=>validate({...photo(),imageUrl:url}),/safe HTTPS/);
 }
 assert.throws(()=>validate({...photo(),licenseUrl:'https://name:secret@creativecommons.org/licenses/by-sa/4.0/'}),/safe HTTPS/);
 const external={...photo(),source:'external',fileName:null,imageUrl:'https://images.example.org/activity.jpg',pageUrl:'https://example.org/activity-photo'};
 assert.ok(validate(external));
 assert.throws(()=>validate({...external,fileName:'File:Incorrect.jpg'}),/null Commons filename/);
});

test('licenses must identify usable rights and match the official license URL',()=>{
 for(const [license,licenseUrl] of [
  ['CC BY 4.0','https://creativecommons.org/licenses/by/4.0/'],
  ['CC-BY-SA-3.0','https://creativecommons.org/licenses/by-sa/3.0/'],
  ['CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/'],
  ['Public domain','https://creativecommons.org/publicdomain/mark/1.0/']
 ])assert.ok(validate({...photo(),license,licenseUrl}));
 for(const [license,licenseUrl] of [
  ['CC BY-NC 4.0','https://creativecommons.org/licenses/by-nc/4.0/'],
  ['CC BY-ND 4.0','https://creativecommons.org/licenses/by-nd/4.0/'],
  ['Unknown','https://creativecommons.org/licenses/by/4.0/'],
  ['All rights reserved','https://example.org/license'],
  ['CC BY-SA 4.0','https://creativecommons.org/licenses/by/4.0/'],
  ['CC BY 3.0','https://creativecommons.org/licenses/by/4.0/'],
  ['CC BY 4.0','https://example.org/licenses/by/4.0/']
 ])assert.throws(()=>validate({...photo(),license,licenseUrl}),/supported/);
});

test('metadata dates must be real calendar dates and cannot be future checks',()=>{
 for(const checkedAt of ['2026-02-30','2026-13-01','2026-1-01','2026-10-23','not-a-date'])assert.throws(()=>validate({...photo(),checkedAt}),/real date/);
 assert.ok(validate({...photo(),checkedAt:'2024-02-29'}));
});

test('only current approved records with a human review stamp and confirmed subject expose public photos',()=>{
 assert.deepEqual(publicActivityPhoto(approved(),{now}),photo());
 for(const status of ['draft','needs-research','ready-for-review','rejected','needs-rechecking']){
  const record=approved();record.verification.status=status;
  assert.equal(publicActivityPhoto(record,{now}),null);
  assert.doesNotMatch(activityPhotoHTML(record,{now}),/<img/);
 }
 for(const patch of [{reviewer:''},{reviewedAt:null},{reviewedAt:'invalid'},{reviewedAt:'2026-10-23T00:00:00Z'}]){
  const record=approved();Object.assign(record.verification,patch);assert.equal(publicActivityPhoto(record,{now}),null);
 }
 const record=approved();record.photo.subjectConfirmed=false;
 assert.equal(publicActivityPhoto(record,{now}),null);
 record.photo.subjectConfirmed=true;record.photo.pageUrl='https://example.org/not-commons';
 assert.equal(publicActivityPhoto(record,{now}),null);
});

test('imports always clear subject confirmation and never mutate proposed metadata',()=>{
 const original=photo(),result=prepareImportedActivityPhoto(original,{now});
 assert.equal(result.subjectConfirmed,false);assert.equal(original.subjectConfirmed,true);
 assert.equal(prepareImportedActivityPhoto(undefined,{now}),null);
});

test('review candidates show unverified status and public figures include escaped attribution and source',()=>{
 const record=approved();record.verification.status='ready-for-review';record.photo.subjectConfirmed=false;
 const candidate=activityPhotoHTML(record,{reviewCandidate:true,now});
 assert.match(candidate,/<img/);assert.match(candidate,/Unverified photo candidate/);assert.match(candidate,/unverified candidate/);
 assert.match(candidate,/data-activity-photo-id="rotorua-fixture"/);
 const reviewed=approved();reviewed.photo.title='<script>fixture</script>';reviewed.photo.creator='A & B';
 const html=activityPhotoHTML(reviewed,{now});
 assert.match(html,/&lt;script&gt;fixture&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);
 for(const value of ['By A &amp; B','CC BY-SA 4.0','Wikimedia Commons source','2026-10-22','data-activity-photo-fallback','referrerpolicy="no-referrer"'])assert.ok(html.includes(value),value);
});

test('captured image errors reveal neutral fallbacks for initial and subsequently rendered activity images',()=>{
 let listener,capture,removed=0;
 const doc={readyState:'complete',addEventListener:(type,fn,options)=>{if(type==='error'){listener=fn;capture=options;}},removeEventListener:()=>{removed++;},querySelectorAll:()=>[]};
 const cleanup=initializeActivityPhotoFallbacks(doc);
 assert.equal(capture,true);assert.equal(initializeActivityPhotoFallbacks(doc),cleanup);
 for(let i=0;i<2;i++){
  const fallback={hidden:true},classes=[];
  const figure={querySelector:()=>fallback,classList:{add:name=>classes.push(name)}};
  const image={hidden:false,matches:()=>true,closest:()=>figure};
  listener({target:image});
  assert.equal(image.hidden,true);assert.equal(fallback.hidden,false);assert.deepEqual(classes,['activity-photo-unavailable']);
 }
 listener({target:{matches:()=>false}});
 cleanup();assert.ok(removed>=1);
 assert.doesNotThrow(()=>initializeActivityPhotoFallbacks(undefined));
});

test('selected metadata persists atomically, clones results and never performs a network request',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-activity-photo-'));let calls=0;
 const originalFetch=globalThis.fetch;globalThis.fetch=()=>{calls++;throw Error('No network permitted');};
 try{
  const cachePath=join(folder,'activity-photo-cache.local.json'),store=createActivityPhotoStore({cachePath,now:()=>now});
  const record=approved(),result=await store.getPhoto(record);
  assert.deepEqual(result,photo());result.title='Changed in a user view';
  assert.equal((await store.getPhoto(record)).title,photo().title);
  const raw=JSON.parse(await readFile(cachePath,'utf8'));
  assert.equal(raw.version,1);assert.equal(Object.keys(raw.entries).length,1);
  assert.match(Object.keys(raw.entries)[0],/^rotorua-fixture:[a-f0-9]{64}$/);
  assert.deepEqual(await readdir(folder),['activity-photo-cache.local.json']);
  assert.equal((await stat(cachePath)).mode&0o777,0o600);
  const reopened=createActivityPhotoStore({cachePath,now:()=>now});assert.deepEqual(await reopened.getPhoto(record),photo());
  assert.equal(calls,0);
 }finally{globalThis.fetch=originalFetch;await rm(folder,{recursive:true,force:true});}
});

test('photo metadata changes replace cache identity and demotion, rejection or removed photo cannot reuse approval',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-activity-photo-recheck-'));
 try{
  const cachePath=join(folder,'photos.json'),store=createActivityPhotoStore({cachePath,now:()=>now});
  const record=approved();await store.getPhoto(record);
  const keys=async()=>Object.keys(JSON.parse(await readFile(cachePath,'utf8')).entries);
  const first=(await keys())[0];record.photo.title='A changed title';record.revision++;
  assert.equal((await store.getPhoto(record)).title,'A changed title');
  const second=await keys();assert.equal(second.length,1);assert.notEqual(second[0],first);
  record.verification.status='rejected';assert.equal(await store.getPhoto(record),null);assert.deepEqual(await keys(),[]);
  record.verification.status='approved';record.photo.subjectConfirmed=false;assert.equal(await store.getPhoto(record),null);
  record.photo.subjectConfirmed=true;await store.getPhoto(record);record.photo=null;
  assert.equal(await store.getPhoto(record),null);assert.deepEqual(await keys(),[]);
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('cached data never overrides the current approved record and concurrent records remain separate',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-activity-photo-cache-'));
 try{
  const cachePath=join(folder,'photos.json'),record=approved();
  await createActivityPhotoStore({cachePath,now:()=>now}).getPhoto(record);
  const data=JSON.parse(await readFile(cachePath,'utf8'));Object.values(data.entries)[0].photo.title='Stale cached title';
  await writeFile(cachePath,JSON.stringify(data));
  const store=createActivityPhotoStore({cachePath,now:()=>now});assert.equal((await store.getPhoto(record)).title,photo().title);
  const second={...record,id:'second-activity'};await Promise.all([store.getPhoto(record),store.getPhoto(second)]);
  assert.equal(Object.keys(JSON.parse(await readFile(cachePath,'utf8')).entries).length,2);
  const changedApproval={...record,verification:{...record.verification,status:'needs-rechecking'}};
  assert.equal(await store.getPhoto(changedApproval),null);
  const remaining=Object.values(JSON.parse(await readFile(cachePath,'utf8')).entries);
  assert.deepEqual(remaining.map(e=>e.activityId),['second-activity']);
 }finally{await rm(folder,{recursive:true,force:true});}
});


test('missing, unreadable or corrupt cache storage never blocks fresh approved metadata or revives rejected images',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-activity-photo-cache-failure-'));
 try{
  const corruptPath=join(folder,'corrupt.json');await writeFile(corruptPath,'{invalid JSON');
  for(const cachePath of [join(folder,'missing-parent','cache.json'),folder,corruptPath]){
   const store=createActivityPhotoStore({cachePath,now:()=>now}),record=approved();
   assert.deepEqual(await store.getPhoto(record),photo());
   record.verification.status='rejected';
   assert.equal(await store.getPhoto(record),null);
   record.verification.status='approved';record.photo.subjectConfirmed=false;
   assert.equal(await store.getPhoto(record),null);
  }
 }finally{await rm(folder,{recursive:true,force:true});}
});
