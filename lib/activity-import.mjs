import { constants } from 'node:fs';
import { open, readFile, lstat, rename, unlink } from 'node:fs/promises';
import { dirname, basename, resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REVIEW_STATUSES, validateActivity, safeSourceUrl } from '../public/activities.js';
import { prepareImportedActivityPhoto } from '../public/activity-photos.js';

export const DEFAULT_ACTIVITY_CATALOGUE_PATH=fileURLToPath(new URL('../data/activities.json',import.meta.url));
export const DEFAULT_IMPORT_DESTINATIONS_PATH=fileURLToPath(new URL('../data/destinations.json',import.meta.url));
export const MAX_IMPORT_ACTIVITIES=1000;
const keys={
 batch:['schemaVersion','activities'],
 activity:['id','destinationId','name','category','description','provider','location','durationMinutes','durationSourceUrl','interests','atmospheres','seasonality','considerations','sources','lastCheckedAt','verification','price','photo'],
 location:['label','sourceUrl','verified'],seasonality:['months','restriction','sourceUrl','verified'],
 consideration:['type','text','sourceUrl','verified'],source:['url','title','type','checkedAt'],
 verification:['status','reviewedAt','reviewer','notes'],
 price:['currency','min','max','unit','covers','sourceUrl','checkedAt','confidence','reviewStatus','evidenceType','experience','unitVerified','conflict','notes','reviewer','reviewedAt','reviewNotes'],
 photo:['source','fileName','imageUrl','pageUrl','title','creator','license','licenseUrl','attribution','checkedAt','subjectConfirmed']
};
export class ActivityImportError extends Error {
 constructor(issues,code='ACTIVITY_IMPORT_INVALID'){
  super(issues.map(issue=>`${issue.index===null?'Batch':`activities[${issue.index}]`}${issue.id?` (${issue.id})`:''}${issue.path?` ${issue.path}`:''}: ${issue.message}`).join('\n'));
  this.name='ActivityImportError';this.code=code;this.statusCode=400;this.issues=issues;
 }
}
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const issue=(message,path='')=>Object.assign(new Error(message),{path});
function strictObject(value,allowed,path){
 if(!plain(value))throw issue('Expected an object.',path);
 const unexpected=Object.keys(value).filter(key=>!allowed.includes(key));
 if(unexpected.length)throw issue('Unknown field'+(unexpected.length===1?'':'s')+': '+unexpected.join(', ')+'.',path);
}
function checkKeys(record){
 strictObject(record,keys.activity,'');
 for(const key of ['location','seasonality'])strictObject(record[key],keys[key],key);
 if(record.verification!==undefined)strictObject(record.verification,keys.verification,'verification');
 if(record.price!==null)strictObject(record.price,keys.price,'price');
 if(record.photo!==undefined&&record.photo!==null){
  strictObject(record.photo,keys.photo,'photo');
  if(Object.hasOwn(record.photo,'subjectConfirmed')&&typeof record.photo.subjectConfirmed!=='boolean')throw issue('subjectConfirmed must be a boolean when supplied.','photo.subjectConfirmed');
 }
 for(const [key,type] of [['sources','source'],['considerations','consideration']]){
  if(!Array.isArray(record[key]))throw issue('Expected an array.',key);
  record[key].forEach((item,index)=>strictObject(item,keys[type],`${key}[${index}]`));
 }
}
function trim(value){
 if(typeof value==='string')return value.trim();
 if(Array.isArray(value))return value.map(trim);
 if(plain(value))return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,trim(item)]));
 return value;
}
function checkReviewInput(review,path){
 if(review===undefined)return;
 if(review.status!==undefined&&!REVIEW_STATUSES.includes(review.status))throw issue('Unknown review status.',path+'.status');
 if(review.reviewer!==undefined&&(typeof review.reviewer!=='string'||review.reviewer.length>120))throw issue('Reviewer must be a string of up to 120 characters.',path+'.reviewer');
 if(review.reviewedAt!==undefined&&review.reviewedAt!==null&&(typeof review.reviewedAt!=='string'||review.reviewedAt.length>40||!Number.isFinite(Date.parse(review.reviewedAt))))throw issue('Invalid review timestamp.',path+'.reviewedAt');
 if(review.notes!==undefined&&(typeof review.notes!=='string'||review.notes.length>4000))throw issue('Review notes must be a string of up to 4000 characters.',path+'.notes');
}
function normalizeRecord(input,{now=new Date(),strict=true}={}){
 if(strict){checkKeys(input);checkReviewInput(input.verification,'verification');}
 const record=trim(structuredClone(input));
 record.verification={status:'ready-for-review',reviewedAt:null,reviewer:'',notes:record.verification?.notes??''};
 if(record.price){
  if(record.price.reviewStatus==='approved')record.price.reviewStatus='ready-for-review';
  // An import can retain numerical evidence, but can never carry a human approval into the catalogue.
  delete record.price.reviewer;delete record.price.reviewedAt;delete record.price.reviewNotes;
 }
 record.photo=prepareImportedActivityPhoto(record.photo,{now});
 for(const key of ['interests','atmospheres'])if(Array.isArray(record[key])&&record[key].every(item=>typeof item==='string'))record[key]=[...new Set(record[key])].sort();
 if(Array.isArray(record.seasonality?.months))record.seasonality.months=[...record.seasonality.months].sort((a,b)=>a-b);
 if(Array.isArray(record.sources))record.sources.sort((a,b)=>String(a.url).localeCompare(String(b.url)));
 return record;
}
function placeholderUrl(value){
 try{const host=new URL(value).hostname.toLowerCase();return host==='localhost'||host.endsWith('.localhost')||host.endsWith('.invalid')||host==='invalid'||host.endsWith('.example')||host==='example'||host.endsWith('.test')||host==='test'||/^(.*\.)?example\.(com|org|net)$/.test(host);}catch{return false;}
}
function requireImportedEvidence(record){
 if(!record.sources.length||record.sources.length>20)throw issue('Provide 1–20 dated activity sources.','sources');
 const byUrl=new Map();
 for(const [index,source] of record.sources.entries()){
  if(!source.title.trim())throw issue('Source title cannot be blank.',`sources[${index}].title`);
  if(placeholderUrl(source.url))throw issue('Replace placeholder or reserved-domain URLs with researched sources.',`sources[${index}].url`);
  if(byUrl.has(source.url))throw issue('Duplicate source URL.',`sources[${index}].url`);
  byUrl.set(source.url,source);
 }
 if(!record.lastCheckedAt)throw issue('A last-checked date is required.','lastCheckedAt');
 const latest=[...byUrl.values()].map(source=>source.checkedAt).sort().at(-1);
 if(record.lastCheckedAt!==latest)throw issue('Use the most recent checkedAt date in sources; do not invent a separate check date.','lastCheckedAt');
 const reference=(url,path,required=false)=>{
  if((url===null||url===''||url===undefined)&&!required)return;
  if(!safeSourceUrl(url)||!byUrl.has(url))throw issue('Reference a matching URL in the dated sources array.',path);
 };
 if(!record.location.label.trim()||!record.location.verified)throw issue('A source-backed location label and verified:true evidence flag are required.','location');
 reference(record.location.sourceUrl,'location.sourceUrl',true);
 reference(record.durationSourceUrl,'durationSourceUrl',record.durationMinutes!==null);
 const seasonalClaim=record.seasonality.months.length>0||!!record.seasonality.restriction;
 reference(record.seasonality.sourceUrl,'seasonality.sourceUrl',seasonalClaim||record.seasonality.verified);
 for(const [index,consideration] of record.considerations.entries()){
  if(!consideration.text.trim())throw issue('Consideration text cannot be blank.',`considerations[${index}].text`);
  reference(consideration.sourceUrl,`considerations[${index}].sourceUrl`,true);
 }
 if(record.price?.sourceUrl)reference(record.price.sourceUrl,'price.sourceUrl',true);
 for(const key of ['interests','atmospheres'])if(record[key].some(item=>!item))throw issue('Tags cannot be blank.',key);
}
function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(plain(value))return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
 return JSON.stringify(value);
}
function wrapRecordError(error,index,id){return {index,id:typeof id==='string'?id:null,path:error.path||'',message:error.message};}
export function parseImportBatch(input,{knownDestinationIds,now=new Date()}={}){
 if(!(knownDestinationIds instanceof Set))throw new ActivityImportError([{index:null,id:null,path:'',message:'Known destination IDs are required.'}]);
 try{
  strictObject(input,keys.batch,'');
  if(input.schemaVersion!==1)throw issue('Expected schemaVersion: 1.','schemaVersion');
  if(!Array.isArray(input.activities)||input.activities.length<1||input.activities.length>MAX_IMPORT_ACTIVITIES)throw issue(`Provide 1–${MAX_IMPORT_ACTIVITIES} activity records. Empty batches are rejected.`,'activities');
 }catch(error){throw new ActivityImportError([wrapRecordError(error,null,null)]);}
 const issues=[],records=[],seen=new Set();
 for(const [index,item] of input.activities.entries()){
  try{
   const normalized=normalizeRecord(item,{now});
   validateActivity(normalized,{knownDestinationIds,now});
   requireImportedEvidence(normalized);
   if(seen.has(normalized.id))throw issue('Duplicate activity ID inside this batch.','id');
   seen.add(normalized.id);records.push(normalized);
  }catch(error){issues.push(wrapRecordError(error,index,item?.id));}
 }
 if(issues.length)throw new ActivityImportError(issues);
 return records;
}
export function mergeActivityImport(existing,input,{knownDestinationIds,now=new Date()}={}){
 const incoming=parseImportBatch(input,{knownDestinationIds,now});
 if(!Array.isArray(existing))throw new ActivityImportError([{index:null,id:null,path:'catalogue',message:'The existing catalogue must be an array.'}]);
 const byId=new Map();
 for(const [index,record] of existing.entries()){
  try{
   validateActivity(record,{knownDestinationIds,now});
   if(byId.has(record.id))throw Error('Duplicate existing activity ID.');
   byId.set(record.id,record);
  }catch(error){throw new ActivityImportError([{index:null,id:record?.id||null,path:`catalogue[${index}]`,message:error.message}]);}
 }
 const added=[],skipped=[],issues=[];
 for(const [index,record] of incoming.entries()){
  const previous=byId.get(record.id);
  if(!previous){added.push(record);continue;}
  // Normalize only for comparison: never replace or demote a pre-existing record.
  if(canonical(normalizeRecord(previous,{now,strict:false}))===canonical(record))skipped.push(record.id);
  else issues.push({index,id:record.id,path:'id',message:'An existing record has different content. Append-only imports never overwrite it; use the review workflow.'});
 }
 if(issues.length)throw new ActivityImportError(issues,'ACTIVITY_IMPORT_CONFLICT');
 return {records:[...existing,...added],added:added.map(record=>record.id),skipped};
}
function protectedTarget(filePath,destinationsPath){
 const name=basename(filePath);
 if(resolve(filePath)===resolve(destinationsPath)||(name==='.env'||name.startsWith('.env.'))||/\.local\.json(?:\.|$)/.test(name)||name==='destinations.json')throw new ActivityImportError([{index:null,id:null,path:'catalogue',message:'The import target must be an activity catalogue, never destinations, credentials, local reviews or caches.'}]);
}
async function readCatalogue(filePath){
 const info=await lstat(filePath);
 if(!info.isFile()||info.isSymbolicLink())throw Error('The activity catalogue must be a regular file, not a symlink.');
 const raw=await readFile(filePath,'utf8');
 let records;try{records=JSON.parse(raw);}catch{throw Error('The activity catalogue is not valid JSON.');}
 return {raw,records,mode:info.mode&0o777};
}
async function acquireLock(lockPath){
 let handle;
 try{handle=await open(lockPath,'wx',0o600);}catch(error){
  if(error.code==='EEXIST')throw new ActivityImportError([{index:null,id:null,path:'catalogue',message:'Another import owns '+lockPath+'. Wait for it to finish. If a process crashed, confirm it is no longer running before removing the stale lock.'}],'ACTIVITY_IMPORT_LOCKED');
  throw error;
 }
 const identity=await handle.stat();
 const release=async()=>{
  await handle.close().catch(()=>{});
  const current=await lstat(lockPath).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(current&&current.ino===identity.ino&&current.dev===identity.dev)await unlink(lockPath);
 };
 try{await handle.writeFile(JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()})+'\n');}
 catch(error){await release();throw error;}
 return release;
}
function appendJson(raw,existingCount,added){
 const closing=raw.lastIndexOf(']');
 if(closing<0)throw Error('The activity catalogue must be a JSON array.');
 // Retain all existing record bytes. Only the array's closing whitespace/delimiter changes.
 return raw.slice(0,closing).trimEnd()+(existingCount?',':'')+'\n'+added.map(record=>JSON.stringify(record,null,2).split('\n').map(line=>'  '+line).join('\n')).join(',\n')+'\n'+raw.slice(closing);
}
export async function importActivities({input,filePath=DEFAULT_ACTIVITY_CATALOGUE_PATH,destinationsPath=DEFAULT_IMPORT_DESTINATIONS_PATH,dryRun=false,now=new Date()}={}){
 const target=resolve(filePath);protectedTarget(target,destinationsPath);
 const destinations=JSON.parse(await readFile(destinationsPath,'utf8'));
 if(!Array.isArray(destinations)||destinations.some(record=>typeof record?.id!=='string'))throw Error('The destination catalogue must be an array with destination IDs.');
 const knownDestinationIds=new Set(destinations.map(record=>record.id));
 // Reject malformed input before creating a lock or touching the catalogue.
 parseImportBatch(input,{knownDestinationIds,now});
 const lockPath=target+'.import.lock';
 let release=null,temporary=null;
 try{
  if(!dryRun)release=await acquireLock(lockPath);
  const snapshot=await readCatalogue(target);
  const result=mergeActivityImport(snapshot.records,input,{knownDestinationIds,now});
  const summary={dryRun:Boolean(dryRun),filePath:target,added:result.added,skipped:result.skipped,totalCount:result.records.length,written:false};
  if(dryRun||!result.added.length)return summary;
  const added=result.records.slice(snapshot.records.length);
  const output=appendJson(snapshot.raw,snapshot.records.length,added);
  temporary=join(dirname(target),basename(target)+'.import-tmp-'+randomUUID());
  const handle=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL,snapshot.mode);
  try{await handle.writeFile(output,'utf8');await handle.sync();}finally{await handle.close();}
  // Cooperative imports are serialized. Also catch a manual edit detected before replacement.
  if(await readFile(target,'utf8')!==snapshot.raw)throw new ActivityImportError([{index:null,id:null,path:'catalogue',message:'The catalogue changed during import. No import was applied; inspect the concurrent edit and retry.'}],'ACTIVITY_IMPORT_CONFLICT');
  await rename(temporary,target);temporary=null;summary.written=true;return summary;
 }finally{
  if(temporary)await unlink(temporary).catch(()=>{});
  if(release)await release();
 }
}
