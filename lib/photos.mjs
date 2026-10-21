import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DEFAULT_PHOTO_CACHE=fileURLToPath(new URL('../data/photo-cache.local.json',import.meta.url));
const COMMONS='https://commons.wikimedia.org/w/api.php';
const MAX_IMAGES=4;
const SKIP=/(?:map\b|diagram|logo|icon\b|flag\b|coat.of.arms|collage|montage|infographic|poster|certificate|illustration|drawing|seal\b|coat_of_arms)/i;
const IMAGE_MIMES=new Set(['image/jpeg','image/png','image/webp']);
const validCommonsUrl=u=>{
 try{
  const url=new URL(u);
  return url.protocol==='https:'&&(url.hostname==='upload.wikimedia.org'||url.hostname.endsWith('.wikimedia.org'));
 }catch{return false;}
};
const cleanHtml=(value='')=>String(value).replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,240);
function allowedLicense(shortName,licenseUrl){
 const name=String(shortName||'').toUpperCase().replace(/[_-]/g,' ');
 // Exclude noncommercial and no-derivatives material, and uncertain rights metadata.
 if(/(?:\bNC\b|\bND\b|NONCOMMERCIAL|NO DERIVATIVES)/.test(name))return false;
 const valid=/^(?:CC BY(?: SA)?(?:\s*\d(?:\.\d)?)?|CC0(?:\s*\d(?:\.\d)?)?|PUBLIC DOMAIN|PD|PDM)/.test(name);
 if(!valid)return false;
 return !licenseUrl||validCommonsUrl(licenseUrl)||String(licenseUrl).startsWith('https://creativecommons.org/');
}
function makeUrl(params){
 const url=new URL(COMMONS);
 for(const [k,v]of Object.entries(params))url.searchParams.set(k,String(v));
 return url.toString();
}
function parsePhoto(page) {
 const info=page?.imageinfo?.[0];
 if(!info||!IMAGE_MIMES.has(info.mime)||info.width<600||info.height<350)return null;
 if(SKIP.test(page.title||''))return null;
 const metadata=info.extmetadata||{};
 const license=cleanHtml(metadata.LicenseShortName?.value||'');
 const licenseUrl=metadata.LicenseUrl?.value||'';
 if(!allowedLicense(license,licenseUrl))return null;
 const source=info.descriptionurl||'https://commons.wikimedia.org/wiki/'+encodeURIComponent(page.title||'');
 const url=info.thumburl||info.url;
 if(!validCommonsUrl(url)||!validCommonsUrl(source))return null;
 return {
  file:page.title,
  src:url,
  source,
  author:cleanHtml(metadata.Attribution?.value||metadata.Artist?.value||info.user||'Wikimedia Commons contributor')||'Wikimedia Commons contributor',
  license,
  licenseUrl,
  provider:'Wikimedia Commons',
  verified:false
 };
}
export function uniquePhotos(existing,proposed,limit=MAX_IMAGES){
 const used=new Set(existing.flatMap(p=>p.map(x=>x.file)));
 const result=[];
 for(const photo of proposed){
  if(!photo?.file||used.has(photo.file))continue;
  result.push(photo);used.add(photo.file);
  if(result.length>=limit)break;
 }
 return result;
}
export function createPhotoStore({destinations,cachePath=DEFAULT_PHOTO_CACHE,fetchImpl=fetch}){
 const destinationsById=new Map(destinations.map(d=>[d.id,d]));
 const cache=new Map(),pending=new Map();
 let writes=Promise.resolve();
 let activeFetch=0;
 const waiters=[];
 async function limitFetch(fn){
  if(activeFetch>=2)await new Promise(resolve=>waiters.push(resolve));
  activeFetch++;
  try{return await fn();}finally{activeFetch--;waiters.shift()?.();}
 }
 async function queryCommons(url){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetchImpl(url,{
    headers:{'User-Agent':'WanderlyPrivateResearchPrototype/0.3 (https://github.com/poseidonhmm/travelappv1)','Accept':'application/json'},
    signal:controller.signal
   });
   if(!response.ok)throw new Error('Commons API '+response.status);
   return await response.json();
  }finally{clearTimeout(timeout);}
 }
 const init=(async()=>{
  try{
   const raw=JSON.parse(await readFile(cachePath,'utf8'));
   if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
   // Reserve any already-selected files globally. Older cache entries cannot
   // claim the same file for a second destination.
   const all=[];
   for(const [id,photos]of Object.entries(raw).sort()){
    if(!destinationsById.has(id)||!Array.isArray(photos))continue;
    const chosen=uniquePhotos(all,photos.filter(p=>p&&typeof p.file==='string'&&validCommonsUrl(p.src)&&validCommonsUrl(p.source)));
    if(chosen.length){all.push(chosen);cache.set(id,chosen);}
   }
  }catch(e){if(e?.code!=='ENOENT')console.warn('Photo cache will be regenerated:',e.message);}
 })();
 function persist(){
  const serialised=JSON.stringify(Object.fromEntries([...cache.entries()].sort()),null,2)+'\n';
  const task=writes.then(async()=>{
   const temp=cachePath+'.tmp-'+randomUUID();
   try{
    await writeFile(temp,serialised,{mode:0o600,flag:'wx'});
    await rename(temp,cachePath);
   }catch(e){await unlink(temp).catch(()=>{});throw e;}
  });
  writes=task.catch(e=>console.warn('Photo cache not persisted:',e.message));
  return task;
 }
 async function retrieve(dest){
  const candidates=[];
  const keys=[dest.name+' '+dest.country,dest.name];
  for(const query of keys){
   if(candidates.length>=MAX_IMAGES*3)break;
   const search=await queryCommons(makeUrl({
    action:'query',format:'json',generator:'search',
    gsrsearch:query,gsrnamespace:6,gsrlimit:28,
    prop:'imageinfo',iiprop:'size|mime'
   }));
   const pages=Object.values(search?.query?.pages||{})
    .filter(p=>p?.title?.startsWith('File:')&&!SKIP.test(p.title))
    .filter(p=>IMAGE_MIMES.has(p.imageinfo?.[0]?.mime)&&p.imageinfo?.[0]?.width>=600)
    .sort((a,b)=>(a.index??999)-(b.index??999));
   for(const page of pages){
    if(!candidates.some(x=>x.title===page.title))candidates.push(page);
    if(candidates.length>=MAX_IMAGES*4)break;
   }
   if(candidates.length>=MAX_IMAGES*3)break;
  }
  const sources=Object.values(searchPagesSelected(candidates));
  if(!sources.length)return [];
  const detail=await queryCommons(makeUrl({
   action:'query',format:'json',
   titles:sources.map(x=>x.title).join('|'),prop:'imageinfo',
   iiprop:'url|size|mime|extmetadata',iiurlwidth:850,
   iiextmetadatafilter:'LicenseShortName|LicenseUrl|Attribution|Artist'
  }));
  const pagesByTitle=new Map(Object.values(detail?.query?.pages||{}).map(x=>[x.title,x]));
  return sources.map(p=>parsePhoto(pagesByTitle.get(p.title))).filter(Boolean);
 }
 function searchPagesSelected(pages){return Object.fromEntries(pages.slice(0,16).map((x,i)=>[i,x]));}
 async function getPhotos(id){
  await init;
  if(!destinationsById.has(id))return null;
  if(cache.has(id))return cache.get(id);
  if(pending.has(id))return pending.get(id);
  const request=limitFetch(async()=>{
   // Global used-file reservation happens after the network call without an
   // intervening await, preventing race-driven duplicated photos.
   let found=[];
   try{found=await retrieve(destinationsById.get(id));}
   catch(error){console.warn('Photo lookup unavailable for '+id+': '+error.message);}
   const chosen=uniquePhotos([...cache.values()],found);
   if(chosen.length){
    cache.set(id,chosen);
    await persist().catch(()=>{});
   }
   return chosen;
  });
  pending.set(id,request);
  try{return await request;}finally{pending.delete(id);}
 }
 return {getPhotos,photoCount:()=>cache.size};
}
