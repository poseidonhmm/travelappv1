// Pure, transparent travel-context helpers shared by the website and search API.
// Approximate regional preferences are NOT verified flight distances or climate data.
export const WORLD_REGIONS=['Europe','Asia','Africa','North America','South America','Oceania','Middle East'];
export const FOOD_PRIORITIES=['any','important','essential'];
export const JOURNEY_PREFERENCES=['any','nearby','different'];
export const MOODS=['any','relaxed','sociable','adventurous','romantic','cultural'];
export const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const southernCountries=new Set(['australia','new zealand','south africa','argentina','chile','uruguay','namibia','botswana','lesotho']);
const northernRegions=new Set(['Europe','North America','Middle East']);

export function currentTravelMonth(now=new Date()){
 return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
}
export function monthOptions(now=new Date(),count=12){
 const values=[];
 for(let i=0;i<count;i++){
  const date=new Date(now.getFullYear(),now.getMonth()+i,1);
  values.push({value:currentTravelMonth(date),label:MONTHS[date.getMonth()]+' '+date.getFullYear()+(i===0?' · now':'')});
 }
 return values;
}
export function seasonContext(travelMonth,homeRegion='all',homeCountry=''){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(travelMonth)))return '';
 const [year,monthText]=travelMonth.split('-');
 const month=Number(monthText);
 const name=MONTHS[month-1]+' '+year;
 const country=homeCountry.trim().toLowerCase();
 const southern=southernCountries.has(country);
 const northern=!southern&&(northernRegions.has(homeRegion)||['united kingdom','uk','morocco','spain','france','germany','italy','united states','canada','india','thailand','japan'].includes(country));
 if(!southern&&!northern)return name+' · local season depends on location';
 const season= southern
  ? (month===12||month<=2?'summer':month<=5?'autumn':month<=8?'winter':'spring')
  : (month===12||month<=2?'winter':month<=5?'spring':month<=8?'summer':'autumn');
 return name+' · '+(southern?'Southern':'Northern')+' Hemisphere '+season;
}
export function isBroadSearch(query){
 const normalized=String(query||'').trim().replace(/[^\p{L}\p{N}\s]/gu,' ');
 return normalized.split(/\s+/).filter(Boolean).length<=2;
}
function sameCountry(a,b){
 const x=String(a||'').trim().toLowerCase(),y=String(b||'').trim().toLowerCase();
 const aliases={'uk':'united kingdom','usa':'united states','us':'united states','uae':'united arab emirates'};
 return !!x&&(aliases[x]||x)===(aliases[y]||y);
}
export function contextBoost(destination,req={}){
 let score=0;
 if(req.foodPriority==='important'||req.foodPriority==='essential'){
  const strong=destination.tags?.vibe?.includes('food-led')||destination.tags?.experiences?.includes('food-tours');
  if(strong)score+=req.foodPriority==='essential'?11:6;
 }
 const originKnown=WORLD_REGIONS.includes(req.homeRegion);
 if(req.journey==='nearby'&&originKnown){
  if(sameCountry(req.homeCountry,destination.country))score+=20;
  else if(req.homeRegion===destination.macroRegion)score+=10;
 }
 if(req.journey==='different'&&originKnown){
  if(destination.macroRegion!==req.homeRegion)score+=8;
 }
 if(req.mood&&req.mood!=='any'&&destination.tags?.vibe?.includes(req.mood))score+=7;
 // Intentionally NO month/climate bonus until sourced monthly weather exists.
 return score;
}
export function contextDescription(req={}){
 const parts=[];
 if(req.homeCountry)parts.push('Starting country: '+req.homeCountry.slice(0,60));
 if(WORLD_REGIONS.includes(req.homeRegion))parts.push('Starting world region: '+req.homeRegion);
 if(req.travelMonth)parts.push('Planned travel month: '+req.travelMonth);
 if(req.journey==='nearby')parts.push('Preference: broadly nearer to home; geographic region is only a rough proxy, not flight time.');
 if(req.journey==='different')parts.push('Preference: a different part of the world; travel duration is unknown.');
 if(req.foodPriority==='important')parts.push('Food is important.');
 if(req.foodPriority==='essential')parts.push('Food is a top priority.');
 if(req.mood&&req.mood!=='any')parts.push('Desired mood: '+req.mood);
 return parts.join('\n');
}
