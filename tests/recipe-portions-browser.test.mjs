import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

test('real built recipe, no-JS base and responsive repeated portion changes; same workshop calculation',async t=>{
 const dist=resolve('dist');
 const bundle=await build({stdin:{contents:"import {recipes} from './src/data/recipes'; import {initCookingWorkshopServings} from './src/scripts/cookingWorkshopServings';window.testRecipe=recipes.find(r=>r.slug==='amok-trey');window.startWorkshop=initCookingWorkshopServings;",resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
 const server=createServer(async(req,res)=>{
  try{const pathname=new URL(req.url,'http://local').pathname;
   if(pathname==='/test-workshop.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle.outputFiles[0].text);return;}
   const file=resolve(dist,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
   if(!file.startsWith(dist+'/')&&!file.startsWith(dist+'\\'))throw Error('PATH');
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'})[extname(file)]||'application/octet-stream');
   res.end(await readFile(file));
  }catch{res.statusCode=404;res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,headless:true});t.after(()=>browser.close());
 const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===origin&&!['image','media','font'].includes(r.request().resourceType())?r.continue():r.abort());
 const page=await context.newPage();const proof=[];
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:950});await page.goto(origin+'/recettes/amok-trey/',{waitUntil:'domcontentloaded',timeout:60000});
  for(const n of [1,2,4,8,12,2,4]){
   let current=Number(await page.locator('[data-serving-current]').first().innerText());
   while(current!==n){await page.locator('[data-serving-action='+ (current<n?'increase':'decrease')+']').click();current+=current<n?1:-1;}
   const values=await page.locator('[data-ingredient-quantity]').allTextContents();
   const method=await page.locator('#etapes').innerText();
   assert.equal(Number(values[1].replace(',','.')),250*n/4);
   assert.equal(Number(values[6]),2);assert.equal(Number(values[7]),8);
   assert.ok(method.includes(n+' ramequin'+(n>1?'s':'')));assert.ok(method.includes('18 à 25 minutes'));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   proof.push({width,servings:n,coconutMl:250*n/4,reserveMl:250*n/4*.06,containers:n,combava:2,basilic:8});
  }
 }
 const noJs=await browser.newContext({javaScriptEnabled:false});const staticPage=await noJs.newPage();
 await staticPage.goto(origin+'/recettes/amok-trey/',{waitUntil:'domcontentloaded'});
 assert.match(await staticPage.locator('#etapes').innerText(),/15 ml[\s\S]*250 ml/);
 assert.equal(await staticPage.locator('[data-ingredient-quantity]').nth(1).innerText(),'250');await noJs.close();
 // Amok is a private, unpublished workshop. Exercise its canonical ingredients
 // through the actual shared workshop controller, not a fictitious public URL.
 await page.addScriptTag({url:origin+'/test-workshop.js'});
 await page.evaluate(()=>{
  const r=window.testRecipe,root=document.createElement('section');root.dataset.workshopServingsRoot='';root.dataset.baseServings=String(r.baseServings);
  root.innerHTML='<input data-workshop-servings-input value="4"><strong data-workshop-servings-summary></strong>'+r.ingredients.map(i=>'<span data-workshop-ingredient-quantity data-base-quantity="'+i.quantity+'" data-unit="'+(i.unit||'')+'" data-scalable="'+(i.scalable!==false)+'"></span>').join('');
  document.querySelector('main').append(root);window.startWorkshop();
 });
 for(const n of [1,2,4,8,12,2,4]){
  await page.locator('[data-workshop-servings-input]').fill(String(n));await page.locator('[data-workshop-servings-input]').dispatchEvent('change');
  const q=await page.locator('[data-workshop-ingredient-quantity]').allTextContents();
  assert.equal(Number(q[1].replace(',','.')),250*n/4);assert.equal(Number(q[6]),2);assert.equal(Number(q[7]),8);
 }
 if(process.env.PORTION_EVIDENCE_DIR){await mkdir(process.env.PORTION_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.PORTION_EVIDENCE_DIR,'portion-browser.json'),JSON.stringify({noJs:true,workshopController:true,proof},null,2));}
 await context.close();
});
