#!/usr/bin/env node
/**
 * P1 recipe change-request bridge. No network, token, PR creation or deploy.
 * Dry-run is default; --write is allowed only on a clean cms/content-* branch
 * based on an explicitly pinned current main SHA.
 *
 * Usage:
 *   node scripts/apply-reviewed-recipe-request.mjs --request /safe/export.json --base-sha <40hex>
 *   node scripts/apply-reviewed-recipe-request.mjs --request /safe/export.json --base-sha <40hex> --write
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { build } from 'esbuild';

const CONTRACT = 'cuisine-cms-recipe-patch-v1';
const TARGETS = Object.freeze({
  recipes: { path: 'src/data/recipes.ts', array: 'recipes' },
  restoredRecipes: { path: 'src/data/restoredRecipes.ts', array: 'restoredRecipes' }
});
const CHANGE_FIELDS = ['ingredients', 'steps', 'baseServings', 'prepTime', 'cookTime'];

function fail(message) { throw new Error('CMS_RECIPE_PATCH_' + message); }
const keys = obj => Object.keys(obj).sort();
function sameKeys(a,b) {
  return JSON.stringify(keys(a)) === JSON.stringify(keys(b));
}
function validString(x, max=3000) {
  return typeof x==='string' && x.trim()!=='' && x.length<=max &&
    !x.includes('\0');
}
function plain(x) {
  return x!==null && typeof x==='object' && !Array.isArray(x) &&
    Object.getPrototypeOf(x)===Object.prototype;
}
function checkRow(original, next, kind, restored=false) {
  if(kind==='ingredients' && restored) {
    if(!validString(next,450))fail('INVALID_RESTORED_INGREDIENT');
    return;
  }
  if(!plain(original) || !plain(next) || !sameKeys(original,next))fail('ROW_KEYS_CHANGED');
  const required=kind==='steps'?['title','text']:['name'];
  if(required.some(k=>!(k in next)))fail('ROW_REQUIRED_FIELD');
  const allowed=kind==='steps'
    ? ['title','text','duration','cue','mistake']
    : ['name','quantity','unit','note','group','scalable'];
  if(keys(next).some(k=>!allowed.includes(k)))fail('ROW_FIELD_FORBIDDEN');
  for(const [key,value] of Object.entries(next)) {
    if(key==='quantity') {
      if(typeof value!=='number' || !Number.isFinite(value) ||
         value<=0 || value>100000)fail('QUANTITY_INVALID');
    } else if(key==='scalable') {
      if(typeof value!=='boolean')fail('SCALABLE_INVALID');
      // Scaling policy is not an editorial free-text field.
      if(value!==original[key])fail('SCALABLE_PROTECTED');
    } else if(key==='group' || key==='note') {
      // Grouping and adaptation notes must not be lost by a guided form.
      if(value!==original[key])fail('INGREDIENT_METADATA_PROTECTED');
    } else if(!validString(value,key==='text'?3000:3000))fail('TEXT_INVALID');
  }
}
export function validateReviewedRecipeRequest(request) {
  if(!plain(request) || !sameKeys(request,{
    contract:0,source_id:0,source_model:0,source_path:0,
    canonical_sha256:0,social_fingerprint:0,review_version:0,
    changes:0,publication:0
  }))fail('REQUEST_FIELDS');
  const target=TARGETS[request.source_model];
  if(request.contract!==CONTRACT || !target ||
     request.source_path!==target.path ||
     !/^recette:[a-z0-9][a-z0-9-]{0,100}$/.test(request.source_id) ||
     !/^[a-f0-9]{64}$/.test(request.canonical_sha256) ||
     !/^[a-f0-9]{16}$/.test(request.social_fingerprint) ||
     !Number.isInteger(request.review_version) ||
     request.review_version<1 || request.review_version>9999 ||
     request.publication!=='none')fail('INVALID_ENVELOPE');
  const changes=request.changes;
  if(!plain(changes) || changes.schema_version!==1 ||
     keys(changes).length<2 ||
     keys(changes).some(k=>!['schema_version',...CHANGE_FIELDS].includes(k)))
    fail('UNSUPPORTED_CHANGES');
  if(JSON.stringify(request).length>26000)fail('TOO_LARGE');
  return target;
}
export function prepareReviewedRecipePatch({request, source, record}) {
  const target=validateReviewedRecipeRequest(request);
  if(!plain(record) || record.slug!==request.source_id.slice('recette:'.length))
    fail('RECIPE_NOT_FOUND');
  const currentDigest=createHash('sha256')
    .update(JSON.stringify({model:request.source_model,record})).digest('hex');
  if(currentDigest!==request.canonical_sha256)fail('SOURCE_CHANGED');
  const changed=request.changes;
  const replacement=structuredClone(record);
  let actual=0;
  for(const [name,next] of Object.entries(changed)) {
    if(name==='schema_version')continue;
    if(!(name in record))fail('MISSING_SOURCE_FIELD');
    if(name==='baseServings') {
      if(!Number.isInteger(next)||next<1||next>100)fail('INVALID_SERVINGS');
    } else if(name==='prepTime'||name==='cookTime') {
      if(!validString(next,100))fail('INVALID_TIME');
    } else if(name==='ingredients'||name==='steps') {
      const prev=record[name];
      if(!Array.isArray(prev)||!Array.isArray(next) ||
         prev.length===0 || prev.length!==next.length)fail('ROW_COUNT_CHANGED');
      for(let i=0;i<prev.length;i++)
        checkRow(prev[i],next[i],name,
          request.source_model==='restoredRecipes' && name==='ingredients');
    } else fail('FIELD_FORBIDDEN');
    if(JSON.stringify(record[name])!==JSON.stringify(next))actual++;
    replacement[name]=next;
  }
  if(actual===0)fail('NO_DIFFERENCE');

  const sourceFile=ts.createSourceFile(target.path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  if(sourceFile.parseDiagnostics.length)fail('SOURCE_PARSE_ERROR');
  const declarations=sourceFile.statements
    .filter(ts.isVariableStatement)
    .flatMap(stmt=>[...stmt.declarationList.declarations])
    .filter(dec=>ts.isIdentifier(dec.name)&&dec.name.text===target.array &&
      dec.initializer && ts.isArrayLiteralExpression(dec.initializer));
  if(declarations.length!==1)fail('SOURCE_ARRAY_NOT_UNIQUE');
  const entries=declarations[0].initializer.elements.filter(ts.isObjectLiteralExpression);
  const matched=entries.filter(entry=>entry.properties.some(prop=>
    ts.isPropertyAssignment(prop)&&prop.name.getText(sourceFile)==='slug' &&
    ts.isStringLiteral(prop.initializer) &&
    prop.initializer.text===record.slug));
  if(matched.length!==1)fail('ASTRO_SLUG_NOT_UNIQUE');
  const node=matched[0];
  const modifications=[];
  for(const [name,next] of Object.entries(changed)){
    if(name==='schema_version'||JSON.stringify(record[name])===JSON.stringify(next))continue;
    const props=node.properties.filter(prop=>ts.isPropertyAssignment(prop)
      && prop.name.getText(sourceFile)===name);
    if(props.length!==1)fail('ASTRO_FIELD_NOT_UNIQUE');
    const init=props[0].initializer;
    const indentation=source.slice(0,init.getStart(sourceFile)).split('\n').at(-1);
    const lead=' '.repeat(Math.min(40,indentation.length));
    const replacementText=JSON.stringify(next,null,2).replace(/\n/g,'\n'+lead);
    modifications.push({
      key:name,start:init.getStart(sourceFile),end:init.getEnd(),
      text:replacementText,before:record[name],after:next
    });
  }
  let output=source;
  for(const edit of [...modifications].sort((a,b)=>b.start-a.start)){
    output=output.slice(0,edit.start)+edit.text+output.slice(edit.end);
  }
  const updated=ts.createSourceFile(target.path,output,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  if(updated.parseDiagnostics.length)fail('UPDATED_SOURCE_PARSE_ERROR');
  return {output,changes:modifications.map(({key,before,after})=>({field:key,before,after})),
    targetPath:target.path,sourceDigest:currentDigest};
}
async function readActualRecord(source, path, collection, slug, cwd) {
  const compiled=await build({
    stdin:{contents:source,resolveDir:cwd,sourcefile:join(cwd,path),loader:'ts'},
    bundle:true,write:false,format:'esm',platform:'node',target:'node22',logLevel:'silent'
  });
  const uri='data:text/javascript;base64,'+
    Buffer.from(compiled.outputFiles[0].text,'utf8').toString('base64');
  const exported=await import(uri);
  const records=exported[collection];
  if(!Array.isArray(records))fail('SOURCE_EXPORT_INVALID');
  const matching=records.filter(x=>x.slug===slug);
  if(matching.length!==1)fail('RECIPE_NOT_UNIQUE');
  return matching[0];
}
function git(cwd,...args) {
  return execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
}
function checkWorkingTree(cwd, sha, write) {
  if(!/^[a-f0-9]{40}$/.test(sha))fail('BASE_SHA_REQUIRED');
  const currentMain=git(cwd,'rev-parse','refs/heads/main');
  if(currentMain!==sha)fail('MAIN_MOVED');
  if(write) {
    const branch=git(cwd,'branch','--show-current');
    if(!/^cms\/content-[a-z0-9-]+$/.test(branch))fail('CONTENT_BRANCH_REQUIRED');
    if(git(cwd,'merge-base','HEAD','refs/heads/main')!==sha)
      fail('CONTENT_BRANCH_BASE_CHANGED');
    if(git(cwd,'status','--porcelain')!=='')fail('DIRTY_WORKTREE');
  }
}
async function main() {
  const args=process.argv.slice(2);
  const val=k=>{const pos=args.indexOf(k);return pos>=0?args[pos+1]:undefined};
  const requestFile=val('--request'),baseSha=val('--base-sha'),write=args.includes('--write');
  if(!requestFile || !baseSha || args.some(a=>a.startsWith('--') &&
      !['--request','--base-sha','--write'].includes(a))) {
    fail('USAGE_EXPECTED_REQUEST_BASE_SHA_AND_OPTIONAL_WRITE');
  }
  const cwd=process.cwd();
  checkWorkingTree(cwd,baseSha,write);
  const request=JSON.parse(await readFile(resolve(requestFile),'utf8'));
  const target=validateReviewedRecipeRequest(request);
  const raw=await readFile(join(cwd,target.path),'utf8');
  const record=await readActualRecord(raw,target.path,target.array,
    request.source_id.slice('recette:'.length),cwd);
  const result=prepareReviewedRecipePatch({request,source:raw,record});
  process.stdout.write('CMS_RECIPE_REVIEW_ONLY ' + request.source_id +
    ' v' + request.review_version + ' ' + target.path + '\n');
  for(const change of result.changes)
    process.stdout.write(JSON.stringify(change,null,2)+'\n');
  if(write) {
    await writeFile(join(cwd,target.path),result.output,'utf8');
    process.stdout.write('CMS_RECIPE_PATCH_WRITTEN_REVIEW_GIT_DIFF_REQUIRED\n');
  } else process.stdout.write('CMS_RECIPE_DRY_RUN_NO_FILES_CHANGED\n');
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  main().catch(e=>{process.stderr.write((e?.message||'CMS_RECIPE_PATCH_FAILED')+'\n');
    process.exitCode=1;});
}
