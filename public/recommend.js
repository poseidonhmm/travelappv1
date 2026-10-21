// Transparent, deterministic search over the unverified editorial seed.
export const examples=[
 'Feel-good food and beach days',
 'Dramatic landscapes and a bit of partying',
 'Posh city break',
 'Tropical adventure',
 'Peaceful mountains and scenic walks'
];
const dictionary={
 'beach':['beach','coast','island','beach-time'],
 'coast':['coast','beach','cliffs'],
 'tropical':['jungle','rainforest','island','beach','tropical-produce'],
 'jungle':['jungle','rainforest','forest'],
 'mountain':['mountains','hiking','scenic'],
 'mountains':['mountains','hiking','scenic'],
 'dramatic':['mountains','cliffs','glaciers','rock-formations','volcanoes','scenic'],
 'landscape':['scenic','mountains','cliffs','lakes','waterfalls'],
 'scenery':['scenic','mountains','cliffs','lakes','waterfalls'],
 'posh':['elegant','luxury','romantic'],
 'fancy':['elegant','luxury'],
 'luxury':['luxury','elegant'],
 'city':['city','architecture','food-tours'],
 'break':['city','architecture'],
 'party':['nightlife','sociable','energetic'],
 'partying':['nightlife','sociable','energetic'],
 'nightlife':['nightlife','sociable','energetic'],
 'social':['sociable','nightlife'],
 'sociable':['sociable','nightlife'],
 'food':['food-led','food-tours','street-food','markets','local-cuisine','seafood'],
 'feel':['food-led','relaxed','local'],
 'good':['food-led','local-cuisine'],
 'eating':['food-tours','street-food','food-led'],
 'romantic':['romantic','elegant','peaceful'],
 'peaceful':['peaceful','remote','relaxed'],
 'quiet':['peaceful','remote','relaxed'],
 'adventure':['adventurous','hiking','surfing','road-trips'],
 'active':['adventurous','hiking','cycling','surfing'],
 'surf':['surfing','beach'],
 'culture':['cultural','history','museums'],
 'historic':['cultural','old-town','history'],
 'nature':['forest','mountains','wildlife','waterfalls'],
 'wildlife':['wildlife','safari'],
 'relaxed':['relaxed','peaceful','wellness'],
 'island':['island','beach','boat-trips']
};
const stopwords=new Set('i me my the to for a an and or with somewhere want looking go getaway holiday trip in of on at that something from but bit really lots great nice some very feel good like need week'.split(' '));
const weatherWords=new Set(['sunny','sunshine','sun','hot','warm','dry','rain','rainy','weather','forecast','february','january','march','april','may','june','july','august','september','october','november','december','winter','summer','autumn','spring']);
export const normalize=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
export function queryHasWeather(query){return normalize(query).split(' ').some(w=>weatherWords.has(w));}
export function matchDestinations(destinations,options={}){
 const {query='',region='all',scenery=[],vibes=[],savedIds=null,limit=88}=options;
 const queryWords=[...new Set(normalize(query).split(' ').filter(word=>word.length>2&&!stopwords.has(word)&&!weatherWords.has(word)))];
 const expanded=queryWords.flatMap(w=>dictionary[w]||[]);
 const explicit=new Set([...scenery,...vibes]);
 const hasCriteria=queryWords.length>0||explicit.size>0;
 return destinations.filter(d=>(region==='all'||d.macroRegion===region)&&(!savedIds||savedIds.has(d.id))).map(d=>{
  const tags=Object.values(d.tags||{}).flat();
  const tagSet=new Set(tags);
  const target=normalize([d.name,d.country,d.macroRegion,d.kind,d.summary,...tags].join(' '));
  let score=0;
  const reasons=[];
  for(const w of queryWords){
    if(target.includes(w)){score+=d.name.toLowerCase().includes(w)?10:3;}
  }
  for(const tag of expanded)if(tagSet.has(tag)){score+=2;reasons.push(tag);}
  for(const tag of explicit)if(tagSet.has(tag)){score+=7;reasons.push(tag);}
  // Special case: phrase implies dining and social energy, not a literal source claim.
  const unique=[...new Set(reasons)].slice(0,4);
  return {...d,score,reasons:unique};
 }).filter(d=>!hasCriteria||d.score>0)
 .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name))
 .slice(0,Math.max(0,limit));
}
