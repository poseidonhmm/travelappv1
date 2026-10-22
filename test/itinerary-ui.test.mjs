import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Exercise the actual app event wiring with a minimal page shell, without a browser
// dependency or live API calls. Data and recommendations use the real catalogue.
test('itinerary UI adds researched experiences, moves/reorders/removes them and preserves a v1 saved plan',async t=>{
 const destinations=JSON.parse(await readFile(new URL('../data/destinations.json',import.meta.url),'utf8'));
 const activities=JSON.parse(await readFile(new URL('../data/activities.json',import.meta.url),'utf8'));
 const originalRecords=JSON.stringify(activities);
 const legacy=Array.from({length:7},(_,i)=>({label:'My saved day '+(i+1),items:i===0?[{key:'legacy-food',template:'food'}]:[]}));
 const stored=new Map([['wanderly-plans-v1',JSON.stringify({'rotorua:7':legacy})]]);
 const events=new Map(),nodes=new Map();
 const shell=()=>({innerHTML:'',textContent:'',value:'',dataset:{},classList:{toggle(){},add(){},remove(){}},addEventListener(){},setAttribute(){},scrollIntoView(){}});
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,shell());return nodes.get(selector);};
 const globals={document:{querySelector:node,querySelectorAll:()=>[],addEventListener(type,handler){events.set(type,[...(events.get(type)||[]),handler]);}},window:{addEventListener(){},scrollTo(){}},location:{search:'?destination=rotorua',pathname:'/'},history:{pushState(){}},localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},scrollY:0,scrollTo(){},setTimeout(){return 1;},clearTimeout(){},fetch:async path=>({ok:true,json:async()=>path==='/data/destinations.json'?destinations:{items:activities}})};
 const previous=new Map(Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 for(const [key,value]of Object.entries(globals))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 t.after(()=>{for(const [key,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 await import('../public/app.js?itinerary-ui-regression');
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(node('#app').innerHTML,/My saved day 1/);
 const click=dataset=>{for(const handler of events.get('click')||[])handler({target:{closest:()=>({dataset})}});};
 const plan=()=>JSON.parse(stored.get('wanderly-plans-v1'))['rotorua:7'];
 const id='rotorua-redwoods-daytime-treewalk';
 node('#activity-day-'+id).value='2';
 click({action:'add-recommended',activityId:id});
 assert.equal(plan()[2].items[0].activityId,id,'the real Add experience control must persist an activity reference');
 assert.equal(plan()[0].items[0].template,'food','legacy personal ideas survive additions');
 node('#move-2-0').value='0';
 click({action:'move',day:'2',index:'0'});
 assert.equal(plan()[2].items.length,0);
 assert.equal(plan()[0].items[1].activityId,id);
 click({action:'up',day:'0',index:'1'});
 assert.equal(plan()[0].items[0].activityId,id);
 click({action:'down',day:'0',index:'0'});
 assert.equal(plan()[0].items[1].activityId,id);
 click({action:'remove',day:'0',index:'1'});
 assert.deepEqual(plan()[0].items,[{key:'legacy-food',template:'food'}]);
 for(const handler of events.get('change')||[])handler({target:{dataset:{dayLabel:'0'},value:'My forest day'}});
 assert.equal(plan()[0].label,'My forest day');
 assert.equal(JSON.stringify(activities),originalRecords,'itinerary actions never mutate verification data');
});
