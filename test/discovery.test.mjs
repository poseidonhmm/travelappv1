import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {matchDestinations} from '../public/recommend.js';
import {COUNTRIES,COUNTRY_MAPPING_SOURCE,findCountry,departureContext} from '../public/countries.js';
import {groupRecommendations,expressedInterests,followupQuestions,rerankWithContext} from '../public/discovery-groups.js';
import {contextBoost} from '../public/trip-context.js';
import {parseSearchRequest,createAiSearch,rankDestinations} from '../lib/ai-search.mjs';

const destination=(id,score=50,{country='Japan',region='Asia',vibe=[],scenery=[],experiences=[]}={})=>({id,name:id,country,macroRegion:region,score,tags:{vibe,scenery,experiences}});
const base=Array.from({length:6},(_,i)=>destination('best-'+i,100-i));

test('departure selector has sourced worldwide coverage, canonical aliases and stable unique IDs',()=>{
 assert.equal(COUNTRIES.length,250);
 assert.equal(new Set(COUNTRIES.map(c=>c.id)).size,COUNTRIES.length);
 assert.ok(COUNTRIES.every(c=>c.name&&c.officialName&&c.region));
 assert.match(COUNTRY_MAPPING_SOURCE.url,/^https:\/\/unstats\.un\.org\//);
 assert.equal(COUNTRY_MAPPING_SOURCE.lastChecked,'2026-10-22');
 for(const [name,region] of [['UK','Europe'],['MAR','Africa'],['New Zealand','Oceania'],['Costa Rica','North America'],['Brazil','South America'],['United Arab Emirates','Middle East'],['India','Asia'],['Taiwan','Asia'],['Kosovo','Europe']]){
  assert.equal(findCountry(name).region,region,name);
 }
 assert.equal(findCountry('Cote d’Ivoire').code,'CIV');
 assert.equal(findCountry('Atlantis'),undefined);
 assert.deepEqual(departureContext(''),{homeCountry:'',homeRegion:'all'});
});

test('API derives region from country and preserves the optional departure and month fields',()=>{
 const req=parseSearchRequest({query:'sunny',region:'Africa',homeCountry:'UK',homeRegion:'Asia'});
 assert.equal(req.homeCountry,'United Kingdom');
 assert.equal(req.homeRegion,'Europe');
 assert.equal(req.region,'Africa','destination-region filter has independent meaning');
 const optional=parseSearchRequest({query:'nature',region:'all',homeRegion:'Europe'});
 assert.equal(optional.homeRegion,'all','an old region alone must not imply a departure country');
 assert.equal(optional.homeCountry,'');
 assert.equal(optional.travelMonth,'');
 assert.throws(()=>parseSearchRequest({query:'nature',region:'all',homeCountry:'Atlantis'}));
 assert.throws(()=>parseSearchRequest({query:'nature',region:'all',beachPriority:'required'}));
});

test('grouping preserves the leading matches, deduplicates IDs and does not force categories',()=>{
 const rest=[destination('food-a',86,{vibe:['food-led']}),destination('food-b',85,{experiences:['food-tours']}),destination('near-a',84,{country:'France',region:'Europe'}),destination('near-b',83,{country:'Italy',region:'Europe'})];
 const grouped=groupRecommendations([...base,...rest,rest[0]],{query:'sunny'});
 assert.deepEqual(grouped[0].destinations.map(d=>d.id),base.map(d=>d.id));
 assert.deepEqual(grouped.map(g=>g.id),['best','more']);
 const ids=grouped.flatMap(g=>g.destinations.map(d=>d.id));
 assert.equal(ids.length,10);
 assert.equal(new Set(ids).size,ids.length);
 const personal=groupRecommendations([...base,...rest],{query:'food',homeCountry:'UK'});
 assert.ok(personal.some(g=>g.id==='food'));
 assert.ok(personal.some(g=>g.id==='nearby'));
 assert.equal(new Set(personal.flatMap(g=>g.destinations.map(d=>d.id))).size,10);
});

test('themed groups cannot elevate weak matches just to fill a category',()=>{
 const ranked=[...base,destination('weak-food-a',4,{vibe:['food-led']}),destination('weak-food-b',3,{vibe:['food-led']})];
 const groups=groupRecommendations(ranked,{query:'amazing food'});
 assert.ok(!groups.some(g=>g.id==='food'));
 assert.deepEqual(groups.at(-1).destinations.map(d=>d.id),['weak-food-a','weak-food-b']);
});

test('sunny remains underspecified and prompts optional relevant questions without inferred lifestyle preferences',()=>{
 assert.deepEqual(expressedInterests({query:'sunny'}),{food:false,adventure:false,beach:false,mood:false});
 assert.deepEqual(followupQuestions({query:'sunny'}),['foodPriority','journey','mood','beachPriority']);
 assert.ok(!followupQuestions({query:'food and relaxing beach days'}).includes('foodPriority'));
 assert.ok(!followupQuestions({query:'food and relaxing beach days'}).includes('beachPriority'));
});

test('follow-up reranking retains semantic relevance and replaces previous preference bonuses',()=>{
 const food=destination('food',50,{vibe:['food-led']});
 const nature=destination('nature',53,{vibe:['adventurous']});
 const selected={foodPriority:'essential'};
 const ranked=rerankWithContext([food,nature],{},selected);
 assert.equal(ranked[0].id,'food');
 const repeated=rerankWithContext(ranked,selected,selected);
 assert.deepEqual(repeated,ranked,'changing another field must not accumulate food bonuses');
 assert.deepEqual(rerankWithContext(ranked,selected,{}).map(d=>[d.id,d.score]),[['nature',53],['food',50]]);
 assert.equal(contextBoost(food,{homeRegion:'Europe',journey:'nearby'}),0);
});

test('one-word AI search uses the literal request with a mocked provider and no invented interpretation',async()=>{
 const calls=[];
 const service=createAiSearch({destinations:[{...destination('a'),summary:'A draft place',kind:'city',tags:{vibe:[],scenery:[],experiences:[],food:[]}}],apiKey:'test-only',fetchImpl:async(url,options)=>{
  calls.push(url);
  assert.ok(url.endsWith('/embeddings'));
  const body=JSON.parse(options.body);
  return {ok:true,json:async()=>({data:body.input.map((_,index)=>({index,embedding:[1,0]}))})};
 }});
 const result=await service.search(parseSearchRequest({query:'sunny',region:'all'}));
 assert.equal(result.interpretation,'You asked for "sunny". No other trip preferences assumed.');
 assert.equal(calls.length,2);
});

test('discovery markup keeps optional origin/date before secondary filters without a region selector',()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.ok(source.indexOf('class="departure-context"')<source.indexOf('class="filter-panel"'));
 assert.match(source,/Where are you travelling from\?/);
 assert.match(source,/list="departureCountries"/);
 assert.doesNotMatch(source,/id="homeRegion"/);
 assert.match(source,/wanderly-search-prefs-v1/);
 assert.match(source,/aria-invalid/);
});


test('fallback ranks the full catalogue with departure preferences before limiting candidates',async()=>{
 const rows=Array.from({length:40},(_,i)=>({...destination('a-'+String(i).padStart(2,'0')),summary:'Draft place',kind:'city',tags:{vibe:[],scenery:[],experiences:[],food:[]}}));
 rows.push({...destination('zz-home',50,{country:'United Kingdom',region:'Europe'}),summary:'Draft place',kind:'city',tags:{vibe:[],scenery:[],experiences:[],food:[]}});
 const service=createAiSearch({destinations:rows,apiKey:'',fetchImpl:()=>{throw Error('No paid provider calls permitted');}});
 const result=await service.search(parseSearchRequest({query:'sunny',region:'all',homeCountry:'UK',journey:'nearby'}));
 assert.equal(result.engine,'keyword');
 assert.equal(result.matches.length,36);
 assert.equal(result.matches[0].id,'zz-home','the same-country match beyond the initial alphabetical cutoff must be considered');
 assert.equal(result.matches[0].score,20);
 assert.ok(result.matches.every(m=>!m.reason.includes('Semantic')),'fallback explanation must not imply AI use');
});

test('sunny match explanations do not turn arbitrary destination vibes into user preferences',()=>{
 const rows=[destination('ibiza',50,{vibe:['nightlife','sociable'],scenery:['beach']}),destination('san-sebastian',50,{vibe:['food-led','elegant'],scenery:['beach']})];
 const result=rankDestinations(rows,[[1,0],[1,0]],[1,0],parseSearchRequest({query:'sunny',region:'all'}));
 assert.equal(result.length,2);
 for(const match of result){
  assert.match(match.reason,/No additional trip preferences assumed/);
  assert.match(match.reason,/Weather suitability is not verified/);
  assert.doesNotMatch(match.reason,/nightlife|sociable|food-led|elegant|beach/);
 }
});

test('match explanations can name explicitly expressed themes and omit unwanted or unrequested vibes',()=>{
 const place=destination('food-place',50,{vibe:['food-led','sociable','nightlife'],scenery:['beach']});
 const rank=req=>rankDestinations([place],[[1,0]],[1,0],parseSearchRequest({region:'all',...req}))[0].reason;
 assert.match(rank({query:'food'}),/food-led/);
 assert.doesNotMatch(rank({query:'food'}),/sociable|nightlife|beach/);
 assert.match(rank({query:'sunny',foodPriority:'important'}),/food-led/);
 assert.match(rank({query:'sunny',vibes:['nightlife']}),/nightlife/);
 assert.doesNotMatch(rank({query:'sunny without nightlife'}),/nightlife/);
});


test('live keyword refinements use the whole catalogue while semantic results preserve their candidates',()=>{
 const rows=Array.from({length:40},(_,i)=>destination('a-'+String(i).padStart(2,'0'),0));
 rows.push(destination('zz-food',0,{vibe:['food-led']}));
 const state={all:rows,q:'sunny',scenery:new Set(),vibe:new Set(),visibleLimit:24,searching:false,needsClarification:false,
  ai:{engine:'keyword',matches:rows.slice(0,36).map(d=>({id:d.id,score:0})),notice:'AI temporarily unavailable'},aiContext:{}};
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 // Exercise the actual rendering and preview functions without a browser or provider.
 const preview=source.slice(source.indexOf('function previewMatches('),source.indexOf('function tripContextLine('));
 const results=source.slice(source.indexOf('function results(){'),source.indexOf('function savedPage(){'));
 const area={innerHTML:''};let visible=[];
 const context={state,matchDestinations,contextBoost,rerankWithContext,
  document:{querySelector:selector=>selector==='#results'?area:null},
  currentSearch:()=>({query:'sunny',region:'all',scenery:[],vibes:[],foodPriority:'essential'}),
  escapeHTML:String,tripContextLine:()=>'',queryHasWeather:()=>true,
  groupRecommendations:items=>{visible=items;return [];}};
 runInNewContext(preview+results+'results();',context);
 assert.equal(visible[0].id,'zz-food','a new food preference must discover a strong match outside the original fallback pool');
 assert.match(area.innerHTML,/AI temporarily unavailable/,'retain the fallback notice while recomputing local matches');
 state.ai.engine='ai';
 runInNewContext(preview+results+'results();',context);
 assert.ok(!visible.some(d=>d.id==='zz-food'),'semantic relevance must continue to use the provider-ranked candidate set');
});
