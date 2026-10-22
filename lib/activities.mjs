import { randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateActivity, activityFlags, priceUsability } from '../public/activities.js';

export const DEFAULT_ACTIVITY_REVIEWS_PATH=fileURLToPath(new URL('../data/activity-reviews.local.json',import.meta.url));
function error(message,statusCode=400){return Object.assign(new Error(message),{statusCode});}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const activityFacts=record=>{const {verification,revision,price,...facts}=record;return facts;};
const priceFacts=price=>{
 if(!price)return null;
 const {reviewStatus,reviewer,reviewedAt,reviewNotes,...facts}=price;return facts;
};
export function createActivityStore({filePath=DEFAULT_ACTIVITY_REVIEWS_PATH,records=[],knownDestinationIds,now=()=>new Date().toISOString()}={}){
 if(!(knownDestinationIds instanceof Set))throw Error('Known destination IDs required.');
 const originals=new Map();
 for(const item of records){
  const valid=validateActivity(item,{knownDestinationIds,now:now()});
  if(originals.has(valid.id))throw Error('Duplicate activity ID: '+valid.id);
  originals.set(valid.id,{...valid,revision:0});
 }
 let queue=Promise.resolve();
 async function readOverrides(){
  try{
   const value=JSON.parse(await readFile(filePath,'utf8'));
   if(value?.version!==1||!Array.isArray(value.records))throw Error('Invalid activity review file.');
   const ids=new Set();
   return value.records.map(item=>{
    const record=validateActivity(item,{knownDestinationIds,now:now()});
    if(!originals.has(record.id)||ids.has(record.id)||record.destinationId!==originals.get(record.id).destinationId||!record.revision)throw Error('Invalid activity review identity.');
    ids.add(record.id);return record;
   });
  }catch(cause){if(cause?.code==='ENOENT')return [];throw cause;}
 }
 async function merged(){
  const map=new Map(originals);
  for(const item of await readOverrides())map.set(item.id,item);
  return [...map.values()].map(record=>structuredClone(record));
 }
 async function list(){await queue;return merged();}
 async function get(id){return (await list()).find(item=>item.id===id)||null;}
 function save(input){
  const task=queue.then(async()=>{
   if(!input||typeof input!=='object'||!['save','approve','approve-price','reject'].includes(input.action))throw error('Choose an explicit review action.');
   const record=validateActivity(input.record,{knownDestinationIds,now:now()});
   const original=originals.get(record.id);
   if(!original||record.destinationId!==original.destinationId)throw error('Unknown activity or changed destination.');
   const overrides=await readOverrides();
   const previous=overrides.find(item=>item.id===record.id)||original;
   if(!Number.isInteger(input.expectedRevision)||input.expectedRevision!==previous.revision)throw error('This activity changed in another review. Reload it before saving.',409);
   const reviewer=typeof input.reviewer==='string'?input.reviewer.trim():'';
   const notes=typeof input.notes==='string'?input.notes.trim():'';
   if(reviewer.length>120||notes.length>4000)throw error('Review details are too long.');
   if(input.action!=='save'&&!reviewer)throw error('Enter the human reviewer name before approving or rejecting.');
   // Merely posting an approved status cannot approve a record or its price.
   if(record.verification.status==='approved'&&previous.verification.status!=='approved'&&input.action!=='approve')throw error('Use the explicit Approve activity action.');
   if(record.verification.status==='rejected'&&previous.verification.status!=='rejected'&&input.action!=='reject')throw error('Use the explicit Reject activity action.');
   if(record.price?.reviewStatus==='approved'&&previous.price?.reviewStatus!=='approved'&&input.action!=='approve-price')throw error('Use the explicit Approve price action.');
   const updated=structuredClone(record);
   // Preserve existing approval identities unless the corresponding explicit action replaces them.
   if(updated.verification.status==='approved'&&previous.verification.status==='approved'){
    updated.verification={...updated.verification,reviewer:previous.verification.reviewer,reviewedAt:previous.verification.reviewedAt};
   }
   if(updated.price?.reviewStatus==='approved'&&previous.price?.reviewStatus==='approved'){
    updated.price={...updated.price,reviewer:previous.price.reviewer,reviewedAt:previous.price.reviewedAt,reviewNotes:previous.price.reviewNotes};
   }
   const changedFacts=!equal(activityFacts(record),activityFacts(previous));
   const changedPrice=!equal(priceFacts(record.price),priceFacts(previous.price));
   if(previous.verification.status==='approved'&&(changedFacts||updated.verification.status!=='approved')){
    updated.verification={...updated.verification,status:changedFacts?'ready-for-review':updated.verification.status,reviewedAt:null,reviewer:''};
   }
   if(changedPrice&&updated.price&&previous.price?.reviewStatus==='approved'){
    updated.price.reviewStatus='ready-for-review';updated.price.reviewedAt=null;updated.price.reviewer='';
   }
   if(input.action==='approve'){
    const blocking=activityFlags(updated,now()).filter(flag=>['missing-evidence','outdated-activity-evidence','outdated-source-evidence','missing-location-evidence','unverified-seasonality','unverified-considerations'].includes(flag));
    if(blocking.length)throw error('Resolve activity evidence flags before approval: '+blocking.join(', ')+'.');
    updated.verification={status:'approved',reviewedAt:now(),reviewer,notes};
   }else if(input.action==='approve-price'){
    if(!updated.price)throw error('There is no price to approve.');
    const candidate={...updated.price,reviewStatus:'ready-for-review'};
    const evidence=priceUsability(candidate,now());
    if(!evidence.usable)throw error('Resolve price evidence flags before approval: '+evidence.flags.join(', ')+'.');
    updated.price={...updated.price,reviewStatus:'approved',reviewer,reviewedAt:now(),reviewNotes:notes};
    updated.verification={...updated.verification,notes};
   }else if(input.action==='reject'){
    updated.verification={status:'rejected',reviewedAt:now(),reviewer,notes};
   }else{
    updated.verification={...updated.verification,notes};
    // Edited status labels cannot carry a stale human approval stamp.
    if(updated.verification.status!=='approved'){
     updated.verification.reviewedAt=null;updated.verification.reviewer=reviewer;
    }
   }
   updated.revision=previous.revision+1;
   validateActivity(updated,{knownDestinationIds,now:now()});
   const saved=overrides.filter(item=>item.id!==record.id);saved.push(updated);
   const temporary=filePath+'.tmp-'+randomUUID();
   try{
    await writeFile(temporary,JSON.stringify({version:1,records:saved},null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
    await rename(temporary,filePath);
   }catch(cause){await unlink(temporary).catch(()=>{});throw cause;}
   return structuredClone(updated);
  });
  queue=task.catch(()=>{});
  return task;
 }
 return {list,get,save};
}
