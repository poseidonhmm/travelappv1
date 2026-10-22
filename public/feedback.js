import {normalize} from './recommend.js';

// Local-only editorial feedback. No OpenAI request is made to save or review ratings.
const state={items:[],dialog:null};
const reasons=[
 ['wrong-vibe','Wrong atmosphere'],
 ['not-relevant','Not relevant to the request'],
 ['wrong-trip-type','Wrong type of trip'],
 ['too-touristy','Too touristy'],
 ['inaccurate-data','Destination description seems wrong'],
 ['other','Something else']
];
function element(tag,className,text){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
function snapshot(id,rank){
 const query=document.querySelector('#query')?.value.trim()||'';
 const region=document.querySelector('#region')?.value||'all';
 const selected=(kind)=>[...document.querySelectorAll('[data-action="toggle"][data-kind="'+kind+'"].active')].map(x=>x.dataset.value);
 const mode=document.querySelector('#results .search-mode')?.textContent||'';
 const engine=mode.includes('AI semantic matching')?'ai':mode.includes('Tag-search fallback')?'keyword':'preview';
 const interpretation=document.querySelector('#results .ai-interpretation')?.textContent?.replace(/^We understood:\s*/,'')||'';
 let prefs={};
 try{prefs=JSON.parse(localStorage.getItem('wanderly-search-prefs-v1'))||{};}catch{}
 const preference=(key,fallback)=>document.querySelector('[data-pref="'+key+'"]')?.value||prefs[key]||fallback;
 const homeRegion=document.querySelector('#homeRegion')?.value||prefs.homeRegion||'all';
 const homeCountry=document.querySelector('#homeCountry')?.value||prefs.homeCountry||'';
 const travelMonth=document.querySelector('#travelMonth')?.value||prefs.travelMonth||'';
 const foodPriority=preference('foodPriority','any');
 const journey=preference('journey','any');
 const mood=preference('mood','any');
 return {query,region,scenery:selected('scenery'),vibes:selected('vibe'),engine,destinationId:id,rank,
  interpretation:interpretation.slice(0,300),homeRegion,homeCountry,travelMonth,foodPriority,journey,mood};
}
function recordKey(r){
 return JSON.stringify([
  normalize(r.query),r.region,[...(r.scenery||[])].sort(),[...(r.vibes||[])].sort(),r.engine,r.destinationId,
  r.homeRegion||'all',normalize(r.homeCountry||''),r.travelMonth||'',
  r.foodPriority||'any',r.journey||'any',r.mood||'any'
 ]);
}
function existing(context){return state.items.find(x=>recordKey(x)===recordKey(context));}
function flash(message,card){
 const area=card.querySelector('.feedback-message');
 if(area){area.textContent=message;area.hidden=false;}
}
async function persist(context,rating,reason,note,card){
 const buttons=card.querySelectorAll('.feedback-choice,.feedback-save');
 buttons.forEach(b=>b.disabled=true);
 try{
  const response=await fetch('/api/feedback',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({...context,rating,reason,note})
  });
  const data=await response.json();
  if(!response.ok||!data.saved)throw new Error(data.error||'Could not save feedback.');
  const key=recordKey(data.item);
  state.items=state.items.filter(x=>recordKey(x)!==key);
  state.items.push(data.item);
  refreshCard(card);
  updateCount();
 }catch(err){
  buttons.forEach(b=>b.disabled=false);
  flash(err.message||'Could not save your feedback.',card);
 }
}
function buildControls(card){
 const open=card.querySelector('[data-action="open"]');
 if(!open||!open.dataset.id)return;
 const body=card.querySelector('.card-body');
 const bottom=card.querySelector('.card-bottom');
 if(!body||!bottom)return;
 card.dataset.feedbackAdded='true';
 const section=element('section','feedback-widget');
 section.setAttribute('aria-label','Rate this travel recommendation');
 const headline=element('div','feedback-widget-head','Does this destination fit your search?');
 const row=element('div','feedback-widget-actions');
 const yes=element('button','feedback-choice', '👍 Good match');
 const no=element('button','feedback-choice', '👎 Not right');
 yes.type='button';no.type='button';
 yes.dataset.rate='good';no.dataset.rate='bad';
 row.append(yes,no);
 const status=element('div','feedback-status');
 status.setAttribute('aria-live','polite');
 const form=element('div','feedback-detail');
 form.hidden=true;
 const label=element('label',null,'Why does it not fit?');
 const select=element('select','feedback-reason');
 reasons.forEach(([value,labelText])=>{
  const option=element('option',null,labelText);
  option.value=value;select.append(option);
 });
 const noteLabel=element('label',null,'Extra explanation (optional)');
 const textarea=element('textarea','feedback-note');
 textarea.placeholder='e.g. This feels more adventurous than conventionally romantic.';
 textarea.maxLength=600;textarea.rows=3;
 const save=element('button','feedback-save','Save feedback');
 save.type='button';
 const cancel=element('button','feedback-cancel','Cancel');
 cancel.type='button';
 const actions=element('div','feedback-form-actions');
 actions.append(save,cancel);
 form.append(label,select,noteLabel,textarea,actions);
 const message=element('div','feedback-message');
 message.hidden=true;
 const foot=element('div','feedback-widget-foot','Saved on your Mac · No extra AI cost');
 section.append(headline,row,status,form,message,foot);
 body.insertBefore(section,bottom);
 const getContext=()=>snapshot(open.dataset.id,[...document.querySelectorAll('#results .trip-card')].indexOf(card)+1);
 yes.addEventListener('click',()=>{
  form.hidden=true;
  persist(getContext(),'good','great-match','',card);
 });
 no.addEventListener('click',()=>{
  const prev=existing(getContext());
  select.value=prev?.rating==='bad'&&reasons.some(x=>x[0]===prev.reason)?prev.reason:'wrong-vibe';
  textarea.value=prev?.rating==='bad'?prev.note||'':'';
  form.hidden=!form.hidden;
  if(!form.hidden)textarea.focus();
 });
 save.addEventListener('click',()=>{
  persist(getContext(),'bad',select.value,textarea.value.trim(),card);
 });
 cancel.addEventListener('click',()=>{form.hidden=true;});
 refreshCard(card);
}
function refreshCard(card){
 const open=card.querySelector('[data-action="open"]');
 if(!open)return;
 const context=snapshot(open.dataset.id,[...document.querySelectorAll('#results .trip-card')].indexOf(card)+1);
 const item=existing(context);
 const yes=card.querySelector('[data-rate="good"]');
 const no=card.querySelector('[data-rate="bad"]');
 if(!yes||!no)return;
 yes.disabled=false;no.disabled=false;
 yes.classList.toggle('is-selected',item?.rating==='good');
 no.classList.toggle('is-selected',item?.rating==='bad');
 yes.setAttribute('aria-pressed',String(item?.rating==='good'));
 no.setAttribute('aria-pressed',String(item?.rating==='bad'));
 const status=card.querySelector('.feedback-status');
 if(status)status.textContent=item?(item.rating==='good'?'✓ Rated helpful':'✓ Rated not relevant'):'';
 const form=card.querySelector('.feedback-detail');
 if(form)form.hidden=true;
 const message=card.querySelector('.feedback-message');
 if(message)message.hidden=true;
}
function updateCount(){
 const count=document.querySelector('#feedbackCounter');
 if(count)count.textContent=state.items.length;
}
function drawReview(){
 const dialog=state.dialog;
 if(!dialog)return;
 dialog.replaceChildren();
 const top=element('div','feedback-review-head');
 const heading=element('h2',null,'Search feedback');
 const close=element('button','feedback-close','×');
 close.type='button';close.setAttribute('aria-label','Close feedback panel');
 close.addEventListener('click',()=>dialog.close());
 top.append(heading,close);
 const intro=element('p',null,'Your ratings are saved locally in this project. They do not automatically train the AI, but give us examples for improving the recommendations.');
 const count=element('div','feedback-review-count');
 const good=state.items.filter(x=>x.rating==='good').length;
 count.textContent=state.items.length+' ratings · '+good+' good · '+(state.items.length-good)+' need improvement';
 const exportBtn=element('button','feedback-export','↓ Export feedback as JSON');
 exportBtn.type='button';exportBtn.disabled=!state.items.length;
 exportBtn.addEventListener('click',()=>{
  const payload={version:1,exportedAt:new Date().toISOString(),items:state.items};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='wanderly-feedback.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 const list=element('div','feedback-review-list');
 const names=new Map([...document.querySelectorAll('.trip-card')].map(c=>[c.querySelector('[data-action="open"]')?.dataset.id,c.querySelector('.card-title')?.textContent]));
 if(!state.items.length){
  list.append(element('p',null,'No feedback yet. Search for a destination and rate its relevance.'));
 }else{
  [...state.items].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).forEach(f=>{
   const item=element('article','feedback-review-item');
   const title=element('strong',null,(names.get(f.destinationId)||f.destinationId)+' · '+(f.rating==='good'?'Good match':'Not right'));
   const query=element('p',null,'Search: '+(f.query||'(filters only)')+' · '+f.engine);
   item.append(title,query);
   if(f.reason&&f.rating==='bad')item.append(element('p',null,'Reason: '+f.reason.replaceAll('-',' ')));
   if(f.note)item.append(element('p',null,'Note: '+f.note));
   list.append(item);
  });
 }
 dialog.append(top,intro,count,exportBtn,list);
}
function addReviewNavigation(){
 const nav=document.querySelector('.top-nav');
 if(!nav||document.querySelector('#feedbackNav'))return;
 const button=element('button','nav-link','Feedback ');
 button.id='feedbackNav';button.type='button';
 const count=element('span','saved-counter','0');count.id='feedbackCounter';
 button.append(count);
 button.addEventListener('click',()=>{drawReview();state.dialog.showModal();});
 nav.append(button);
 const dialog=element('dialog','feedback-review-dialog');
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 document.body.append(dialog);state.dialog=dialog;
 updateCount();
}
let queued=false;
function scan(){
 if(queued)return;
 queued=true;
 queueMicrotask(()=>{
  queued=false;
  if(!document.querySelector('#searchForm'))return;
  document.querySelectorAll('#results .trip-card:not([data-feedback-added])').forEach(buildControls);
 });
}
async function init(){
 addReviewNavigation();
 try{
  const response=await fetch('/api/feedback');
  if(response.ok){
   const body=await response.json();
   state.items=Array.isArray(body.items)?body.items:[];
  }
 }catch(error){console.warn('Feedback history could not be loaded.',error);}
 updateCount();scan();
 const app=document.querySelector('#app');
 if(app)new MutationObserver(scan).observe(app,{childList:true,subtree:true});
}
init();
