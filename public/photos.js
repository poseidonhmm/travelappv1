// Destination-specific, attribution-aware Wikimedia Commons photo galleries.
// Photos are chosen uniquely by the local server; no stock URLs are shared.
const requests=new Map();
const waiting=[];
let active=0,observer=null,scanPending=false;
function getImages(id){
 if(requests.has(id))return requests.get(id);
 const promise=new Promise(resolve=>{
  waiting.push({id,resolve});pump();
 });
 requests.set(id,promise);
 return promise;
}
function pump(){
 while(active<3&&waiting.length){
  const {id,resolve}=waiting.shift();active++;
  fetch('/api/photos?destination='+encodeURIComponent(id))
   .then(async response=>{
    if(!response.ok)throw new Error('Photo service unavailable');
    const data=await response.json();
    return Array.isArray(data.photos)?data.photos:[];
   })
   .catch(()=>[])
   .then(resolve)
   .finally(()=>{active--;pump();});
 }
}
function isCommonsUrl(value){
 try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='wikimedia.org'||u.hostname.endsWith('.wikimedia.org'));}
 catch{return false;}
}
// Wikimedia thumbnails can occasionally be missing, inaccessible, or blocked.
// Try the full-size file and a Commons redirect before giving up.
function attachPhoto(image,photo,onFailure){
 const urls=[photo?.src,photo?.originalSrc,
  photo?.file?'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(photo.file.replace(/^File:/,'')):null]
  .filter(isCommonsUrl);
 const tried=[...new Set(urls)];
 if(!tried.length){onFailure();return;}
 let index=0;
 image.onerror=()=>{
  index++;
  if(index<tried.length){image.src=tried[index];return;}
  image.onerror=null;
  onFailure();
 };
 image.src=tried[index];
}
function hue(id){
 let n=0;for(const char of id)n=(n*33+char.charCodeAt(0))%360;
 return n;
}
function attribution(container,photos){
 const details=document.createElement('details');
 details.className='photo-credits';
 const summary=document.createElement('summary');
 summary.textContent='Photo sources · location unverified';
 details.append(summary);
 const list=document.createElement('ol');
 for(const photo of photos){
  if(!isCommonsUrl(photo.source))continue;
  const li=document.createElement('li');
  const author=document.createElement('span');
  author.textContent=(photo.author||'Wikimedia Commons contributor')+' · ';
  const source=document.createElement('a');
  source.href=photo.source;source.target='_blank';source.rel='noopener noreferrer';
  source.textContent=photo.file?.replace(/^File:/,'')||'View source';
  li.append(author,source);
  if(photo.license){
   const l=document.createElement('span');l.textContent=' · '+photo.license;
   li.append(l);
  }
  if(photo.licenseUrl&&/^https:\/\/creativecommons\.org\//.test(photo.licenseUrl)){
   const link=document.createElement('a');
   link.href=photo.licenseUrl;link.target='_blank';link.rel='noopener noreferrer';
   link.textContent=' (licence)';li.append(link);
  }
  list.append(li);
 }
 details.append(list);
 container.after(details);
}
async function renderMosaic(mosaic){
 const id=mosaic.dataset.photoDestination;
 if(!id)return;
 mosaic.dataset.photosReady='true';
 mosaic.style.setProperty('--photo-hue',hue(id));
 const photos=await getImages(id);
 if(!mosaic.isConnected)return;
 const slots=[...mosaic.querySelectorAll('[data-slot]')];
 slots.forEach((slot,i)=>{
  const photo=photos[i];
  if(!photo||![photo.src,photo.originalSrc].some(isCommonsUrl)){
   slot.classList.add('photo-missing');
   slot.textContent='Photo unavailable';
   return;
  }
  const image=document.createElement('img');
  image.alt='Wikimedia Commons photo candidate for '+id.replaceAll('-',' ');
  image.loading='lazy';image.decoding='async';
  image.referrerPolicy='no-referrer';
  attachPhoto(image,photo,()=>{
   image.remove();slot.classList.add('photo-missing');slot.textContent='Image unavailable';
  });
  slot.replaceChildren(image);
  slot.classList.add('photo-loaded');
 });
 if(photos.length)attribution(mosaic,photos);
 else{
  const hint=document.createElement('p');
  hint.className='photo-empty-note';
  hint.textContent='No Commons photo candidates found · image research pending.';
  mosaic.after(hint);
 }
}
async function renderHero(hero){
 const id=hero.dataset.photoHero;
 hero.dataset.photosReady='true';
 const photos=await getImages(id);
 if(!hero.isConnected)return;
 const photo=photos[0];
 if(!photo||!isCommonsUrl(photo.src))return;
 const image=document.createElement('img');
 image.alt='Wikimedia Commons photo candidate for '+id.replaceAll('-',' ');
 image.referrerPolicy='no-referrer';
 attachPhoto(image,photo,()=>{image.remove();});
 hero.prepend(image);
 image.addEventListener('load',()=>hero.querySelector('.hero-photo-fallback')?.remove(),{once:true});
}
async function renderActivity(image){
 const id=image.dataset.photoActivity;
 image.dataset.photosReady='true';
 const photos=await getImages(id);
 if(!image.isConnected||!photos.length)return;
 const n=Number(image.dataset.photoIndex)||0;
 const selected=photos[n%photos.length];
 if(selected&&isCommonsUrl(selected.src)){
  image.loading='lazy';image.referrerPolicy='no-referrer';
  attachPhoto(image,selected,()=>image.removeAttribute('src'));
 }
}
function observe(element){
 if(element.dataset.photosObserved)return;
 element.dataset.photosObserved='true';
 if(observer)observer.observe(element);
 else {
  if(element.matches('[data-photo-destination]'))renderMosaic(element);
  else if(element.matches('[data-photo-hero]'))renderHero(element);
  else renderActivity(element);
 }
}
function scan(){
 if(scanPending)return;
 scanPending=true;
 queueMicrotask(()=>{
  scanPending=false;
  document.querySelectorAll('[data-photo-destination]:not([data-photos-observed]),[data-photo-hero]:not([data-photos-observed]),[data-photo-activity]:not([data-photos-observed])').forEach(observe);
 });
}
function setup(){
 if('IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)return;
    observer.unobserve(entry.target);
    if(entry.target.matches('[data-photo-destination]'))renderMosaic(entry.target);
    else if(entry.target.matches('[data-photo-hero]'))renderHero(entry.target);
    else renderActivity(entry.target);
   }
  },{rootMargin:'420px 0px'});
 }
 const main=document.querySelector('#app');
 if(main)new MutationObserver(scan).observe(main,{childList:true,subtree:true});
 scan();
}
setup();
