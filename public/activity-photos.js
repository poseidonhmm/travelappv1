// Activity photos are supplied as evidence by editors. This module never searches
// for images or fetches metadata, and it never substitutes a destination photo.
const PHOTO_KEYS=Object.freeze(['source','fileName','imageUrl','pageUrl','title','creator','license','licenseUrl','attribution','checkedAt','subjectConfirmed']);
const textLimits={fileName:300,imageUrl:2048,pageUrl:2048,title:300,creator:300,license:160,licenseUrl:2048,attribution:1600};
const isObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fail(message){const error=new Error(message);error.statusCode=400;throw error;}
export function safeActivityPhotoUrl(value){
 if(typeof value!=='string'||value.length>2048||value.trim()!==value||/[\u0000-\u0020\u007f\\]/u.test(value))return false;
 try{
  const url=new URL(value),host=url.hostname.toLowerCase();
  // Reject local/network addresses as well as credentials. URLs are rendered in
  // an image element; they must not cause the browser to probe a private host.
  if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443')return false;
  if(!host.includes('.')||host.endsWith('.')||/^\d+(?:\.\d+){3}$/.test(host)||host.includes(':'))return false;
  if(host==='localhost'||/\.(localhost|local|internal|test|invalid)$/.test(host))return false;
  return true;
 }catch{return false;}
}
function validCheckedDate(value,now){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00Z'),current=new Date(now);
 return Number.isFinite(date.getTime())&&Number.isFinite(current.getTime())&&date.toISOString().slice(0,10)===value&&value<=current.toISOString().slice(0,10);
}
const normalizedFile=value=>value.normalize('NFC').replaceAll('_',' ');
function fileFromCommonsPage(url){
 if(url.hostname!=='commons.wikimedia.org'||!url.pathname.startsWith('/wiki/'))return null;
 try{return decodeURIComponent(url.pathname.slice('/wiki/'.length));}catch{return null;}
}
function fileFromCommonsImage(url){
 if(url.hostname!=='upload.wikimedia.org'||!url.pathname.startsWith('/wikipedia/commons/'))return null;
 const parts=url.pathname.slice('/wikipedia/commons/'.length).split('/');
 // Original /a/ab/File.jpg, or thumbnail /thumb/a/ab/File.jpg/800px-File.jpg.
 const candidate=parts[0]==='thumb'&&parts.length>=5?parts[3]:parts.length===3?parts[2]:null;
 try{return candidate?'File:'+decodeURIComponent(candidate):null;}catch{return null;}
}
function usablePhotoLicense(name,url){
 const label=name.trim().toUpperCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ');
 if(/\b(NC|ND|NONCOMMERCIAL|NO DERIVATIVES)\b/.test(label))return false;
 const source=new URL(url);
 if(!['creativecommons.org','www.creativecommons.org'].includes(source.hostname)||source.search||source.hash)return false;
 const path=source.pathname.replace(/\/$/,'');
 const cc=label.match(/^CC BY( SA)? (1\.0|2\.0|2\.5|3\.0|4\.0)$/);
 if(cc)return new RegExp('^/licenses/'+(cc[1]?'by-sa':'by')+'/'+cc[2].replace('.','\\.')+'(?:/(?:deed\\.[a-z-]+|legalcode(?:\\.[a-z-]+)?))?$').test(path);
 if(/^CC0(?: 1\.0)?$/.test(label))return path==='/publicdomain/zero/1.0';
 if(/^(?:PUBLIC DOMAIN|PD|PDM(?: 1\.0)?)$/.test(label))return ['/publicdomain/mark/1.0','/publicdomain/zero/1.0'].includes(path);
 return false;
}
export function validateActivityPhoto(photo,{now=new Date()}={}){
 if(photo===undefined||photo===null)return null;
 if(!isObject(photo))fail('Invalid activity photo metadata.');
 if(Object.keys(photo).some(key=>!PHOTO_KEYS.includes(key)))fail('Unknown activity photo field.');
 if(PHOTO_KEYS.some(key=>!Object.hasOwn(photo,key)))fail('Activity photo metadata is incomplete.');
 if(!['wikimedia-commons','external'].includes(photo.source))fail('Invalid activity photo source.');
 for(const [key,max] of Object.entries(textLimits)){
  if(key==='fileName'&&photo.source==='external'&&photo[key]===null)continue;
  if(typeof photo[key]!=='string'||!photo[key].trim()||photo[key].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(photo[key]))fail('Invalid activity photo '+key+'.');
 }
 for(const key of ['imageUrl','pageUrl','licenseUrl'])if(!safeActivityPhotoUrl(photo[key]))fail('Activity photo '+key+' must be a safe HTTPS URL without credentials.');
 if(!usablePhotoLicense(photo.license,photo.licenseUrl))fail('Activity photos need a supported CC BY, CC BY-SA, CC0 or public-domain license with its matching Creative Commons URL.');
 if(typeof photo.subjectConfirmed!=='boolean')fail('Activity photo subject confirmation must be a boolean.');
 if(!validCheckedDate(photo.checkedAt,now))fail('Activity photo checkedAt must be a real date that is not in the future.');
 if(photo.source==='wikimedia-commons'){
  if(!/^File:[^/\\#?]+$/.test(photo.fileName))fail('A Commons activity photo needs its File: filename.');
  const pageFile=fileFromCommonsPage(new URL(photo.pageUrl));
  if(!pageFile||normalizedFile(pageFile)!==normalizedFile(photo.fileName))fail('The Commons page must match the activity photo filename.');
  const imageFile=fileFromCommonsImage(new URL(photo.imageUrl));
  if(!imageFile||normalizedFile(imageFile)!==normalizedFile(photo.fileName))fail('The Commons upload image must match the activity photo filename.');
 }else if(photo.fileName!==null)fail('An external activity photo must have a null Commons filename.');
 // Return only the known fields in a stable order, without mutating editor input.
 return Object.fromEntries(PHOTO_KEYS.map(key=>[key,photo[key]]));
}
export function prepareImportedActivityPhoto(photo,options){
 if(photo===undefined||photo===null)return null;
 if(!isObject(photo))fail('Invalid imported activity photo metadata.');
 // Import evidence can propose an image. Only a later human edit can confirm it.
 return validateActivityPhoto({...photo,subjectConfirmed:false},options);
}
export function publicActivityPhoto(record,options){
 const review=record?.verification,current=new Date(options?.now??new Date());
 if(review?.status!=='approved'||record?.photo?.subjectConfirmed!==true||typeof review.reviewer!=='string'||!review.reviewer.trim()||typeof review.reviewedAt!=='string')return null;
 const reviewedAt=new Date(review.reviewedAt);
 if(!Number.isFinite(reviewedAt.getTime())||!Number.isFinite(current.getTime())||reviewedAt>current)return null;
 try{return validateActivityPhoto(record.photo,options);}catch{return null;}
}
function placeholder(record,message){
 const name=record?.name||'this activity';
 return '<figure class="activity-photo activity-photo-empty" data-activity-photo-id="'+escape(record?.id||'')+'"><div class="activity-photo-fallback" role="img" aria-label="'+escape(message+' for '+name)+'"><span aria-hidden="true">◇</span><p>'+escape(message)+'</p><small>'+escape(name)+'</small></div></figure>';
}
export function activityPhotoHTML(record,{reviewCandidate=false,now=new Date()}={}){
 let photo=publicActivityPhoto(record,{now});
 const isPublic=!!photo;
 if(!photo&&reviewCandidate){try{photo=validateActivityPhoto(record?.photo,{now});}catch{}}
 if(!photo)return placeholder(record,record?.photo?'Activity photo awaiting verification':'Activity photo not yet available');
 const candidate=reviewCandidate&&!isPublic;
 const name=record?.name||'this activity';
 const credit=(url,label)=>'<a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">'+escape(label)+'</a>';
 return '<figure class="activity-photo'+(candidate?' activity-photo-candidate':'')+'" data-activity-photo-id="'+escape(record?.id||'')+'">'+
  (candidate?'<p class="activity-photo-review-warning">Unverified photo candidate — confirm that it shows '+escape(name)+'.</p>':'')+
  '<img data-activity-photo-image="'+escape(record?.id||'')+'" src="'+escape(photo.imageUrl)+'" alt="'+escape(photo.title+' — '+name+(candidate?' (unverified candidate)':''))+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">'+
  '<div class="activity-photo-fallback" data-activity-photo-fallback hidden role="img" aria-label="'+escape('Image unavailable for '+name)+'"><span aria-hidden="true">◇</span><p>Activity image unavailable</p><small>'+escape(name)+'</small></div>'+
  '<figcaption><strong>'+escape(photo.title)+'</strong><span>By '+escape(photo.creator)+' · '+credit(photo.licenseUrl,photo.license)+'</span><span>'+escape(photo.attribution)+'</span><span>'+credit(photo.pageUrl,photo.source==='wikimedia-commons'?'Wikimedia Commons source':'Image source')+' · Metadata checked '+escape(photo.checkedAt)+'</span></figcaption></figure>';
}
const initializedDocuments=new WeakMap();
export function initializeActivityPhotoFallbacks(doc=globalThis.document){
 if(!doc||typeof doc.addEventListener!=='function')return ()=>{};
 if(initializedDocuments.has(doc))return initializedDocuments.get(doc);
 const failed=image=>{
  if(!image?.matches?.('img[data-activity-photo-image]'))return;
  const figure=image.closest?.('[data-activity-photo-id]');
  const fallback=figure?.querySelector?.('[data-activity-photo-fallback]');
  if(!fallback)return;
  image.hidden=true;fallback.hidden=false;figure.classList?.add('activity-photo-unavailable');
 };
 const onError=event=>failed(event.target);
 const scan=()=>doc.querySelectorAll?.('img[data-activity-photo-image]').forEach(image=>{
  if(image.complete&&!image.naturalWidth&&image.getAttribute('src'))failed(image);
 });
 // Image errors do not bubble; capture also handles images added on later renders.
 doc.addEventListener('error',onError,true);
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
 const cleanup=()=>{doc.removeEventListener('error',onError,true);doc.removeEventListener('DOMContentLoaded',scan);initializedDocuments.delete(doc);};
 initializedDocuments.set(doc,cleanup);return cleanup;
}
if(typeof globalThis.document!=='undefined')initializeActivityPhotoFallbacks();
