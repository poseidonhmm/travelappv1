import { REVIEW_STATUSES,activityFlags,priceUsability,formatActivityPrice,safeSourceUrl } from './activities.js';

import {activityPhotoHTML} from './activity-photos.js';

const state={items:[],selectedId:'',dialog:null,filter:'all',loading:false};
const labels={'draft':'Draft','needs-research':'Needs research','ready-for-review':'Ready for review','approved':'Approved','rejected':'Rejected','needs-rechecking':'Needs rechecking'};
const flagLabels={'safety-considerations':'Safety guidance to inspect','permit-considerations':'Permit requirements to inspect','eligibility-considerations':'Eligibility and accessibility guidance to inspect','missing-evidence':'Missing activity sources','indirect-evidence':'Indirect activity evidence','outdated-source-evidence':'One or more source checks are outdated','price-source-mismatch':'Price metadata does not match a dated catalogue source','outdated-activity-evidence':'Activity evidence needs rechecking','missing-location-evidence':'Missing or unverified location','unverified-seasonality':'Seasonality needs evidence review','unverified-considerations':'Safety, permit or eligibility evidence needs review','awaiting-human-review':'Awaiting human activity review','missing-price':'Price unavailable','weak-price-evidence':'Incomplete price evidence','invalid-price-range':'Invalid price range','future-price-date':'Future price-check date','unsupported-high-confidence':'High confidence lacks official evidence','low-price-confidence':'Low confidence price needs research','outdated-price':'Price evidence is outdated','conflicting-price':'Conflicting price sources','price-needs-review':'Price needs review'};
function node(tag,className,content){const result=document.createElement(tag);if(className)result.className=className;if(content!==undefined)result.textContent=content;return result;}
function button(label,className='outline'){const result=node('button',className,label);result.type='button';return result;}
function link(url,label){const result=node('a','activity-review-source',label);if(safeSourceUrl(url)){result.href=url;result.target='_blank';result.rel='noopener noreferrer';}return result;}
function field(label,control){const wrap=node('label','activity-review-field');wrap.append(node('span',null,label),control);return wrap;}
function selectStatus(value,label){
 const select=node('select','field-select');select.setAttribute('aria-label',label);
 for(const status of REVIEW_STATUSES){const option=node('option',null,labels[status]);option.value=status;option.disabled=status==='approved'||label==='Activity review state'&&status==='rejected';option.selected=status===value;select.append(option);}
 return select;
}
function announce(message,isError=false){const area=state.dialog.querySelector('.activity-review-message');if(area){area.textContent=message;area.classList.toggle('is-error',isError);}}
async function load(){
 state.loading=true;render();
 try{const response=await fetch('/api/activity-review');const data=await response.json();if(!response.ok||!Array.isArray(data.items))throw Error(data.error||'Activity reviews could not be loaded.');state.items=data.items;if(!state.selectedId&&data.items.length)state.selectedId=data.items[0].id;state.loading=false;render();}
 catch(error){state.loading=false;render();announce(error.message,true);}
}
function render(){
 const dialog=state.dialog;if(!dialog)return;
 dialog.replaceChildren();
 const head=node('div','activity-review-head');const title=node('h2',null,'Activity verification');const close=button('×','activity-review-close');close.setAttribute('aria-label','Close activity verification');close.addEventListener('click',()=>dialog.close());head.append(title,close);
 const intro=node('p','activity-review-intro','Inspect the original sources and check the experience, location and price before approving. A named human reviewer makes the final decision. Reviews are saved locally, separately from travellers’ itineraries.');
 const message=node('p','activity-review-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 dialog.append(head,intro,message);
 if(state.loading){dialog.append(node('p',null,'Loading activity records…'));return;}
 const toolbar=node('div','activity-review-toolbar');const filter=node('select','field-select');filter.setAttribute('aria-label','Filter activities by review status');
 for(const value of ['all',...REVIEW_STATUSES]){const option=node('option',null,value==='all'?'All review states':labels[value]);option.value=value;option.selected=value===state.filter;filter.append(option);}
 filter.addEventListener('change',()=>{state.filter=filter.value;render();});const reload=button('Reload records');reload.addEventListener('click',load);toolbar.append(filter,reload);dialog.append(toolbar);
 if(!state.items.length){dialog.append(node('p',null,'No researched activity records yet. Use the activity batch importer described in docs/ACTIVITY_IMPORT_SPEC.md; nothing is approved automatically.'));return;}
 const layout=node('div','activity-review-layout');const list=node('div','activity-review-list');list.setAttribute('aria-label','Activity records');
 const visible=state.items.filter(item=>state.filter==='all'||item.verification.status===state.filter);
 if(!visible.some(item=>item.id===state.selectedId))state.selectedId=visible[0]?.id||'';
 for(const record of visible){
  const item=button('', 'activity-review-item'+(record.id===state.selectedId?' is-selected':''));item.setAttribute('aria-pressed',String(record.id===state.selectedId));
  item.append(node('strong',null,record.name),node('span',null,record.destinationId+' · '+labels[record.verification.status]),node('small',null,activityFlags(record).length+' review flags'));
  item.addEventListener('click',()=>{state.selectedId=record.id;render();});list.append(item);
 }
 layout.append(list);const record=state.items.find(item=>item.id===state.selectedId);
 if(record)layout.append(editor(record));else layout.append(node('p',null,'No activities match this review state.'));
 dialog.append(layout);
}
function editor(record){
 const pane=node('section','activity-review-editor');pane.append(node('h3',null,record.name));
 const meta=node('p','activity-review-meta',record.destinationId+' · '+record.category+' · revision '+(record.revision||0));pane.append(meta);
 const flags=node('ul','activity-review-flags');for(const flag of activityFlags(record))flags.append(node('li',null,flagLabels[flag]||flag));pane.append(flags);
 const sources=node('div','activity-review-sources');sources.append(node('strong',null,'Evidence to inspect'));
 for(const source of record.sources)sources.append(link(source.url,source.title+' · '+source.type+' · checked '+source.checkedAt));
 if(record.location.sourceUrl)sources.append(link(record.location.sourceUrl,'Location: '+(record.location.label||'needs detail')));
 for(const consideration of record.considerations){sources.append(node('p',null,consideration.type+': '+consideration.text));if(consideration.sourceUrl)sources.append(link(consideration.sourceUrl,'Inspect '+consideration.type+' guidance'));}
 if(record.price){sources.append(node('p',null,formatActivityPrice(record.price)+' · '+priceUsability(record.price).effectiveConfidence+' current confidence (recorded '+record.price.confidence+') · '+labels[record.price.reviewStatus]));if(record.price.sourceUrl)sources.append(link(record.price.sourceUrl,'Price source · checked '+(record.price.checkedAt||'date unavailable')));if(record.price.notes)sources.append(node('p',null,record.price.notes));}
 else sources.append(node('p',null,'Price unavailable. Unknown prices are excluded from itinerary totals.'));
 pane.append(sources);
 let photoConfirmation=null,photoPreview=null;
 if(record.photo){
  photoPreview=node('div','activity-review-photo');photoPreview.innerHTML=activityPhotoHTML(record,{reviewCandidate:true});pane.append(photoPreview);
  photoConfirmation=node('input');photoConfirmation.type='checkbox';photoConfirmation.checked=record.photo.subjectConfirmed===true;
  pane.append(field('I checked that this image depicts this specific activity and its licence and attribution permit reuse',photoConfirmation));
  pane.append(node('p','activity-review-footnote','A photo appears in itineraries only when this confirmation is checked and the activity is explicitly approved. Saving a candidate does not approve it.'));
 }
 const status=selectStatus(record.verification.status,'Activity review state');pane.append(field('Activity review state',status));
 let priceStatus=null;if(record.price){priceStatus=selectStatus(record.price.reviewStatus,'Price review state');pane.append(field('Price review state',priceStatus));}
 const reviewer=node('input','field-select');reviewer.type='text';reviewer.maxLength=120;reviewer.autocomplete='name';reviewer.value=record.verification.reviewer||'';pane.append(field('Human reviewer name (required to approve or reject)',reviewer));
 const notes=node('textarea','field-select');notes.rows=3;notes.maxLength=4000;notes.value=record.verification.notes||'';pane.append(field('Review notes',notes));
 const details=node('details','activity-review-json');details.append(node('summary',null,'Edit activity facts, sources and pricing'));
 details.append(node('p',null,'Edit the structured record. Use null for an unknown price or duration. The approval buttons record the human decision; changing a status in JSON does not approve it. Source checks are evidence flags, independent of human approval.'));
 const json=node('textarea','activity-review-json-input');json.rows=20;json.spellcheck=false;json.setAttribute('aria-label','Structured activity record');json.value=JSON.stringify(record,null,2);details.append(json);pane.append(details);
 // Reconfirm after metadata edits, so a replacement image cannot inherit the old check.
 json.addEventListener('input',()=>{
  if(!photoConfirmation)return;
  try{const edited=JSON.parse(json.value);const facts=p=>{if(!p)return null;const {subjectConfirmed,...rest}=p;return rest;};
   if(JSON.stringify(facts(edited.photo))!==JSON.stringify(facts(record.photo)))photoConfirmation.checked=false;
   photoPreview.innerHTML=activityPhotoHTML({...edited,verification:{...edited.verification,status:'ready-for-review'}},{reviewCandidate:true});
  }catch{/* Leave JSON errors for the existing save validation. */}
 });
 const actions=node('div','activity-review-actions');const save=button('Save changes');const approve=button('Approve activity','primary');const approvePrice=button('Approve price');const reject=button('Reject activity','activity-review-reject');
 actions.append(save,approve);if(record.price)actions.append(approvePrice);actions.append(reject);pane.append(actions);
 const submit=async action=>{
  let edited;try{edited=JSON.parse(json.value);}catch{announce('The structured record must be valid JSON.',true);return;}
  if(edited.id!==record.id||edited.destinationId!==record.destinationId){announce('Activity and destination IDs cannot change in a review.',true);return;}
  if(action!=='save'&&!reviewer.value.trim()){announce('Enter your reviewer name to record an explicit human decision.',true);reviewer.focus();return;}
  if(edited.photo)edited.photo.subjectConfirmed=!!photoConfirmation?.checked;
  edited.verification={...edited.verification,status:status.value};if(edited.price&&priceStatus)edited.price.reviewStatus=priceStatus.value;
  actions.querySelectorAll('button').forEach(control=>control.disabled=true);announce('Saving review…');
  try{
   const response=await fetch('/api/activity-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({record:edited,expectedRevision:record.revision||0,action,reviewer:reviewer.value.trim(),notes:notes.value})});
   const data=await response.json();if(!response.ok||!data.saved)throw Error(data.error||'Review could not be saved.');
   state.items=state.items.map(item=>item.id===record.id?data.item:item);render();announce(action==='approve'?'Activity approved by '+reviewer.value.trim()+'.':action==='approve-price'?'Price approved by '+reviewer.value.trim()+'.':'Review saved.');
   window.dispatchEvent(new CustomEvent('wanderly:activities-updated',{detail:{item:data.item}}));
  }catch(error){announce(error.message,true);actions.querySelectorAll('button').forEach(control=>control.disabled=false);}
 };
 save.addEventListener('click',()=>submit('save'));approve.addEventListener('click',()=>submit('approve'));approvePrice.addEventListener('click',()=>submit('approve-price'));reject.addEventListener('click',()=>submit('reject'));
 const note=node('p','activity-review-footnote','High confidence needs an official price checked within 180 days, with the experience and pricing unit identified. Medium confidence needs usable published or older evidence within 365 days. Low confidence, conflicting and outdated prices remain excluded from totals.');pane.append(note);
 return pane;
}
function init(){
 const nav=document.querySelector('.top-nav');if(!nav||document.querySelector('#activityReviewNav'))return;
 const open=button('Activity review','nav-link');open.id='activityReviewNav';
 const dialog=node('dialog','activity-review-dialog');dialog.setAttribute('aria-label','Activity verification');document.body.append(dialog);state.dialog=dialog;
 open.addEventListener('click',()=>{dialog.showModal();load();});nav.append(open);
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}
init();
