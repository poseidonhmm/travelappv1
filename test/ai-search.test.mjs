import test from 'node:test';
import assert from 'node:assert/strict';
import { load } from '../scripts/validate.mjs';
import { createAiSearch,cosineSimilarity,destinationText,parseSearchRequest,rankDestinations } from '../lib/ai-search.mjs';
const destinations=load().destinations;

test('rejects malformed or unsafe search payloads',()=>{
 assert.throws(()=>parseSearchRequest({query:'',region:'all'}));
 assert.throws(()=>parseSearchRequest({query:'x'.repeat(401),region:'all'}));
 assert.throws(()=>parseSearchRequest({query:'mountains',region:'Mars'}));
 assert.throws(()=>parseSearchRequest({query:'beach',region:'all',scenery:'beach'}));
 const result=parseSearchRequest({query:'seaside escape',region:'Europe',scenery:['beach','beach'],vibes:['romantic']});
 assert.deepEqual(result.scenery,['beach']);
});
test('embedding text uses the existing draft record',()=>{
 const text=destinationText(destinations[0]);
 assert.ok(text.includes(destinations[0].name));
 assert.ok(text.includes(destinations[0].tags.food[0]));
});
test('cosine and ranking respect region and real destination IDs',()=>{
 assert.equal(cosineSimilarity([1,0],[1,0]),1);
 assert.equal(cosineSimilarity([1,0],[0,1]),0);
 const subset=destinations.slice(0,3);
 const vectors=[[1,0],[0,1],[1,1]];
 const req={query:'scenic coast',region:'all',scenery:[],vibes:[]};
 const found=rankDestinations(subset,vectors,[1,0],req);
 assert.equal(found[0].id,subset[0].id);
 assert.ok(found.every(x=>subset.some(d=>x.id===d.id)));
 assert.deepEqual(rankDestinations(subset,vectors,[1,0],{...req,region:'Asia'}),[]);
});
test('missing key shows explicit no-AI fallback without upstream calls',async()=>{
 const ai=createAiSearch({destinations,apiKey:'',fetchImpl:()=>{throw Error('Should not use AI');}});
 const found=await ai.search(parseSearchRequest({query:'dramatic landscapes',region:'all'}));
 assert.equal(found.engine,'keyword');
 assert.ok(found.notice.includes('AI is off'));
 assert.ok(found.matches.length>0);
});
test('model interpretation and embeddings are called with cache for destination vectors',async()=>{
 let embeddingCalls=0,interpretationCalls=0;
 const fakeFetch=async(url,options)=>{
  const body=JSON.parse(options.body);
  if(url.endsWith('/responses')){
   interpretationCalls++;
   return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify({semantic_query:'calm nature hiking mountain',interpretation:'Quiet mountain scenery and gentle adventures'})}]}]})};
  }
  if(url.endsWith('/embeddings')){
   embeddingCalls++;
   return {ok:true,json:async()=>({data:body.input.map((s,index)=>({index,embedding:s.includes('mountain')?[1,0]:[0,1]}))})};
  }
  throw Error('Unexpected URL');
 };
 const service=createAiSearch({destinations:destinations.slice(0,10),apiKey:'unit-test-key',fetchImpl:fakeFetch});
 const query=parseSearchRequest({query:'quiet mountains',region:'Europe'});
 const first=await service.search(query);
 const second=await service.search(query);
 assert.equal(first.engine,'ai');
 assert.equal(first.interpretation,'Quiet mountain scenery and gentle adventures');
 assert.ok(first.matches.every(m=>destinations.some(d=>d.id===m.id)));
 assert.equal(second.engine,'ai');
 assert.equal(embeddingCalls,2,'one destination embedding batch + one query embedding when repeated');
 assert.equal(interpretationCalls,1);
 assert.equal(second.cached,true);
});
test('upstream failure uses labelled fallback and does not invent climate',async()=>{
 const failFetch=async()=>({ok:false,status:429});
 const service=createAiSearch({destinations,apiKey:'fake-key',fetchImpl:failFetch});
 const res=await service.search(parseSearchRequest({query:'sunny in February and cheap',region:'all'}));
 assert.equal(res.engine,'keyword');
 assert.match(res.notice,/unavailable/i);
 assert.ok(res.warnings.some(x=>x.includes('Weather')));
 assert.ok(res.warnings.some(x=>x.includes('Prices')));
});
