/** Shared synthetic private Studio fixture. No real config, draft, key or endpoint. */
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
export async function ttsStudioFixture(t){
 const root=await mkdtemp(join(tmpdir(),'cdc-studio-browser-tts-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const bridge=async(mode,request=null)=>{
  const child=spawn(process.env.PHP_BIN||'php',['-d','display_errors=stderr','tests/php/fixtures/editorial-tts-bridge.php',mode,root,resolve(process.env.TTS_TEST_DIST||'dist')],
   {stdio:['pipe','pipe','pipe'],windowsHide:true});
  let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
  child.stdin.end(request===null?'':JSON.stringify(request));
  const status=await new Promise((r,j)=>{child.on('error',j);child.on('exit',r)});
  if(status!==0)throw Error('TTS_FIXTURE_PHP '+stderr.slice(0,700));return JSON.parse(stdout);
 };
 return {root,bridge,...await bridge('init')};
}
