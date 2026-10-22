import { matchDestinations, queryHasWeather, normalize } from '../public/recommend.js';

const MODEL='gpt-4o-mini';
const EMBEDDINGS='text-embedding-3-small';
const REGIONS=new Set(['all','Europe','Asia','Africa','North America','South America','Oceania','Middle East']);
const TAGS=new Set(['beach','coast','jungle','mountains','city','island','relaxed','sociable','romantic','adventurous','food-led','nightlife','luxury']);
export class InputError extends Error {}

const CREDIT_CODES=new Set([
 'insufficient_quota','credit_balance_exhausted',
 'organization_spend_limit_exceeded','project_spend_limit_exceeded',
 'organization_usage_limit_exceeded'
]);
export function explainOpenAiFailure(status,providerResponse){
 const rawCode=providerResponse?.error?.code;
 const rawType=providerResponse?.error?.type;
 const code=typeof rawCode==='string'&&/^[a-z_]{1,80}$/.test(rawCode)?rawCode:
  typeof rawType==='string'&&/^[a-z_]{1,80}$/.test(rawType)?rawType:'unknown';
 let notice='OpenAI API request failed (HTTP '+status+'). Showing tag-search results; check Terminal for the reason.';
 if(CREDIT_CODES.has(code)){
  notice='OpenAI API quota, billing or spend limit reached ('+code+'). Check API billing and project limits; ChatGPT credits are separate. Showing tag-search results.';
 }else if(status===429){
  notice='OpenAI API returned HTTP 429: likely a temporary request/token rate limit, or a billing/quota limit. Check Terminal for the specific error code. Showing tag-search results.';
 }else if(status===401||status===403){
  notice='OpenAI API rejected the key or project permissions (HTTP '+status+'). Check your API key and project access. Showing tag-search results.';
 }else if(status===400){
  notice='OpenAI API rejected a search request (HTTP 400). Check Terminal for the error code. Showing tag-search results.';
 }
 return {status,code,notice};
}
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
 const searchCache=new Map();
 async function call(path,body){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetchImpl('https://api.openai.com/v1/'+path,{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:controller.signal
   });
   if(!response.ok){
    // Only capture documented error codes; don't log the provider's raw message
    // or any credential, user text, or response body.
    const payload=await response.json().catch(()=>null);
    const diagnostic=explainOpenAiFailure(response.status,payload);
    const error=new Error('OpenAI API HTTP '+diagnostic.status+' ('+diagnostic.code+') on '+path);
    error.publicNotice=diagnostic.notice;
    throw error;
   }
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
 async function freshSearch(req){
  if(!apiKey)return fallback(req,'AI is off. Add your API key to the local .env file and restart the server.');
  try{
   const [index,intent]=await Promise.all([getIndex(),interpret(req.query)]);
   const [queryVector]=await embed([intent.query]);
   return {engine:'ai',notice:'AI semantic search is on; rankings use draft descriptions.',interpretation:intent.interpretation,warnings:searchWarnings(req.query),matches:rankDestinations(destinations,index,queryVector,req)};
  }catch(error){
   console.error('AI search unavailable:',error?.message||'Provider error');
   return fallback(req,error?.publicNotice||'AI was unavailable due to a temporary provider or network error. Check Terminal; showing tag-search results.');
  }
 }
 // Identical search requests reuse results in memory, avoiding additional paid API calls.
 // This is a local development cache, cleared when the server restarts.
 async function search(req){
  if(!apiKey)return freshSearch(req);
  const key=JSON.stringify([req.query.toLowerCase().trim(),req.region,
   [...req.scenery].sort(),[...req.vibes].sort()]);
  const hit=searchCache.get(key);
  if(hit)return {...await hit,cached:true};
  const pending=freshSearch(req);
  searchCache.set(key,pending);
  if(searchCache.size>80)searchCache.delete(searchCache.keys().next().value);
  try{
   const value=await pending;
   if(value.engine!=='ai')searchCache.delete(key);
   return value;
  }catch(error){searchCache.delete(key);throw error;}
 }
 return {search,getIndex};
}
