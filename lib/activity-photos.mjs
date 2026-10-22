import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {publicActivityPhoto,validateActivityPhoto} from '../public/activity-photos.js';

export const DEFAULT_ACTIVITY_PHOTO_CACHE=fileURLToPath(new URL('../data/activity-photo-cache.local.json',import.meta.url));
const idPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function stable(value){
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
 return value;
}
function identity(activity,photo){
 return createHash('sha256').update(JSON.stringify(stable({id:activity.id,destinationId:activity.destinationId,name:activity.name,revision:activity.revision??null,verification:activity.verification,photo}))).digest('hex');
}
// This cache stores selected editor-supplied metadata only. It performs no network
// lookup and never grants publication permission; each read checks the live record.
export function createActivityPhotoStore({cachePath=DEFAULT_ACTIVITY_PHOTO_CACHE,now=()=>new Date()}={}){
 const entries=new Map();let queue=Promise.resolve();
 const ready=(async()=>{
  try{
   const data=JSON.parse(await readFile(cachePath,'utf8'));
   if(data?.version!==1||!data.entries||typeof data.entries!=='object'||Array.isArray(data.entries))return;
   for(const [key,entry] of Object.entries(data.entries)){
    if(!entry||!idPattern.test(entry.activityId||'')||key!==entry.activityId+':'+entry.identity||!/^[a-f0-9]{64}$/.test(entry.identity))continue;
    try{entries.set(key,{activityId:entry.activityId,identity:entry.identity,photo:validateActivityPhoto(entry.photo,{now:now()})});}catch{}
   }
  }catch{
   // Cache files are optional. An unreadable or malformed file cannot authorize
   // an image or prevent validated catalogue metadata from being displayed.
  }
 })();
 async function persist(){
  const temp=cachePath+'.tmp-'+randomUUID();
  try{
   await writeFile(temp,JSON.stringify({version:1,entries:Object.fromEntries([...entries.entries()].sort())},null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
   await rename(temp,cachePath);
  }catch(error){await unlink(temp).catch(()=>{});throw error;}
 }
 function getPhoto(activity){
  // Snapshot the authorization and supplied metadata at the time of this call.
  const id=activity?.id;
  if(typeof id!=='string'||!idPattern.test(id))return Promise.resolve(null);
  const photo=publicActivityPhoto(activity,{now:now()});
  const hash=photo?identity(activity,photo):null,key=hash?id+':'+hash:null;
  const task=queue.then(async()=>{
   await ready;let changed=false;
   for(const [existing,entry] of entries)if(entry.activityId===id&&existing!==key){entries.delete(existing);changed=true;}
   if(!photo){if(changed)await persist().catch(()=>{});return null;}
   const hit=entries.get(key);
   if(!hit||JSON.stringify(hit.photo)!==JSON.stringify(photo)){
    entries.set(key,{activityId:id,identity:hash,photo});changed=true;
   }
   if(changed)await persist().catch(()=>{});
   return structuredClone(photo);
  });
  queue=task.catch(()=>{});return task;
 }
 return {getPhoto};
}
