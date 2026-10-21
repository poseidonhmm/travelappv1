import { load } from './validate.mjs';
const {destinations}=load();
const aliases={
 'food':['food-led','food-tours','street-food','markets','traditional-cuisine'],
 'feel':['food-led','relaxed','local'],
 'good':['food-led','relaxed','local'],
 'posh':['elegant','luxury','romantic'],
 'luxurious':['luxury','elegant'],
 'party':['nightlife','sociable','energetic'],
 'partying':['nightlife','sociable','energetic'],
 'nightlife':['nightlife','sociable'],
 'dramatic':['mountains','cliffs','volcanoes','glaciers','rock-formations','scenic'],
 'landscape':['mountains','cliffs','volcanoes','glaciers','scenic'],
 'tropical':['jungle','rainforest','beach','island','tropical-produce'],
 'beach':['beach','coast','beach-time'],
 'mountain':['mountains','hiking'],
 'quiet':['peaceful','relaxed','remote'],
 'adventure':['adventurous','hiking','road-trips'],
 'city':['city','architecture'],
 'romantic':['romantic','elegant'],
 'surf':['surfing','beach']
};
export function searchDestinations(query,all=destinations){
 const words=query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]+/g)||[];
 if(!words.length)return [];
 return all.map(d=>{
  const blob=[d.name,d.country,d.macroRegion,d.summary,...Object.values(d.tags).flat()].join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tagSet=new Set(Object.values(d.tags).flat());
  let score=0;
  for(const w of words){
    if(w.length<3)continue;
    if(blob.includes(w))score+=3;
    for(const expansion of aliases[w]||[])if(tagSet.has(expansion))score+=2;
  }
  return {id:d.id,name:d.name,country:d.country,score,status:d.editorial.status};
 }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
if(process.argv[1]&&process.argv[1].endsWith('search.mjs')){
 const query=process.argv.slice(2).join(' ');
 if(!query){console.error('Usage: npm run search -- "your dream trip"');process.exit(1);}
 console.log(JSON.stringify(searchDestinations(query).slice(0,12),null,2));
 console.log('\nWARNING: prototype keyword search includes unverified editorial drafts. Do not publish these as verified results.');
}
