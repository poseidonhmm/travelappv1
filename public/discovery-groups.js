import {departureContext,sameCountry} from './countries.js';
import {normalize} from './recommend.js';
import {contextBoost} from './trip-context.js';

const hasTags=(d,tags)=>Object.values(d.tags||{}).flat().some(t=>tags.includes(t));
export function expressedInterests(req={}){
 const text=normalize(req.query||'');
 const tags=[...(req.scenery||[]),...(req.vibes||[])];
 return {
  food:['important','essential'].includes(req.foodPriority)||tags.includes('food-led')||/\b(food|foodie|foodies|cuisine|culinary|eating|restaurants?)\b/.test(text),
  adventure:req.mood==='adventurous'||tags.some(t=>['adventurous','mountains','jungle'].includes(t))||/\b(adventure|adventurous|nature|wildlife|hiking|outdoors|mountains?|forests?)\b/.test(text),
  beach:req.beachPriority==='important'||tags.some(t=>['beach','coast','island'].includes(t))||/\b(beach|beaches|seaside|coast|islands?)\b/.test(text),
  mood:req.mood&&req.mood!=='any'||tags.some(t=>['relaxed','adventurous','sociable','romantic','nightlife'].includes(t))||/\b(relaxing|relaxed|adventurous|romantic|sociable|nightlife|quiet|peaceful)\b/.test(text)
 };
}

// Partition an already ranked list. The leading recommendations always remain first.
// Category cards must come from the stronger half of the ranking score range; no
// low-quality item is imported simply to fill a category. Every ID appears once.
export function groupRecommendations(ranked,req={}){
 const unique=[...new Map(ranked.map(d=>[d.id,d])).values()];
 if(!unique.length)return [];
 const used=new Set();
 const groups=[];
 const add=(id,label,description,items)=>{
  if(!items.length)return;
  items.forEach(d=>used.add(d.id));groups.push({id,label,description,destinations:items});
 };
 add('best','Best matches','The strongest overall matches for your search.',unique.slice(0,6));
 const origin=departureContext(req.homeCountry);
 const interests=expressedInterests(req);
 const scores=unique.map(d=>Number.isFinite(d.score)?d.score:0);
 const floor=Math.max(0,Math.max(...scores)*0.55);
 const eligible=d=>!used.has(d.id)&&(!Number.isFinite(d.score)||d.score>=floor);
 const take=(id,label,description,predicate)=>{
  const items=unique.filter(d=>eligible(d)&&predicate(d)).slice(0,3);
  if(items.length>=2)add(id,label,description,items);
 };
 const nearby=()=>take('nearby','Closer to home','Your departure country or broad region; flight times and distances are not checked.',d=>sameCountry(req.homeCountry,d.country)||d.macroRegion===origin.homeRegion);
 const different=()=>take('different','Something different','Matches in a different broad region from your chosen departure country.',d=>d.macroRegion!==origin.homeRegion);
 if(req.journey==='nearby'&&origin.homeRegion!=='all')nearby();
 if(req.journey==='different'&&origin.homeRegion!=='all')different();
 if(interests.food)take('food','Food-focused escapes','Food tours or food-led themes in the editorial destination catalogue.',d=>hasTags(d,['food-led','food-tours']));
 if(interests.adventure)take('adventure','Adventure and nature','Outdoor and nature themes that reflect your expressed interests.',d=>hasTags(d,['adventurous','hiking','wildlife','rainforest','forest','jungle','mountains']));
 if(origin.homeRegion!=='all'&&req.journey!=='different'&&req.journey!=='nearby')nearby();
 if(origin.homeRegion!=='all'&&req.journey!=='nearby'&&req.journey!=='different')different();
 add('more','More to explore','More destinations in recommendation order.',unique.filter(d=>!used.has(d.id)));
 return groups;
}

export function followupQuestions(req={}){
 const interests=expressedInterests(req);
 const questions=[];
 if(!interests.food)questions.push('foodPriority');
 if(!req.journey||req.journey==='any')questions.push('journey');
 if(!interests.mood)questions.push('mood');
 if(!interests.beach)questions.push('beachPriority');
 return questions;
}

// Preserve semantic candidates and their original relevance when a follow-up
// changes context. Remove the old context bonus before applying the new one.
export function rerankWithContext(ranked,previousContext={},nextContext={}){
 return ranked.map(d=>({...d,score:(Number.isFinite(d.score)?d.score:0)-contextBoost(d,previousContext)+contextBoost(d,nextContext)}))
  .sort((a,b)=>b.score-a.score);
}
