import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Private local cache. No API keys or user searches are stored here.
export const DEFAULT_EMBEDDING_CACHE=fileURLToPath(new URL('../data/embeddings.local.json',import.meta.url));
const VERSION=1;
const hash=value=>createHash('sha256').update(value).digest('hex');
const validVector=value=>Array.isArray(value)&&value.length>0&&value.every(Number.isFinite);

export function createEmbeddingIndex({
 records,model,embed,cachePath=null,batchSize=64,logger=console
}){
 if(!Array.isArray(records)||!records.every(x=>typeof x.id==='string'&&typeof x.text==='string'))
  throw new Error('Embedding index requires destination identifiers and texts.');
 if(!Number.isInteger(batchSize)||batchSize<1||batchSize>256)throw new Error('Invalid embedding batch size.');
 const expected=records.map(r=>({id:r.id,text:r.text,hash:hash(r.text)}));
 let run=null;

 async function build(){
  let onDisk={};
  if(cachePath){
   try{
    const stored=JSON.parse(await readFile(cachePath,'utf8'));
    if(stored?.version===VERSION&&stored.model===model&&stored.entries&&typeof stored.entries==='object')
     onDisk=stored.entries;
   }catch(error){
    if(error?.code!=='ENOENT')logger.warn('Embedding cache could not be read; rebuilding it.');
   }
  }
  const entries={};
  for(const item of expected){
   const saved=onDisk[item.id];
   if(saved?.hash===item.hash&&validVector(saved.vector))
    entries[item.id]={hash:item.hash,vector:saved.vector};
  }
  const missing=expected.filter(item=>!entries[item.id]);
  if(missing.length)logger.log('Destination embedding index: '+(expected.length-missing.length)+' cached, '+missing.length+' to generate.');
  else logger.log('Destination embedding index: loaded '+expected.length+' cached destinations from local storage.');

  async function persist(){
   if(!cachePath)return;
   const tmp=cachePath+'.tmp-'+randomUUID();
   try{
    await writeFile(tmp,JSON.stringify({version:VERSION,model,entries}),{encoding:'utf8',mode:0o600,flag:'wx'});
    await rename(tmp,cachePath);
   }catch(error){
    await unlink(tmp).catch(()=>{});
    logger.warn('Could not save embedding index locally; searches will still work.');
   }
  }

  // Small requests avoid the long single call that previously hit the 30-second timeout.
  // Save after each batch so a later API failure doesn't waste all prior processing.
  for(let i=0;i<missing.length;i+=batchSize){
   const batch=missing.slice(i,i+batchSize);
   const vectors=await embed(batch.map(x=>x.text));
   if(!Array.isArray(vectors)||vectors.length!==batch.length||vectors.some(v=>!validVector(v)))
    throw new Error('Incomplete destination embedding batch.');
   for(let j=0;j<batch.length;j++)entries[batch[j].id]={hash:batch[j].hash,vector:vectors[j]};
   await persist();
  }
  return expected.map(item=>entries[item.id].vector);
 }
 function getVectors(){
  if(!run)run=build().catch(error=>{run=null;throw error;});
  return run;
 }
 return {getVectors};
}
