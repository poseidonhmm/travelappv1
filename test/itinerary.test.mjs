import test from 'node:test';
import assert from 'node:assert/strict';
import {createActivityPlan,editPlan,planActivityRecords} from '../public/itinerary.js';

test('new plans distribute real destination activities without inventing or repeating attractions',()=>{
 const fixture=(id,destinationId,status='ready-for-review')=>({id,destinationId,verification:{status},sources:[{url:'https://example.com/source'}],location:{verified:true,sourceUrl:'https://example.com/location'}});
 const records=[fixture('a','rotorua'),fixture('b','rotorua'),fixture('c','lisbon'),fixture('rejected','rotorua','rejected')];
 const plan=createActivityPlan(records,'rotorua',5);
 assert.equal(plan.length,5);
 assert.deepEqual(plan.flatMap(d=>d.items.map(i=>i.activityId)),['a','b']);
 assert.equal(createActivityPlan(records,'unknown',7).flatMap(d=>d.items).length,0);
});
test('v1 saved ideas and new activity references can add, reorder, remove and move to any day',()=>{
 const saved=[{label:'My first day',items:[{key:'old',template:'food'}]},{label:'My second day',items:[]},{label:'A quiet day',items:[]}];
 const original=structuredClone(saved);
 let result=editPlan(saved,{action:'add',dayIndex:0,item:{key:'new',activityId:'te-puia'}});
 result=editPlan(result,{action:'up',dayIndex:0,itemIndex:1});
 assert.deepEqual(result[0].items.map(i=>i.key),['new','old']);
 result=editPlan(result,{action:'down',dayIndex:0,itemIndex:0});
 assert.deepEqual(result[0].items.map(i=>i.key),['old','new']);
 result=editPlan(result,{action:'move',dayIndex:0,itemIndex:1,targetDay:2});
 assert.equal(result[2].items[0].activityId,'te-puia');
 result=editPlan(result,{action:'move',dayIndex:2,itemIndex:0,targetDay:0});
 result=editPlan(result,{action:'remove',dayIndex:0,itemIndex:0});
 assert.equal(result[0].items[0].activityId,'te-puia');
 assert.deepEqual(saved,original,'user source plan must not be mutated');
 assert.equal(result[0].label,'My first day');
 const stored=JSON.parse(JSON.stringify(result));
 assert.deepEqual(planActivityRecords(stored,[{id:'te-puia',price:null}]),[{id:'te-puia',price:null}]);
});
test('invalid edit coordinates leave itineraries intact',()=>{
 const plan=[{label:'Saved',items:[{key:'a',template:'food'}]}];
 for(const options of [{action:'remove',dayIndex:-1,itemIndex:0},{action:'move',dayIndex:0,itemIndex:0,targetDay:99},{action:'down',dayIndex:0,itemIndex:0},{action:'add',dayIndex:0,item:{}}])assert.equal(editPlan(plan,options),plan);
 assert.deepEqual(planActivityRecords(plan,[]),[null]);
});
