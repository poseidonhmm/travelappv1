import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateActivity,priceUsability,activityFlags,recommendActivities,summarizeActivityCosts,formatActivityPrice,REVIEW_STATUSES } from '../public/activities.js';
import {activityPriceHTML} from '../public/activity-planner.js';
import { createActivityStore } from '../lib/activities.mjs';

const now='2026-10-22T12:00:00Z';
const known=new Set(['rotorua','lisbon']);
const fixture=()=>({id:'rotorua-thermal-walk',destinationId:'rotorua',name:'Named thermal walk',category:'nature',description:'A sourced walk at a specific attraction.',provider:'Example attraction',location:{label:'Rotorua attraction entrance',sourceUrl:'https://example.org/location',verified:true},durationMinutes:120,durationSourceUrl:'https://example.org/visit',interests:['nature','geothermal'],atmospheres:['relaxed'],seasonality:{months:[],restriction:null,sourceUrl:null,verified:false},considerations:[],sources:[{url:'https://example.org/visit',title:'Official visit information',type:'official',checkedAt:'2026-10-20'},{url:'https://example.org/tickets',title:'Official adult ticket price',type:'official',checkedAt:'2026-10-20'}],lastCheckedAt:'2026-10-20',verification:{status:'ready-for-review',reviewedAt:null,reviewer:'',notes:''},price:{currency:'NZD',min:45,max:45,unit:'per-person',covers:'One adult admission',sourceUrl:'https://example.org/tickets',checkedAt:'2026-10-20',confidence:'high',reviewStatus:'ready-for-review',evidenceType:'official',experience:'Named thermal walk adult admission',unitVerified:true,conflict:false}});
const validate=record=>validateActivity(record,{knownDestinationIds:known,now});
test('activity validation preserves a specific evidence-backed pending record without approving it',()=>{
 const original=fixture();const valid=validate(original);assert.deepEqual(valid,original);assert.notEqual(valid,original);assert.equal(valid.verification.status,'ready-for-review');
 assert.throws(()=>validate({...original,destinationId:'invented-place'}),/Unknown/);
 assert.throws(()=>validate({...original,id:'../bad'}),/ID/);
 assert.throws(()=>validate({...original,durationSourceUrl:null}),/duration requires evidence/);
 assert.throws(()=>validate({...original,sources:[{...original.sources[0],url:'javascript:alert(1)'}]}),/source/);
 assert.throws(()=>validate({...original,lastCheckedAt:'2026-02-30'}),/date/);
 assert.throws(()=>validate({...original,lastCheckedAt:'2026-10-23'}),/date/);
 assert.throws(()=>validate({...original,price:{...original.price,min:60,max:40}}),/range/);
 assert.throws(()=>validate({...original,price:{...original.price,min:NaN}}),/range/);
 assert.throws(()=>validate({...original,verification:{...original.verification,status:'verified'}}),/review status/);
});
test('high confidence requires direct official evidence with unit, coverage and experience',()=>{
 const record=fixture();
 for(const change of [{evidenceType:'published'},{sourceUrl:null},{checkedAt:null},{unitVerified:false},{experience:''},{covers:''}])assert.throws(()=>validate({...record,price:{...record.price,...change}}),/High confidence/);
 assert.throws(()=>validate({...record,price:{...record.price,checkedAt:'2026-10-23'}}),/future/);
 assert.throws(()=>validate({...record,verification:{...record.verification,status:'approved'}}),/human reviewer/);
 assert.throws(()=>validate({...record,price:{...record.price,reviewStatus:'approved'}}),/human reviewer/);
});
test('usable estimates enforce age, confidence, conflicts, evidence and review states on every calculation',()=>{
 const price=fixture().price;assert.equal(priceUsability(price,now).usable,true);
 assert.equal(priceUsability({...price,checkedAt:'2026-04-25'},now).usable,true); // 180 days
 assert.ok(priceUsability({...price,checkedAt:'2026-04-24'},now).flags.includes('outdated-price'));
 assert.equal(priceUsability({...price,confidence:'medium',evidenceType:'published',checkedAt:'2025-10-22'},now).usable,true);
 assert.equal(priceUsability({...price,confidence:'medium',checkedAt:'2025-10-21'},now).usable,false);
 for(const change of [{confidence:'low'},{conflict:true},{unitVerified:false},{sourceUrl:''},{experience:''},{reviewStatus:'needs-rechecking'},{checkedAt:'2026-10-23'}])assert.equal(priceUsability({...price,...change},now).usable,false);
 assert.equal(formatActivityPrice(null,now),'Price unavailable');
 assert.equal(formatActivityPrice({...price,confidence:'low'},now),'Estimate pending verification');
});
test('activity flags expose missing location, weak evidence, unsupported seasonality, considerations and stale pricing',()=>{
 const record=fixture();record.location.verified=false;record.sources=[];record.lastCheckedAt='2024-01-01';record.seasonality={months:[6,7],restriction:'Seasonal restriction',sourceUrl:null,verified:false};record.considerations=[{type:'permit',text:'Permit details require checking',sourceUrl:null,verified:false}];record.price.checkedAt='2024-01-01';record.price.conflict=true;
 const flags=activityFlags(record,now);
 for(const flag of ['missing-evidence','missing-location-evidence','outdated-activity-evidence','unverified-seasonality','unverified-considerations','outdated-price','conflicting-price','awaiting-human-review'])assert.ok(flags.includes(flag),flag);
});
test('recommendations respect destination and review states, expressed interests, and only verified seasonal restrictions',()=>{
 const first=fixture(),food={...fixture(),id:'rotorua-food',name:'Specific food visit',category:'food',interests:['food']},elsewhere={...fixture(),id:'lisbon-walk',destinationId:'lisbon'};
 assert.equal(recommendActivities([first,food,elsewhere],'rotorua',{foodPriority:'essential'})[0].id,food.id);
 assert.deepEqual(recommendActivities(REVIEW_STATUSES.map((status,index)=>({...fixture(),id:'record-'+index,verification:{...fixture().verification,status}})),'rotorua').map(x=>x.verification.status),['approved','ready-for-review']);
 first.seasonality={months:[1,2],restriction:null,sourceUrl:'https://example.org/seasons',verified:true};
 assert.equal(recommendActivities([first],'rotorua',{travelMonth:'2026-10'}).length,0);
 first.seasonality.verified=false;assert.equal(recommendActivities([first],'rotorua',{travelMonth:'2026-10'}).length,1);
 assert.equal(recommendActivities([{...fixture(),location:{...fixture().location,verified:false}}],'rotorua').length,0);
});
test('activity totals count only usable evidence and keep different currencies and pricing units separate',()=>{
 const a=fixture(),b={...fixture(),price:{...a.price,min:20,max:30}},group={...fixture(),price:{...a.price,min:100,max:150,unit:'per-group'}},euro={...fixture(),price:{...a.price,currency:'EUR',min:10,max:20}},unknown={...fixture(),price:null},low={...fixture(),price:{...a.price,confidence:'low'}},rejected={...fixture(),verification:{...a.verification,status:'rejected'}};
 const summary=summarizeActivityCosts([a,{activity:b},group,euro,unknown,low,rejected],now);
 assert.equal(summary.knownCount,4);assert.equal(summary.unknownCount,3);assert.equal(summary.totalCount,7);assert.equal(summary.incomplete,true);
 assert.deepEqual(summary.groups,[{currency:'NZD',unit:'per-person',min:65,max:75,knownCount:2},{currency:'NZD',unit:'per-group',min:100,max:150,knownCount:1},{currency:'EUR',unit:'per-person',min:10,max:20,knownCount:1}]);
 const free={...fixture(),price:{...a.price,min:0,max:0,covers:'Officially documented complimentary admission'}};
 assert.equal(summarizeActivityCosts([free],now).knownCount,1);assert.equal(summarizeActivityCosts([{title:'Legacy unsourced activity'}],now).unknownCount,1);
});
async function withStore(run){
 const folder=await mkdtemp(join(tmpdir(),'wanderly-activity-review-'));try{const filePath=join(folder,'reviews.json');const record=fixture();const options={filePath,records:[record],knownDestinationIds:known,now:()=>now};await run(createActivityStore(options),filePath,options,record);}finally{await rm(folder,{recursive:true,force:true});}
}
test('review saves remain separate from catalogue and approvals require explicit human actions',async()=>withStore(async(store,path,options,original)=>{
 const initial=await store.get(original.id);assert.equal(initial.revision,0);assert.equal(initial.verification.status,'ready-for-review');
 await assert.rejects(store.save({record:initial,expectedRevision:0,action:'approve',reviewer:''}),/reviewer name/);
 await assert.rejects(store.save({record:{...initial,verification:{...initial.verification,status:'approved',reviewer:'Robot',reviewedAt:now}},expectedRevision:0,action:'save',reviewer:'Robot'}),/explicit Approve/);
 const saved=await store.save({record:initial,expectedRevision:0,action:'save',notes:'Check the original operator page.'});assert.equal(saved.verification.status,'ready-for-review');assert.equal(saved.revision,1);
 const approved=await store.save({record:saved,expectedRevision:1,action:'approve',reviewer:'Human reviewer',notes:'Sources checked manually.'});assert.equal(approved.verification.status,'approved');assert.equal(approved.price.reviewStatus,'ready-for-review');assert.equal(approved.verification.reviewer,'Human reviewer');
 const priceApproved=await store.save({record:approved,expectedRevision:2,action:'approve-price',reviewer:'Price reviewer',notes:'Price and adult unit checked.'});assert.equal(priceApproved.price.reviewStatus,'approved');assert.equal(priceApproved.price.reviewer,'Price reviewer');
 const fresh=createActivityStore(options);assert.deepEqual(await fresh.get(original.id),priceApproved);assert.equal(original.verification.status,'ready-for-review');
 const disk=JSON.parse(await readFile(path,'utf8'));assert.equal(disk.version,1);assert.equal(disk.records.length,1);
}));
test('review workflow rejects stale concurrent writes and demotes approved facts and prices when edited',async()=>withStore(async(store)=>{
 let record=await store.get('rotorua-thermal-walk');record=await store.save({record,expectedRevision:0,action:'approve',reviewer:'Human'});record=await store.save({record,expectedRevision:1,action:'approve-price',reviewer:'Human'});
 await assert.rejects(store.save({record,expectedRevision:0,action:'save'}),error=>error.statusCode===409);
 const changed={...record,name:'Corrected attraction name',price:{...record.price,min:46,max:46}};
 const saved=await store.save({record:changed,expectedRevision:2,action:'save',notes:'Changes require another check.'});assert.equal(saved.verification.status,'ready-for-review');assert.equal(saved.verification.reviewedAt,null);assert.equal(saved.price.reviewStatus,'ready-for-review');assert.equal(saved.price.reviewedAt,null);assert.equal(saved.price.min,46);assert.equal(record.price.min,45);assert.equal(summarizeActivityCosts([record],now).groups[0].min,45);assert.equal(summarizeActivityCosts([saved],now).groups[0].min,46);
 await assert.rejects(store.save({record:{...saved,id:'unknown-activity'},expectedRevision:0,action:'save'}),/Unknown activity/);
}));
test('manual approval cannot bypass missing evidence or conflicting prices; rejection excludes a saved record',async()=>withStore(async(store)=>{
 let record=await store.get('rotorua-thermal-walk');
 await assert.rejects(store.save({record:{...record,location:{...record.location,verified:false}},expectedRevision:0,action:'approve',reviewer:'Human'}),/missing-location/);
 await assert.rejects(store.save({record:{...record,price:{...record.price,conflict:true}},expectedRevision:0,action:'approve-price',reviewer:'Human'}),/conflicting-price/);
 record=await store.save({record,expectedRevision:0,action:'reject',reviewer:'Human',notes:'Needs a different experience.'});assert.equal(record.verification.status,'rejected');assert.equal(recommendActivities([record],'rotorua').length,0);assert.equal(summarizeActivityCosts([record],now).knownCount,0);
}));
test('simultaneous review submissions are serialized and stale revisions cannot overwrite a decision',async()=>withStore(async(store)=>{
 const record=await store.get('rotorua-thermal-walk');
 const results=await Promise.allSettled([store.save({record,expectedRevision:0,action:'save',notes:'First review'}),store.save({record,expectedRevision:0,action:'save',notes:'Stale review'})]);
 assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');assert.equal(results[1].reason.statusCode,409);assert.equal((await store.get(record.id)).verification.notes,'First review');
}));

test('trip length adjusts documented duration preferences and important food or beaches refine rankings',()=>{
 const long={...fixture(),id:'long-adventure',durationMinutes:240},short={...fixture(),id:'short-visit',durationMinutes:90};
 assert.equal(recommendActivities([long,short],'rotorua',{days:5})[0].id,'short-visit');
 assert.equal(recommendActivities([short,long],'rotorua',{days:10})[0].id,'long-adventure');
 const food={...fixture(),id:'food-visit',interests:['food']},beach={...fixture(),id:'beach-visit',interests:['beach']};
 assert.equal(recommendActivities([short,food],'rotorua',{foodPriority:'important'})[0].id,'food-visit');
 assert.equal(recommendActivities([short,beach],'rotorua',{beachPriority:'important'})[0].id,'beach-visit');
});
test('fresh aggregate dates cannot hide outdated source evidence or inconsistent price provenance',async()=>withStore(async(store)=>{
 const record=await store.get('rotorua-thermal-walk');
 const stale={...record,price:null,sources:record.sources.map(source=>({...source,checkedAt:'2020-01-01'}))};
 assert.ok(activityFlags(stale,now).includes('outdated-source-evidence'));
 await assert.rejects(store.save({record:stale,expectedRevision:0,action:'approve',reviewer:'Human'}),/outdated-source-evidence/);
 assert.throws(()=>validate({...record,sources:record.sources.filter(source=>source.url!==record.price.sourceUrl)}),/dated catalogue source/);
 assert.throws(()=>validate({...record,sources:record.sources.map(source=>({...source,checkedAt:'2020-01-01'}))}),/dated catalogue source/);
 assert.equal(summarizeActivityCosts([{...record,sources:[]}],now).knownCount,0);
 assert.equal(priceUsability({...record.price,checkedAt:'2020-01-01'},now).effectiveConfidence,'low');
}));

test('approving a price after editing approved activity facts clears the superseded activity approval stamp',async()=>withStore(async(store)=>{
 let record=await store.get('rotorua-thermal-walk');
 record=await store.save({record,expectedRevision:0,action:'approve',reviewer:'Original activity reviewer'});
 const result=await store.save({record:{...record,name:'Corrected named attraction'},expectedRevision:1,action:'approve-price',reviewer:'Price reviewer',notes:'The price was checked; the changed activity needs review.'});
 assert.equal(result.name,'Corrected named attraction');
 assert.equal(result.verification.status,'ready-for-review');
 assert.equal(result.verification.reviewedAt,null);
 assert.equal(result.verification.reviewer,'');
 assert.equal(result.price.reviewStatus,'approved');
 assert.equal(result.price.reviewer,'Price reviewer');
 const saved=await store.get(record.id);assert.deepEqual(saved,result);
}));
test('activity ranking understands expressed mood aliases without inventing preferences from sunny',()=>{
 const culture={...fixture(),id:'culture-stop',name:'Historic attraction',category:'culture',interests:['culture'],atmospheres:['cultural']};
 const peaceful={...fixture(),id:'forest-walk',name:'Named forest walkway',interests:['walking','forest'],atmospheres:['peaceful']};
 const outdoors={...fixture(),id:'outdoor-stop',name:'Named nature trail',interests:['nature','hiking'],atmospheres:['scenic']};
 assert.equal(recommendActivities([culture,peaceful],'rotorua',{mood:'relaxed'})[0].id,'forest-walk');
 assert.equal(recommendActivities([culture,outdoors],'rotorua',{mood:'adventurous'})[0].id,'outdoor-stop');
 assert.equal(recommendActivities([peaceful,culture],'rotorua',{query:'cultural visits'})[0].id,'culture-stop');
 assert.deepEqual(recommendActivities([culture,peaceful,outdoors],'rotorua',{query:'sunny'}).map(record=>record.id),['culture-stop','forest-walk','outdoor-stop']);
});

test('review surfaces sourced safety, permit and eligibility guidance and price rejection labels remain explicit',()=>{
 const record=fixture();
 record.considerations=['safety','permit','eligibility'].map(type=>({type,text:'Inspect documented '+type+' guidance.',sourceUrl:'https://example.org/visit',verified:true}));
 const flags=activityFlags(record,now);
 for(const type of ['safety','permit','eligibility'])assert.ok(flags.includes(type+'-considerations'));
 assert.ok(!flags.includes('unverified-considerations'),'sourced guidance is visible without being mislabelled as unsourced');
 record.price.reviewStatus='rejected';
 const html=activityPriceHTML(record);
 assert.match(html,/Price rejected/);
 assert.match(html,/Estimate pending verification/);
 assert.doesNotMatch(html,/Price awaiting human review/);
 assert.equal(summarizeActivityCosts([record],now).knownCount,0);
});
