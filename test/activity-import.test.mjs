import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,rm,symlink,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ActivityImportError,parseImportBatch,mergeActivityImport,importActivities} from '../lib/activity-import.mjs';
import {parseImportArguments} from '../scripts/import-activities.mjs';

// Entirely synthetic fixtures. These are never research evidence and are never written to the real catalogue.
const now='2026-10-22T12:00:00Z';
const known=new Set(['fixture-town','second-town']);
const sourceUrl='https://operator-fixture.org/visit';
function fixture(id='fixture-walk',destinationId='fixture-town'){
 return {id,destinationId,name:'Synthetic named walkway',category:'nature',description:'Synthetic source-backed fixture used only in temporary tests.',provider:'Synthetic fixture provider',location:{label:'Synthetic entrance address',sourceUrl,verified:true},durationMinutes:null,durationSourceUrl:null,interests:['walking','nature'],atmospheres:['peaceful'],seasonality:{months:[],restriction:null,sourceUrl:null,verified:false},considerations:[],sources:[{url:sourceUrl,title:'Synthetic official visitor page',type:'official',checkedAt:'2026-10-20'}],lastCheckedAt:'2026-10-20',verification:{status:'ready-for-review',reviewedAt:null,reviewer:'',notes:'Synthetic fixture, not real research.'},price:null};
}
const batch=(...activities)=>({schemaVersion:1,activities});
const parse=input=>parseImportBatch(input,{knownDestinationIds:known,now});
const clone=value=>structuredClone(value);
const photo=()=>({source:'external',fileName:null,imageUrl:'https://images.operator-fixture.org/walk.jpg',pageUrl:'https://operator-fixture.org/walk-photo',title:'Synthetic walkway photograph',creator:'Synthetic fixture photographer',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',attribution:'Synthetic fixture photographer / CC BY 4.0',checkedAt:'2026-10-20',subjectConfirmed:true});
const price=()=>({currency:'NZD',min:10,max:12,unit:'per-person',covers:'Synthetic adult admission fixture',sourceUrl,checkedAt:'2026-10-20',confidence:'high',reviewStatus:'approved',evidenceType:'official',experience:'Synthetic walkway adult admission',unitVerified:true,conflict:false,reviewer:'Supplied approver',reviewedAt:now,reviewNotes:'Untrusted imported approval'});

test('multi-destination imports normalize to pending human review without inventing price or approving photos',()=>{
 const first=fixture();first.verification={status:'approved',reviewedAt:now,reviewer:'Imported name',notes:'Keep factual review notes'};first.price=price();first.photo=photo();first.interests=['walking','nature','walking'];first.name='  Synthetic named walkway  ';
 const second=fixture('second-museum','second-town');delete second.verification;
 const records=parse(batch(first,second));
 assert.equal(records.length,2);assert.equal(records[1].destinationId,'second-town');
 assert.deepEqual(records[0].verification,{status:'ready-for-review',reviewedAt:null,reviewer:'',notes:'Keep factual review notes'});
 assert.equal(records[0].name,'Synthetic named walkway');assert.deepEqual(records[0].interests,['nature','walking']);
 assert.equal(records[0].price.min,10);assert.equal(records[0].price.max,12);assert.equal(records[0].price.confidence,'high');assert.equal(records[0].price.reviewStatus,'ready-for-review');assert.equal(records[0].price.reviewer,undefined);assert.equal(records[0].price.reviewedAt,undefined);assert.equal(records[0].price.reviewNotes,undefined);
 assert.equal(records[0].photo.subjectConfirmed,false);assert.equal(records[1].photo,null);assert.equal(records[1].price,null);
 assert.equal(first.verification.status,'approved');assert.equal(first.photo.subjectConfirmed,true,'input must not be mutated');
 for(const status of ['draft','needs-research','ready-for-review','rejected','needs-rechecking']){const item=fixture();item.price={...price(),reviewStatus:status};assert.equal(parse(batch(item))[0].price.reviewStatus,status,'non-approved price states are not promoted');}
});
test('schema version, empty batches, unknown keys and malformed records fail with activity index and ID context',()=>{
 for(const input of [[],{schemaVersion:2,activities:[fixture()]},{schemaVersion:1,activities:[]},{schemaVersion:1,activities:[fixture()],activites:[]}])assert.throws(()=>parse(input),ActivityImportError);
 const alterations=[record=>record.activtyId='typo',record=>record.location.source='typo',record=>record.seasonality.month=1,record=>record.sources[0].checked='typo',record=>record.verification.approved=true,record=>record.price={...price(),cost:10},record=>record.considerations=[{type:'safety',text:'Synthetic note',sourceUrl,verified:true,warning:'typo'}],record=>record.photo={...photo(),caption:'typo'},record=>record.revision=0];
 for(const alter of alterations){const record=fixture();alter(record);assert.throws(()=>parse(batch(record)),error=>error instanceof ActivityImportError&&error.issues[0].index===0&&error.issues[0].id==='fixture-walk'&&/Unknown field/.test(error.message));}
 const bad=fixture();bad.photo={...photo(),subjectConfirmed:'yes'};assert.throws(()=>parse(batch(bad)),/photo.subjectConfirmed/);
 const issues=batch(fixture('wrong-place','unknown-destination'),{...fixture('wrong-duration'),durationMinutes:-1});
 assert.throws(()=>parse(issues),error=>error.issues.length===2&&error.message.includes('activities[0] (wrong-place)')&&error.message.includes('activities[1] (wrong-duration)'));
});
test('import rejects unknown destinations, repeated batch IDs, missing and stale-looking fabricated evidence dates',()=>{
 assert.throws(()=>parse(batch(fixture('unknown','not-in-catalogue'))),/Unknown activity destination/);
 assert.throws(()=>parse(batch(fixture(),fixture())),/Duplicate activity ID inside this batch/);
 for(const change of [{sources:[]},{lastCheckedAt:null},{lastCheckedAt:'2026-10-21'},{sources:[{...fixture().sources[0],checkedAt:'2026-02-30'}]},{sources:[{...fixture().sources[0],checkedAt:'2026-10-23'}]},{location:{...fixture().location,verified:false}},{location:{...fixture().location,label:''}}])assert.throws(()=>parse(batch({...fixture(),...change})));
 const tooMany=fixture();tooMany.sources=Array.from({length:21},(_,index)=>({...fixture().sources[0],url:sourceUrl+'/'+index}));assert.throws(()=>parse(batch(tooMany)),/sources/);
 const placeholder=fixture();placeholder.sources[0].url='https://example.invalid/replace-with-research';placeholder.location.sourceUrl=placeholder.sources[0].url;assert.throws(()=>parse(batch(placeholder)),/placeholder/);
});
test('all factual evidence URLs must match dated sources, including optional and seasonal claims',()=>{
 const mutations=[record=>record.location.sourceUrl=sourceUrl+'/missing',record=>{record.durationMinutes=40;record.durationSourceUrl=sourceUrl+'/duration';},record=>record.durationSourceUrl=sourceUrl+'/optional-duration',record=>record.seasonality={months:[6],restriction:'Synthetic seasonal claim',sourceUrl:null,verified:false},record=>record.seasonality={months:[],restriction:null,sourceUrl:sourceUrl+'/unlisted-season',verified:false},record=>record.considerations=[{type:'permit',text:'Synthetic permit note',sourceUrl:null,verified:false}],record=>record.price={...price(),confidence:'low',sourceUrl:sourceUrl+'/unlisted-price'}];
 for(const mutate of mutations){const record=fixture();mutate(record);assert.throws(()=>parse(batch(record)),/matching URL|requires evidence/);}
 const complete=fixture();complete.durationMinutes=40;complete.durationSourceUrl=sourceUrl;complete.seasonality={months:[6,5],restriction:'Synthetic seasonal note',sourceUrl,verified:true};complete.considerations=[{type:'eligibility',text:'Synthetic eligibility note',sourceUrl,verified:true}];assert.deepEqual(parse(batch(complete))[0].seasonality.months,[5,6]);
});
test('category and interest strings stay open rather than silently imposing an unimplemented enum',()=>{
 const record=fixture();record.category='editorial-special-category';record.interests=['unlisted-but-valid-theme'];record.atmospheres=['unlisted-atmosphere'];const result=parse(batch(record))[0];assert.equal(result.category,record.category);assert.deepEqual(result.interests,record.interests);
 assert.throws(()=>parse(batch({...record,category:'x'.repeat(81)})),/category/);
 assert.throws(()=>parse(batch({...record,interests:['x'.repeat(81)]})),/interests/);
 assert.throws(()=>parse(batch({...record,interests:['  ']})),/blank/);
});
test('append-only merge skips normalized identical records but preserves existing approvals and legacy fields exactly',()=>{
 const original=fixture();original.verification={status:'approved',reviewer:'Real local reviewer fixture',reviewedAt:now,notes:original.verification.notes};original.photo=photo();original.price=price();
 const imported=clone(original);imported.interests.reverse();imported.photo.subjectConfirmed=false;
 const before=clone(original);const result=mergeActivityImport([original],batch(imported,fixture('new-entry','second-town')),{knownDestinationIds:known,now});
 assert.deepEqual(result.added,['new-entry']);assert.deepEqual(result.skipped,[original.id]);assert.deepEqual(result.records[0],before);assert.equal(result.records[0],original);assert.equal(result.records[0].verification.status,'approved');assert.equal(result.records[0].photo.subjectConfirmed,true);
 const legacy={...fixture(),legacyEditorialField:'Preserve this legacy field'};
 assert.deepEqual(mergeActivityImport([legacy],batch(fixture('new-entry')),{knownDestinationIds:known,now}).records[0],legacy);
 assert.throws(()=>mergeActivityImport([original],batch({...fixture(),name:'Conflicting attraction'},fixture('otherwise-valid')),{knownDestinationIds:known,now}),error=>error.code==='ACTIVITY_IMPORT_CONFLICT'&&error.issues[0].index===0&&error.issues[0].id===original.id);
});
async function temporary(run){
 const folder=await mkdtemp(join(tmpdir(),'wanderly-import-test-'));
 const filePath=join(folder,'activities.json'),destinationsPath=join(folder,'destinations.json');
 const raw='[\n'+JSON.stringify(fixture(),null,1)+'\n]\n';
 await writeFile(filePath,raw);await writeFile(destinationsPath,JSON.stringify([...known].map(id=>({id}))));
 try{await run({folder,filePath,destinationsPath,raw,options:{filePath,destinationsPath,now}});}finally{await rm(folder,{recursive:true,force:true});}
}
test('dry run validates an entire multi-destination batch and writes no catalogue, lock, temporary or local files',async()=>temporary(async({folder,filePath,raw,options})=>{
 const before=await readdir(folder);const result=await importActivities({...options,input:batch(fixture('new-a'),fixture('new-b','second-town')),dryRun:true});
 assert.equal(result.dryRun,true);assert.equal(result.written,false);assert.deepEqual(result.added,['new-a','new-b']);assert.equal(result.totalCount,3);assert.equal(await readFile(filePath,'utf8'),raw);assert.deepEqual(await readdir(folder),before);
}));
test('atomic append preserves original record bytes and repeat normalized import is a byte-for-byte no-op',async()=>temporary(async({folder,filePath,raw,options})=>{
 const overridePath=join(folder,'activity-reviews.local.json'),cachePath=join(folder,'feedback.local.json');
 const override='{"syntheticApprovedReview":"must stay untouched"}\n';const cache='["synthetic feedback"]\n';await writeFile(overridePath,override);await writeFile(cachePath,cache);
 const input=batch(fixture('new-a'),fixture('new-b','second-town'));const result=await importActivities({...options,input});assert.equal(result.written,true);assert.equal(result.totalCount,3);
 const saved=await readFile(filePath,'utf8');assert.ok(saved.startsWith(raw.slice(0,raw.lastIndexOf(']')).trimEnd()+','),'pre-existing record bytes remain intact');assert.deepEqual(JSON.parse(saved)[0],fixture());
 const mtime=(await stat(filePath)).mtimeMs;const again=await importActivities({...options,input});assert.equal(again.written,false);assert.deepEqual(again.added,[]);assert.deepEqual(again.skipped,['new-a','new-b']);assert.equal(await readFile(filePath,'utf8'),saved);assert.equal((await stat(filePath)).mtimeMs,mtime);
 assert.equal(await readFile(overridePath,'utf8'),override);assert.equal(await readFile(cachePath,'utf8'),cache);assert.equal((await readdir(folder)).some(name=>name.includes('.import')),false);
}));
test('any validation or existing-ID conflict leaves the whole catalogue unchanged and releases its lock',async()=>temporary(async({folder,filePath,raw,options})=>{
 await assert.rejects(importActivities({...options,input:batch(fixture('valid-new'),fixture('invalid-new','unknown-destination'))}),/Unknown activity destination/);assert.equal(await readFile(filePath,'utf8'),raw);
 await assert.rejects(importActivities({...options,input:batch(fixture('valid-new'),{...fixture(),name:'Conflicting replacement'})}),error=>error.code==='ACTIVITY_IMPORT_CONFLICT');assert.equal(await readFile(filePath,'utf8'),raw);
 assert.equal((await readdir(folder)).some(name=>name.includes('.import')),false);
 await writeFile(filePath,'not JSON');await assert.rejects(importActivities({...options,input:batch(fixture('new'))}),/not valid JSON/);assert.equal(await readFile(filePath,'utf8'),'not JSON');assert.equal((await readdir(folder)).some(name=>name.includes('.import')),false);
}));
test('a held lock blocks mutations, stays owned by its holder, and dry runs remain non-mutating',async()=>temporary(async({filePath,raw,options})=>{
 const lock=filePath+'.import.lock';const marker='{"pid":"synthetic existing owner"}\n';await writeFile(lock,marker);
 await assert.rejects(importActivities({...options,input:batch(fixture('new'))}),error=>error.code==='ACTIVITY_IMPORT_LOCKED');assert.equal(await readFile(lock,'utf8'),marker);assert.equal(await readFile(filePath,'utf8'),raw);
 const preview=await importActivities({...options,input:batch(fixture('new')),dryRun:true});assert.equal(preview.written,false);assert.equal(await readFile(lock,'utf8'),marker);assert.equal(await readFile(filePath,'utf8'),raw);
}));
test('concurrent imports cannot lose updates and retries append each distinct batch once',async()=>temporary(async({folder,filePath,options})=>{
 const inputs=[batch(fixture('concurrent-a')),batch(fixture('concurrent-b','second-town'))];
 const outcomes=await Promise.allSettled(inputs.map(input=>importActivities({...options,input})));
 for(const [index,result] of outcomes.entries())if(result.status==='rejected'){assert.equal(result.reason.code,'ACTIVITY_IMPORT_LOCKED');await importActivities({...options,input:inputs[index]});}
 const records=JSON.parse(await readFile(filePath,'utf8'));assert.deepEqual(records.map(record=>record.id).sort(),['concurrent-a','concurrent-b','fixture-walk']);assert.equal((await readdir(folder)).some(name=>name.includes('.import')),false);
}));
test('protected cache, review, destination and credential targets and symlinks cannot be overwritten',async()=>temporary(async({folder,filePath,destinationsPath,raw,options})=>{
 for(const name of ['feedback.local.json','photo-cache.local.json','embeddings.local.json','activity-reviews.local.json','.env','.env.backup']){
  const target=join(folder,name);await writeFile(target,'preserve exactly');await assert.rejects(importActivities({...options,filePath:target,input:batch(fixture('new'))}),/never destinations, credentials, local reviews or caches/);assert.equal(await readFile(target,'utf8'),'preserve exactly');
 }
 await assert.rejects(importActivities({...options,filePath:destinationsPath,input:batch(fixture('new'))}),/never destinations/);
 const alias=join(folder,'symlink-catalogue.json');await symlink(filePath,alias);await assert.rejects(importActivities({...options,filePath:alias,input:batch(fixture('new'))}),/regular file/);assert.equal(await readFile(filePath,'utf8'),raw);assert.equal((await readdir(folder)).some(name=>name.includes('.import')),false);
}));
test('CLI supports help, dry run and append without network calls or real catalogue writes',async()=>temporary(async({folder,filePath,destinationsPath,raw})=>{
 const script=fileURLToPath(new URL('../scripts/import-activities.mjs',import.meta.url));const inputPath=join(folder,'batch.json');await writeFile(inputPath,JSON.stringify(batch(fixture('cli-entry'))));
 const run=args=>spawnSync(process.execPath,[script,...args],{encoding:'utf8',env:{...process.env,WANDERLY_AI_DISABLED:'1'}});
 const preview=run([inputPath,'--catalogue',filePath,'--destinations',destinationsPath,'--dry-run']);assert.equal(preview.status,0,preview.stderr);assert.match(preview.stdout,/Dry run: would add 1 activity/);assert.match(preview.stdout,/No files were written/);assert.equal(await readFile(filePath,'utf8'),raw);
 const actual=run([inputPath,'--catalogue',filePath,'--destinations',destinationsPath]);assert.equal(actual.status,0,actual.stderr);assert.match(actual.stdout,/Added 1 activity/);assert.match(actual.stdout,/Restart Wanderly/);
 const again=run([inputPath,'--catalogue',filePath,'--destinations',destinationsPath]);assert.equal(again.status,0,again.stderr);assert.match(again.stdout,/skipped 1 identical/);
 assert.equal(run(['--help']).status,0);const invalid=run([inputPath,'--bogus']);assert.equal(invalid.status,1);assert.match(invalid.stderr,/Unknown option/);
 assert.throws(()=>parseImportArguments([]),/required/);assert.throws(()=>parseImportArguments([inputPath,'--catalogue']),/requires/);assert.throws(()=>parseImportArguments([inputPath,'--catalogue',filePath,'--catalogue',filePath]),/Repeated/);
}));
