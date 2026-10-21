import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root=new URL('../',import.meta.url);
export const load=()=>({
 destinations:JSON.parse(fs.readFileSync(new URL('data/destinations.json',root),'utf8')),
 taxonomy:JSON.parse(fs.readFileSync(new URL('data/taxonomy.json',root),'utf8'))
});

export function validateCatalogue(destinations,taxonomy) {
 const errors=[];
 const ids=new Set();
 if(!Array.isArray(destinations)||destinations.length<1)return ['No destinations found'];
 for (const [index,d] of destinations.entries()) {
  const key=`row ${index+1} (${d?.id||'missing id'})`;
  if(typeof d.id!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.id))errors.push(`${key}: invalid ID`);
  if(ids.has(d.id))errors.push(`${key}: duplicate ID`); ids.add(d.id);
  for(const field of ['name','country','macroRegion','kind','summary'])if(typeof d[field]!=='string'||!d[field].trim())errors.push(`${key}: missing ${field}`);
  if(!taxonomy.regions.includes(d.macroRegion))errors.push(`${key}: invalid region`);
  if(!taxonomy.kinds.includes(d.kind))errors.push(`${key}: invalid kind`);
  for(const [category,allowed] of Object.entries(taxonomy.tagCategories)) {
   if(!Array.isArray(d.tags?.[category])||d.tags[category].length<1)errors.push(`${key}: missing ${category} tags`);
   else for(const tag of d.tags[category])if(!allowed.includes(tag))errors.push(`${key}: unknown ${category} tag ${tag}`);
  }
  if(!Array.isArray(d.sources))errors.push(`${key}: missing sources array`);
  if(!['draft','reviewed','published'].includes(d.editorial?.status))errors.push(`${key}: invalid review status`);
  if(d.editorial?.status!=='draft' && (!d.editorial.reviewedAt || !d.sources?.length))errors.push(`${key}: reviewed/published requires reviewedAt and sources`);
  if(d.geographic?.verification==='verified' &&
      (!Number.isFinite(d.geographic.latitude) || !Number.isFinite(d.geographic.longitude) || !d.geographic.wikidataId))errors.push(`${key}: verified geography lacks sourced coordinates/ID`);
  const lat=d.geographic?.latitude, lon=d.geographic?.longitude;
  if(lat!==null && (typeof lat!=='number'||lat < -90||lat>90))errors.push(`${key}: invalid latitude`);
  if(lon!==null && (typeof lon!=='number'||lon < -180||lon>180))errors.push(`${key}: invalid longitude`);
  if(!Array.isArray(d.bestMonths)||d.bestMonths.some(m=>!Number.isInteger(m)||m<1||m>12))errors.push(`${key}: invalid bestMonths`);
  if(d.bestMonths?.length && !d.sources?.length)errors.push(`${key}: seasonality data without a source`);
  if(d.budget?.tier!==null && (!['low','medium','high','variable'].includes(d.budget.tier)||!d.budget.source||!d.budget.checkedAt))errors.push(`${key}: unsourced budget tier`);
 }
 return errors;
}

if(process.argv[1] && fileURLToPath(import.meta.url)===fileURLToPath(new URL(process.argv[1],'file://'+process.cwd()+'/'))) {
 const {destinations,taxonomy}=load();
 const errors=validateCatalogue(destinations,taxonomy);
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
 else console.log(`Validated ${destinations.length} destinations; ${destinations.filter(x=>x.editorial.status==='draft').length} drafts; no publishing implied.`);
}
