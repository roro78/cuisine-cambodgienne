import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const source=new URL('../public/gestion-social/diagnostic-cli.php',import.meta.url);
const code=readFileSync(source,'utf8');

test('OVH readiness CLI cannot be a public HTTP diagnostic and performs no writes',()=>{
 assert.match(code,/PHP_SAPI !== 'cli'/);
 assert.match(code,/http_response_code\(404\)/);
 assert.match(code,/SET TRANSACTION READ ONLY/);
 assert.match(code,/pg_stat_ssl/);
 assert.match(code,/cuisine_social_viewer/);
 assert.match(code,/VIEWER_WRITE_OR_DISPATCH_ACCESS/);
 assert.match(code,/READY_FOR_PRIVATE_ANDROID_TEST/);
 assert.doesNotMatch(code,/echo\s+\$e|fwrite\([^)]*\$e|error_log\([^)]*\$e/);
 assert.doesNotMatch(code,/\b(?:CREATE ROLE|ALTER ROLE|GRANT|INSERT INTO|UPDATE cuisine_social|DELETE FROM)\b/i);
});

test('OVH diagnostic fails closed without private configuration, without leaking credentials',()=>{
 const base=mkdtempSync(join(tmpdir(),'cuisine-ovh-ready-'));
 try{
   const publicPath=join(base,'home','www','cdc2017','gestion-social');
   mkdirSync(publicPath,{recursive:true});
   const file=join(publicPath,'diagnostic-cli.php');
   copyFileSync(source,file);
   const result=spawnSync('php',[file],{encoding:'utf8',timeout:4000});
   assert.equal(result.status,2,'Without private config diagnostic must fail closed');
   assert.match(result.stdout,/PORTAL_READINESS_FAIL:/);
   assert.doesNotMatch(result.stdout,/password|DSN=|SQLSTATE|\/home\/|PDOException/i);
   assert.equal(result.stderr,'');
   // This fake private file contains no usable credential and should not print it.
   const dir=join(base,'home','.cuisine-asset-portal');
   mkdirSync(dir,{recursive:true});
   writeFileSync(join(dir,'config.php'),"<?php return ['admin_user'=>'fixture'];");
   const incomplete=spawnSync('php',[file],{encoding:'utf8',timeout:4000});
   assert.equal(incomplete.status,2);
   assert.match(incomplete.stdout,/PORTAL_READINESS_FAIL:/);
   assert.doesNotMatch(incomplete.stdout,/SQLSTATE|\/home\/|fixture/i);
   assert.equal(incomplete.stderr,'');
 }finally {rmSync(base,{recursive:true,force:true});}
});
