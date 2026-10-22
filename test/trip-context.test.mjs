import test from 'node:test';
import assert from 'node:assert/strict';
import { currentTravelMonth,monthOptions,seasonContext,isBroadSearch,contextBoost } from '../public/trip-context.js';

test('short queries are recognised as underspecified but full requests are not',()=>{
 assert.equal(isBroadSearch('sunny'),true);
 assert.equal(isBroadSearch('sunny beaches'),true);
 assert.equal(isBroadSearch('sunny beaches with food and quiet nightlife'),false);
});
test('month choices begin at the actual local month and move across year boundaries',()=>{
 const now=new Date(2026,9,22);
 assert.equal(currentTravelMonth(now),'2026-10');
 const opts=monthOptions(now);
 assert.equal(opts.length,12);
 assert.equal(opts[0].value,'2026-10');
 assert.equal(opts[3].value,'2027-01');
 assert.match(seasonContext('2026-10','Europe','United Kingdom'),/autumn/);
 assert.match(seasonContext('2026-10','Oceania','Australia'),/spring/);
 assert.match(seasonContext('2026-10','Asia','Indonesia'),/depends on location/);
});
test('proximity is a coarse transparent preference and food requires a food-led profile',()=>{
 const france={country:'France',macroRegion:'Europe',tags:{vibe:['food-led'],experiences:['food-tours']}};
 const japan={country:'Japan',macroRegion:'Asia',tags:{vibe:['scenic'],experiences:['hiking']}};
 const req={homeRegion:'Europe',homeCountry:'United Kingdom',journey:'nearby',foodPriority:'essential'};
 assert.ok(contextBoost(france,req)>contextBoost(japan,req));
 assert.equal(contextBoost(japan,{journey:'nearby',homeRegion:'all'}),0);
 assert.equal(contextBoost(japan,{travelMonth:'2026-10'}),0,'unknown seasonality must not influence ranking');
 assert.ok(contextBoost(japan,{journey:'different',homeRegion:'Europe',homeCountry:'United Kingdom'})>0);
});
