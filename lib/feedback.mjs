import { randomUUID } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { normalize } from '../public/recommend.js';

export const DEFAULT_FEEDBACK_PATH=fileURLToPath(new URL('../data/feedback.local.json',import.meta.url));
const RATINGS=new Set(['good','bad']);
const ENGINES=new Set(['ai','keyword','preview']);
const REASONS=new Set(['great-match','interesting','wrong-vibe','not-relevant','too-touristy','wrong-trip-type','inaccurate-data','other','']);
const REGIONS=new Set(['all','Europe','Asia','Africa','North America','South America','Oceania','Middle East']);
function bad(message){const err=new Error(message);err.statusCode=400;return err;}
export function validateFeedback(input,knownIds){
 if(!input||typeof input!=='object'||Array.isArray(input))throw bad('Invalid feedback.');
 const {query,region,scenery=[],vibes=[],engine,destinationId,rating,reason='',note='',rank,interpretation=''}=input;
 if(typeof query!=='string'||query.length>400)throw bad('Search query is too long.');
 if(typeof region!=='string'||!REGIONS.has(region))throw bad('Unknown region.');
 if(!Array.isArray(scenery)||!Array.isArray(vibes)||scenery.length>16||vibes.length>16||[...scenery,...vibes].some(x=>typeof x!=='string'||x.length>48))throw bad('Invalid filters.');
 if(!ENGINES.has(engine))throw bad('Invalid search engine.');
 if(typeof destinationId!=='string'||!knownIds.has(destinationId))throw bad('Unknown destination.');
 if(!RATINGS.has(rating))throw bad('Invalid rating.');
 if(typeof reason!=='string'||!REASONS.has(reason))throw bad('Invalid feedback reason.');
 if(typeof note!=='string'||note.length>600)throw bad('Feedback notes can be up to 600 characters.');
 if(!Number.isInteger(rank)||rank<1||rank>88)throw bad('Invalid result position.');
 if(typeof interpretation!=='string'||interpretation.length>300)throw bad('Invalid interpretation.');
 return {
  query:query.trim(),region,scenery:[...new Set(scenery)].sort(),vibes:[...new Set(vibes)].sort(),
  engine,destinationId,rating,reason,note:note.trim(),rank,interpretation:interpretation.trim()
 };
}
export function feedbackKey(f){
 return JSON.stringify([normalize(f.query),f.region,[...f.scenery].sort(),[...f.vibes].sort(),f.engine,f.destinationId]);
}
export function createFeedbackStore({filePath=DEFAULT_FEEDBACK_PATH,knownIds,now=()=>new Date().toISOString()}){
 if(!(knownIds instanceof Set))throw Error('Known destination IDs required.');
 let queue=Promise.resolve();
 async function readAll(){
  try{
   const value=JSON.parse(await readFile(filePath,'utf8'));
   if(!Array.isArray(value))throw Error('Feedback file must be an array.');
   return value;
  }catch(error){
   if(error?.code==='ENOENT')return [];
   throw error;
  }
 }
 function save(input){
  const valid=validateFeedback(input,knownIds);
  const task=queue.then(async()=>{
   const all=await readAll();
   const key=feedbackKey(valid);
   const previous=all.find(x=>feedbackKey(x)===key);
   const record={...valid,id:previous?.id||randomUUID(),createdAt:previous?.createdAt||now(),updatedAt:now()};
   const updated=all.filter(x=>feedbackKey(x)!==key);
   updated.push(record);
   // Atomic replace reduces the risk of a truncated feedback file.
   const temporary=filePath+'.tmp-'+randomUUID();
   try{
    await writeFile(temporary,JSON.stringify(updated,null,2)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
    await rename(temporary,filePath);
   }catch(error){
    const {unlink}=await import('node:fs/promises');
    await unlink(temporary).catch(()=>{});
    throw error;
   }
   return record;
  });
  queue=task.catch(()=>{});
  return task;
 }
 async function list(){await queue;return readAll();}
 return {save,list};
}
