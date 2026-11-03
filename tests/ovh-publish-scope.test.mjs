import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ovhIsProtectedPath,ovhAuditPaths,ovhScanDist} from '../scripts/check-ovh-publish-scope.mjs';

test('ordinary compiled static routes remain eligible',()=>{
  assert.deepEqual(ovhAuditPaths(['index.html','404.html','_astro/index.css','recettes/index.html']),{passed:true,blocked:[]});
});
test('block private Studio, social, visuals and coupled indexes',()=>{
  const dangerous=['gestion-contenus/index.php','gestion-social/diagnostic-cli.php',
    'gestion-visuels/index.php','editorial-source-index.json','editorial-guided-fields.json',
    'social-feed.json','.cuisine-asset-portal/config.php','editorial-drafts/example.json'];
  const result=ovhAuditPaths(['index.html',...dangerous]);
  assert.equal(result.passed,false);
  assert.deepEqual(result.blocked,dangerous.sort());
});
test('reject malformed paths and nested credential-like files',()=>{
  for(const bad of ['/etc/config.php','../private','dir/../secret','dir\\config.php','empty//name','./bad']){
    assert.throws(()=>ovhIsProtectedPath(bad),/OVH_INVALID_FILE_PATH/);
  }
  assert.equal(ovhIsProtectedPath('nested/.env.production'),true);
  assert.equal(ovhIsProtectedPath('nested/config.php'),true);
  assert.equal(ovhIsProtectedPath('a-propos/index.html'),false);
});
test('scan a real build directory and refuse symlinks',async()=>{
  const root=await mkdtemp(join(tmpdir(),'ovh-scope-'));
  try{
    await mkdir(join(root,'_astro'));
    await writeFile(join(root,'index.html'),'test');
    await writeFile(join(root,'_astro','index.css'),'body{}');
    assert.equal((await ovhScanDist(root)).passed,true);
    await mkdir(join(root,'gestion-contenus'));
    await writeFile(join(root,'gestion-contenus','index.php'),'<?php');
    const checked=await ovhScanDist(root);
    assert.equal(checked.passed,false);
    assert.deepEqual(checked.blocked,['gestion-contenus/index.php']);
    await symlink(join(root,'index.html'),join(root,'linked.html'));
    await assert.rejects(ovhScanDist(root),/OVH_SYMLINK_IN_DIST/);
  }finally{await rm(root,{recursive:true,force:true});}
});
