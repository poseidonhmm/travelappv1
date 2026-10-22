import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createPhotoStore,uniquePhotos } from '../lib/photos.mjs';

test('image selection never assigns the same Commons file to two destinations',()=>{
 const item=id=>({file:id,src:'https://upload.wikimedia.org/a.jpg',source:'https://commons.wikimedia.org/wiki/File:A',license:'CC BY 4.0'});
 assert.deepEqual(uniquePhotos([[item('A'),item('B')]],[item('B'),item('C')]).map(x=>x.file),['C']);
});
test('Commons photo lookups are credited and globally de-duplicated',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-photos-'));
 const destinations=[{id:'a',name:'First Place',country:'Testland'},{id:'b',name:'Second Place',country:'Testland'}];
 let calls=0;
 const files=['Shared landscape','First unique landscape','Second unique landscape','Third landscape','Fourth landscape','Fifth landscape'];
 const mk=title=>({
  title:'File:'+title+'.jpg',imageinfo:[{width:1400,height:900,mime:'image/jpeg',
   thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/'+encodeURIComponent(title)+'.jpg',
   descriptionurl:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(title)+'.jpg',
   extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},LicenseUrl:{value:'https://creativecommons.org/licenses/by-sa/4.0/'},Artist:{value:'Test Photographer'}}}]
 });
 const fakeFetch=async url=>{
  calls++;
  const request=new URL(url);
  const source=request.searchParams.has('generator');
  const pages=source?Object.fromEntries(files.map((title,i)=>[i,{title:'File:'+title+'.jpg',index:i,imageinfo:[{width:1400,height:900,mime:'image/jpeg'}]}])):
    Object.fromEntries(files.map((title,i)=>[i,mk(title)]));
  return {ok:true,json:async()=>({query:{pages}})};
 };
 try{
  const store=createPhotoStore({destinations,fetchImpl:fakeFetch,cachePath:join(folder,'cache.json')});
  const [first,second]=await Promise.all([store.getPhotos('a'),store.getPhotos('b')]);
  assert.equal(first.length,4);
  assert.equal(second.length,2);
  const titles=[...first,...second].map(x=>x.file);
  assert.equal(new Set(titles).size,6);
  assert.ok(first.every(x=>x.author==='Test Photographer'&&x.license==='CC BY-SA 4.0'));
  const count=calls;
  assert.deepEqual(await store.getPhotos('a'),first);
  assert.equal(calls,count);
  const reloaded=createPhotoStore({destinations,fetchImpl:fakeFetch,cachePath:join(folder,'cache.json')});
  assert.equal((await reloaded.getPhotos('a')).length,4);
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('partial image caches are topped up after the next app restart',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wanderly-photo-refresh-'));
 const files=['A','B','C','D'];
 let broad=false;
 const fetchImpl=async url=>{
  const q=new URL(url);
  const results=(broad?files:files.slice(0,1)).map((file,index)=>{
   const base={title:'File:'+file+'.jpg',index};
   const imageinfo={width:1200,height:800,mime:'image/jpeg'};
   if(!q.searchParams.has('generator'))Object.assign(imageinfo,{
    sha1:file,
    url:'https://upload.wikimedia.org/wikipedia/commons/'+file+'.jpg',
    thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/'+file+'.jpg',
    descriptionurl:'https://commons.wikimedia.org/wiki/File:'+file+'.jpg',
    extmetadata:{LicenseShortName:{value:'CC BY 4.0'},Artist:{value:'Test Photographer'}}
   });
   return [index,{...base,imageinfo:[imageinfo]}];
  });
  return {ok:true,json:async()=>({query:{pages:Object.fromEntries(results)}})};
 };
 try{
  const path=join(folder,'photos.json');
  const destinations=[{id:'test-destination',name:'Test Destination',country:'Testland'}];
  const initial=createPhotoStore({destinations,cachePath:path,fetchImpl});
  const first=await initial.getPhotos('test-destination');
  assert.equal(first.length,1);
  assert.ok(first[0].originalSrc?.startsWith('https://upload.wikimedia.org/'));
  broad=true;
  const renewed=createPhotoStore({destinations,cachePath:path,fetchImpl});
  const full=await renewed.getPhotos('test-destination');
  assert.equal(full.length,4);
  assert.equal(new Set(full.map(x=>x.file)).size,4);
 }finally{await rm(folder,{recursive:true,force:true});}
});
