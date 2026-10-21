// Private UX-prototype matcher. Interpret broad search phrases using controlled tags.
// This is intentionally deterministic, not a trained AI or a source of factual claims.
export const examples=[
 'Feel-good food and beach days',
 'Dramatic landscapes and a bit of partying',
 'Posh city break',
 'Tropical adventure',
 'Peaceful mountains and scenic walks'
];
const concepts={
 beach:{words:['beach','beaches','seaside','seashore'],tags:['beach','coast','island','beach-time']},
 tropical:{words:['tropical','paradise','tropics'],tags:['jungle','rainforest','island','beach','tropical-produce']},
 mountains:{words:['mountain','mountains','alpine','hills'],tags:['mountains','hiking','scenic','hills']},
 scenery:{words:['dramatic','landscape','landscapes','scenery','scenic'],tags:['scenic','mountains','cliffs','glaciers','rock-formations','volcanoes','lakes','waterfalls']},
 nightlife:{words:['party','partying','nightlife','bars','social','sociable'],tags:['nightlife','sociable','energetic']},
 refined:{words:['posh','fancy','luxury','luxurious','upmarket','upscale'],tags:['elegant','luxury','romantic']},
 city:{words:['city','cities','urban'],tags:['city','architecture','food-tours']},
 food:{words:['food','foodie','eating','cuisine','delicious'],tags:['food-led','food-tours','street-food','markets','local-cuisine','seafood','traditional-cuisine']},
 romantic:{words:['romantic','couple','romance'],tags:['romantic','elegant','peaceful']},
 peaceful:{words:['quiet','peaceful','calm','tranquil'],tags:['peaceful','remote','relaxed']},
 adventure:{words:['adventure','adventurous','active','outdoors'],tags:['adventurous','hiking','surfing','road-trips','cycling']},
 surf:{words:['surf','surfing'],tags:['surfing','beach']},
 culture:{words:['culture','cultural','historic','history'],tags:['cultural','history','museums','old-town']},
 nature:{words:['nature','wildlife','forest','jungle'],tags:['forest','mountains','wildlife','waterfalls','jungle','rainforest']},
 relaxed:{words:['relaxed','relaxing','chill','slow'],tags:['relaxed','peaceful','wellness']},
 island:{words:['island','islands'],tags:['island','beach','boat-trips']}
};
const wordToConcept=new Map(Object.entries(concepts).flatMap(([key,value])=>value.words.map(word=>[word,key])));
const stopwords=new Set('i me my the to for a an and or with somewhere want looking go getaway holiday trip in of on at that something from but bit really lots great nice some very feel good like need week break days time'.split(' '));
const weatherWords=new Set(['sunny','sunshine','sun','hot','warm','dry','rain','rainy','weather','forecast','february','january','march','april','may','june','july','august','september','october','november','december','winter','summer','autumn','spring']);
export const normalize=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function queryHasWeather(query){return normalize(query).split(' ').some(w=>weatherWords.has(w));}
export function matchDestinations(destinations,options={}){
 const {query='',region='all',scenery=[],vibes=[],savedIds=null,limit=88}=options;
 const normalized=normalize(query);
 const words=[...new Set(normalized.split(' ').filter(w=>w.length>2&&!stopwords.has(w)&&!weatherWords.has(w)))];
 const groups=new Map();
 for(const word of words){
  const name=wordToConcept.get(word)||'literal:'+word;
  if(!groups.has(name))groups.set(name,new Set());
  groups.get(name).add(word);
 }
 const selected=[...scenery,...vibes];
 const hasCriteria=groups.size>0||selected.length>0;
 return destinations.filter(d=>(region==='all'||d.macroRegion===region)&&(!savedIds||savedIds.has(d.id))).map(d=>{
  const tags=Object.values(d.tags||{}).flat();
  const tagSet=new Set(tags);
  const blob=normalize([d.name,d.country,d.macroRegion,d.kind,d.summary,...tags].join(' '));
  let score=0,matchedGroups=0;
  const reasons=[];
  for(const [group,terms] of groups){
   if(group.startsWith('literal:')){
    const matched=[...terms].some(term=>blob.includes(term));
    if(matched){matchedGroups++;score+=8;}
    continue;
   }
   const matched=concepts[group].tags.filter(tag=>tagSet.has(tag));
   if(matched.length){
    matchedGroups++;
    score+=8+Math.min(6,matched.length*2);
    reasons.push(...matched.slice(0,2));
   }else if([...terms].some(term=>blob.includes(term))){
    matchedGroups++;
    score+=7;
   }
  }
  // Covering more distinct needs matters more than matching the same need repeatedly.
  if(groups.size>1){score+=10*matchedGroups/groups.size;if(matchedGroups===groups.size)score+=18;}
  // Explicit chips are preferences, not absolute constraints at this exploratory stage.
  const matchedSelected=selected.filter(tag=>tagSet.has(tag));
  score+=matchedSelected.length*8;
  if(selected.length>1&&matchedSelected.length===selected.length)score+=8;
  reasons.push(...matchedSelected);
  // Directly naming a destination is a strong navigational signal.
  if(normalized.length>=4 && normalized.includes(normalize(d.name)))score+=25;
  return {...d,score,reasons:[...new Set(reasons)].slice(0,4)};
 }).filter(d=>!hasCriteria||d.score>0)
 .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name))
 .slice(0,Math.max(0,limit));
}
