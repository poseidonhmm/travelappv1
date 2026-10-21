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
