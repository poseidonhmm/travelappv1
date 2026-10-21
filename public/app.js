import {examples,matchDestinations,queryHasWeather} from './recommend.js';

const root=document.querySelector('#app');
const toast=document.querySelector('#toast');
const state={all:[],view:'explore',previous:'explore',detail:null,q:'',region:'all',days:7,scenery:new Set(),vibe:new Set(),saved:new Set(),plans:{}};
const choices={scenery:[['beach','Beach'],['coast','Coastal'],['jungle','Jungle'],['mountains','Mountains'],['city','Cities'],['island','Islands']],vibe:[['relaxed','Relaxed'],['sociable','Sociable'],['romantic','Romantic'],['adventurous','Adventure'],['food-led','Foodie'],['nightlife','Nightlife'],['luxury','Luxury']]};
const regions=['Europe','Asia','Africa','North America','South America','Oceania','Middle East'];
function fromStore(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function toStore(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{notify('Browser storage is unavailable. Your edits may not persist.');}}
state.saved=new Set(Array.isArray(fromStore('wanderly-saved-v1',[]))?fromStore('wanderly-saved-v1',[]):[]);
const savedPlans=fromStore('wanderly-plans-v1',{});
state.plans=(savedPlans&&typeof savedPlans==='object'&&!Array.isArray(savedPlans))?savedPlans:{};
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const title=s=>String(s).split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ');
const photos={
 beach:['photo-1507525428034-b723cf961d3e','photo-1510414842594-a61c69b5ae57','photo-1502920917128-1aa500764cbd','photo-1533105079780-92b9be482077'],
 coast:['photo-1507525428034-b723cf961d3e','photo-1510414842594-a61c69b5ae57','photo-1527004013197-933c4bb611b3','photo-1502920917128-1aa500764cbd'],
 mountains:['photo-1464822759023-fed622ff2c3b','photo-1470770841072-f978cf4d019e','photo-1501785888041-af3ef285b470','photo-1493246507139-91e8fad9978e'],
 jungle:['photo-1441974231531-c6227db76b6e','photo-1469474968028-56623f02e42e','photo-1511497584788-876760111969','photo-1500534623283-312aade485b7'],
 city:['photo-1519501025264-65ba15a82390','photo-1480796927426-f609979314bd','photo-1523906834658-6e24ef2386f9','photo-1500534623283-312aade485b7'],
 island:['photo-1537996194471-e657df975ab4','photo-1518548419970-58e3b4079ab2','photo-1533105079780-92b9be482077','photo-1507525428034-b723cf961d3e'],
 desert:['photo-1509316785289-025f5b846b35','photo-1473580044384-7ba9967e16a0','photo-1500534623283-312aade485b7','photo-1447752875215-b2761acb3c5'],
 default:['photo-1500534623283-312aade485b7','photo-1441974231531-c6227db76b6e','photo-1464822759023-fed622ff2c3b','photo-1507525428034-b723cf961d3e']
};
function img(id,width=620){return 'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w='+width+'&q=75';}
function imagesFor(d){
 const tags=d.tags.scenery;
 const type=['island','mountains','jungle','desert','beach','coast','city'].find(x=>tags.includes(x))||'default';
 const n=[...d.id].reduce((a,c)=>a+c.charCodeAt(0),0);
 const set=photos[type];
 return [set[n%4],set[(n+1)%4],photos[tags.includes('city')?'city':'default'][(n+2)%4],set[(n+3)%4]];
}
function moodboard(d){return '<div class="mosaic">'+imagesFor(d).map((id,i)=>'<img loading="lazy" src="'+img(id)+'" alt="Illustrative travel mood photo '+(i+1)+' for '+escapeHTML(d.name)+'" onerror="this.style.opacity=.1">').join('')+'</div>';}
function pills(d){return [...new Set([...d.tags.vibe.slice(0,2),...d.tags.scenery.slice(0,2)])].map(x=>'<span class="tag">'+escapeHTML(title(x))+'</span>').join('');}
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('show'),2800);}
function nav(){
 document.querySelector('#navExplore').classList.toggle('active',state.view==='explore');
 document.querySelector('#navSaved').classList.toggle('active',state.view==='saved');
 document.querySelector('#savedCount').textContent=state.saved.size;
}
function card(d){
 const saved=state.saved.has(d.id);
 return '<article class="trip-card">'+moodboard(d)+'<div class="card-body"><span class="card-country">'+escapeHTML(d.country)+' · '+escapeHTML(d.macroRegion)+'</span><div class="card-title-row"><h3 class="card-title">'+escapeHTML(d.name)+'</h3><button class="heart '+(saved?'saved':'')+'" data-action="save" data-id="'+escapeHTML(d.id)+'" aria-label="'+(saved?'Unsave ':'Save ')+escapeHTML(d.name)+'">'+(saved?'♥':'♡')+'</button></div><p class="card-desc">'+escapeHTML(d.summary)+'</p><div class="tags">'+pills(d)+'</div><div class="card-bottom"><span class="small-note">✦ Draft travel inspiration</span><button class="card-open" data-action="open" data-id="'+escapeHTML(d.id)+'">Explore trip →</button></div></div></article>';
}
function tagButtons(kind){
 return choices[kind].map(([value,label])=>'<button type="button" class="chip '+(state[kind].has(value)?'active':'')+'" aria-pressed="'+state[kind].has(value)+'" data-action="toggle" data-kind="'+kind+'" data-value="'+value+'">'+label+'</button>').join('');
}
function discover(){
 root.innerHTML='<section class="hero"><div class="hero-content"><div class="eyebrow">A WORLD OF POSSIBILITIES</div><h1>Go somewhere<br><em>that feels like you.</em></h1><p>Don’t know where to go? Describe the feeling you’re chasing. We’ll find places that match.</p></div></section>'+
 '<section class="search-card"><form id="searchForm" class="search-row"><label class="search-field"><span>⌕</span><input id="query" type="search" autocomplete="off" aria-label="Describe your dream holiday" placeholder="Try: amazing food, beaches, a bit of nightlife" value="'+escapeHTML(state.q)+'"></label><button class="primary" type="submit">Find my escape ↗</button></form>'+
 '<div class="hint-row"><span class="hint-label">Try searching:</span>'+examples.map(x=>'<button class="chip" data-action="preset" data-value="'+escapeHTML(x)+'">'+escapeHTML(x)+'</button>').join('')+'</div>'+
 '<div class="filter-panel"><div><label class="filter-label" for="region">Part of the world</label><select class="field-select" id="region"><option value="all">Anywhere</option>'+regions.map(r=>'<option value="'+r+'" '+(state.region===r?'selected':'')+'>'+r+'</option>').join('')+'</select></div>'+
 '<div><span class="filter-label">Dream trip duration</span><div class="segmented">'+[5,7,10].map(n=>'<button type="button" class="toggle '+(state.days===n?'active':'')+'" data-action="duration" data-value="'+n+'">'+n+' days</button>').join('')+'</div></div>'+
 '<div><span class="filter-label">Budget & season</span><button type="button" class="field-select" disabled>Coming soon</button><p class="disabled-note">Waiting for researched data</p></div></div>'+
 '<div style="margin-top:18px"><span class="filter-label">Landscape & scenery</span><div class="hint-row">'+tagButtons('scenery')+'</div></div>'+
 '<div style="margin-top:16px"><span class="filter-label">The vibe</span><div class="hint-row">'+tagButtons('vibe')+'</div></div></section>'+
 '<section class="main-section" id="resultsSection"><div id="results"></div></section>';
 document.querySelector('#searchForm').addEventListener('submit',event=>{event.preventDefault();state.q=document.querySelector('#query').value;results();document.querySelector('#resultsSection').scrollIntoView({behavior:'smooth'});});
 document.querySelector('#query').addEventListener('input',event=>{state.q=event.target.value;results();});
 document.querySelector('#region').addEventListener('change',event=>{state.region=event.target.value;results();});
 results();
}
function results(){
 const found=matchDestinations(state.all,{query:state.q,region:state.region,scenery:[...state.scenery],vibes:[...state.vibe],limit:88});
 const area=document.querySelector('#results');if(!area)return;
 area.innerHTML='<div class="section-heading"><div><span class="eyebrow" style="color:var(--accent)">FIND YOUR KIND OF SOMEWHERE</span><h2>'+((state.q||state.scenery.size||state.vibe.size)?'Matching escapes':'Explore everywhere')+'</h2><p>Feel inspired by destinations chosen for their atmosphere and experiences.</p></div><span class="count">'+found.length+' of '+state.all.length+' draft destinations</span></div>'+
 (found.length?'<div class="results">'+found.map(card).join('')+'</div>':'<div class="empty"><h3>No matching destinations yet</h3><p>Try different words or fewer filters.</p><button class="outline" data-action="clear">Clear filters</button></div>')+
 (queryHasWeather(state.q)?'<div class="notice">☀ Weather and seasons are not connected yet. Results cannot guarantee sunshine or good conditions for your dates.</div>':'')+
 '<div class="notice">✧ Private prototype: profiles are editorial drafts, photos are illustrative, and results use an initial keyword/tag matcher rather than an AI search engine.</div>';
}
function savedPage(){
 const matches=matchDestinations(state.all,{savedIds:state.saved,limit:88});
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
 return '<article class="day"><div class="day-header"><span class="day-number">DAY '+(index+1)+'</span><h3>'+escapeHTML(day.label)+'</h3></div>'+
 day.items.map((item,j)=>{
  const t=library.find(x=>x[0]===item.template)||library[1];
  return '<div class="activity"><button class="activity-thumb" data-action="video" aria-label="Preview video placeholder for '+escapeHTML(t[1])+'"><img loading="lazy" src="'+img((photos[t[3]]||photos.default)[1],320)+'" alt="Illustrative activity thumbnail"></button><div><div class="activity-title">'+escapeHTML(t[1])+'</div><div class="activity-caption">'+escapeHTML(t[2])+'</div></div>'+
  '<div class="activity-actions">'+
  '<button class="iconbtn" title="Move up" data-action="up" data-day="'+index+'" data-index="'+j+'" '+(j===0?'disabled':'')+'>↑</button>'+
  '<button class="iconbtn" title="Move down" data-action="down" data-day="'+index+'" data-index="'+j+'" '+(j===day.items.length-1?'disabled':'')+'>↓</button>'+
  '<button class="iconbtn" title="Move to next day" data-action="next" data-day="'+index+'" data-index="'+j+'" '+(index===total-1?'disabled':'')+'>→</button>'+
  '<button class="iconbtn" title="Remove" data-action="remove" data-day="'+index+'" data-index="'+j+'">×</button></div></div>';
 }).join('')+
 '<div class="add-menu"><label class="filter-label" for="add-'+index+'">Add an idea to this day</label><select id="add-'+index+'">'+library.map(x=>'<option value="'+x[0]+'">'+escapeHTML(x[1])+'</option>').join('')+'</select><button class="outline" data-action="add" data-day="'+index+'">+ Add activity</button></div></article>';
}
function detail(){
 const d=state.all.find(x=>x.id===state.detail);
 if(!d){goExplore();return;}
 const current=plan(d);
 root.innerHTML='<button class="back-btn" data-action="back">← Back to '+(state.previous==='saved'?'saved trips':'discover')+'</button>'+
 '<section class="detail-hero"><img src="'+img(imagesFor(d)[0],1500)+'" alt="Illustrative destination mood image"><div class="detail-hero-content"><div class="eyebrow">WANDERLY · A DESTINATION TO DREAM ABOUT</div><h1>'+escapeHTML(d.name)+'</h1><p>'+escapeHTML(d.summary)+'</p><div class="tags">'+pills(d)+'</div></div></section>'+
 '<div class="detail-toolbar"><div class="result-meta"><span class="tag">'+escapeHTML(d.country)+'</span><span class="tag">'+state.days+' day inspiration</span><span class="mini-count">Edit the outline as you like</span></div><div class="result-meta"><button class="outline" data-action="save" data-id="'+escapeHTML(d.id)+'">'+(state.saved.has(d.id)?'♥ Saved':'♡ Save')+'</button><button class="outline" data-action="reset">↺ Reset outline</button></div></div>'+
 '<section class="detail-content"><div><div class="panel"><h2>Make this trip yours</h2><p>This is your starting point: a flexible idea board, not a real researched route. Reorder activities, move them between days and add new experiences.</p><div class="demo-banner">⚑ Locations, transfer times and attractions are not verified. Thumbnail play icons are placeholders until videos are connected.</div></div>'+
 '<div class="planner-heading"><h2>Your '+state.days+'-day idea board</h2><span class="small-note">↑↓ Reorder activities</span></div>'+current.map((x,i)=>dayHTML(x,i,current.length)).join('')+
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
 const d=state.all.find(x=>x.id===state.detail);if(!d)return;
 const days=plan(d);
 if(!Number.isInteger(dayIndex)||dayIndex<0||dayIndex>=days.length)return;
 const list=days[dayIndex].items;
 if(action==='add'){
  const id=document.querySelector('#add-'+dayIndex)?.value;
  if(!library.some(x=>x[0]===id))return;
  list.push({key:'added-'+Date.now()+'-'+Math.random().toString(36).slice(2),template:id});
 }else{
  if(!Number.isInteger(itemIndex)||itemIndex<0||itemIndex>=list.length)return;
  if(action==='remove')list.splice(itemIndex,1);
  else if(action==='up'&&itemIndex>0)[list[itemIndex-1],list[itemIndex]]=[list[itemIndex],list[itemIndex-1]];
  else if(action==='down'&&itemIndex<list.length-1)[list[itemIndex+1],list[itemIndex]]=[list[itemIndex],list[itemIndex+1]];
  else if(action==='next'&&dayIndex+1<days.length){days[dayIndex+1].items.unshift(...list.splice(itemIndex,1));}
  else return;
 }
 persist(days);
 const y=scrollY;detail();scrollTo(0,y);
}
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-action]');if(!target)return;
 const action=target.dataset.action;
 if(action==='preset'){state.q=target.dataset.value;document.querySelector('#query').value=state.q;results();return;}
 if(action==='toggle'){
  const set=state[target.dataset.kind];const value=target.dataset.value;
  set.has(value)?set.delete(value):set.add(value);
  target.classList.toggle('active',set.has(value));
  target.setAttribute('aria-pressed',String(set.has(value)));results();return;
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
 if(action==='clear'){state.q='';state.region='all';state.scenery.clear();state.vibe.clear();discover();return;}
 if(action==='video'){notify('Real activity videos will be added later.');return;}
 if(action==='reset'){
  if(confirm('Discard your edits and reset the example itinerary?')){delete state.plans[planKey()];toStore('wanderly-plans-v1',state.plans);detail();notify('Idea board reset.');}
  return;
 }
 if(['up','down','next','remove','add'].includes(action)){edit(action,Number(target.dataset.day),Number(target.dataset.index));}
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
