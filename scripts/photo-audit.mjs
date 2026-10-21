import { readFile } from 'node:fs/promises';
import { DEFAULT_PHOTO_CACHE,createPhotoStore } from '../lib/photos.mjs';
import { load } from './validate.mjs';

const {destinations}=load();
const ids=new Set(destinations.map(x=>x.id));
const arg=process.argv[2];
if(arg==='--sample'){
 const examples=['paris','wadi-rum','bali','cape-town'];
 const store=createPhotoStore({destinations});
 console.log('Looking up example destination image candidates from Wikimedia Commons...');
 for(const id of examples){
  const photos=await store.getPhotos(id);
  console.log(id+': '+(photos?.length||0)+' distinct licensed file candidate(s)');
  for(const p of photos||[])console.log('  '+p.file+' — '+p.license+' — '+p.source);
 }
 console.log('These are automatically selected candidates: verify that they show the correct location.');
}else{
 let cache={};
 try{cache=JSON.parse(await readFile(DEFAULT_PHOTO_CACHE,'utf8'));}
 catch(error){
  if(error.code!=='ENOENT')throw error;
  console.log('No photo cache yet. Browse destinations in Wanderly or run npm run photos:sample.');
  process.exit(0);
 }
 const reported=[];
 const usedFile=new Map(),usedHash=new Map();
 let complete=0,partial=0,total=0;
 for(const [id,items]of Object.entries(cache)){
  if(!ids.has(id))reported.push('Unknown cached destination '+id);
  if(!Array.isArray(items)){reported.push('Not an image list: '+id);continue;}
  if(items.length===4)complete++;
  else partial++;
  total+=items.length;
  for(const photo of items){
   if(!photo?.file){reported.push('Missing source file for '+id);continue;}
   if(usedFile.has(photo.file))reported.push('Repeated Commons file '+photo.file+' in '+usedFile.get(photo.file)+' and '+id);
   usedFile.set(photo.file,id);
   if(photo.fingerprint){
    if(usedHash.has(photo.fingerprint))reported.push('Repeated Commons image hash in '+usedHash.get(photo.fingerprint)+' and '+id);
    usedHash.set(photo.fingerprint,id);
   }
   if(!photo.source||!photo.license||!photo.author)reported.push('Missing credit/rights metadata for '+id+' '+photo.file);
  }
 }
 console.log('Catalogue: '+destinations.length+' destinations');
 console.log('Photo cache: '+Object.keys(cache).length+' destinations; '+total+' image file(s)');
 console.log('Full four-photo galleries: '+complete+'; partial galleries: '+partial);
 console.log('Not yet cached: '+(destinations.length-Object.keys(cache).length));
 console.log('Duplicate/metadata concerns: '+reported.length);
 if(reported.length){console.error(reported.join('\n'));process.exitCode=1;}
 else console.log('Cached Commons file IDs and SHA-1 hashes are unique across destinations.');
 console.log('Media relevance and rights still require a human check.');
}
