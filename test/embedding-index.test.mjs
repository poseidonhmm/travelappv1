import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEmbeddingIndex } from '../lib/embedding-index.mjs';

const records=Array.from({length:5},(_,i)=>({id:'place-'+i,text:'Profile '+i}));
const vectorOf=text=>[text.length,text.charCodeAt(text.length-1)];

test('embedding index writes small batches, then reuses them after restart at no new API cost',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'wanderly-index-'));
 const path=join(dir,'embeddings.local.json');
 let calls=0;
 const embed=async items=>{calls++;return items.map(vectorOf);};
 const logger={log(){},warn(){}};
 try{
  const first=createEmbeddingIndex({records,model:'test-small',embed,cachePath:path,batchSize:2,logger});
  const vectors=await first.getVectors();
  assert.equal(vectors.length,5);
  assert.equal(calls,3);
  assert.deepEqual(await first.getVectors(),vectors);
  assert.equal(calls,3);
  const again=createEmbeddingIndex({records,model:'test-small',embed,cachePath:path,batchSize:2,logger});
  assert.deepEqual(await again.getVectors(),vectors);
  assert.equal(calls,3,'restart should not re-embed unchanged profiles');
  const edited=records.map((d,i)=>i===3?{...d,text:d.text+' rewritten'}:d);
  const changed=createEmbeddingIndex({records:edited,model:'test-small',embed,cachePath:path,batchSize:2,logger});
  await changed.getVectors();
  assert.equal(calls,4,'only the edited profile should be embedded');
  const data=JSON.parse(await readFile(path,'utf8'));
  assert.equal(Object.keys(data.entries).length,5);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('successful batches persist even when a later batch fails',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'wanderly-index-retry-'));
 const path=join(dir,'embeddings.local.json');
 let calls=0;
 const logger={log(){},warn(){}};
 try{
  const failing=createEmbeddingIndex({
   records,model:'test',batchSize:2,cachePath:path,logger,
   embed:async items=>{calls++;if(calls===2)throw Error('temporary network');return items.map(vectorOf);}
  });
  await assert.rejects(failing.getVectors(),/temporary network/);
  const partial=JSON.parse(await readFile(path,'utf8'));
  assert.equal(Object.keys(partial.entries).length,2);
  const continued=createEmbeddingIndex({records,model:'test',batchSize:2,cachePath:path,logger,
   embed:async items=>{calls++;return items.map(vectorOf);}
  });
  const output=await continued.getVectors();
  assert.equal(output.length,5);
  assert.equal(calls,4,'only remaining batches are generated');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('different embedding model or corrupt disk cache triggers rebuild',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'wanderly-index-version-'));
 const path=join(dir,'embeddings.local.json');
 let calls=0;
 const logger={log(){},warn(){}};
 const embed=async inputs=>{calls++;return inputs.map(vectorOf);};
 try{
  await createEmbeddingIndex({records,model:'old-model',embed,cachePath:path,logger}).getVectors();
  await createEmbeddingIndex({records,model:'new-model',embed,cachePath:path,logger}).getVectors();
  assert.equal(calls,2);
  const { writeFile }=await import('node:fs/promises');
  await writeFile(path,'broken json');
  await createEmbeddingIndex({records,model:'new-model',embed,cachePath:path,logger}).getVectors();
  assert.equal(calls,3);
 }finally{await rm(dir,{recursive:true,force:true});}
});
