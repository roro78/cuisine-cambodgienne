// Separate-process restart fixture. No real provider, HTTP request or production service.
import {readFile,appendFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createJobGateway} from '../../scripts/editorial-ai-job-gateway.mjs';
const [mode,root]=process.argv.slice(2),id='c'.repeat(48);
if(!root||!['interrupt','restart'].includes(mode))throw Error('FIXTURE_ARGS');
const gateway=await createJobGateway({root:join(root,'queue'),token:'synthetic-restart-token-'.repeat(2),provider:async()=>{
  await appendFile(join(root,'calls.txt'),'x');process.stdout.write('MODEL_STARTED\n');
  await new Promise(r=>setTimeout(r,60000));return '{}';
}});
if(mode==='interrupt')await gateway.submit(id,JSON.parse(await readFile(join(root,'request.json'),'utf8')));
await gateway.workOnce();
console.log(JSON.stringify(await gateway.state(id)));
