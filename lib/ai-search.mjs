import { matchDestinations, queryHasWeather, normalize } from '../public/recommend.js';

const MODEL='gpt-4o-mini';
const EMBEDDINGS='text-embedding-3-small';
const REGIONS=new Set(['all','Europe','Asia','Africa','North America','South America','Oceania','Middle East']);
const TAGS=new Set(['beach','coast','jungle','mountains','city','island','relaxed','sociable','romantic','adventurous','food-led','nightlife','luxury']);
export class InputError extends Error {}
export function parseSearchRequest(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new InputError('Expected a search request.');
 if(typeof body.query!=='string'||!body.query.trim()||body.query.length>400)throw new InputError('Enter a description of up to 400 characters.');
 if(typeof body.region!=='string'||!REGIONS.has(body.region))throw new InputError('Invalid region.');
 const uniqueTags=value=>{
  if(!Array.isArray(value)||value.length>16||value.some(s=>typeof s!=='string'))throw new InputError('Invalid filters.');
  return [...new Set(value.filter(s=>TAGS.has(s)))];
 };
 return {query:body.query.trim(),region:body.region,scenery:uniqueTags(body.scenery||[]),vibes:uniqueTags(body.vibes||[])};
}
export function destinationText(d){
 return [d.name+' in '+d.country+'. Region: '+d.macroRegion+'. Type: '+d.kind+'.','Atmosphere: '+d.summary,
 'Scenery: '+d.tags.scenery.join(', '),'Vibe: '+d.tags.vibe.join(', '),
 'Experiences: '+d.tags.experiences.join(', '),'Food: '+d.tags.food.join(', ')].join(' ');
}
export function cosineSimilarity(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||!a.length)return -1;
 let dot=0,aa=0,bb=0;
 for(let i=0;i<a.length;i++){
  if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))return -1;
  dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];
 }
 return aa>0&&bb>0?dot/Math.sqrt(aa*bb):-1;
}
export function extractResponseText(response){
 return (response?.output||[]).flatMap(o=>o.content||[]).find(x=>x.type==='output_text'&&typeof x.text==='string')?.text||'';
}
export function rankDestinations(destinations,vectors,queryVector,req,limit=12){
 const q=normalize(req.query);
 return destinations.map((d,i)=>{
  if(req.region!=='all'&&d.macroRegion!==req.region)return null;
  const similarity=cosineSimilarity(vectors[i],queryVector);
  if(similarity<0)return null;
  const tags=new Set(Object.values(d.tags).flat());
  const matching=[...req.scenery,...req.vibes].filter(t=>tags.has(t));
  const named=q.includes(normalize(d.name))&&normalize(d.name).length>=4;
  const score=similarity*100+matching.length*5+(named?20:0);
  const reasons=[...new Set([...matching,...d.tags.vibe.slice(0,2),...d.tags.scenery.slice(0,1)])].slice(0,3);
  return {id:d.id,score:Math.round(score*100)/100,reason:'Matches draft travel themes: '+reasons.join(', ')+'.'};
 }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function searchWarnings(query){
 const messages=['All destination profiles are unverified editorial drafts; bookings and attractions are not checked.'];
 if(queryHasWeather(query))messages.push('Weather, sunshine and seasonal suitability have not been checked.');
 if(/\b(cheap|budget|affordable|price|under\s+[£$€]|\d+\s*(?:pounds|dollars|euros))\b/i.test(query))messages.push('Prices and affordability have not been checked.');
 return messages;
}
const intentSchema={
 type:'object',additionalProperties:false,
 properties:{semantic_query:{type:'string'},interpretation:{type:'string'}},
 required:['semantic_query','interpretation']
};
export function createAiSearch({destinations,apiKey,fetchImpl=fetch,model=MODEL}){
 let cachedIndex=null;
 async function call(path,body){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetchImpl('https://api.openai.com/v1/'+path,{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:controller.signal
   });
   if(!response.ok)throw new Error('OpenAI unavailable (HTTP '+response.status+')');
   return await response.json();
  }finally{clearTimeout(timeout);}
 }
 async function embed(input){
  const output=await call('embeddings',{model:EMBEDDINGS,input});
  const vectors=[...(output.data||[])].sort((a,b)=>a.index-b.index).map(x=>x.embedding);
  if(vectors.length!==input.length||vectors.some(x=>!Array.isArray(x)||!x.length))throw new Error('Incomplete embedding output');
  return vectors;
 }
 function getIndex(){
  if(!cachedIndex)cachedIndex=embed(destinations.map(destinationText)).catch(e=>{cachedIndex=null;throw e;});
  return cachedIndex;
 }
 async function interpret(query){
  const response=await call('responses',{
   model,store:false,max_output_tokens:250,
   input:[
    {role:'system',content:'Interpret a creative holiday-inspiration request for semantic search. Provide a concise, rich description of the desired mood, activities, scenery, food and sociability. Explain user intent in one sentence. Preserve distinctions such as quiet nightlife versus partying. Do not name destinations or claim facts about weather, costs, hotels or availability. Return only the structured result.'},
    {role:'user',content:query}
   ],
   text:{format:{type:'json_schema',name:'wanderly_travel_intent',strict:true,schema:intentSchema}}
  });
  const parsed=JSON.parse(extractResponseText(response));
  if(typeof parsed.semantic_query!=='string'||!parsed.semantic_query.trim())throw new Error('Missing semantic query');
  return {query:parsed.semantic_query.slice(0,600),interpretation:typeof parsed.interpretation==='string'?parsed.interpretation.slice(0,250):''};
 }
 function fallback(req,notice){
  const matches=matchDestinations(destinations,{query:req.query,region:req.region,scenery:req.scenery,vibes:req.vibes,limit:12});
  return {engine:'keyword',notice,interpretation:'',warnings:searchWarnings(req.query),matches:matches.map(d=>({id:d.id,score:d.score,reason:'Matched draft tags (not AI).'}))};
 }
 async function search(req){
  if(!apiKey)return fallback(req,'AI is off. Add your API key to the local .env file and restart the server.');
  try{
   const [index,intent]=await Promise.all([getIndex(),interpret(req.query)]);
   const [queryVector]=await embed([intent.query]);
   return {engine:'ai',notice:'AI semantic search is on; rankings use draft descriptions.',interpretation:intent.interpretation,warnings:searchWarnings(req.query),matches:rankDestinations(destinations,index,queryVector,req)};
  }catch(error){
   console.error('AI search unavailable:',error?.message||'Provider error');
   return fallback(req,'AI was unavailable. Showing tag-search results; check API credentials, credits and network.');
  }
 }
 return {search,getIndex};
}
