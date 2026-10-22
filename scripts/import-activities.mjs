import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {importActivities} from '../lib/activity-import.mjs';

export const ACTIVITY_IMPORT_USAGE=`Usage: node scripts/import-activities.mjs <batch.json> [--dry-run] [--catalogue <path>] [--destinations <path>]

Import a researched {schemaVersion:1, activities:[...]} JSON batch.
New records enter Ready for review. Existing records are never overwritten.
Run --dry-run first. No network calls or paid APIs are used.
See docs/ACTIVITY_IMPORT_SPEC.md for the schema, evidence rules and review steps.`;
export function parseImportArguments(argv){
 const options={dryRun:false};let inputPath=null;
 for(let index=0;index<argv.length;index++){
  const value=argv[index];
  if(value==='--help'||value==='-h')return {help:true};
  if(value==='--dry-run'){options.dryRun=true;continue;}
  if(value==='--catalogue'||value==='--destinations'){
   const next=argv[++index];
   if(!next||next.startsWith('-'))throw Error(value+' requires a file path.');
   const key=value==='--catalogue'?'filePath':'destinationsPath';
   if(options[key])throw Error('Repeated option: '+value+'.');
   options[key]=resolve(next);continue;
  }
  if(value.startsWith('-'))throw Error('Unknown option: '+value+'.');
  if(inputPath)throw Error('Provide exactly one batch JSON file.');
  inputPath=resolve(value);
 }
 if(!inputPath)throw Error('A batch JSON file is required.');
 return {inputPath,...options};
}
export async function runImportCli(argv,{stdout=console.log,stderr=console.error}={}){
 try{
  const {help,inputPath,...options}=parseImportArguments(argv);
  if(help){stdout(ACTIVITY_IMPORT_USAGE);return 0;}
  let input;try{input=JSON.parse(await readFile(inputPath,'utf8'));}catch(error){throw Error('Cannot read batch JSON '+inputPath+': '+error.message);}
  const result=await importActivities({input,...options});
  stdout((result.dryRun?'Dry run: would add ':'Added ')+result.added.length+' activit'+(result.added.length===1?'y':'ies')+'; skipped '+result.skipped.length+' identical existing record'+(result.skipped.length===1?'':'s')+'; catalogue total '+result.totalCount+'.');
  if(result.added.length)stdout((result.dryRun?'Pending additions: ':'Added IDs: ')+result.added.join(', '));
  if(result.skipped.length)stdout('Skipped IDs: '+result.skipped.join(', '));
  stdout(result.written?'Catalogue updated atomically. Restart Wanderly to load new records, then review them manually.':'No files were written.');
  return 0;
 }catch(error){stderr('Activity import failed: '+error.message);return 1;}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))process.exitCode=await runImportCli(process.argv.slice(2));
