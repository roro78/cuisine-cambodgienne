/** Offline process restart fixture, no network, token or actual provider. */
import {readFile,appendFile} from 'node:fs/promises';import {join,basename} from 'node:path';
import {createCoralCheckpointHarness} from '../../scripts/coral-tts-checkpoints.mjs';import {audioSha,durableAudioWrite} from '../../scripts/coral-tts-audio.mjs';
const [root,stage]=process.argv.slice(2);if(!basename(root||'').startsWith('cdc-coral-checkpoints-')||!['first','resume'].includes(stage))throw Error('FIXTURE_ONLY');
const text='Donnée fictive de redémarrage sans voix réelle ni production. '.repeat(20),p={requestId:'b'.repeat(48),index:0,chapter:{id:'intro',text,sha256:audioSha(text)},checkpointDir:join(root,'process-parts')};
let calls=0;try{calls=Number(await readFile(join(root,'calls.txt'),'utf8'));}catch{}
const a=createCoralCheckpointHarness({testOnly:true,authorize:async()=>true,pauseAfter:stage==='first'?1:null,exchange:async({event})=>{
 calls++;await (await import('node:fs/promises')).writeFile(join(root,'calls.txt'),String(calls),{mode:0o600});const id='resp_process_'+calls,transcript=event.response.input[0].content[0].text;
 return {async *[Symbol.asyncIterator](){yield {type:'response.created',response:{id}};yield {type:'response.output_audio.delta',response_id:id,delta:Buffer.alloc(4800).toString('base64')};yield {type:'response.output_audio.done',response_id:id};yield {type:'response.output_audio_transcript.done',response_id:id,transcript};yield {type:'response.done',response:{id,status:'completed',usage:{input_tokens:20,output_tokens:22,input_token_details:{text_tokens:20,audio_tokens:0},output_token_details:{text_tokens:2,audio_tokens:20}}}};}};
}});
let result;try{await durableAudioWrite(join(root,'process-final.wav'),await a.synthesize(p));result='completed';}catch(e){if(stage==='first'&&e.message==='CORAL_CHECKPOINT_PAUSED')result='paused';else throw e;}
console.log(JSON.stringify({pid:process.pid,result,calls,status:await a.checkpointStatus(p)}));
