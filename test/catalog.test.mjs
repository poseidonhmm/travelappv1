import test from 'node:test';
import assert from 'node:assert/strict';
import {load,validateCatalogue} from '../scripts/validate.mjs';
import {searchDestinations} from '../scripts/search.mjs';
const {destinations,taxonomy}=load();
test('catalogue has broad geographic coverage',()=>{
 assert.ok(destinations.length>=75);
 assert.ok(new Set(destinations.map(x=>x.macroRegion)).size>=7);
});
test('catalogue passes schema and editorial safeguards',()=>{
 assert.deepEqual(validateCatalogue(destinations,taxonomy),[]);
 assert.ok(destinations.every(x=>x.editorial.status==='draft'));
 assert.ok(destinations.every(x=>x.budget.tier===null && x.bestMonths.length===0));
});
test('duplicate IDs rejected',()=>{
 const wrong=[...destinations,destinations[0]];
 assert.ok(validateCatalogue(wrong,taxonomy).some(x=>x.includes('duplicate ID')));
});
test('cannot publish without source and review date',()=>{
 const wrong=structuredClone(destinations);
 wrong[0].editorial.status='published';
 assert.ok(validateCatalogue(wrong,taxonomy).some(x=>x.includes('requires reviewedAt and sources')));
});
test('keyword smoke searches have suggestions but do not claim verification',()=>{
 for(const query of ['feel good food','dramatic landscape party','posh city break','tropical beach']){
  const found=searchDestinations(query);
  assert.ok(found.length>0,query);
  assert.ok(found.every(x=>x.status==='draft'));
 }
});
