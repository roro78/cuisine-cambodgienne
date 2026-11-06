// Isolated subprocess fixture: no listeners, production roots or providers.
import {readFile,appendFile} from 'node:fs/promises';
import {basename,resolve,join} from 'node:path';
import {createJobGateway} from '../../scripts/editorial-ai-job-gateway.mjs';
import {createSimulatedTtsJobs} from '../../scripts/coral-tts-jobs.mjs';
import {simulatedTtsProvider} from '../../scripts/coral-tts-audio.mjs';
const [rootArg,mode]=process.argv.slice(2),root=resolve(rootArg||'');
if(!basename(root).startsWith('cdc-tts-test-')||!['first','resume','observe'].includes(mode))throw Error('FIXTURE_ONLY');
const request=JSON.parse(await readFile(join(root,'fixture-request.json'),'utf8')),p=simulatedTtsProvider();
const jobs=createSimulatedTtsJobs({authorize:async()=>true,budgetDir:join(root,'budget'),pauseAfter:mode==='first'?3:null,
 provider:{...p,async synthesize(c){await appendFile(join(root,'fixture-calls.txt'),c.chapter.id+'\n',{mode:0o600});return p.synthesize(c)}}});
const g=await createJobGateway({root:join(root,'jobs'),token:'synthetic-token-'.repeat(4),provider:async()=>{},ttsJobs:jobs});
if(mode==='first')await g.submit(request.request_id,request);
if(mode==='resume')await g.ttsOperation(request.request_id,'resume');
await g.workOnce();console.log(JSON.stringify(await g.state(request.request_id)));
