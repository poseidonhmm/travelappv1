// Read-only suggestions, not an automatic match/verification step.
// Uses Wikidata search with a descriptive user agent; review candidates manually.
const term=process.argv.slice(2).join(' ').trim();
if(!term){console.error('Usage: node scripts/wikidata-candidates.mjs "San Sebastián"');process.exit(1);}
const url=new URL('https://www.wikidata.org/w/api.php');
url.search=new URLSearchParams({action:'wbsearchentities',search:term,language:'en',format:'json',limit:'7',type:'item'}).toString();
try{
 const response=await fetch(url,{headers:{'User-Agent':'WanderlyDestinationResearch/0.1 (educational destination curation; contact via repository issues)'}});
 if(!response.ok)throw new Error('Wikidata HTTP '+response.status);
 const data=await response.json();
 console.log(JSON.stringify((data.search||[]).map(x=>({id:x.id,label:x.label,description:x.description,url:x.concepturi})),null,2));
 console.log('These are candidates only. Confirm the correct entity before recording a Wikidata ID or coordinates.');
}catch(err){console.error('Could not query Wikidata:',err.message);process.exitCode=1;}
