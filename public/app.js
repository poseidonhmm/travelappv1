import {recommendActivities} from './activities.js';
import {activityPhotoHTML} from './activity-photos.js';
import {createActivityPlan,editPlan,planActivityRecords} from './itinerary.js';
import {activityPriceHTML,activityEvidenceHTML,activityCostsHTML,recommendedActivitiesHTML} from './activity-planner.js';
import {examples,matchDestinations,queryHasWeather} from './recommend.js';
import {monthOptions,seasonContext,isBroadSearch,contextBoost} from './trip-context.js';
import {COUNTRIES,COUNTRY_MAPPING_SOURCE,departureContext,findCountry} from './countries.js';
import {groupRecommendations,followupQuestions,rerankWithContext} from './discovery-groups.js';

const root=document.querySelector('#app');
const toast=document.querySelector('#toast');
const state={all:[],view:'explore',previous:'explore',detail:null,q:'',region:'all',days:7,scenery:new Set(),vibe:new Set(),saved:new Set(),plans:{},ai:null,searching:false,aiError:null,requestVersion:0,visibleLimit:24,homeRegion:'all',homeCountry:'',travelMonth:'',foodPriority:'any',journey:'any',mood:'any',beachPriority:'any',needsClarification:false,refinementDismissed:new Set(),aiContext:null};
state.refinementOpen=new Map();
state.activities=[];
state.activitiesError='';
const choices={scenery:[['beach','Beach'],['coast','Coastal'],['jungle','Jungle'],['mountains','Mountains'],['city','Cities'],['island','Islands']],vibe:[['relaxed','Relaxed'],['sociable','Sociable'],['romantic','Romantic'],['adventurous','Adventure'],['food-led','Foodie'],['nightlife','Nightlife'],['luxury','Luxury']]};
const regions=['Europe','Asia','Africa','North America','South America','Oceania','Middle East'];
function fromStore(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function toStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{notify('Browser storage is unavailable. Your edits may not persist.');}}
state.saved=new Set(Array.isArray(fromStore('wanderly-saved-v1',[]))?fromStore('wanderly-saved-v1',[]):[]);
const prefFields=['homeRegion','homeCountry','travelMonth','foodPriority','journey','mood','beachPriority'];
const savedPrefs=fromStore('wanderly-search-prefs-v1',{});
const validMonthKeys=new Set(monthOptions(undefined,24).map(x=>x.value));
if(savedPrefs&&typeof savedPrefs==='object'&&!Array.isArray(savedPrefs)){
 for(const key of prefFields){
  if(typeof savedPrefs[key]==='string')state[key]=savedPrefs[key].slice(0,60);
 }
}
Object.assign(state,departureContext(state.homeCountry));
if(!validMonthKeys.has(state.travelMonth))state.travelMonth='';
for(const [key,allowed] of Object.entries({foodPriority:['any','important','essential'],journey:['any','nearby','different'],mood:['any','relaxed','sociable','adventurous','romantic','cultural'],beachPriority:['any','important']})){if(!allowed.includes(state[key]))state[key]='any';}
function savePrefs(){toStore('wanderly-search-prefs-v1',Object.fromEntries(prefFields.map(k=>[k,state[k]])));}
const savedPlans=fromStore('wanderly-plans-v1',{});
state.plans=(savedPlans&&typeof savedPlans==='object'&&!Array.isArray(savedPlans))?savedPlans:{};
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=s=>String(s).split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');
// On-demand per-destination photos are provided by photos.js, not a shared stock pool.
function moodboard(d){
 return '<div class="mosaic" data-photo-destination="'+escapeHTML(d.id)+'">'+
 Array.from({length:4},(_,i)=>'<div class="photo-slot" data-slot="'+i+'" aria-label="Photo pending"><span>Photo '+(i+1)+'</span></div>').join('')+'</div>';
}
function pills(d){return [...new Set([...d.tags.vibe.slice(0,2),...d.tags.scenery.slice(0,2)])].map(x=>'<span class="tag">'+escapeHTML(title(x))+'</span>').join('');}
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),2800);}
function nav(){
 document.querySelector('#navExplore').classList.toggle('active',state.view==='explore');
 document.querySelector('#navSaved').classList.toggle('active',state.view==='saved');
 document.querySelector('#savedCount').textContent=state.saved.size;
}
function card(d){
 const saved=state.saved.has(d.id);
 const explanation=d.matchReason?'<p class="ai-reason"><strong>Why it fits:</strong> '+escapeHTML(d.matchReason)+'</p>':'';
 return '<article class="trip-card">'+moodboard(d)+'<div class="card-body"><span class="card-country">'+escapeHTML(d.country)+' · '+escapeHTML(d.macroRegion)+'</span><div class="card-title-row"><h3 class="card-title">'+escapeHTML(d.name)+'</h3><button class="heart '+(saved?'saved':'')+'" data-action="save" data-id="'+escapeHTML(d.id)+'" aria-label="'+(saved?'Unsave ':'Save ')+escapeHTML(d.name)+'">'+(saved?'♥':'♡')+'</button></div><p class="card-desc">'+escapeHTML(d.summary)+'</p><div class="tags">'+pills(d)+'</div>'+explanation+'<div class="card-bottom"><span class="small-note">✦ Draft travel inspiration</span><button class="card-open" data-action="open" data-id="'+escapeHTML(d.id)+'">Explore trip →</button></div></div></article>';
}
function tagButtons(kind){
 return choices[kind].map(([value,label])=>'<button type="button" class="chip '+(state[kind].has(value)?'active':'')+'" aria-pressed="'+state[kind].has(value)+'" data-action="toggle" data-kind="'+kind+'" data-value="'+value+'">'+label+'</button>').join('');
}

function preferenceOptions(key,options){
 return options.map(([value,label])=>'<option value="'+escapeHTML(value)+'" '+(state[key]===value?'selected':'')+'>'+escapeHTML(label)+'</option>').join('');
}
function refinePanel(){
 const queryKey=state.q.trim().toLowerCase();
 const expanded=state.refinementOpen.has(queryKey)?state.refinementOpen.get(queryKey):state.needsClarification;
 const questions=followupQuestions(currentSearch());
 // Once answered, controls remain available; missing preferences determine which
 // questions are offered initially. Closing the card applies to this query only.
 const fields={
 foodPriority:['Is food important?',[['any','No preference'],['important','Quite important'],['essential','A main reason to travel']]],
 journey:['Closer to home or somewhere different?',[['any','Open to anywhere'],['nearby','Closer to home first'],['different','Somewhere quite different']]],
 mood:['Relaxing or adventurous?',[['any','Not sure yet'],['relaxed','Relaxed'],['adventurous','Adventurous'],['sociable','Sociable'],['romantic','Romantic'],['cultural','Culture-rich']]],
 beachPriority:['Are beaches important?',[['any','No preference'],['important','Yes, I would like a beach']]]
 };
 const keys=Object.keys(fields).filter(key=>questions.includes(key)||state[key]!=='any');
 if(!keys.length||state.refinementDismissed.has(state.q.trim().toLowerCase()))return '';
 return '<details class="refinement-card" id="refinementPanel" data-refinement-query="'+escapeHTML(queryKey)+'" '+(expanded?'open':'')+'><summary>Make these matches more you <span class="small-note">· optional</span></summary>'+
 '<button type="button" class="refinement-dismiss" data-action="dismiss-refinement" aria-label="Dismiss optional follow-up questions">×</button>'+
 '<div class="refinement-heading"><p>'+(state.needsClarification?'A short search leaves room to explore. Choose only what matters to you.':'A few optional choices can help narrow things down.')+'</p></div>'+
 '<div class="refinement-fields">'+keys.map(key=>'<label>'+fields[key][0]+'<select data-pref="'+key+'">'+preferenceOptions(key,fields[key][1])+'</select></label>').join('')+'</div>'+
 '<p class="refinement-inline-note" role="status">Your choices update these recommendations as you go.</p>'+
 (state.journey!=='any'&&state.homeRegion==='all'?'<p class="refinement-alert">Choose a departure country above to use the broad near or far preference.</p>':'')+'</details>';
}
function refreshContext(){
 state.requestVersion++;state.searching=false;savePrefs();results();
}
function previewMatches(query){
 return matchDestinations(state.all,{query:query.q,region:query.region,scenery:query.scenery,vibes:query.vibes,limit:state.all.length})
  .map(d=>({...d,score:(d.score||0)+contextBoost(d,query)}))
  .sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
function tripContextLine(){
 const pieces=[];
 if(state.homeCountry||state.homeRegion!=='all')pieces.push('From '+(state.homeCountry||state.homeRegion));
 const planned=seasonContext(state.travelMonth);
 pieces.push(planned||'When: not chosen yet');
 return pieces.join(' · ');
}

function discover(){
 root.innerHTML='<section class="hero"><div class="hero-content"><div class="eyebrow">A WORLD OF POSSIBILITIES</div><h1>Go somewhere<br><em>that feels like you.</em></h1><p>Don’t know where to go? Describe the feeling you’re chasing. We’ll find places that match.</p></div></section>'+
 '<section class="search-card"><form id="searchForm" class="search-row"><label class="search-field"><span>⌕</span><input id="query" type="search" autocomplete="off" aria-label="Describe your dream holiday" placeholder="Try: amazing food, beaches, a bit of nightlife" value="'+escapeHTML(state.q)+'"></label><button class="primary" type="submit">Find my escape ↗</button></form>'+
 '<div class="hint-row"><span class="hint-label">Try searching:</span>'+examples.map(x=>'<button class="chip" data-action="preset" data-value="'+escapeHTML(x)+'">'+escapeHTML(x)+'</button>').join('')+'</div>'+
 '<div class="departure-context"><div><label class="filter-label" for="homeCountry">Where are you travelling from? <span class="optional-label">Optional</span></label><input class="field-select" id="homeCountry" type="search" list="departureCountries" autocomplete="off" aria-describedby="countryHelp countryError" placeholder="Search countries or leave blank" value="'+escapeHTML(state.homeCountry)+'"><datalist id="departureCountries">'+COUNTRIES.map(c=>'<option value="'+escapeHTML(c.name)+'"></option>').join('')+'</datalist><p class="disabled-note country-help" id="countryHelp">Only the country you choose is used. Broad regions follow <a href="'+COUNTRY_MAPPING_SOURCE.url+'" target="_blank" rel="noopener noreferrer">UN geography</a> with Wanderly’s regional categories.</p><p class="country-error" id="countryError" hidden></p></div>'+
 '<div><label class="filter-label" for="travelMonth">When do you want to travel? <span class="optional-label">Optional</span></label><select class="field-select" id="travelMonth"><option value="" '+(!state.travelMonth?'selected':'')+'>Not sure yet</option>'+monthOptions(undefined,24).map(x=>'<option value="'+x.value+'" '+(state.travelMonth===x.value?'selected':'')+'>'+escapeHTML(x.label)+'</option>').join('')+'</select><p class="disabled-note" id="seasonNote">'+escapeHTML(state.travelMonth?seasonContext(state.travelMonth):'Choose a month when you know. Destination climate is not verified.')+'</p></div></div>'+
 '<div class="filter-panel"><div><label class="filter-label" for="region">Part of the world</label><select class="field-select" id="region"><option value="all">Anywhere</option>'+regions.map(r=>'<option value="'+r+'" '+(state.region===r?'selected':'')+'>'+r+'</option>').join('')+'</select></div>'+
 '<div><span class="filter-label">Dream trip duration</span><div class="segmented">'+[5,7,10].map(n=>'<button type="button" class="toggle '+(state.days===n?'active':'')+'" data-action="duration" data-value="'+n+'">'+n+' days</button>').join('')+'</div></div></div>'+
 '<div style="margin-top:18px"><span class="filter-label">Landscape & scenery</span><div class="hint-row">'+tagButtons('scenery')+'</div></div>'+
 '<div style="margin-top:16px"><span class="filter-label">The vibe</span><div class="hint-row">'+tagButtons('vibe')+'</div></div></section>'+
 '<section class="main-section" id="resultsSection"><div id="results"></div></section>';
 document.querySelector('#searchForm').addEventListener('submit',event=>{event.preventDefault();state.q=document.querySelector('#query').value;runAiSearch();document.querySelector('#resultsSection').scrollIntoView({behavior:'smooth'});});
 document.querySelector('#query').addEventListener('input',event=>{state.q=event.target.value;clearAi();results();});
 document.querySelector('#region').addEventListener('change',event=>{state.region=event.target.value;clearAi();results();});
 document.querySelector('#travelMonth').addEventListener('change',event=>{state.travelMonth=event.target.value;document.querySelector('#seasonNote').textContent=state.travelMonth?seasonContext(state.travelMonth):'Choose a month when you know. Destination climate is not verified.';refreshContext();});
 document.querySelector('#homeCountry').addEventListener('change',event=>{
  const country=findCountry(event.target.value),invalid=!!event.target.value.trim()&&!country;
  Object.assign(state,departureContext(country?.name||''));
  event.target.setAttribute('aria-invalid',String(invalid));
  const error=document.querySelector('#countryError');error.hidden=!invalid;error.textContent=invalid?'Choose a country from the suggestions, or leave this optional field blank.':'';
  if(country)event.target.value=country.name;
  refreshContext();
 });
 results();
}
function clearAi(){
 state.visibleLimit=24;
 state.needsClarification=false;
 state.requestVersion++;
 state.ai=null;state.aiContext=null;state.aiError=null;state.searching=false;
}
function currentSearch(){
 return {query:state.q.trim(),region:state.region,scenery:[...state.scenery],vibes:[...state.vibe],homeRegion:state.homeRegion,homeCountry:state.homeCountry,travelMonth:state.travelMonth,foodPriority:state.foodPriority,journey:state.journey,mood:state.mood,beachPriority:state.beachPriority};
}
async function runAiSearch(){
 const query=currentSearch();
 if(!query.query){clearAi();results();notify('Describe your dream trip first.');return;}
 const isKnownPlace=state.all.some(d=>d.name.toLowerCase()===query.query.toLowerCase());
 state.needsClarification=isBroadSearch(query.query)&&!isKnownPlace;
 const requestId=++state.requestVersion;
 state.searching=true;state.ai=null;state.aiError=null;results();
 try{
  const response=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(query)});
  if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'Search is unavailable');}
  const result=await response.json();
  if(requestId!==state.requestVersion)return;
  if(!['ai','keyword'].includes(result.engine)||!Array.isArray(result.matches))throw new Error('Unexpected search response');
  state.ai=result;state.aiContext=query;
 }catch(error){
  if(requestId!==state.requestVersion)return;
  state.aiError=error?.message||'Search failed';
 }finally{
  if(requestId===state.requestVersion){state.searching=false;results();}
 }
}
function results(){
 const byId=new Map(state.all.map(d=>[d.id,d]));
 const q=currentSearch();
 // Keyword fallback can be recomputed across the full catalogue without a network call.
 // Only semantic results need to retain their original embedding-ranked candidates.
 const found=state.ai?.engine==='ai'&&Array.isArray(state.ai.matches)?rerankWithContext(state.ai.matches.map(m=>{
  const d=byId.get(m.id);
  return d?{...d,score:m.score,matchReason:typeof m.reason==='string'?m.reason:''}:null;
 }).filter(Boolean),state.aiContext||q,q):previewMatches({q:state.q, ...q});
 const visible=found.slice(0,state.visibleLimit);
 const area=document.querySelector('#results');if(!area)return;
 const engine=state.searching?'✧ AI is interpreting your dream trip…':state.ai?.engine==='ai'?'✦ AI semantic matching':state.ai?.engine==='keyword'?'Tag-search fallback':'✧ Preview results · press Find my escape to run AI';
 const interpretation=state.ai?.interpretation?'<p class="ai-interpretation"><strong>We understood:</strong> '+escapeHTML(state.ai.interpretation)+'</p>':'';
 const warnings=Array.isArray(state.ai?.warnings)?state.ai.warnings.map(x=>'<p class="notice">'+escapeHTML(x)+'</p>').join(''):'';
 const notice=state.ai?.notice?'<p class="search-mode">'+escapeHTML(state.ai.notice)+'</p>':'';
 const context='<div class="travel-context-summary"><strong>Trip context:</strong> '+escapeHTML(tripContextLine())+'<span>Month is for planning, not verified climate. Nearby = broad region, not flight time.</span></div>';
 const missing=state.needsClarification?'<div class="clarification-notice"><strong>Exploring “'+escapeHTML(state.q.trim())+'”</strong><span>No other trip preferences assumed. Optional questions appear after your first matches.</span></div>':'';
 const groups=groupRecommendations(visible,q);
 const cards=groups.map((group,i)=>'<section class="result-group" aria-labelledby="group-'+group.id+'"><div class="result-group-heading"><h3 id="group-'+group.id+'">'+escapeHTML(group.label)+'</h3><span class="group-count">'+group.destinations.length+'</span><p>'+escapeHTML(group.description)+'</p></div><div class="results">'+group.destinations.map(card).join('')+'</div></section>'+(i===0?refinePanel():'')).join('');
 const err=state.aiError?'<p class="notice" role="alert">Search error: '+escapeHTML(state.aiError)+' — showing local preview results.</p>':'';
 area.innerHTML='<div class="section-heading"><div><span class="eyebrow" style="color:var(--accent)">FIND YOUR KIND OF SOMEWHERE</span><h2>'+((state.q||state.scenery.size||state.vibe.size)?'Matching escapes':'Explore everywhere')+'</h2><p>Feel inspired by destinations chosen for their atmosphere and experiences.</p></div><span class="count">'+found.length+' of '+state.all.length+' draft destinations</span></div>'+
 '<p class="search-mode" role="status">'+engine+'</p>'+context+missing+interpretation+notice+err+
 (state.searching?'<div class="loading-state">Comparing the feeling of your search with 288 destination profiles…</div>':found.length?cards+(found.length>visible.length?'<div class="show-more-wrap"><button class="outline" data-action="show-more">Show '+Math.min(24,found.length-visible.length)+' more destinations ↓</button></div>':''):'<div class="empty"><h3>No matching destinations yet</h3><p>Try different words or fewer filters.</p><button class="outline" data-action="clear">Clear filters</button></div>')+
 warnings+(!state.ai&&queryHasWeather(state.q)?'<p class="notice">☀ Weather and seasons are not connected yet. Results cannot guarantee sunshine for your dates.</p>':'')+
 '<p class="notice">✧ Private prototype: destination descriptions and photos are unverified. AI matches meaning, not real-time weather, travel prices or booking availability.</p>';
}
function savedPage(){
 const matches=matchDestinations(state.all,{savedIds:state.saved,limit:state.all.length});
 root.innerHTML='<section class="main-section" style="padding-top:32px"><div class="section-heading"><div><span class="eyebrow" style="color:var(--accent)">YOUR DAYDREAMS</span><h2>Saved escapes</h2><p>All the places you have been dreaming about.</p></div><span class="count">'+matches.length+' saved</span></div>'+
 (matches.length?'<div class="results">'+matches.map(card).join('')+'</div>':'<div class="empty"><h3>Your wish list starts here</h3><p>Tap the heart on any destination to save it.</p><button class="primary" data-action="explore">Explore destinations</button></div>')+
 '<div class="notice">Saved trips and edits live in this browser only. They are not synced across devices.</div></section>';
}
const library=[
 ['arrival','Arrive and settle in','Take time to find your feet.','city'],
 ['explore','Explore the local neighbourhood','Wander and discover a few favourite corners.','city'],
 ['food','Sample the local food','Explore cafes, markets or restaurants.','city'],
 ['viewpoint','Look for scenic viewpoints','Find a special viewpoint and enjoy the scenery.','mountains'],
 ['beach','Spend the afternoon on the beach','Plan a relaxed few hours by the sea.','beach'],
 ['hike','Go for a scenic walk','Explore a suitable local walking route.','mountains'],
 ['market','Explore local markets','See food, makers and neighbourhood life.','city'],
 ['nightlife','Enjoy the evening atmosphere','Discover bars, music or social neighbourhoods.','city'],
 ['water','Explore from the water','Research a boat ride or coastal excursion.','beach'],
 ['culture','Discover local culture','Visit a museum, landmark or historic site.','city'],
 ['nature','Enjoy the natural surroundings','Plan an outdoor or nature experience.','jungle'],
 ['slow','Slow morning in a cafe','Leave room for a coffee and some quiet time.','city'],
 ['sunset','Find somewhere for sunset','Make time to slow down and enjoy the view.','coast']
];
function ideasFor(d){
 const tags=new Set(Object.values(d.tags).flat());
 const order=library.map(x=>{
  let weight=0;
  if(x[0]==='beach'&&['beach','coast','island'].some(t=>tags.has(t)))weight+=8;
  if(x[0]==='hike'&&['mountains','hiking','adventurous'].some(t=>tags.has(t)))weight+=8;
  if(x[0]==='nightlife'&&['nightlife','sociable'].some(t=>tags.has(t)))weight+=8;
  if(x[0]==='food'&&['food-led','food-tours','street-food'].some(t=>tags.has(t)))weight+=8;
  if(x[0]==='nature'&&['forest','jungle','rainforest'].some(t=>tags.has(t)))weight+=8;
  if(x[0]==='viewpoint'&&['scenic','cliffs','mountains'].some(t=>tags.has(t)))weight+=8;
  return {template:x,weight};
 });
 return order.sort((a,b)=>b.weight-a.weight).map(x=>x.template);
}
function planKey(){return state.detail+':'+state.days;}
function makePlan(d){
 const researched=recommendActivities(state.activities,d.id,{...currentSearch(),days:state.days});
 if(researched.length)return createActivityPlan(state.activities,d.id,state.days,currentSearch());
 const ideas=ideasFor(d);
 return Array.from({length:state.days},(_,i)=>({
  label:i===0?'Arrival & first impressions':i===state.days-1?'One last discovery':'A day to explore',
  items:(i===0?[library[0],ideas[0]]:[ideas[((i-1)*2)%ideas.length],ideas[((i-1)*2+1)%ideas.length]]).map((a,j)=>({key:i+'-'+j+'-'+a[0],template:a[0]}))
 }));
}
function plan(d){
 const custom=state.plans[planKey()];
 return Array.isArray(custom)&&custom.length===state.days&&custom.every(day=>Array.isArray(day.items))?structuredClone(custom):makePlan(d);
}
function persist(p){state.plans[planKey()]=p;toStore('wanderly-plans-v1',state.plans);}
function dayHTML(day,index,total){
 const records=planActivityRecords([day],state.activities);
 return '<article class="day"><div class="day-header"><span class="day-number">DAY '+(index+1)+'</span><input class="day-label" aria-label="Day '+(index+1)+' title" data-day-label="'+index+'" maxlength="120" value="'+escapeHTML(day.label)+'"></div>'+activityCostsHTML(records,{compact:true})+
 day.items.map((item,j)=>{
  const activity=state.activities.find(a=>a.id===item.activityId);
  const template=library.find(x=>x[0]===item.template);
  const unavailable=!!item.activityId&&!activity;
  const heading=activity?.name||template?.[1]||(unavailable?'Previously saved activity':'Saved idea');
  const description=activity?.description||template?.[2]||'This saved item is preserved, but its catalogue record is unavailable.';
  return '<div class="activity has-evidence"><div>'+(activity?activityPhotoHTML(activity):'')+'<div class="activity-title">'+escapeHTML(heading)+'</div><div class="activity-caption">'+escapeHTML(description)+'</div>'+
   (activity?activityEvidenceHTML(activity)+activityPriceHTML(activity):'<p class="small-note">'+(unavailable?'Activity record unavailable':'Personal planning idea · attraction not researched')+' · Price unavailable</p>')+
   '<div class="move-activity"><label for="move-'+index+'-'+j+'">Move to day</label><select id="move-'+index+'-'+j+'">'+Array.from({length:total},(_,i)=>'<option value="'+i+'" '+(i===index?'selected':'')+'>Day '+(i+1)+'</option>').join('')+'</select><button class="outline" data-action="move" data-day="'+index+'" data-index="'+j+'">Move</button></div></div>'+
   '<div class="activity-actions">'+
   '<button class="iconbtn" aria-label="Move '+escapeHTML(heading)+' up" title="Move up" data-action="up" data-day="'+index+'" data-index="'+j+'" '+(j===0?'disabled':'')+'>↑</button>'+
   '<button class="iconbtn" aria-label="Move '+escapeHTML(heading)+' down" title="Move down" data-action="down" data-day="'+index+'" data-index="'+j+'" '+(j===day.items.length-1?'disabled':'')+'>↓</button>'+
   '<button class="iconbtn" aria-label="Move '+escapeHTML(heading)+' to next day" title="Move to next day" data-action="next" data-day="'+index+'" data-index="'+j+'" '+(index===total-1?'disabled':'')+'>→</button>'+
   '<button class="iconbtn" aria-label="Remove '+escapeHTML(heading)+'" title="Remove" data-action="remove" data-day="'+index+'" data-index="'+j+'">×</button></div></div>';
 }).join('')+
 '<div class="add-menu"><label class="filter-label" for="add-'+index+'">Add a personal planning idea</label><select id="add-'+index+'">'+library.map(x=>'<option value="'+x[0]+'">'+escapeHTML(x[1])+'</option>').join('')+'</select><button class="outline" data-action="add" data-day="'+index+'">+ Add idea</button></div></article>';
}
function detail(){
 const d=state.all.find(x=>x.id===state.detail);
 if(!d){goExplore();return;}
 const current=plan(d);
 root.innerHTML='<button class="back-btn" data-action="back">← Back to '+(state.previous==='saved'?'saved trips':'discover')+'</button>'+
 '<section class="detail-hero" data-photo-hero="'+escapeHTML(d.id)+'"><div class="hero-photo-fallback">Finding destination images…</div><div class="detail-hero-content"><div class="eyebrow">WANDERLY · A DESTINATION TO DREAM ABOUT</div><h1>'+escapeHTML(d.name)+'</h1><p>'+escapeHTML(d.summary)+'</p><div class="tags">'+pills(d)+'</div></div></section>'+
 '<div class="detail-toolbar"><div class="result-meta"><span class="tag">'+escapeHTML(d.country)+'</span><span class="tag">'+state.days+' day inspiration</span><label class="mini-count" for="tripDuration">Trip length</label><select class="trip-duration" id="tripDuration">'+[5,7,10].map(n=>'<option value="'+n+'" '+(state.days===n?'selected':'')+'>'+n+' days</option>').join('')+'</select></div><div class="result-meta"><button class="outline" data-action="save" data-id="'+escapeHTML(d.id)+'">'+(state.saved.has(d.id)?'♥ Saved':'♡ Save')+'</button><button class="outline" data-action="reset">↺ Reset outline</button></div></div>'+
 '<section class="detail-content"><div><div class="panel"><h2>Make this trip yours</h2><p>Shape your days with researched experiences and your own planning ideas. Reorder activities, move them to any day and edit each day’s title.</p><div class="demo-banner">Activities carry their own source and review status. Routes, transfers and availability are not planned or guaranteed. Your saved edits stay separate from catalogue reviews.</div></div>'+
 ''+(state.activitiesError?'<p class="notice">'+escapeHTML(state.activitiesError)+'</p>':'')+recommendedActivitiesHTML(state.activities,d.id,currentSearch(),state.days)+activityCostsHTML(planActivityRecords(current,state.activities))+'<div class="planner-heading"><h2>Your '+state.days+'-day idea board</h2><span class="small-note">↑↓ Reorder activities</span></div>'+current.map((x,i)=>dayHTML(x,i,current.length)).join('')+
 '<p class="save-line">Edits are saved only to this browser when storage is available</p></div>'+
 '<aside class="side-stack"><div class="panel"><h2>Trip moodboard</h2><div class="detail-mosaic">'+moodboard(d)+'</div><p style="font-size:12px">Illustrative photos. These are not yet checked against the actual destination.</p></div>'+
 '<div class="panel"><h2>What draws you here?</h2><div class="tags">'+pills(d)+'</div><p style="font-size:12px">Editorial impressions from the unverified destination catalogue.</p></div>'+
 '<div class="panel"><h2>Coming later</h2><div class="info-grid"><div class="info-item"><strong>Season</strong><span>Not verified</span></div><div class="info-item"><strong>Budget</strong><span>Not researched</span></div><div class="info-item"><strong>Flights</strong><span>Not connected</span></div><div class="info-item"><strong>Hotels</strong><span>Not connected</span></div></div></div></aside></section>';
}
function render(){
 nav();
 if(state.detail)detail();
 else if(state.view==='saved')savedPage();
 else discover();
}
function goExplore(){state.detail=null;state.view='explore';history.pushState({},'',location.pathname);render();window.scrollTo(0,0);}
function goSaved(){state.detail=null;state.view='saved';history.pushState({},'',location.pathname+'?view=saved');render();window.scrollTo(0,0);}
function open(id){
 if(!state.all.find(d=>d.id===id))return;
 state.previous=state.view;state.detail=id;
 history.pushState({},'',location.pathname+'?destination='+encodeURIComponent(id));
 render();window.scrollTo(0,0);
}
function edit(action,dayIndex,itemIndex){
 const destination=state.all.find(x=>x.id===state.detail);if(!destination)return;
 const current=plan(destination);
 let item;
 if(action==='add'){
  const template=document.querySelector('#add-'+dayIndex)?.value;
  if(!library.some(x=>x[0]===template))return;
  item={key:'added-'+Date.now()+'-'+Math.random().toString(36).slice(2),template};
 }
 const targetDay=Number(document.querySelector('#move-'+dayIndex+'-'+itemIndex)?.value);
 const next=editPlan(current,{action,dayIndex,itemIndex,targetDay,item});
 if(next===current)return;
 persist(next);const y=scrollY;detail();scrollTo(0,y);
}
async function refreshActivities(){
 try{
  const response=await fetch('/api/activities');
  if(!response.ok)throw Error('Activity research could not be loaded. Saved edits are preserved.');
  const payload=await response.json();
  if(!Array.isArray(payload.items))throw Error('Activity research is unavailable.');
  state.activities=payload.items;state.activitiesError='';
 }catch(error){state.activitiesError=error.message;}
}
window.addEventListener('wanderly:activities-updated',async()=>{
 await refreshActivities();if(state.detail){const y=scrollY;detail();scrollTo(0,y);}
});
document.addEventListener('change',event=>{
 if(event.target?.id==='tripDuration'){
  const days=Number(event.target.value);if(![5,7,10].includes(days))return;
  state.days=days;detail();return;
 }
 const day=event.target?.dataset?.dayLabel;
 if(day===undefined||!state.detail)return;
 const destination=state.all.find(x=>x.id===state.detail);if(!destination)return;
 const current=plan(destination),index=Number(day);
 if(!current[index])return;
 current[index].label=event.target.value.trim().slice(0,120)||'A day to explore';persist(current);
});
document.addEventListener('change',event=>{
 const key=event.target?.dataset?.pref;
 if(!['foodPriority','journey','mood','beachPriority'].includes(key))return;
 const openPanel=event.target.closest('details')?.open;
 state[key]=event.target.value;refreshContext();
 if(openPanel){const panel=document.querySelector('#refinementPanel');if(panel)panel.open=true;}
 const control=document.querySelector('[data-pref="'+key+'"]');control?.focus({preventScroll:true});
});
document.addEventListener('toggle',event=>{
 const panel=event.target;
 if(panel.id==='refinementPanel'&&panel.isConnected)state.refinementOpen.set(panel.dataset.refinementQuery,panel.open);
},true);
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-action]');if(!target)return;
 const action=target.dataset.action;
 if(action==='add-recommended'){
  const destination=state.all.find(x=>x.id===state.detail);if(!destination)return;
  const id=target.dataset.activityId;
  if(!recommendActivities(state.activities,destination.id,{...currentSearch(),days:state.days}).some(a=>a.id===id))return;
  const dayIndex=Number(document.querySelector('#activity-day-'+id)?.value);
  const current=plan(destination);
  const next=editPlan(current,{action:'add',dayIndex,item:{key:'added-'+Date.now()+'-'+Math.random().toString(36).slice(2),activityId:id}});
  if(next===current)return;
  persist(next);const y=scrollY;detail();scrollTo(0,y);notify('Experience added to day '+(dayIndex+1));return;
 }
 if(action==='dismiss-refinement'){state.refinementDismissed.add(state.q.trim().toLowerCase());results();return;}
 if(action==='preset'){state.q=target.dataset.value;document.querySelector('#query').value=state.q;clearAi();results();return;}
 if(action==='toggle'){
  const set=state[target.dataset.kind];const value=target.dataset.value;
  set.has(value)?set.delete(value):set.add(value);
  target.classList.toggle('active',set.has(value));
  target.setAttribute('aria-pressed',String(set.has(value)));clearAi();results();return;
 }
 if(action==='duration'){state.days=Number(target.dataset.value);document.querySelectorAll('[data-action="duration"]').forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.value)===state.days));notify('Trip preview set to '+state.days+' days');return;}
 if(action==='open'){open(target.dataset.id);return;}
 if(action==='save'){
  const id=target.dataset.id;
  state.saved.has(id)?state.saved.delete(id):state.saved.add(id);
  toStore('wanderly-saved-v1',[...state.saved]);
  render();notify(state.saved.has(id)?'Saved to your escapes':'Removed from saved');
  return;
 }
 if(action==='back'){state.previous==='saved'?goSaved():goExplore();return;}
 if(action==='explore'){goExplore();return;}
 if(action==='show-more'){state.visibleLimit+=24;results();return;}
 if(action==='clear'){state.q='';state.region='all';state.scenery.clear();state.vibe.clear();clearAi();discover();return;}
 if(action==='video'){notify('Real activity videos will be added later.');return;}
 if(action==='reset'){
  if(confirm('Discard your edits and reset the example itinerary?')){delete state.plans[planKey()];toStore('wanderly-plans-v1',state.plans);detail();notify('Idea board reset.');}
  return;
 }
 if(['up','down','next','move','remove','add'].includes(action)){edit(action,Number(target.dataset.day),Number(target.dataset.index));}
});
document.querySelector('#brand').addEventListener('click',event=>{event.preventDefault();goExplore();});
document.querySelector('#navExplore').addEventListener('click',goExplore);
document.querySelector('#navSaved').addEventListener('click',goSaved);
window.addEventListener('popstate',()=>{
 const params=new URLSearchParams(location.search);const id=params.get('destination');
 state.detail=state.all.some(d=>d.id===id)?id:null;
 state.view=params.get('view')==='saved'?'saved':'explore';
 render();
});
async function start(){
 try{
  const response=await fetch('/data/destinations.json');
  if(!response.ok)throw new Error('Could not load catalogue');
  const data=await response.json();
  if(!Array.isArray(data))throw new Error('Unexpected data format');
  state.all=data;
  await refreshActivities();
  const params=new URLSearchParams(location.search),id=params.get('destination');
  if(id&&data.some(d=>d.id===id))state.detail=id;
  if(params.get('view')==='saved')state.view='saved';
  render();
 }catch(err){
  console.error(err);
  root.innerHTML='<div class="empty"><h3>Catalogue could not be loaded</h3><p>Run <code>npm run dev</code> then open http://localhost:3000.</p><button id="retry" class="outline">Retry</button></div>';
  document.querySelector('#retry').addEventListener('click',start);
 }
}
start();
