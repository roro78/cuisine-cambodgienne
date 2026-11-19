import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

test('existing Coral texts match the approved workshop blueprints',async()=>{
  const root=await mkdtemp(join(tmpdir(),'coral-source-'));
  try{
    const bundle=await build({
      stdin:{
        contents:`
          export { GET } from './src/pages/gestion-contenus/atelier-narrations.json.ts';
          export { releasedCookingWorkshopGuides } from './src/data/cookingWorkshopGuides.ts';
        `,
        resolveDir:fileURLToPath(new URL('../',import.meta.url))
      },
      bundle:true,platform:'node',format:'esm',target:'node22',
      write:false,logLevel:'silent'
    });
    const path=join(root,'compiled.mjs');
    await writeFile(path,bundle.outputFiles[0].text);
    const mod=await import(pathToFileURL(path).href);
    const json=await (await mod.GET({})).json();
    assert.equal(json.contract,'cdc-workshop-existing-coral-narrations-v1');
    assert.equal(json.schemaVersion,1);
    assert.equal(json.items.length,mod.releasedCookingWorkshopGuides.length);
    const ids=['intro','installer','preparer','assembler','maitriser','rectifier','terminer'];
    for(const original of mod.releasedCookingWorkshopGuides){
      const slug=original.sourceRecipeSlug;
      const item=json.items.find(x=>x.id==='atelier:'+original.slug);
      assert.ok(item,'missing original '+slug);
      assert.equal(item.canonicalFingerprint.length,64);
      assert.deepEqual(item.chapters.map(x=>x.id),ids);
      assert.equal(item.chapters[0].text,original.audio.intro,'real intro '+slug);
      for(let i=0;i<6;i++)
        assert.equal(item.chapters[i+1].text,original.phases[i].audioScript,'real voice chapter '+slug+'/'+i);
      const scripts=item.chapters.map(x=>x.text);
      assert.equal(item.scriptSha256,createHash('sha256').update(JSON.stringify(scripts)).digest('hex'));
      assert.equal(item.scriptSha256,original.audio.asset.scriptSha256);
      assert.equal(item.audio.url,original.audio.asset.audioUrl);
      const track=fileURLToPath(new URL('../public'+item.audio.url,import.meta.url));
      assert.ok((await stat(track)).size>1000000,'real MP3 not found '+track);
    }
    const serialized=JSON.stringify(json);
    assert.ok(!serialized.includes('private_config')&&!serialized.includes('password_hash'));
  }finally{await rm(root,{recursive:true,force:true});}
});
