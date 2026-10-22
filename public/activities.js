// Shared browser/server activity model. Catalogue facts and manual reviews are separate from itinerary edits.
export const REVIEW_STATUSES=Object.freeze(['draft','needs-research','ready-for-review','approved','rejected','needs-rechecking']);
export const PRICE_CONFIDENCES=Object.freeze(['high','medium','low']);
export const PRICE_UNITS=Object.freeze(['per-person','per-group','per-ticket']);
const DAY=86400000;
const idPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text=(value,max=1200)=>typeof value==='string'&&value.length<=max;
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function safeSourceUrl(value){
 if(typeof value!=='string'||value.length>2048)return false;
 try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!!url.hostname&&!url.username&&!url.password;}catch{return false;}
}
function validDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+'T00:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value;
}
function daysOld(value,now=new Date()){
 if(!validDate(value))return Infinity;
 const current=new Date(now);
 return Math.floor((Date.UTC(current.getUTCFullYear(),current.getUTCMonth(),current.getUTCDate())-new Date(value+'T00:00:00Z').getTime())/DAY);
}
function fail(message){const error=new Error(message);error.statusCode=400;throw error;}
function requireText(value,label,max=1200){if(!text(value,max))fail('Invalid '+label+'.');}
function optionalUrl(value,label){if(value!==null&&value!==''&&!safeSourceUrl(value))fail('Invalid '+label+' source URL.');}
function validateReview(value,label){
 if(!object(value)||!REVIEW_STATUSES.includes(value.status))fail('Invalid '+label+' review status.');
 requireText(value.reviewer,label+' reviewer',120);requireText(value.notes,label+' notes',4000);
 if(value.reviewedAt!==null&&(!text(value.reviewedAt,40)||!Number.isFinite(Date.parse(value.reviewedAt))))fail('Invalid '+label+' review date.');
 if(value.status==='approved'&&(!value.reviewer.trim()||!value.reviewedAt))fail('Approved '+label+' needs a named human reviewer and review date.');
}
function validatePrice(price,now){
 if(price===null)return;
 if(!object(price))fail('Invalid activity price.');
 if(!/^[A-Z]{3}$/.test(price.currency))fail('Price currency must be a three-letter currency code.');
 if(!Number.isFinite(price.min)||!Number.isFinite(price.max)||price.min<0||price.max<price.min)fail('Invalid price range. Unknown costs must use a null price.');
 if(!PRICE_UNITS.includes(price.unit))fail('Invalid price unit.');
 requireText(price.covers,'price coverage');requireText(price.experience,'priced experience',300);
 if(price.notes!==undefined)requireText(price.notes,'price notes',2000);
 optionalUrl(price.sourceUrl,'price');
 if(price.checkedAt!==null&&!validDate(price.checkedAt))fail('Invalid price last-checked date.');
 if(price.checkedAt&&daysOld(price.checkedAt,now)<0)fail('Price last-checked date cannot be in the future.');
 if(!PRICE_CONFIDENCES.includes(price.confidence))fail('Invalid price confidence.');
 if(!REVIEW_STATUSES.includes(price.reviewStatus))fail('Invalid price review status.');
 if(!['official','published'].includes(price.evidenceType))fail('Invalid price evidence type.');
 if(typeof price.unitVerified!=='boolean'||typeof price.conflict!=='boolean')fail('Price evidence flags must be booleans.');
 // Stale evidence remains loadable for rechecking. It never remains usable just because a saved label says high.
 if(price.confidence==='high'&&(price.evidenceType!=='official'||!safeSourceUrl(price.sourceUrl)||!price.checkedAt||!price.unitVerified||!price.experience.trim()||!price.covers.trim()))fail('High confidence requires direct official evidence, an identified experience, coverage, date and verified pricing unit.');
 if(price.reviewStatus==='approved'&&(!text(price.reviewer,120)||!price.reviewer.trim()||!price.reviewedAt||!Number.isFinite(Date.parse(price.reviewedAt))))fail('Approved prices need a named human reviewer and review date.');
}
export function validateActivity(record,{knownDestinationIds,now=new Date()}={}){
 if(!object(record))fail('Invalid activity record.');
 if(!text(record.id,100)||!idPattern.test(record.id))fail('Invalid activity ID.');
 if(!text(record.destinationId,100)||!idPattern.test(record.destinationId)||(knownDestinationIds&&!knownDestinationIds.has(record.destinationId)))fail('Unknown activity destination.');
 for(const [key,max] of [['name',180],['category',80],['description',2400]]){requireText(record[key],key,max);if(!record[key].trim())fail('Activity '+key+' is required.');}
 if(record.provider!==null)requireText(record.provider,'provider',180);
 if(!object(record.location))fail('Location evidence is required.');
 requireText(record.location.label,'location',300);optionalUrl(record.location.sourceUrl,'location');
 if(typeof record.location.verified!=='boolean')fail('Location evidence flag must be a boolean.');
 if(record.location.verified&&(!record.location.label.trim()||!safeSourceUrl(record.location.sourceUrl)))fail('Verified location requires a label and evidence.');
 if(record.durationMinutes!==null&&(!Number.isInteger(record.durationMinutes)||record.durationMinutes<1||record.durationMinutes>10080))fail('Invalid approximate duration.');
 optionalUrl(record.durationSourceUrl,'duration');
 if(record.durationMinutes!==null&&!safeSourceUrl(record.durationSourceUrl))fail('Approximate duration requires evidence.');
 for(const key of ['interests','atmospheres'])if(!Array.isArray(record[key])||record[key].length>24||record[key].some(value=>!text(value,80)))fail('Invalid activity '+key+'.');
 if(!object(record.seasonality)||!Array.isArray(record.seasonality.months)||record.seasonality.months.length>12||record.seasonality.months.some(month=>!Number.isInteger(month)||month<1||month>12)||new Set(record.seasonality.months).size!==record.seasonality.months.length)fail('Invalid seasonal months.');
 if(record.seasonality.restriction!==null)requireText(record.seasonality.restriction,'seasonal restriction',1000);
 optionalUrl(record.seasonality.sourceUrl,'seasonality');
 if(typeof record.seasonality.verified!=='boolean')fail('Seasonal evidence flag must be a boolean.');
 if(record.seasonality.verified&&!safeSourceUrl(record.seasonality.sourceUrl))fail('Verified seasonality requires evidence.');
 if(!Array.isArray(record.considerations)||record.considerations.length>20)fail('Invalid activity considerations.');
 for(const consideration of record.considerations){
  if(!object(consideration)||!['safety','permit','eligibility'].includes(consideration.type))fail('Invalid consideration type.');
  requireText(consideration.text,'consideration',1000);optionalUrl(consideration.sourceUrl,'consideration');
  if(typeof consideration.verified!=='boolean'||consideration.verified&&!safeSourceUrl(consideration.sourceUrl))fail('Verified consideration requires evidence.');
 }
 if(!Array.isArray(record.sources)||record.sources.length>20)fail('Invalid activity sources.');
 for(const source of record.sources){
  if(!object(source)||!safeSourceUrl(source.url)||!['official','published'].includes(source.type)||!validDate(source.checkedAt)||daysOld(source.checkedAt,now)<0)fail('Invalid activity source or last-checked date.');
  requireText(source.title,'source title',300);
 }
 if(record.lastCheckedAt!==null&&(!validDate(record.lastCheckedAt)||daysOld(record.lastCheckedAt,now)<0))fail('Invalid activity last-checked date.');
 validateReview(record.verification,'activity');validatePrice(record.price,now);
 if(record.price&&record.price.confidence!=='low'&&!priceEvidenceMatches(record))fail('High or medium price evidence must match a dated catalogue source and evidence type.');
 if(record.revision!==undefined&&(!Number.isInteger(record.revision)||record.revision<0))fail('Invalid activity revision.');
 return structuredClone(record);
}
export function priceEvidenceMatches(record){
 const price=record?.price;
 return !!price&&record.sources?.some(source=>source.url===price.sourceUrl&&source.type===price.evidenceType&&validDate(source.checkedAt)&&validDate(price.checkedAt)&&source.checkedAt>=price.checkedAt);
}
export function priceUsability(price,now=new Date()){
 const flags=[];
 if(!price)return {usable:false,reason:'Price unavailable',explanation:'No source-backed price is recorded.',effectiveConfidence:null,flags:['missing-price']};
 if(!safeSourceUrl(price.sourceUrl)||!validDate(price.checkedAt)||!price.experience?.trim()||!price.covers?.trim()||!price.unitVerified)flags.push('weak-price-evidence');
 if(!/^[A-Z]{3}$/.test(price.currency)||!PRICE_UNITS.includes(price.unit)||!Number.isFinite(price.min)||!Number.isFinite(price.max)||price.min<0||price.max<price.min)flags.push('invalid-price-range');
 const age=daysOld(price.checkedAt,now);
 if(age<0)flags.push('future-price-date');
 if(price.confidence==='high'&&price.evidenceType!=='official')flags.push('unsupported-high-confidence');
 if(price.confidence==='low'||!PRICE_CONFIDENCES.includes(price.confidence))flags.push('low-price-confidence');
 if(age>(price.confidence==='high'?180:365))flags.push('outdated-price');
 if(price.conflict)flags.push('conflicting-price');
 if(!['ready-for-review','approved'].includes(price.reviewStatus))flags.push('price-needs-review');
 const descriptions={'weak-price-evidence':'Price evidence is incomplete','invalid-price-range':'The price range or pricing unit is invalid','future-price-date':'The evidence check is dated in the future','unsupported-high-confidence':'High confidence needs direct official evidence','low-price-confidence':'The evidence has low confidence','outdated-price':'The price evidence is outdated','conflicting-price':'Published prices conflict','price-needs-review':'The price needs further review'};
 return {usable:flags.length===0,reason:flags.length?'Estimate pending verification':'Source-backed activity estimate',explanation:flags.length?flags.map(flag=>descriptions[flag]).join('. ')+'.':'The cited estimate is current and has an identified experience and pricing unit.',effectiveConfidence:flags.length?'low':price.confidence,flags};
}
export function activityFlags(record,now=new Date()){
 const flags=[];
 if(!record.sources?.length||!record.sources.some(source=>safeSourceUrl(source.url)))flags.push('missing-evidence');
 else if(!record.sources.some(source=>source.type==='official'))flags.push('indirect-evidence');
 if(!record.lastCheckedAt||daysOld(record.lastCheckedAt,now)>365)flags.push('outdated-activity-evidence');
 if(record.sources?.some(source=>daysOld(source.checkedAt,now)>365))flags.push('outdated-source-evidence');
 if(record.price&&!priceEvidenceMatches(record))flags.push('price-source-mismatch');
 if(!record.location?.label?.trim()||!record.location?.verified||!safeSourceUrl(record.location?.sourceUrl))flags.push('missing-location-evidence');
 if((record.seasonality?.months?.length||record.seasonality?.restriction)&&(!record.seasonality.verified||!safeSourceUrl(record.seasonality.sourceUrl)))flags.push('unverified-seasonality');
 for(const type of ['safety','permit','eligibility'])if(record.considerations?.some(item=>item.type===type))flags.push(type+'-considerations');
 if(record.considerations?.some(item=>!item.verified||!safeSourceUrl(item.sourceUrl)))flags.push('unverified-considerations');
 if(record.verification?.status!=='approved')flags.push('awaiting-human-review');
 flags.push(...priceUsability(record.price,now).flags);
 return [...new Set(flags)];
}
const normalized=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
// Small editorial vocabulary bridges phrasing to existing source-backed activity tags.
// These aliases refine expressed interests; a weather-only request adds no lifestyle preferences.
const activityAliases=Object.freeze({
 relaxed:['relaxing','peaceful','quiet'],relaxing:['relaxed','peaceful','quiet'],peaceful:['relaxed','quiet'],
 adventurous:['adventure','outdoors','nature','hiking'],adventure:['adventurous','outdoors','nature','hiking'],
 outdoors:['outdoor','nature','walking','hiking'],outdoor:['outdoors','nature','walking','hiking'],
 cultural:['culture','history','architecture','temples'],culture:['cultural','history','temples'],
 foodie:['food','culinary'],culinary:['food'],beaches:['beach','coast'],beach:['beaches','coast'],
 hiking:['walking','nature'],forests:['forest','nature'],mountains:['mountain','hiking','nature']
});
export function recommendActivities(records,destinationId,preferences={}){
 const month=Number(String(preferences.travelMonth||'').split('-')[1]);
 const words=new Set(normalized([preferences.query,...(preferences.scenery||[]),...(preferences.vibes||[]),...(preferences.interests||[]),preferences.mood,['important','essential'].includes(preferences.foodPriority)?'food':'',['important','essential','yes'].includes(preferences.beachPriority||preferences.beaches)?'beach':''].join(' ')).split(' ').filter(word=>word.length>2&&!['any','all'].includes(word)));
 for(const word of [...words])for(const related of activityAliases[word]||[])words.add(related);
 return records.filter(record=>record.destinationId===destinationId&&['ready-for-review','approved'].includes(record.verification?.status)&&record.sources?.length&&record.location?.verified&&safeSourceUrl(record.location.sourceUrl)&&!(month&&record.seasonality?.verified&&record.seasonality.months.length&&!record.seasonality.months.includes(month)))
  .map((record,index)=>{
   const tags=normalized([record.name,record.category,...(record.interests||[]),...(record.atmospheres||[])].join(' '));
   let score=record.verification.status==='approved'?3:0;
   for(const word of words)if(tags.split(' ').includes(word))score+=2;
   if(month&&record.seasonality?.verified&&record.seasonality.months.includes(month))score++;
   // A short trip can favour documented shorter visits; unknown durations never gain a fabricated advantage.
   if(record.durationMinutes&&safeSourceUrl(record.durationSourceUrl)){
    if(Number(preferences.days)>0&&Number(preferences.days)<=5&&record.durationMinutes<=120)score++;
    if(Number(preferences.days)>=10&&record.durationMinutes>=180)score++;
   }
   return {record,index,score};
  }).sort((a,b)=>b.score-a.score||a.index-b.index).map(item=>item.record);
}
export function summarizeActivityCosts(items,now=new Date()){
 const groups=new Map();let knownCount=0;
 for(const item of items){
  const record=item?.activity||item;
  // Removed, rejected or demoted catalogue records cannot keep contributing an old snapshot price.
  const allowed=record?.verification?['ready-for-review','approved'].includes(record.verification.status):false;
  if(!allowed||!priceEvidenceMatches(record)||!priceUsability(record.price,now).usable)continue;
  const price=record.price,key=price.currency+':'+price.unit;
  const group=groups.get(key)||{currency:price.currency,unit:price.unit,min:0,max:0,knownCount:0};
  group.min=Math.round((group.min+price.min)*100)/100;group.max=Math.round((group.max+price.max)*100)/100;group.knownCount++;
  groups.set(key,group);knownCount++;
 }
 return {groups:[...groups.values()],knownCount,unknownCount:items.length-knownCount,totalCount:items.length,incomplete:knownCount<items.length};
}
export function formatActivityPrice(price,now=new Date()){
 const state=priceUsability(price,now);
 if(!state.usable)return state.reason;
 const format=value=>new Intl.NumberFormat(undefined,{style:'currency',currency:price.currency,maximumFractionDigits:2}).format(value);
 return (price.min===price.max?format(price.min):format(price.min)+'–'+format(price.max))+' '+price.unit.replaceAll('-',' ');
}
