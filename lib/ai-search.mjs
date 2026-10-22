import { matchDestinations, queryHasWeather, normalize } from '../public/recommend.js';
import { createEmbeddingIndex } from './embedding-index.mjs';
import { WORLD_REGIONS,FOOD_PRIORITIES,JOURNEY_PREFERENCES,MOODS,BEACH_PRIORITIES,isBroadSearch,contextBoost,contextDescription } from '../public/trip-context.js';

import {departureContext,findCountry} from '../public/countries.js';

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
 const suppliedRegion=body.homeRegion??'all';
 const homeCountry=body.homeCountry??'';
 const travelMonth=body.travelMonth??'';
 const foodPriority=body.foodPriority??'any';
 const journey=body.journey??'any';
 const mood=body.mood??'any';
 const beachPriority=body.beachPriority??'any';
 if(suppliedRegion!=='all'&&!WORLD_REGIONS.includes(suppliedRegion))throw new InputError('Invalid departure region.');
 if(typeof homeCountry!=='string'||homeCountry.length>100||homeCountry.trim()&&!findCountry(homeCountry))throw new InputError('Invalid country of departure.');
 if(typeof travelMonth!=='string'||travelMonth&&!/^20\d{2}-(0[1-9]|1[0-2])$/.test(travelMonth))throw new InputError('Invalid travel month.');
 if(!FOOD_PRIORITIES.includes(foodPriority))throw new InputError('Invalid food preference.');
 if(!JOURNEY_PREFERENCES.includes(journey))throw new InputError('Invalid journey preference.');
 if(!MOODS.includes(mood))throw new InputError('Invalid travel mood.');
 if(!BEACH_PRIORITIES.includes(beachPriority))throw new InputError('Invalid beach preference.');
 const origin=departureContext(homeCountry);
 return {query:body.query.trim(),region:body.region,scenery:uniqueTags(body.scenery||[]),vibes:uniqueTags(body.vibes||[]),
  ...origin,travelMonth,foodPriority,journey,mood,beachPriority};
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
// Explain only themes the traveller actually expressed. Destination profile tags
// alone are not evidence that a traveller asked for food, nightlife or sociability.
function matchReason(destination,req,engine='ai'){
 const tags=new Set(Object.values(destination.tags||{}).flat());
 const selected=[...(req.scenery||[]),...(req.vibes||[])].filter(t=>tags.has(t));
 const normalized=normalize(req.query);
 // The controlled matcher does not understand negation. Keep explanations neutral
 // in that case rather than calling an explicitly unwanted theme a preference.
 const query=/\b(no|not|without|avoid|never|don t|dont)\b/.test(normalized)?'':req.query;
 const literal=matchDestinations([destination],{query,region:'all',limit:1})[0]?.reasons||[];
 const priorities=[];
 if(['important','essential'].includes(req.foodPriority))priorities.push(...['food-led','food-tours'].filter(t=>tags.has(t)));
 if(req.mood&&req.mood!=='any'&&tags.has(req.mood))priorities.push(req.mood);
 if(req.beachPriority==='important')priorities.push(...['beach','coast','island'].filter(t=>tags.has(t)));
 const reasons=[...new Set([...selected,...literal,...priorities])].slice(0,3);
 let reason=reasons.length?'Matches your expressed themes in the draft catalogue: '+reasons.join(', ')+'.'
  :engine==='ai'?'Semantic match to your search. No additional trip preferences assumed.'
  :'Local discovery preview. No additional trip preferences assumed.';
 if(queryHasWeather(req.query))reason+=' Weather suitability is not verified.';
 return reason;
}
export function rankDestinations(destinations,vectors,queryVector,req,limit=36){
 const q=normalize(req.query);
 return destinations.map((d,i)=>{
  if(req.region!=='all'&&d.macroRegion!==req.region)return null;
  const similarity=cosineSimilarity(vectors[i],queryVector);
  if(similarity<0)return null;
  const tags=new Set(Object.values(d.tags).flat());
  const matching=[...req.scenery,...req.vibes].filter(t=>tags.has(t));
  const named=q.includes(normalize(d.name))&&normalize(d.name).length>=4;
  const score=similarity*100+matching.length*5+(named?20:0)+contextBoost(d,req);
  return {id:d.id,score:Math.round(score*100)/100,reason:matchReason(d,req)};
 }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function searchWarnings(query,req={}){
 const messages=['All destination profiles are unverified editorial drafts; bookings and attractions are not checked.'];
 if(queryHasWeather(query)||req.travelMonth)messages.push('Weather, sunshine and monthly season suitability are not verified for the selected travel month. No sunshine guarantee.');
 if(req.journey!=='any'&&req.homeRegion!=='all')messages.push('Near/far recommendations use broad world regions, not verified flight times or distances.');
 if(/\b(cheap|budget|affordable|price|under\s+[£$€]|\d+\s*(?:pounds|dollars|euros))\b/i.test(query))messages.push('Prices and affordability have not been checked.');
 return messages;
}
const intentSchema={
 type:'object',additionalProperties:false,
 properties:{semantic_query:{type:'string'},interpretation:{type:'string'}},
 required:['semantic_query','interpretation']
};
export function createAiSearch({destinations,apiKey,fetchImpl=fetch,model=MODEL,indexCachePath=null,apiTimeoutMs=90000}){
 const index=createEmbeddingIndex({
  records:destinations.map(d=>({id:d.id,text:destinationText(d)})),
  model:EMBEDDINGS,
  embed:async texts=>embed(texts),
  cachePath:indexCachePath,
  batchSize:64
 });
 const searchCache=new Map();
 async function call(path,body){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),apiTimeoutMs);
  try{
   const response=await fetchImpl('https://api.openai.com/v1/'+path,{
    method:'POST',
    headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:controller.signal
   });
   if(!response.ok){
    // Only capture documented error codes; don't log the provider's raw message
    // or any credential, user text, or response body.
    const payload=typeof response.json==='function'?await response.json().catch(()=>null):null;
    const diagnostic=explainOpenAiFailure(response.status,payload);
    const error=new Error('OpenAI API HTTP '+diagnostic.status+' ('+diagnostic.code+') on '+path);
    error.publicNotice=diagnostic.notice;
    throw error;
   }
   return await response.json();
  }catch(error){
   if(controller.signal.aborted||error?.name==='AbortError'){
    const timeoutError=new Error('OpenAI request timed out after '+apiTimeoutMs+'ms on '+path);
    timeoutError.publicNotice='OpenAI took too long to respond ('+Math.ceil(apiTimeoutMs/1000)+' seconds). Try the search again; destination profiles already completed are saved locally. Showing tag-search results.';
    throw timeoutError;
   }
   throw error;
  }finally{clearTimeout(timeout);}
 }
 async function embed(input){
  const output=await call('embeddings',{model:EMBEDDINGS,input});
  const vectors=[...(output.data||[])].sort((a,b)=>a.index-b.index).map(x=>x.embedding);
  if(vectors.length!==input.length||vectors.some(x=>!Array.isArray(x)||!x.length))throw new Error('Incomplete embedding output');
  return vectors;
 }
 function getIndex(){
  return index.getVectors();
 }
 async function interpret(req){
  // Single words and short phrases are insufficient grounds for invented
  // lifestyle preferences. They can be embedded directly without a model call.
  if(isBroadSearch(req.query)){
   return {query:req.query,interpretation:'You asked for "'+req.query+'". No other trip preferences assumed.'};
  }
  const response=await call('responses',{
   model,store:false,max_output_tokens:250,
   input:[
    {role:'system',content:'Interpret travel requests faithfully for semantic destination retrieval. STRICT: Never invent preferences. If the traveller says only "sunny", return an intent about sunshine or warmth ONLY; never invent cuisine, social activities, nightlife, partying, relaxation, romance or adventure. For underspecified requests, keep the interpretation short and acknowledge that trip style is unknown. Explicit filter preferences are provided separately; use only what is present. Mention travel month as planning context, but never claim a destination has guaranteed weather, a seasonal climate, flight times, prices or availability. Never name recommended destinations. Return only the structured result.'},
    {role:'user',content:'Traveller request (preserve exactly): '+req.query+'\nKnown preferences (do not infer missing preferences):\n'+(contextDescription(req)||'None supplied.')+'\nSelected scenery: '+(req.scenery.join(', ')||'unspecified')+'; selected vibes: '+(req.vibes.join(', ')||'unspecified')}
   ],
   text:{format:{type:'json_schema',name:'wanderly_travel_intent',strict:true,schema:intentSchema}}
  });
  const parsed=JSON.parse(extractResponseText(response));
  if(typeof parsed.semantic_query!=='string'||!parsed.semantic_query.trim())throw new Error('Missing semantic query');
  return {query:parsed.semantic_query.slice(0,600),interpretation:typeof parsed.interpretation==='string'?parsed.interpretation.slice(0,250):''};
 }
 function fallback(req,notice){
  const matches=matchDestinations(destinations,{query:req.query,region:req.region,scenery:req.scenery,vibes:req.vibes,limit:destinations.length});
  const ordered=matches.map(d=>({...d,score:(d.score||0)+contextBoost(d,req)}))
  .sort((a,b)=>b.score-a.score).slice(0,36);
  return {engine:'keyword',notice,interpretation:'',warnings:searchWarnings(req.query,req),
   matches:ordered.map(d=>({id:d.id,score:d.score,reason:matchReason(d,req,'keyword')}))};
 }
 async function freshSearch(req){
  if(!apiKey)return fallback(req,'AI is off. Add your API key to the local .env file and restart the server.');
  try{
   // Interpret first: don't pay to embed the whole catalogue if credentials,
   // quota or project limits already reject this smaller request.
   const intent=await interpret(req);
   const vectors=await getIndex();
   const [queryVector]=await embed([intent.query]);
   return {engine:'ai',notice:'AI semantic search is on; rankings use draft descriptions.',interpretation:intent.interpretation,warnings:searchWarnings(req.query,req),matches:rankDestinations(destinations,vectors,queryVector,req)};
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
   [...req.scenery].sort(),[...req.vibes].sort(),req.homeRegion,req.homeCountry?.toLowerCase(),
   req.travelMonth,req.foodPriority,req.journey,req.mood,req.beachPriority]);
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
